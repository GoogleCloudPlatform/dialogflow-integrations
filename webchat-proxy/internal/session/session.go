package session

import (
	"context"
	"io"
	"log"

	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
	"cloud.google.com/go/dialogflow/apiv2beta1/dialogflowpb"
)

type Session struct {
	ID              string
	ParticipantName string
	Cancel          context.CancelFunc
	Done            chan struct{}

	client *dialogflow.ParticipantsClient
	stream dialogflowpb.Participants_BidiEndpointInteractClient
}


func NewSession(id, participantName string, client *dialogflow.ParticipantsClient) *Session {
	return &Session{
		ID:              id,
		ParticipantName: participantName,
		Done:            make(chan struct{}),
		client:          client,
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

		// TODO: Replace the echo behavior below.
		// Forward any message from V2 API to the 3P
		log.Printf("Session %s: Received message from V2 API: %v", s.ID, resp)
		output := resp.GetOutput()
		if output == nil { continue }
		text := output.GetText()
		if text == "" { continue }
		messageReq := &dialogflowpb.BidiEndpointInteractRequest{
		  Request: &dialogflowpb.BidiEndpointInteractRequest_Input_{
		    Input: &dialogflowpb.BidiEndpointInteractRequest_Input{
		      Text: text,
		    },
		  },
		}
	  if err := s.stream.Send(messageReq); err != nil {
		  log.Printf("[Session %s] ERROR: Failed to send initial request: %v", s.ID, err)
		  return
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
