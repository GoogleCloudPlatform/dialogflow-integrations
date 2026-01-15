package session

import (
	"fmt"
	"sync"

	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
)

type SessionManager struct {
	sessions   map[string]*Session
	sessionsMu sync.RWMutex
	client     *dialogflow.ParticipantsClient
}

func NewSessionManager(client *dialogflow.ParticipantsClient) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		client:   client,
	}
}

func (sm *SessionManager) CreateSession(id, participantName string) (*Session, error) {
	sm.sessionsMu.Lock()
	defer sm.sessionsMu.Unlock()

	if _, exists := sm.sessions[id]; exists {
		return nil, fmt.Errorf("session %s already exists", id)
	}

	s := NewSession(id, participantName, sm.client)
	s.StartStream()
	sm.sessions[id] = s
	return s, nil
}

func (sm *SessionManager) GetSession(id string) (*Session, bool) {
	sm.sessionsMu.RLock()
	defer sm.sessionsMu.RUnlock()

	s, exists := sm.sessions[id]
	return s, exists
}

func (sm *SessionManager) DeleteSession(id string) {
	sm.sessionsMu.Lock()
	defer sm.sessionsMu.Unlock()

	if s, exists := sm.sessions[id]; exists {
		s.StopStream()
		delete(sm.sessions, id)
	}
}
