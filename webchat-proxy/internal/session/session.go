package session

import (
	"context"
	"log"

)

type Session struct {
	ID     string
	Cancel context.CancelFunc
	Done   chan struct{}
}

// StopStream cancels the session context and blocks until the stream goroutine exits.
func (s *Session) StopStream() {
	s.Cancel()
	<-s.Done
}

// NewSession creates a new session.
func NewSession(id string) *Session {
	return &Session{
		ID:   id,
		Done: make(chan struct{}),
	}
}

// StartStream starts the gRPC stream in a goroutine.
func (s *Session) StartStream() {
	ctx, cancel := context.WithCancel(context.Background())
	s.Cancel = cancel
	go s.runStream(ctx)
}

// Open a BidiEndpointInteract stream and proxy messages to Ccaas platform
func (s *Session) runStream(ctx context.Context) {
	defer close(s.Done)
	log.Printf("Session %s: Starting stream...", s.ID)

	// TODO: Establish BidiEndpointInteract stream
	// this API stream is supposed to forward any message from V2 API to the 3P

	for {
		select {
		case <-ctx.Done():
			log.Printf("Session %s: Context cancelled, closing stream.", s.ID)
			return
		}
	}
}
