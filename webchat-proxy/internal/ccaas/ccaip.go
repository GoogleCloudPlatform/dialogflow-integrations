package ccaas

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
	"cloud.google.com/go/dialogflow/apiv2beta1/dialogflowpb"
	"github.com/redis/go-redis/v9"
)

// CCAIPConnector handles interactions with Google CCAIP.
type CCAIPConnector struct {
	Config     *GoogleCCAIPConfig
	HTTPClient *http.Client

	DialogflowClient *dialogflow.ParticipantsClient
	RedisClient      *redis.Client
}

func NewCCAIPConnector(config *GoogleCCAIPConfig, client *dialogflow.ParticipantsClient, redisClient *redis.Client) *CCAIPConnector {
	return &CCAIPConnector{
		Config:           config,
		HTTPClient:       &http.Client{},
		DialogflowClient: client,
		RedisClient:      redisClient,
	}
}

func (c *CCAIPConnector) RegisterParticipant(chatID, participantName string) {
	err := c.RedisClient.Set(context.Background(), chatID, participantName, 0).Err()
	if err != nil {
		log.Printf("Could not set value in Redis: %v", err)
	}
}

// getConversationIDFromParticipant extracts conversation ID from participant name.
// Format: projects/<Project>/locations/<Location>/conversations/<ConversationID>/participants/<ParticipantID>
func getConversationIDFromParticipant(participantName string) string {
	parts := make([]string, 0)
	current := ""
	for _, ch := range participantName {
		if ch == '/' {
			if current != "" {
				parts = append(parts, current)
			}
			current = ""
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		parts = append(parts, current)
	}
	for i, part := range parts {
		if part == "conversations" && i+1 < len(parts) {
			return parts[i+1]
		}
	}
	return "unknown"
}

func (c *CCAIPConnector) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[unknown] CCAIP ← Webhook: ERROR reading body: %v", err)
		http.Error(w, "Error reading body", http.StatusInternalServerError)
		return
	}

	sig := r.Header.Get("X-Signature")
	ts := r.Header.Get("X-Signature-Timestamp")

	// Verification logic
	if !VerifyCCAIPSignature(body, sig, ts, c.Config) {
		log.Printf("[unknown] CCAIP ← Webhook: ERROR signature verification failed (sig=%s, ts=%s)", sig, ts)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Process event
	var event MessageEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("[unknown] CCAIP ← Webhook: ERROR parsing JSON: %v", err)
		http.Error(w, "Error parsing body", http.StatusBadRequest)
		return
	}

	chatID := strconv.Itoa(event.ChatID)
	participantName, err := c.RedisClient.Get(context.Background(), chatID).Result()
	if err != nil {
		log.Printf("Could not get value from Redis: %v", err)
	}

	convID := getConversationIDFromParticipant(participantName)
	if convID == "unknown" {
		convID = fmt.Sprintf("chat-%s", chatID)
	}

	if event.EventType == EventMessageReceived {
		log.Printf("[%s] CCAIP ← Webhook: %s from %s: %s", convID, event.EventType, event.Body.Sender.Type, event.Body.Message.Content)
		
		// Only relay messages FROM agents/bots TO Dialogflow end-users (or system logic).
		// We ignore messages from "end_user" because those are the ones we are proxying FOR.
		if event.Body.Sender.Type != "agent" && event.Body.Sender.Type != "virtual_agent" {
			log.Printf("[%s] CCAIP ← Webhook: Ignoring message from sender type: %s", convID, event.Body.Sender.Type)
			w.WriteHeader(http.StatusOK)
			return
		}

		text := event.Body.Message.Content

		if participantName != "" {
			go c.relayToDialogflow(context.Background(), convID, participantName, text)
		} else {
			log.Printf("[%s] CCAIP ← Webhook: WARNING no participant registered for chat", convID)
		}
	} else if event.EventType == EventChatEnded || event.EventType == EventChatDismissed {
		log.Printf("[%s] CCAIP ← Webhook: %s received", convID, event.EventType)

		if participantName != "" {
			go c.disconnectDialogflow(context.Background(), convID, participantName)
		} else {
			log.Printf("[%s] CCAIP ← Webhook: WARNING no participant registered for %s event", convID, event.EventType)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (c *CCAIPConnector) relayToDialogflow(ctx context.Context, convID, participantName, text string) {
	log.Printf("[%s] Dialogflow → BidiEndpointInteract: Relaying text input: %q", convID, text)
	stream, err := c.DialogflowClient.BidiEndpointInteract(ctx)
	if err != nil {
		log.Printf("[%s] Dialogflow → BidiEndpointInteract: ERROR opening stream: %v", convID, err)
		return
	}
	defer stream.CloseSend()

	// 1. Initial Config
	configReq := &dialogflowpb.BidiEndpointInteractRequest{
		Request: &dialogflowpb.BidiEndpointInteractRequest_Config_{
			Config: &dialogflowpb.BidiEndpointInteractRequest_Config{
				Participant: participantName,
				EndpointId:   "webchat-proxy-send-endpoint",
				ConnectAudio: false,
			},
		},
	}
	if err := stream.Send(configReq); err != nil {
		log.Printf("[%s] Dialogflow → BidiEndpointInteract: ERROR sending config: %v", convID, err)
		return
	}

	// 2. Text Input
	inputReq := &dialogflowpb.BidiEndpointInteractRequest{
		Request: &dialogflowpb.BidiEndpointInteractRequest_Input_{
			Input: &dialogflowpb.BidiEndpointInteractRequest_Input{
				Text: text,
			},
		},
	}
	if err := stream.Send(inputReq); err != nil {
		log.Printf("[%s] Dialogflow → BidiEndpointInteract: ERROR sending input: %v", convID, err)
		return
	}

	log.Printf("[%s] Dialogflow → BidiEndpointInteract: Successfully relayed text: %q", convID, text)
}

func (c *CCAIPConnector) disconnectDialogflow(ctx context.Context, convID, participantName string) {
	log.Printf("[%s] Dialogflow → BidiEndpointInteract: Sending Disconnect", convID)
	stream, err := c.DialogflowClient.BidiEndpointInteract(ctx)
	if err != nil {
		log.Printf("[%s] Dialogflow → BidiEndpointInteract: ERROR opening stream for disconnect: %v", convID, err)
		return
	}
	defer stream.CloseSend()

	// 1. Initial Config
	configReq := &dialogflowpb.BidiEndpointInteractRequest{
		Request: &dialogflowpb.BidiEndpointInteractRequest_Config_{
			Config: &dialogflowpb.BidiEndpointInteractRequest_Config{
				Participant:  participantName,
				EndpointId:    "webchat-proxy-send-endpoint",
				ConnectAudio: false,
			},
		},
	}
	if err := stream.Send(configReq); err != nil {
		log.Printf("[%s] Dialogflow → BidiEndpointInteract: ERROR sending config for disconnect: %v", convID, err)
		return
	}

	// 2. Disconnect
	disconnectReq := &dialogflowpb.BidiEndpointInteractRequest{
		Request: &dialogflowpb.BidiEndpointInteractRequest_Disconnect_{
			Disconnect: &dialogflowpb.BidiEndpointInteractRequest_Disconnect{},
		},
	}
	if err := stream.Send(disconnectReq); err != nil {
		log.Printf("[%s] Dialogflow → BidiEndpointInteract: ERROR sending disconnect: %v", convID, err)
		return
	}

	log.Printf("[%s] Dialogflow → BidiEndpointInteract: Disconnect sent successfully", convID)
}

func (c *CCAIPConnector) getAuthHeader() string {
	auth := fmt.Sprintf("%s:%s", c.Config.Auth.Username, c.Config.Auth.Password)
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(auth))
}

func (c *CCAIPConnector) upsertEndUser(ctx context.Context, convID, identifier string) (int, error) {
	url := fmt.Sprintf("%s/end_users", c.Config.APIBaseURL)
	payload := map[string]string{
		"identifier": identifier,
	}
	body, _ := json.Marshal(payload)

	log.Printf("[%s] CCAIP → POST %s (upsertEndUser)", convID, url)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Printf("[%s] CCAIP ← POST %s: ERROR %v", convID, url, err)
		return 0, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[%s] CCAIP ← POST %s: Status=%d", convID, url, resp.StatusCode)

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return 0, fmt.Errorf("unexpected status code from upsertEndUser: %d", resp.StatusCode)
	}

	var result struct {
		ID int `json:"id"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return 0, err
	}

	return result.ID, nil
}

func (c *CCAIPConnector) CreateChatSession(ctx context.Context, convID string, req *CreateChatRequest) (*ChatSession, error) {
	// 1. Upsert End User
	ccaipEndUserID, err := c.upsertEndUser(ctx, convID, req.ExternalIdentifier)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert end user: %w", err)
	}

	// 2. Create Chat
	url := fmt.Sprintf("%s/chats", c.Config.APIBaseURL)
	
	menuID := req.MenuID
	if menuID == 0 {
		menuID = c.Config.DefaultMenuID
	}
	
	lang := req.Lang
	if lang == "" {
		lang = c.Config.DefaultLang
	}

	ccaipReq := map[string]interface{}{
		"chat": map[string]interface{}{
			"menu_id":     menuID,
			"end_user_id": ccaipEndUserID,
			"lang":        lang,
			"context": map[string]interface{}{
				"value": req.Context,
			},
		},
	}

	if len(req.Transcript) > 0 {
		ccaipReq["chat"].(map[string]interface{})["transcript"] = req.Transcript
	}

	body, _ := json.Marshal(ccaipReq)
	log.Printf("[%s] CCAIP → POST %s (createChat): menu_id=%d, lang=%s", convID, url, menuID, lang)

	hReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		log.Printf("[%s] CCAIP ← POST %s: ERROR %v", convID, url, err)
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[%s] CCAIP ← POST %s: Status=%d", convID, url, resp.StatusCode)

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("failed to create chat: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID int `json:"id"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	log.Printf("[%s] CCAIP: Chat session created (ccaip_chat_id=%d)", convID, result.ID)

	return &ChatSession{
		ID:        strconv.Itoa(result.ID),
		EndUserID: strconv.Itoa(ccaipEndUserID),
	}, nil
}

func (c *CCAIPConnector) SendMessage(ctx context.Context, convID, chatID string, req *SendMessageRequest) error {
	url := fmt.Sprintf("%s/chats/%s/message", c.Config.APIBaseURL, chatID)
	
	endUserID, _ := strconv.Atoi(req.FromUserID)
	ccaipReq := map[string]interface{}{
		"from_user_id": endUserID,
		"message": map[string]interface{}{
			"type":    req.Message.Type,
			"content": req.Message.Content,
		},
	}

	body, _ := json.Marshal(ccaipReq)
	log.Printf("[%s] CCAIP → POST %s (sendMessage): %q", convID, url, req.Message.Content)

	hReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		log.Printf("[%s] CCAIP ← POST %s: ERROR %v", convID, url, err)
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[%s] CCAIP ← POST %s: Status=%d", convID, url, resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send message: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (c *CCAIPConnector) EndSession(ctx context.Context, convID, chatID string, req *EndSessionRequest) error {
	url := fmt.Sprintf("%s/chats/%s", c.Config.APIBaseURL, chatID)
	
	endUserID, _ := strconv.Atoi(req.FinishedByUserID)
	ccaipReq := map[string]interface{}{
		"finished_by_user_id": endUserID,
		"chat": map[string]interface{}{
			"status": "finished",
		},
	}

	body, _ := json.Marshal(ccaipReq)
	log.Printf("[%s] CCAIP → PATCH %s (endSession)", convID, url)

	hReq, err := http.NewRequestWithContext(ctx, "PATCH", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		log.Printf("[%s] CCAIP ← PATCH %s: ERROR %v", convID, url, err)
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[%s] CCAIP ← PATCH %s: Status=%d", convID, url, resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to end session: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	log.Printf("[%s] CCAIP: Session ended", convID)
	return nil
}

// ChatSession represents an active session in a CCaaS platform.
type ChatSession struct {
	ID        string
	EndUserID string
}

// CreateChatRequest contains parameters for creating a chat session.
type CreateChatRequest struct {
	MenuID     int                    `json:"menu_id"`
	Lang       string                 `json:"lang"`
	Context    map[string]interface{} `json:"context,omitempty"`
	Transcript []TranscriptMessage    `json:"transcript,omitempty"`
	// ExternalIdentifier is the ID of the user in the proxy system, 
	// used to upsert/find the end user in CCaaS.
	ExternalIdentifier string `json:"external_identifier"`
}

// TranscriptMessage represents a single message in a transcript.
type TranscriptMessage struct {
	Sender    string               `json:"sender"` // "end_user" or "virtual_agent"
	Timestamp string               `json:"timestamp"`
	Content   []MessageContentItem `json:"content"`
}

// MessageContentItem represents a piece of content in a message.
type MessageContentItem struct {
	Type string `json:"type"` // e.g., "text"
	Text string `json:"text,omitempty"`
}

// SendMessageRequest contains parameters for sending a message.
type SendMessageRequest struct {
	FromUserID string       `json:"from_user_id"`
	Message    MessageBlock `json:"message"`
}

// MessageBlock represents the message structure in SendMessageRequest.
type MessageBlock struct {
	Type    string `json:"type"`    // e.g., "text"
	Content string `json:"content"` // actual message text
}

// EndSessionRequest contains parameters for ending a session.
type EndSessionRequest struct {
	FinishedByUserID string `json:"finished_by_user_id"`
}
