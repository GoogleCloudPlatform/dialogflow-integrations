package ccaas

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"strings"
)

// Webhook event types.
const (
	EventMessageReceived   = "MessageReceivedEvent"
	EventParticipantJoined = "ParticipantJoinedEvent"
	EventParticipantLeft   = "ParticipantLeftEvent"
	EventChatEnded         = "ChatEndedEvent"
	EventChatDismissed     = "ChatDismissedEvent"
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

// Note: Specific event payloads can be added here as needed for parsing in the handlers.
type BaseEvent struct {
	Type   string `json:"type"`
	ChatID int    `json:"chat_id"`
}

type MessageEvent struct {
	BaseEvent
	Message MessageBlock `json:"message"`
}
