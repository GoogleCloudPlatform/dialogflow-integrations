package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

type CreateSessionRequest struct {
	EscalationID string `json:"escalation_id"`
	Participant  string `json:"participant"`
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

	// TODO: a. handshake with Ccaas platform

	// TODO: b. create a session which create a bidi grpc stream

	_, err := s.SessionManager.CreateSession(conversationID)
	if err != nil {
		log.Printf("Failed to create session: %v", err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}
	log.Printf("Created session: %s", conversationID)
	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"session_id": "%s"}`, conversationID)
}
