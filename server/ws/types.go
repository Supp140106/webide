package ws

import "encoding/json"

// WSMessage represents the standard JSON structure for all WebSocket messages.
type WSMessage struct {
	Type      string          `json:"type"`
	ProjectID string          `json:"projectId"`
	FilePath  string          `json:"filePath"`
	Payload   json.RawMessage `json:"payload"`
}

// Handler defines the interface for modular WebSocket message handlers.
type Handler interface {
	Handle(payload json.RawMessage) error
	Close() error
}
