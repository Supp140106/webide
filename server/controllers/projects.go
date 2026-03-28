package controllers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"server/config"
	"server/models"
	"server/utils"
	"strings"

	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type OpenProjectRequest struct {
	RepoURL   string `json:"repoUrl"`
	ProjectID string `json:"projectId"` // Optional, if opening an existing project
}

func OpenProject(c *gin.Context) {
	var req OpenProjectRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	user := userInterface.(models.User)

	var projectID uuid.UUID
	var repoName string
	var containerName string
	isNewProject := req.ProjectID == ""

	if isNewProject {
		projectID = uuid.New()
		repoName = strings.TrimSuffix(filepath.Base(req.RepoURL), ".git")
		containerName = "project-" + projectID.String()
		log.Printf("Opening NEW project: %s (ID: %s)", repoName, projectID)
	} else {
		var err error
		projectID, err = uuid.Parse(req.ProjectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Project ID"})
			return
		}
		var existingProject models.Project
		if err := config.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&existingProject).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		repoName = existingProject.Name
		containerName = existingProject.ContainerName
		log.Printf("Opening EXISTING project: %s (ID: %s)", repoName, projectID)
	}

	workspace := "/tmp/workspaces/" + projectID.String()

	if isNewProject {
		if err := os.MkdirAll(workspace, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workspace directory"})
			return
		}
		cmd := exec.Command("git", "clone", req.RepoURL, workspace)
		if err := cmd.Run(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Git clone failed"})
			return
		}
	} else {
		// Restore from DB
		if err := os.MkdirAll(workspace, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workspace directory"})
			return
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
	}

	// Get a free port for this container
	port, err := utils.GetFreePort()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign port"})
		return
	}

	// Make sure a container with this name is not already running or lingering
	exec.Command("docker", "rm", "-f", containerName).Run()

	uid := fmt.Sprintf("%d", os.Getuid())
	gid := fmt.Sprintf("%d", os.Getgid())

	// Pre-create the npm cache directory so Docker doesn't create it as root
	os.MkdirAll(filepath.Join(workspace, ".npm-cache"), os.ModePerm)

	log.Printf("Starting Docker container %s on port %d with UID:GID %s:%s", containerName, port, uid, gid)
	dockerCmd := exec.Command(
		"docker", "run", "-d",
		"--name", containerName,
		"--user", uid+":"+gid, // Run as host user
		"-v", workspace+":/app",
		"-w", "/app",
		// Mount a temporary home directory so npm cache doesn't fail
		"-v", workspace+"/.npm-cache:/tmp/npm-cache",
		"-e", "npm_config_cache=/tmp/npm-cache",
		"-p", fmt.Sprintf("%d:5173", port),
		"node:22-alpine",
		"sh", "-c", "npm install && npm run dev -- --host",
	)

	if err := dockerCmd.Run(); err != nil {
		log.Printf("Docker run failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Docker start failed"})
		return
	}

	if isNewProject {
		project := models.Project{
			ID:            projectID,
			RepoURL:       req.RepoURL,
			Name:          repoName,
			ContainerName: containerName,
			UserID:        user.ID,
		}
		if err := config.DB.Create(&project).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save project to db"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Project started successfully",
		"projectId": projectID,
		"container": containerName,
		"repoName":  repoName,
		"port":      port,
	})
}

