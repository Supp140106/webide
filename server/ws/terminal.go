package ws

import (
	"encoding/json"
	"io"
	"log"
	"os"
	"os/exec"

	"github.com/creack/pty"
)

// TerminalHandler handles terminal interaction via Docker PTY.
type TerminalHandler struct {
	projectID     string
	containerName string
	pty           *os.File
	cmd           *exec.Cmd
	onOutput      func(data []byte)
}

// NewTerminalHandler initializes a new terminal session.
func NewTerminalHandler(projectID string, onOutput func(data []byte)) (*TerminalHandler, error) {
	containerName := "project-" + projectID
	cmd := exec.Command("docker", "exec", "-it", containerName, "/bin/sh")

	f, err := pty.Start(cmd)
	if err != nil {
		return nil, err
	}

	h := &TerminalHandler{
		projectID:     projectID,
		containerName: containerName,
		pty:           f,
		cmd:           cmd,
		onOutput:      onOutput,
	}

	// PTY output to WS callback
	go func() {
		buf := make([]byte, 4096) // Larger buffer for standard output
		for {
			n, err := f.Read(buf)
			if err != nil {
				if err != io.EOF {
					log.Printf("PTY read error for %s: %v", containerName, err)
				}
				break
			}
			onOutput(buf[:n])
		}
	}()

	return h, nil
}

// Handle receives input from the WebSocket and writes it to the PTY.
func (h *TerminalHandler) Handle(payload json.RawMessage) error {
	var input string
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	_, err := h.pty.Write([]byte(input))
	return err
}

// Close cleans up the PTY and command.
func (h *TerminalHandler) Close() error {
	if h.pty != nil {
		h.pty.Close()
	}
	if h.cmd != nil {
		h.cmd.Process.Kill()
	}
	return nil
}
