package api

import (
	"fmt"
	"log"
	"net/http"

	"webchat-proxy/internal/ccaas"
)

func (s *Server) HandleDeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("session_id")
	if id == "" {
		http.Error(w, "Missing session_id", http.StatusBadRequest)
		return
	}

	// Retrieve session to get CCAIP Chat ID
	sess, exists := s.SessionManager.GetSession(id)
	if !exists {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	// End the session on CCAIP platform
	endReq := &ccaas.EndSessionRequest{
		FinishedByUserID: sess.CCAIPChatID, // Or a system user ID
	}
	if err := s.CCaaS.EndSession(r.Context(), sess.CCAIPChatID, endReq); err != nil {
		log.Printf("Failed to end CCAIP session %s: %v", sess.CCAIPChatID, err)
		// fail-open
	}


	// Stop and delete the session
	s.SessionManager.DeleteSession(id)

	log.Printf("Deleted session: %s", id)
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status": "deleted", "session_id": "%s"}`, id)
}
