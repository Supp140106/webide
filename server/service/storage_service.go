package service

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"server/config"
	"server/models"
	"strings"

	"github.com/google/uuid"
)

type StorageService struct{}

func NewStorageService() *StorageService {
	return &StorageService{}
}

func (s *StorageService) GetWorkspacePath(projectID uuid.UUID) string {
	return filepath.Join("/tmp/workspaces/", projectID.String())
}

func (s *StorageService) RestoreWorkspaceFromDB(projectID uuid.UUID, workspace string) error {
	if err := os.MkdirAll(workspace, os.ModePerm); err != nil {
		return err
	}
	var files []models.File
	config.DB.Where("project_id = ?", projectID).Find(&files)
	for _, f := range files {
		fullPath := filepath.Join(workspace, f.Path)
		if f.IsDir {
			os.MkdirAll(fullPath, os.ModePerm)
		} else {
			os.MkdirAll(filepath.Dir(fullPath), os.ModePerm)
			os.WriteFile(fullPath, []byte(f.Content), 0644)
		}
	}
	return nil
}

func (s *StorageService) SaveWorkspaceToDB(projectID uuid.UUID, basePath string, relativePath string) error {
	fullPath := filepath.Join(basePath, relativePath)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		name := entry.Name()
		// Skip generated/cache directories
		if name == ".git" || name == "node_modules" || name == ".npm-cache" || name == "dist" || name == "build" || name == ".cache" || name == ".next" {
			continue
		}

		rel := filepath.Join(relativePath, entry.Name())
		entryFullPath := filepath.Join(basePath, rel)
		isDir := entry.IsDir()

		var content string
		if !isDir {
			b, err := os.ReadFile(entryFullPath)
			if err == nil {
				content = string(b)
			} else {
				log.Printf("Failed to read file %s: %v", entryFullPath, err)
			}
		}

		fileRecord := models.File{
			ID:        uuid.New(),
			ProjectID: projectID,
			Path:      rel,
			Content:   content,
			IsDir:     isDir,
		}
		config.DB.Create(&fileRecord)

		if isDir {
			s.SaveWorkspaceToDB(projectID, basePath, rel)
		}
	}
	return nil
}

type FileNode struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Type         string     `json:"type"`
	Children     []FileNode `json:"children,omitempty"`
	IsSelectable bool       `json:"isSelectable"`
}

func (s *StorageService) BuildFileTree(basePath, relativePath string) ([]FileNode, error) {
	fullPath := filepath.Join(basePath, relativePath)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	var nodes []FileNode
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".git") || entry.Name() == "node_modules" {
			continue
		}

		rel := filepath.Join(relativePath, entry.Name())
		id := rel

		node := FileNode{
			ID:           id,
			Name:         entry.Name(),
			IsSelectable: true,
		}

		if entry.IsDir() {
			node.Type = "folder"
			children, err := s.BuildFileTree(basePath, rel)
			if err != nil {
				return nil, err
			}
			node.Children = children
		} else {
			node.Type = "file"
		}

		nodes = append(nodes, node)
	}

	return nodes, nil
}

func (s *StorageService) CleanupWorkspace(projectID uuid.UUID) {
	workspace := s.GetWorkspacePath(projectID)
	if err := os.RemoveAll(workspace); err != nil {
		// Fallback to docker rm if permissions are weird
		exec.Command("docker", "run", "--rm", "-v", "/tmp/workspaces:/workspaces", "alpine", "rm", "-rf", "/workspaces/"+projectID.String()).Run()
	}
}
