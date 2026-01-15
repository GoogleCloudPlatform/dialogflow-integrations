package api

import (
	"fmt"
	"log"
	"net/http"
)

func (s *Server) HandleDeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("session_id")
	if id == "" {
		http.Error(w, "Missing session_id", http.StatusBadRequest)
		return
	}

	// TODO: a. delete the session from Ccaas platform
	
	log.Printf("Deleted session: %s", id)
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "deleted", "session_id": "%s"}`, id)
}
