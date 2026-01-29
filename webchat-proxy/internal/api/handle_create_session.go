package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"webchat-proxy/internal/ccaas"
)

type CreateSessionRequest struct {
	EscalationID string                 `json:"escalation_id"`
	QueueID      string                 `json:"queue_id"`
	Participant  string                 `json:"participant"`
	Context      map[string]interface{} `json:"context"`
}


func (s *Server) HandleCreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Extract Conversation ID from Participant string.
	// Format: projects/<Project ID>/locations/<Location ID>/conversations/<Conversation ID>/participants/<Participant ID>
	parts := strings.Split(req.Participant, "/")
	var conversationID string
	for i, part := range parts {
		if part == "conversations" && i+1 < len(parts) {
			conversationID = parts[i+1]
			break
		}
	}

	if conversationID == "" {
		http.Error(w, "Invalid participant format, could not extract conversation ID", http.StatusBadRequest)
		return
	}

	// Extract Participant ID for ExternalIdentifier
	participantID := parts[len(parts)-1]

	// Convert QueueID to int
	menuID := 0
	if req.QueueID != "" {
		var err error
		menuID, err = strconv.Atoi(req.QueueID)
		if err != nil {
			log.Printf("Invalid queue_id format: %v, using default", err)
			menuID = 0 // Will use default from config
		}
	}

	// Handshake with CCAIP platform
	chatReq := &ccaas.CreateChatRequest{
		ExternalIdentifier: participantID,
		MenuID:             menuID,
		Context:            req.Context,
	}

	chatSession, err := s.CCaaS.CreateChatSession(r.Context(), chatReq)
	if err != nil {
		log.Printf("Failed to create CCAIP chat session: %v", err)
		http.Error(w, "Failed to initialize CCaaS session", http.StatusInternalServerError)
		return
	}

	// Register participant name for webhook relay
	s.CCaaS.RegisterParticipant(chatSession.ID, req.Participant)

	// Create a local session which manages the bidi grpc stream
	_, err = s.SessionManager.CreateSession(conversationID, req.Participant, chatSession.ID, chatSession.EndUserID)
	if err != nil {
		log.Printf("Failed to create local session: %v", err)
		http.Error(w, "Failed to create local session", http.StatusInternalServerError)
		return
	}

	log.Printf("Created session: %s (CCAIP ID: %s)", conversationID, chatSession.ID)
	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"session_id": "%s", "ccaip_chat_id": "%s"}`, conversationID, chatSession.ID)
}
