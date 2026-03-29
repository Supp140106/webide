package ws

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Client represents a single WebSocket connection.
type Client struct {
	Manager   *Manager
	ProjectID string
	Conn      *websocket.Conn
	Send      chan WSMessage
}

// Hub maintains the set of active clients and broadcasts messages to clients.
type Hub struct {
	// Registered clients by ProjectID
	projects map[string]map[*Client]bool
	
	// Inbound messages from the clients.
	broadcast chan WSMessage

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	mu sync.RWMutex
}

var GlobalHub = &Hub{
	broadcast:  make(chan WSMessage),
	register:   make(chan *Client),
	unregister: make(chan *Client),
	projects:   make(map[string]map[*Client]bool),
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.projects[client.ProjectID] == nil {
				h.projects[client.ProjectID] = make(map[*Client]bool)
			}
			h.projects[client.ProjectID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered to project %s", client.ProjectID)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.projects[client.ProjectID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.projects, client.ProjectID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client unregistered from project %s", client.ProjectID)

		case msg := <-h.broadcast:
			h.mu.RLock()
			clients := h.projects[msg.ProjectID]
			for client := range clients {
				// We don't want to broadcast the message back to the sender
				// unless it's a specific type that needs confirmation.
				// For now, let's assume sender handles their own state.
				// Actually, often it's safer to broadcast to everyone to ensure sync.
				
				select {
				case client.Send <- msg:
				default:
					// If the send channel is full, unregister the client
					go func(c *Client) { h.unregister <- c }(client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Broadcast(msg WSMessage) {
	h.broadcast <- msg
}

func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()
	for message := range c.Send {
		if err := c.Conn.WriteJSON(message); err != nil {
			log.Printf("Write error for project %s: %v", c.ProjectID, err)
			return
		}
	}
	// The hub closed the channel correctly.
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
}
