package api

import (
	"net/http"

	"webchat-proxy/internal/ccaas"
	"webchat-proxy/internal/session"
	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
)

type Server struct {
	SessionManager *session.SessionManager
	Mux            *http.ServeMux
	CCaaS          *ccaas.CCAIPConnector
}

func NewServer(client *dialogflow.ParticipantsClient, cc *ccaas.CCAIPConnector) *Server {
	sm := session.NewSessionManager(client, cc)
	s := &Server{
		SessionManager: sm,
		Mux:            http.NewServeMux(),
		CCaaS:          cc,
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.Mux.HandleFunc("POST /sessions", s.HandleCreateSession)
	s.Mux.HandleFunc("DELETE /sessions/{session_id}", s.HandleDeleteSession)
	s.Mux.HandleFunc("POST /webhooks/{provider}", s.HandleWebhook)
}

// HandleWebhook delegates the webhook request to the CCAIP connector.
func (s *Server) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	s.CCaaS.HandleWebhook(w, r)
}


