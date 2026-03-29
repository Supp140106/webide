package controllers

import (
	"fmt"
	"net/http"
	"server/config"
	"server/models"
	"server/service"
	"server/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func SendOTP(c *gin.Context) {
	var body struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate OTP
	code := utils.GenerateOTP()

	// Save new OTP
	otp := models.OTP{
		ID:        uuid.New(),
		Email:     body.Email,
		Code:      code,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if err := config.DB.Create(&otp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create OTP"})
		return
	}

	// Async cleanup of old OTPs and send email
	go func(email string, currentOtpID uuid.UUID, otpCode string) {
		config.DB.Where("email = ? AND id != ?", email, currentOtpID).Delete(&models.OTP{})
		if err := service.SendEmail(email, otpCode); err != nil {
			fmt.Printf("Error sending email to %s: %v\n", email, err)
		}
	}(body.Email, otp.ID, code)

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent to " + body.Email})
}

// VerifyOTP godoc
// POST /auth/verify-otp
// Body: { "email": "user@example.com", "code": "123456" }
func VerifyOTP(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Code     string `json:"code" binding:"required"`
		Name     string `json:"name"`
		Password string `json:"password"` 
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find OTP
	var otp models.OTP
	if err := config.DB.Where("email = ? AND code = ?", body.Email, body.Code).First(&otp).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	// Check expiry
	if time.Now().After(otp.ExpiresAt) {
		go func(otpToDelete models.OTP) {
			config.DB.Delete(&otpToDelete)
		}(otp)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OTP expired"})
		return
	}

	// Check if user already exists
	var user models.User
	err := config.DB.Where("email = ?", body.Email).First(&user).Error

	if err != nil {
		// User doesn't exist, create new one (Sign Up)
		if body.Name == "" || body.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Name and Password are required for sign up"})
			return
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		user = models.User{
			ID:        uuid.New(),
			Email:     body.Email,
			Name:      body.Name,
			Password:  string(hashedPassword),
			Verified:  true,
			CreatedAt: time.Now(),
		}

		if err := config.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// Check for pending invites
		var invites []models.ProjectInvite
		// Invitation emails are stored in lowercase in the database
		config.DB.Where("email = ?", strings.ToLower(user.Email)).Find(&invites)
		for _, invite := range invites {
			access := models.ProjectAccess{
				ID:        uuid.New(),
				ProjectID: invite.ProjectID,
				UserID:    user.ID,
			}
			config.DB.Create(&access)
			config.DB.Delete(&invite)
		}
	} else {
		// User exists, mark as verified if not already (Login)
		if !user.Verified {
			config.DB.Model(&user).Update("verified", true)
		}
	}

	// Delete OTP after successful verification asynchronously
	go func(otpToDelete models.OTP) {
		config.DB.Delete(&otpToDelete)
	}(otp)

	// Generate JWT
	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set Token Cookie
	c.SetCookie("token", token, 3600*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Verified successfully",
		"token":   token,
		"user":    user,
	})
}

func Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set Token Cookie
	c.SetCookie("token", token, 3600*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}
