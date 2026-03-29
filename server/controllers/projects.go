package controllers

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"server/config"
	"server/models"
	"server/service"
	"server/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var (
	dockerSvc  = service.NewDockerService()
	gitSvc     = service.NewGitService()
	storageSvc = service.NewStorageService()
)

type OpenProjectRequest struct {
	RepoURL   string `json:"repoUrl"`
	ProjectID string `json:"projectId"`
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
	} else {
		var err error
		projectID, err = uuid.Parse(req.ProjectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Project ID"})
			return
		}
		var existingProject models.Project
		if err := config.DB.Where("id = ? AND (user_id = ? OR id IN (SELECT project_id FROM project_accesses WHERE user_id = ?))", projectID, user.ID, user.ID).First(&existingProject).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found or access denied"})
			return
		}
		repoName = existingProject.Name
		containerName = existingProject.ContainerName
	}

	workspace := storageSvc.GetWorkspacePath(projectID)

	// Reuse existing container if running
	if dockerSvc.IsContainerRunning(containerName) {
		port, err := dockerSvc.GetContainerPort(containerName)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{
				"message":   "Project is already running",
				"projectId": projectID,
				"container": containerName,
				"repoName":  repoName,
				"port":      port,
			})
			return
		}
	}

	// Prepare workspace
	if isNewProject {
		if err := os.MkdirAll(workspace, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workspace directory"})
			return
		}
		if err := gitSvc.CloneRepo(req.RepoURL, workspace); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Git clone failed"})
			return
		}
	} else {
		if err := storageSvc.RestoreWorkspaceFromDB(projectID, workspace); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore workspace"})
			return
		}
	}

	// Start environment
	port, err := utils.GetFreePort()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign port"})
		return
	}

	if err := dockerSvc.StartContainer(containerName, workspace, port); err != nil {
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
		config.DB.Create(&project)
	} else {
		// Update UpdatedAt for existing project
		config.DB.Model(&models.Project{}).Where("id = ?", projectID).Update("updated_at", time.Now())
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

	var ownedProjects []models.Project
	config.DB.Where("user_id = ?", user.ID).Order("updated_at desc").Find(&ownedProjects)

	var sharedProjects []models.Project
	config.DB.Table("projects").
		Select("projects.*").
		Joins("JOIN project_accesses ON projects.id = project_accesses.project_id").
		Where("project_accesses.user_id = ?", user.ID).
		Order("projects.updated_at desc").
		Find(&sharedProjects)

	c.JSON(http.StatusOK, gin.H{
		"owned":  ownedProjects,
		"shared": sharedProjects,
	})
}

func CloseProject(c *gin.Context) {
	projectIDParam := c.Param("id")
	projectID, err := uuid.Parse(projectIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userInterface, _ := c.Get("user")
	user := userInterface.(models.User)

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	go func(proj models.Project, id uuid.UUID) {
		dockerSvc.StopAndRemoveContainer(proj.ContainerName)
		workspace := storageSvc.GetWorkspacePath(id)
		config.DB.Where("project_id = ?", id).Delete(&models.File{})
		
		if err := storageSvc.SaveWorkspaceToDB(id, workspace, ""); err != nil {
			log.Printf("Failed to sync workspace to DB for project %s: %v", id, err)
		}
		storageSvc.CleanupWorkspace(id)
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

	userInterface, _ := c.Get("user")
	user := userInterface.(models.User)

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	config.DB.Where("project_id = ?", projectID).Delete(&models.File{})
	config.DB.Delete(&project)

	go func(proj models.Project) {
		dockerSvc.StopAndRemoveContainer(proj.ContainerName)
		storageSvc.CleanupWorkspace(proj.ID)
	}(project)

	c.JSON(http.StatusOK, gin.H{"message": "Project deletion started"})
}

func GetFileTree(c *gin.Context) {
	projectIDParam := c.Param("id")
	projectID, _ := uuid.Parse(projectIDParam)
	workspace := storageSvc.GetWorkspacePath(projectID)

	if _, err := os.Stat(workspace); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project workspace not found"})
		return
	}

	tree, err := storageSvc.BuildFileTree(workspace, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build file tree"})
		return
	}

	c.JSON(http.StatusOK, tree)
}

func GetFileContent(c *gin.Context) {
	projectIDParam := c.Param("id")
	projectID, _ := uuid.Parse(projectIDParam)
	filePath := c.Query("path")
	
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File path is required"})
		return
	}

	fullPath := filepath.Join(storageSvc.GetWorkspacePath(projectID), filePath)
	if !strings.HasPrefix(fullPath, "/tmp/workspaces/"+projectIDParam) {
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
	projectIDParam := c.Param("id")
	projectID, _ := uuid.Parse(projectIDParam)
	var req struct {
		Path    string `json:"path" binding:"required"`
		Content string `json:"content"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	fullPath := filepath.Join(storageSvc.GetWorkspacePath(projectID), req.Path)
	if !strings.HasPrefix(fullPath, "/tmp/workspaces/"+projectIDParam) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File saved successfully"})
}

func GetProjectPort(c *gin.Context) {
	projectID := c.Param("id")
	containerName := "project-" + projectID

	port, err := dockerSvc.GetContainerPort(containerName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Port not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"port": port})
}

func SaveProject(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Project saved (stub)"})
}
