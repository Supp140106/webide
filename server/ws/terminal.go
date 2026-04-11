package ws

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"time"

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

	// Wait up to 10s for the container to be running
	if err := waitForContainer(containerName, 10*time.Second); err != nil {
		return nil, fmt.Errorf("container %s not ready: %w", containerName, err)
	}

	cmd := exec.Command("docker", "exec", "-i",
		"-e", `PS1=\n\[\033[1;36m\]\w\[\033[0m\]\n\[\033[1;32m\]> \[\033[0m\] `,
		containerName, "/bin/sh")

	f, err := pty.Start(cmd)
	if err != nil {
		return nil, fmt.Errorf("pty start failed for %s: %w", containerName, err)
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
		buf := make([]byte, 4096)
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

// waitForContainer polls until the container is running or timeout is reached.
func waitForContainer(name string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		out, err := exec.Command("docker", "inspect", "-f", "{{.State.Running}}", name).Output()
		if err == nil && string(out) != "" {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("timed out waiting for container %s", name)
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
