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
	"sync"

	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
	"cloud.google.com/go/dialogflow/apiv2beta1/dialogflowpb"
)

// CCAIPConnector handles interactions with Google CCAIP.
type CCAIPConnector struct {
	Config     *GoogleCCAIPConfig
	HTTPClient *http.Client

	DialogflowClient *dialogflow.ParticipantsClient
	
	// Map of CCAIP ChatID to Dialogflow ParticipantName
	participants   map[string]string
	participantsMu sync.RWMutex
}

func NewCCAIPConnector(config *GoogleCCAIPConfig, client *dialogflow.ParticipantsClient) *CCAIPConnector {
	return &CCAIPConnector{
		Config:           config,
		HTTPClient:       &http.Client{},
		DialogflowClient: client,
		participants:     make(map[string]string),
	}
}

func (c *CCAIPConnector) RegisterParticipant(chatID, participantName string) {
	c.participantsMu.Lock()
	defer c.participantsMu.Unlock()
	c.participants[chatID] = participantName
}

func (c *CCAIPConnector) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading CCAIP webhook body: %v", err)
		http.Error(w, "Error reading body", http.StatusInternalServerError)
		return
	}

	sig := r.Header.Get("X-Signature")
	log.Printf("Received CCAIP Webhook. Signature: %s, Body: %s", sig, string(body))

	// TODO: Verification logic using ccaas.VerifyCCAIPSignature

	// Process event
	var event MessageEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Error unmarshaling CCAIP webhook: %v", err)
		http.Error(w, "Error parsing body", http.StatusBadRequest)
		return
	}

	if event.EventType == EventMessageReceived {
		log.Printf("Received CCAIP %s from %s: %s", event.EventType, event.Body.Sender.Type, string(body))
		
		// Only relay messages FROM agents/bots TO Dialogflow end-users (or system logic).
		// We ignore messages from "end_user" because those are the ones we are proxying FOR.
		if event.Body.Sender.Type != "agent" && event.Body.Sender.Type != "virtual_agent" {
			log.Printf("Ignoring message from sender type: %s", event.Body.Sender.Type)
			w.WriteHeader(http.StatusOK)
			return
		}

		chatID := strconv.Itoa(event.ChatID)
		text := event.Body.Message.Content
		
		c.participantsMu.RLock()
		participantName := c.participants[chatID]
		c.participantsMu.RUnlock()

		if participantName != "" {
			go c.relayToDialogflow(context.Background(), participantName, text)
		} else {
			log.Printf("No participant registered for CCAIP chat %s", chatID)
		}
	} else if event.EventType == EventChatEnded || event.EventType == EventChatDismissed {
		chatID := strconv.Itoa(event.ChatID)
		log.Printf("Received CCAIP %s for chat %s", event.EventType, chatID)

		c.participantsMu.RLock()
		participantName := c.participants[chatID]
		c.participantsMu.RUnlock()

		if participantName != "" {
			go c.disconnectDialogflow(context.Background(), participantName)
		} else {
			log.Printf("No participant registered for CCAIP chat %s (ChatID: %s)", event.EventType, chatID)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (c *CCAIPConnector) relayToDialogflow(ctx context.Context, participantName, text string) {
	log.Printf("Relaying message to Dialogflow: %s", text)
	stream, err := c.DialogflowClient.BidiEndpointInteract(ctx)
	if err != nil {
		log.Printf("ERROR relayToDialogflow: failed to open stream: %v", err)
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
		log.Printf("ERROR relayToDialogflow: failed to send config: %v", err)
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
		log.Printf("ERROR relayToDialogflow: failed to send input: %v", err)
		return
	}

	log.Printf("Relayed message to Dialogflow: %s", text)
}

func (c *CCAIPConnector) disconnectDialogflow(ctx context.Context, participantName string) {
	log.Printf("Sending Disconnect to Dialogflow for participant: %s", participantName)
	stream, err := c.DialogflowClient.BidiEndpointInteract(ctx)
	if err != nil {
		log.Printf("ERROR disconnectDialogflow: failed to open stream: %v", err)
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
		log.Printf("ERROR disconnectDialogflow: failed to send config: %v", err)
		return
	}

	// 2. Disconnect
	disconnectReq := &dialogflowpb.BidiEndpointInteractRequest{
		Request: &dialogflowpb.BidiEndpointInteractRequest_Disconnect_{
			Disconnect: &dialogflowpb.BidiEndpointInteractRequest_Disconnect{},
		},
	}
	if err := stream.Send(disconnectReq); err != nil {
		log.Printf("ERROR disconnectDialogflow: failed to send disconnect: %v", err)
		return
	}

	log.Printf("Successfully sent Disconnect to Dialogflow for %s", participantName)
}

func (c *CCAIPConnector) getAuthHeader() string {
	auth := fmt.Sprintf("%s:%s", c.Config.Auth.Username, c.Config.Auth.Password)
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(auth))
}

func (c *CCAIPConnector) upsertEndUser(ctx context.Context, identifier string) (int, error) {
	url := fmt.Sprintf("%s/end_users", c.Config.APIBaseURL)
	payload := map[string]string{
		"identifier": identifier,
	}
	body, _ := json.Marshal(payload)

	log.Printf("CCAIP REQUEST: POST %s | Body: %s", url, string(body))

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Printf("CCAIP ERROR: POST %s | Error: %v", url, err)
		return 0, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("CCAIP RESPONSE: POST %s | Status: %d | Body: %s", url, resp.StatusCode, string(respBody))

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

func (c *CCAIPConnector) CreateChatSession(ctx context.Context, req *CreateChatRequest) (*ChatSession, error) {
	// 1. Upsert End User
	ccaipEndUserID, err := c.upsertEndUser(ctx, req.ExternalIdentifier)
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
			// "context": map[string]interface{}{
			// 	"value": req.Context,
			// },
		},
	}

	if len(req.Transcript) > 0 {
		ccaipReq["chat"].(map[string]interface{})["transcript"] = req.Transcript
	}

	body, _ := json.Marshal(ccaipReq)
	log.Printf("CCAIP REQUEST: POST %s | Body: %s", url, string(body))

	hReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		log.Printf("CCAIP ERROR: POST %s | Error: %v", url, err)
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("CCAIP RESPONSE: POST %s | Status: %d | Body: %s", url, resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("failed to create chat: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID int `json:"id"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	return &ChatSession{
		ID:        strconv.Itoa(result.ID),
		EndUserID: strconv.Itoa(ccaipEndUserID),
	}, nil
}

func (c *CCAIPConnector) SendMessage(ctx context.Context, chatID string, req *SendMessageRequest) error {
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
	log.Printf("CCAIP REQUEST: POST %s | Body: %s", url, string(body))

	hReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		log.Printf("CCAIP ERROR: POST %s | Error: %v", url, err)
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("CCAIP RESPONSE: POST %s | Status: %d | Body: %s", url, resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send message: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (c *CCAIPConnector) EndSession(ctx context.Context, chatID string, req *EndSessionRequest) error {
	url := fmt.Sprintf("%s/chats/%s", c.Config.APIBaseURL, chatID)
	
	endUserID, _ := strconv.Atoi(req.FinishedByUserID)
	ccaipReq := map[string]interface{}{
		"finished_by_user_id": endUserID,
		"chat": map[string]interface{}{
			"status": "finished",
		},
	}

	body, _ := json.Marshal(ccaipReq)
	log.Printf("CCAIP REQUEST: PATCH %s | Body: %s", url, string(body))

	hReq, err := http.NewRequestWithContext(ctx, "PATCH", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		log.Printf("CCAIP ERROR: PATCH %s | Error: %v", url, err)
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("CCAIP RESPONSE: PATCH %s | Status: %d | Body: %s", url, resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to end session: status=%d body=%s", resp.StatusCode, string(respBody))
	}

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
