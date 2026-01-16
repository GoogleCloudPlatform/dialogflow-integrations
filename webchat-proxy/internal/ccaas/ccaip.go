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
)

// CCAIPConnector handles interactions with Google CCAIP.
type CCAIPConnector struct {
	Config     *GoogleCCAIPConfig
	HTTPClient *http.Client
	// Password is the actual API token, resolved from Secret Manager.
	Password string
}

func NewCCAIPConnector(config *GoogleCCAIPConfig, password string) *CCAIPConnector {
	return &CCAIPConnector{
		Config:     config,
		HTTPClient: &http.Client{},
		Password:   password,
	}
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
	// This requires looking up the secret for the specific escalation config.
	// For now, we return 200 OK to acknowledge receipt.

	w.WriteHeader(http.StatusOK)
}

func (c *CCAIPConnector) getAuthHeader() string {
	auth := fmt.Sprintf("%s:%s", c.Config.Auth.Username, c.Password)
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(auth))
}

func (c *CCAIPConnector) upsertEndUser(ctx context.Context, identifier string) (int, error) {
	url := fmt.Sprintf("%s/end_users", c.Config.APIBaseURL)
	body, _ := json.Marshal(map[string]string{
		"identifier": identifier,
	})

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return 0, fmt.Errorf("unexpected status code from upsertEndUser: %d", resp.StatusCode)
	}

	var result struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
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
			"context": map[string]interface{}{
				"value": req.Context,
			},
		},
	}

	if len(req.Transcript) > 0 {
		ccaipReq["chat"].(map[string]interface{})["transcript"] = req.Transcript
	}

	body, _ := json.Marshal(ccaipReq)
	hReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to create chat: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
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
			"type": req.Message.Type,
			"content": map[string]interface{}{
				"text": req.Message.Content.Text,
			},
		},
	}

	body, _ := json.Marshal(ccaipReq)
	hReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
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
	hReq, err := http.NewRequestWithContext(ctx, "PATCH", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	hReq.Header.Set("Content-Type", "application/json")
	hReq.Header.Set("Accept", "application/json")
	hReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.HTTPClient.Do(hReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
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
	Type    string         `json:"type"` // e.g., "text"
	Content MessageContent `json:"content"`
}

// MessageContent contains the actual content of a message.
type MessageContent struct {
	Text string `json:"text"`
}

// EndSessionRequest contains parameters for ending a session.
type EndSessionRequest struct {
	FinishedByUserID string `json:"finished_by_user_id"`
}
