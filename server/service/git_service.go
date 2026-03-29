package service

import (
	"os/exec"
)

type GitService struct{}

func NewGitService() *GitService {
	return &GitService{}
}

func (s *GitService) CloneRepo(repoURL, workspace string) error {
	cmd := exec.Command("git", "clone", repoURL, workspace)
	return cmd.Run()
}
