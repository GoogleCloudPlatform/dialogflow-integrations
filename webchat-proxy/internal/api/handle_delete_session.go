package api

import (
	"net/http"
)

func (s *Server) HandleDeleteSession(w http.ResponseWriter, r *http.Request) {
	// The session cleanup is handled automatically by the stream lifecycle.
	// This endpoint is kept for compatibility and returns 200 OK promptly.
	w.WriteHeader(http.StatusOK)
}
