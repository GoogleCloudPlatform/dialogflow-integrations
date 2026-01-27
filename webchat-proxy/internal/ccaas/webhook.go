package ccaas

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"strings"
)

// Webhook event types.
const (
	EventMessageReceived   = "message_received"
	EventParticipantJoined = "participant_joined"
	EventParticipantLeft   = "participant_left"
	EventChatEnded         = "chat_ended"
	EventChatDismissed     = "chat_dismissed"
)

// VerifyCCAIPSignature verifies the X-Signature header from CCAIP.
func VerifyCCAIPSignature(payload []byte, signatureHeader string, secret string) bool {
	if signatureHeader == "" || secret == "" {
		return false
	}

	// Extract primary signature
	// Format: primary=SIG1secondary=SIG2
	primaryPrefix := "primary="
	secondarySeparator := "secondary="
	
	if !strings.HasPrefix(signatureHeader, primaryPrefix) {
		return false
	}
	
	endIdx := strings.Index(signatureHeader, secondarySeparator)
	var primarySig string
	if endIdx == -1 {
		primarySig = signatureHeader[len(primaryPrefix):]
	} else {
		primarySig = signatureHeader[len(primaryPrefix):endIdx]
	}

	// Calculate HMAC-SHA256
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expectedMAC := mac.Sum(nil)
	actualMAC, err := base64.StdEncoding.DecodeString(primarySig)
	if err != nil {
		return false
	}

	return hmac.Equal(actualMAC, expectedMAC)
}

// BaseEvent represents common fields for all CCAIP webhook events.
type BaseEvent struct {
	EventType string `json:"event_type"`
	Timestamp string `json:"timestamp"`
	ChatID    int    `json:"chat_id"`
}

// MessageEvent represents the payload for message_received events.
type MessageEvent struct {
	BaseEvent
	Body struct {
		Sender  Sender         `json:"sender"`
		Message WebhookMessage `json:"message"`
	} `json:"body"`
}

// Sender represents the participant who sent the message.
type Sender struct {
	ID          int    `json:"id"`
	Type        string `json:"type"` // "agent", "virtual_agent", "end_user"
	Status      string `json:"status"`
	ConnectedAt string `json:"connected_at"`
}

// WebhookMessage represents a message received via webhook.
type WebhookMessage struct {
	Type    string `json:"type"` // e.g., "text", "markdown"
	Content string `json:"content"`
}
