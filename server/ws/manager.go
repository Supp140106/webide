package ws

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // IDE context usually permits cross-origin for local dev
	},
}

// Manager coordinates multiple handlers for a single WebSocket connection.
type Manager struct {
	handlers  map[string]Handler
	conn      *websocket.Conn
	projectID string
	client    *Client
}

// ServeWS handles the initial entry point for a WebSocket connection.
func ServeWS(c *gin.Context) {
	projectID := c.Param("id")

	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	mgr := &Manager{
		handlers:  make(map[string]Handler),
		conn:      ws,
		projectID: projectID,
	}

	client := &Client{
		Manager:   mgr,
		ProjectID: projectID,
		Conn:      ws,
		Send:      make(chan WSMessage, 256),
	}
	mgr.client = client

	// Register the client to the hub
	GlobalHub.register <- client

	// Start the write pump in a separate goroutine
	go client.WritePump()

	// Ensure all handlers and client are cleaned up
	defer func() {
		GlobalHub.unregister <- client
		for _, h := range mgr.handlers {
			h.Close()
		}
	}()

	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("Invalid JSON received: %v", err)
			continue
		}

		// Fill in missing ProjectID if not provided by frontend (compatibility)
		if wsMsg.ProjectID == "" {
			wsMsg.ProjectID = projectID
		}

		// Direct handling for collaboration messages
		if wsMsg.Type == "edit" {
			// Broadcast to all other clients in the project
			GlobalHub.Broadcast(wsMsg)
			continue
		}

		// Lazy-load requested handler if it doesn't exist
		handler, err := mgr.getOrCreateHandler(wsMsg.Type)
		if err != nil {
			log.Printf("Could not initialize handler for type %s: %v", wsMsg.Type, err)
			continue
		}

		if err := handler.Handle(wsMsg.Payload); err != nil {
			log.Printf("Handler execution error (%s): %v", wsMsg.Type, err)
		}
	}
}

func (m *Manager) getOrCreateHandler(msgType string) (Handler, error) {
	if h, ok := m.handlers[msgType]; ok {
		return h, nil
	}

	var h Handler
	var err error

	switch msgType {
	case "terminal":
		h, err = NewTerminalHandler(m.projectID, func(data []byte) {
			m.broadcast("terminal", "", data)
		})
	default:
		log.Printf("Unsupported message type: %s", msgType)
		return nil, nil // Silently ignore unsupported for now
	}

	if err != nil {
		return nil, err
	}

	m.handlers[msgType] = h
	return h, nil
}

func (m *Manager) broadcast(msgType string, filePath string, data []byte) {
	payload, _ := json.Marshal(string(data))
	msg := WSMessage{
		Type:      msgType,
		ProjectID: m.projectID,
		FilePath:  filePath,
		Payload:   payload,
	}
	// Send directly to this client only — terminal output must NOT bleed to other sessions
	select {
	case m.client.Send <- msg:
	default:
	}
}
