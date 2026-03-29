package service

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
)

type DockerService struct{}

func NewDockerService() *DockerService {
	return &DockerService{}
}

func (s *DockerService) IsContainerRunning(containerName string) bool {
	cmd := exec.Command("docker", "inspect", "-f", "{{.State.Running}}", containerName)
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(out)) == "true"
}

func (s *DockerService) GetContainerPort(containerName string) (string, error) {
	cmd := exec.Command("docker", "port", containerName, "5173/tcp")
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	portStr := strings.TrimSpace(string(out))
	parts := strings.Split(portStr, ":")
	if len(parts) == 0 {
		return "", fmt.Errorf("could not parse port")
	}
	return parts[len(parts)-1], nil
}

func (s *DockerService) StartContainer(containerName, workspace string, hostPort int) error {
	uid := fmt.Sprintf("%d", os.Getuid())
	gid := fmt.Sprintf("%d", os.Getgid())

	// Pre-create the npm cache directory
	os.MkdirAll(workspace+"/.npm-cache", os.ModePerm)

	// Force remove if exists
	exec.Command("docker", "rm", "-f", containerName).Run()

	log.Printf("Starting Docker container %s on port %d", containerName, hostPort)
	dockerCmd := exec.Command(
		"docker", "run", "-d",
		"--name", containerName,
		"--user", uid+":"+gid,
		"-v", workspace+":/app",
		"-w", "/app",
		"-v", workspace+"/.npm-cache:/tmp/npm-cache",
		"-e", "npm_config_cache=/tmp/npm-cache",
		"-p", fmt.Sprintf("%d:5173", hostPort),
		"node:22-alpine",
		"sh", "-c", "npm install && npm run dev -- --host",
	)

	return dockerCmd.Run()
}

func (s *DockerService) StopAndRemoveContainer(containerName string) {
	exec.Command("docker", "stop", containerName).Run()
	exec.Command("docker", "rm", "-f", containerName).Run()
}
