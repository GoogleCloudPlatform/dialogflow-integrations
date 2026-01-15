package api

import (
	"net/http"

	"webchat-proxy/internal/session"
)

type Server struct {
	SessionManager *session.SessionManager
	Mux            *http.ServeMux
}

func NewServer() *Server {
	sm := session.NewSessionManager()
	s := &Server{
		SessionManager: sm,
		Mux:            http.NewServeMux(),
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.Mux.HandleFunc("POST /sessions", s.HandleCreateSession)
	s.Mux.HandleFunc("DELETE /sessions/{session_id}", s.HandleDeleteSession)
}


