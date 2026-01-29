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
//
// The signature header format is: "primary=<sig> secondary=<sig>" or just "primary=<sig>"
// The signature is a base64 encoded HMAC-SHA256 of: timestamp + payload
func VerifyCCAIPSignature(payload []byte, signatureHeader string, timestamp string, config *GoogleCCAIPConfig) bool {
	// Skip verification if secrets are not configured.
	if config.PrimaryWebhookSecret == "" && config.SecondaryWebhookSecret == "" {
		return true
	}

	if signatureHeader == "" || timestamp == "" {
		return false
	}

	// Helper to extract signature value by key
	extractSig := func(key string) string {
		start := strings.Index(signatureHeader, key+"=")
		if start == -1 {
			return ""
		}
		start += len(key) + 1
		rest := signatureHeader[start:]
		end := strings.Index(rest, " ")
		if end == -1 {
			return rest
		}
		return rest[:end]
	}

	primarySig := extractSig("primary")
	secondarySig := extractSig("secondary")

	verify := func(secret, sig, ts string, body []byte) bool {
		if secret == "" || sig == "" {
			return false
		}
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(ts))
		mac.Write(body)
		expectedMAC := base64.StdEncoding.EncodeToString(mac.Sum(nil))
		return hmac.Equal([]byte(sig), []byte(expectedMAC))
	}

	// Verify against primary secret
	if verify(config.PrimaryWebhookSecret, primarySig, timestamp, payload) {
		return true
	}

	// Verify against secondary secret
	if verify(config.SecondaryWebhookSecret, secondarySig, timestamp, payload) {
		return true
	}

	// Also fallback to try secondary signature against primary secret, and vice-versa, 
	// or whatever combination implies rotation. 
	if verify(config.SecondaryWebhookSecret, primarySig, timestamp, payload) {
		return true
	}

	if verify(config.PrimaryWebhookSecret, secondarySig, timestamp, payload) {
		return true
	}

	return false
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
