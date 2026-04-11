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

func (s *DockerService) StartContainer(containerName, workspace string) (string, error) {
	uid := fmt.Sprintf("%d", os.Getuid())
	gid := fmt.Sprintf("%d", os.Getgid())

	os.MkdirAll(workspace+"/.npm-cache", os.ModePerm)

	exec.Command("docker", "rm", "-f", containerName).Run()

	log.Printf("Starting Docker container %s with Traefik subdomain", containerName)

	dockerCmd := exec.Command(
		"docker", "run", "-d",
		"--name", containerName,
		"--network", "traefik_net",
		"--add-host=host.docker.internal:host-gateway",

		// Traefik labels
		"-l", "traefik.enable=true",
		"-l", "traefik.docker.network=traefik_net",
		"-l", fmt.Sprintf("traefik.http.routers.%s.rule=Host(`%s.localhost`)", containerName, containerName),
		"-l", fmt.Sprintf("traefik.http.services.%s.loadbalancer.server.port=5173", containerName),

		"--user", uid+":"+gid,
		"-v", workspace+":/app",
		"-w", "/app",
		"-v", workspace+"/.npm-cache:/tmp/npm-cache",
		"-e", "npm_config_cache=/tmp/npm-cache",

		"node:22-alpine",
		"sh", "-c", "[ -f package.json ] && npm install && npm run dev -- --host || (echo 'No package.json found, keeping container alive' && tail -f /dev/null)",
	)

	log.Printf("Running Docker command: %s", strings.Join(dockerCmd.Args, " "))
	output, err := dockerCmd.CombinedOutput()
	if err != nil {
		log.Printf("Docker run failed for %s: %v, output: %s", containerName, err, string(output))
		return "", fmt.Errorf("docker run failed: %w, output: %s", err, string(output))
	}

	// Generate dynamic URL
	url := fmt.Sprintf("http://%s.localhost", containerName)
	return url, nil
}

func (s *DockerService) StopAndRemoveContainer(containerName string) {
	exec.Command("docker", "stop", containerName).Run()
	exec.Command("docker", "rm", "-f", containerName).Run()
}