func ListProjects(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	user := userInterface.(models.User)

	var projects []models.Project
	if err := config.DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func CloseProject(c *gin.Context) {
	projectIDParam := c.Param("id")
	projectID, err := uuid.Parse(projectIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	user := userInterface.(models.User)

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Run the teardown and database sync in a background goroutine
	go func(proj models.Project, id uuid.UUID) {
		// Stop and remove docker container
		exec.Command("docker", "stop", proj.ContainerName).Run()
		exec.Command("docker", "rm", "-f", proj.ContainerName).Run()

		workspace := "/tmp/workspaces/" + id.String()

		// Delete existing files in DB
		config.DB.Where("project_id = ?", id).Delete(&models.File{})

		// Sync files to DB
		err := saveWorkspaceToDB(id, workspace, "")
		if err != nil {
			log.Printf("Failed to sync workspace to DB for project %s: %v", id, err)
		}

		// Delete local workspace with fallback
		if err := os.RemoveAll(workspace); err != nil {
			exec.Command("docker", "run", "--rm", "-v", "/tmp/workspaces:/workspaces", "alpine", "rm", "-rf", "/workspaces/"+id.String()).Run()
		}
	}(project, projectID)

	c.JSON(http.StatusOK, gin.H{"message": "Project is closing in the background"})
}

func DeleteProject(c *gin.Context) {
	projectIDParam := c.Param("id")
	projectID, err := uuid.Parse(projectIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	user := userInterface.(models.User)

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Eagerly delete from DB so it instantly disappears from the Dashboard
	config.DB.Where("project_id = ?", projectID).Delete(&models.File{})
	config.DB.Delete(&project)

	// Run the heavy Docker/file cleanup operations in the background
	go func(proj models.Project) {
		// Stop and remove docker container
		exec.Command("docker", "stop", proj.ContainerName).Run()
		exec.Command("docker", "rm", "-f", proj.ContainerName).Run()

		workspace := "/tmp/workspaces/" + proj.ID.String()

		// Delete local workspace
		if err := os.RemoveAll(workspace); err != nil {
			exec.Command("docker", "run", "--rm", "-v", "/tmp/workspaces:/workspaces", "alpine", "rm", "-rf", "/workspaces/"+proj.ID.String()).Run()
		}
	}(project)

	c.JSON(http.StatusOK, gin.H{"message": "Project deletion started"})
}

func saveWorkspaceToDB(projectID uuid.UUID, basePath string, relativePath string) error {
	fullPath := filepath.Join(basePath, relativePath)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		name := entry.Name()
		// Skip generated/cache directories and .git to save DB space
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
			saveWorkspaceToDB(projectID, basePath, rel)
		}
	}
	return nil
}

func SaveProject(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Project saved (stub)"})
}

type FileNode struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Type         string     `json:"type"`
	Children     []FileNode `json:"children,omitempty"`
	IsSelectable bool       `json:"isSelectable"`
}

func GetFileTree(c *gin.Context) {
	projectID := c.Param("id")
	workspace := "/tmp/workspaces/" + projectID

	if _, err := os.Stat(workspace); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project workspace not found"})
		return
	}

	tree, err := buildFileTree(workspace, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build file tree"})
		return
	}

	c.JSON(http.StatusOK, tree)
}

func buildFileTree(basePath, relativePath string) ([]FileNode, error) {
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
			children, err := buildFileTree(basePath, rel)
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

func GetFileContent(c *gin.Context) {
	projectID := c.Param("id")
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File path is required"})
		return
	}

	fullPath := filepath.Join("/tmp/workspaces/", projectID, filePath)

	if !strings.HasPrefix(fullPath, "/tmp/workspaces/"+projectID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	content, err := os.ReadFile(fullPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"content": string(content)})
}

func SaveFileContent(c *gin.Context) {
	projectID := c.Param("id")
	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	fullPath := filepath.Join("/tmp/workspaces/", projectID, req.Path)

	if !strings.HasPrefix(fullPath, "/tmp/workspaces/"+projectID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File saved successfully"})
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func TerminalWebsocket(c *gin.Context) {
	projectID := c.Param("id")
	containerName := "project-" + projectID

	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer ws.Close()

	cmd := exec.Command("docker", "exec", "-it", containerName, "/bin/sh")

	f, err := pty.Start(cmd)
	if err != nil {
		log.Printf("Failed to start pty: %v", err)
		return
	}
	defer f.Close()

	go func() {
		io.Copy(&wsWriter{ws: ws}, f)
	}()

	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("WS read error for container %s: %v", containerName, err)
			}
			break
		}
		if _, err := f.Write(message); err != nil {
			log.Printf("PTY write error for container %s: %v", containerName, err)
			break
		}
	}

	cmd.Wait()
}

type wsWriter struct {
	ws *websocket.Conn
}

func (w *wsWriter) Write(p []byte) (n int, err error) {
	err = w.ws.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func GetProjectPort(c *gin.Context) {
	projectID := c.Param("id")
	containerName := "project-" + projectID

	portCmd := exec.Command("docker", "port", containerName, "5173/tcp")
	portOut, _ := portCmd.Output()
	portStr := strings.TrimSpace(string(portOut))
	
	if portStr != "" {
		parts := strings.Split(portStr, ":")
		if len(parts) > 0 {
			port := parts[len(parts)-1]
			c.JSON(http.StatusOK, gin.H{"port": port})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Port not found"})
}
