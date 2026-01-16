package session

import (
	"context"
	"io"
	"log"

	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
	"cloud.google.com/go/dialogflow/apiv2beta1/dialogflowpb"
	"webchat-proxy/internal/ccaas"
)

type Session struct {
	ID              string
	ParticipantName string
	CCAIPChatID     string
	CCAIPEndUserID  string
	Cancel          context.CancelFunc
	Done            chan struct{}

	client *dialogflow.ParticipantsClient
	stream dialogflowpb.Participants_BidiEndpointInteractClient
	ccaas  *ccaas.CCAIPConnector
}


func NewSession(id, participantName, ccaipChatID, ccaipEndUserID string, client *dialogflow.ParticipantsClient, cc *ccaas.CCAIPConnector) *Session {
	return &Session{
		ID:              id,
		ParticipantName: participantName,
		CCAIPChatID:     ccaipChatID,
		CCAIPEndUserID:  ccaipEndUserID,
		Done:            make(chan struct{}),
		client:          client,
		ccaas:           cc,
	}
}

// StartStream starts the gRPC stream in a goroutine.
func (s *Session) StartStream() {
	ctx, cancel := context.WithCancel(context.Background())
	s.Cancel = cancel
	go s.runStream(ctx)
}

// Open a BidiEndpointInteract stream and proxy messages
func (s *Session) runStream(ctx context.Context) {
	defer close(s.Done)
	log.Printf("[Session %s] runStream started for participant: %s", s.ID, s.ParticipantName)

	// Open BidiEndpointInteract stream
	log.Printf("[Session %s] Attempting to open BidiEndpointInteract stream...", s.ID)
	var err error
	s.stream, err = s.client.BidiEndpointInteract(ctx)
	if err != nil {
		log.Printf("[Session %s] CRITICAL: Failed to open BidiEndpointInteract: %v", s.ID, err)
		return
	}
	log.Printf("[Session %s] BidiEndpointInteract stream successfully opened.", s.ID)

	// Send initial Config request
	configReq := &dialogflowpb.BidiEndpointInteractRequest{
		Request: &dialogflowpb.BidiEndpointInteractRequest_Config_{
			Config: &dialogflowpb.BidiEndpointInteractRequest_Config{
				Participant:  s.ParticipantName,
				EndpointId:   "webchat-proxy-receive-endpoint",
				ConnectAudio: false,
			},
		},
	}
	log.Printf("[Session %s] Sending initial Config request...", s.ID)
	if err := s.stream.Send(configReq); err != nil {
		log.Printf("[Session %s] ERROR: Failed to send initial config request: %v", s.ID, err)
		return
	}
	log.Printf("[Session %s] Initial Config request sent. Waiting for responses...", s.ID)

	// Keep the stream open and handle incoming messages
	for {
		resp, err := s.stream.Recv()
		if err == io.EOF {
			log.Printf("[Session %s] Stream closed by server (EOF).", s.ID)
			return
		}
		if err != nil {
			select {
			case <-ctx.Done():
				// Context cancelled, normal exit
				log.Printf("Session %s: Context cancelled, closing stream.", s.ID)
				return
			default:
				log.Printf("Session %s: Error receiving from stream: %v", s.ID, err)
				return
			}
		}

		// Forward any message from V2 API to the 3P
		log.Printf("Session %s: Received response from Dialogflow: %+v", s.ID, resp)
		if output := resp.GetOutput(); output != nil && output.GetText() != "" {
			if output.GetParticipant() == s.ParticipantName {
				log.Printf("Session %s: Ignoring message from our own participant (%s).", s.ID, s.ParticipantName)
				continue
			}

			text := output.GetText()
			log.Printf("Session %s: Forwarding bot message to CCaIP: %s", s.ID, text)

			sendReq := &ccaas.SendMessageRequest{
				FromUserID: s.CCAIPEndUserID, // Bot messages should be attributed to the end user for context, or a system user if applicable
				Message: ccaas.MessageBlock{
					Type:    "text",
					Content: text,
				},
			}
			if err := s.ccaas.SendMessage(ctx, s.CCAIPChatID, sendReq); err != nil {
				log.Printf("Session %s: ERROR forwarding bot message: %v", s.ID, err)
			}
		}
	}
}

// StopStream cancels the session context and blocks until the stream goroutine exits.
func (s *Session) StopStream() {
	if s.stream != nil {
		s.stream.CloseSend()
	}
	if s.Cancel != nil {
		s.Cancel()
	}
	<-s.Done
}
