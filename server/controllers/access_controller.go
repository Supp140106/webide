package controllers

import (
	"net/http"
	"server/config"
	"server/models"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ShareProjectRequest struct {
	Email string `json:"email"`
}

func ShareProject(c *gin.Context) {
	projectIDParam := c.Param("id")
	projectID, err := uuid.Parse(projectIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req ShareProjectRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userInterface, _ := c.Get("user")
	currentUser := userInterface.(models.User)

	// Verify project ownership
	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, currentUser.ID).First(&project).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the project owner can share it"})
		return
	}

	// Check if target user exists
	var targetUser models.User
	if err := config.DB.Where("email = ?", strings.ToLower(req.Email)).First(&targetUser).Error; err != nil {
		// User does not exist, create an invite
		token := uuid.New().String()
		invite := models.ProjectInvite{
			ID:        uuid.New(),
			ProjectID: projectID,
			Email:     strings.ToLower(req.Email),
			Token:     token,
		}
		if err := config.DB.Create(&invite).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invite"})
			return
		}

		// In a real app, we would send an email here.
		// For now, we return the invite link as requested.
		inviteLink := "http://localhost:5173/signup?invite=" + token
		c.JSON(http.StatusOK, gin.H{
			"message":    "Invite created for new user",
			"inviteLink": inviteLink,
			"pending":    true,
		})
		return
	}

	// User exists, grant direct access
	access := models.ProjectAccess{
		ID:        uuid.New(),
		ProjectID: projectID,
		UserID:    targetUser.ID,
	}

	// Check if access already exists
	var existingAccess models.ProjectAccess
	if err := config.DB.Where("project_id = ? AND user_id = ?", projectID, targetUser.ID).First(&existingAccess).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already has access to this project"})
		return
	}

	if err := config.DB.Create(&access).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to grant access"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Access granted successfully to " + targetUser.Email,
		"pending": false,
	})
}

func VerifyInvite(c *gin.Context) {
	token := c.Param("token")
	var invite models.ProjectInvite
	if err := config.DB.Where("token = ?", token).First(&invite).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired invite token"})
		return
	}

	var project models.Project
	config.DB.Where("id = ?", invite.ProjectID).First(&project)

	c.JSON(http.StatusOK, gin.H{
		"project": project.Name,
		"email":   invite.Email,
	})
}
