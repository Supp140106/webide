package router

import (
	"net/http"
	"server/controllers"
	"server/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Auth routes
	auth := r.Group("/auth")
	{
		auth.POST("/send-otp", controllers.SendOTP)
		auth.POST("/verify-otp", controllers.VerifyOTP)
		auth.POST("/login", controllers.Login)
	}

	// Protected routes
	protected := r.Group("/user")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/me", func(c *gin.Context) {
			user, _ := c.Get("user")
			c.JSON(http.StatusOK, gin.H{"user": user})
		})
	}
}
