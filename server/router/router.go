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

		protected.POST("/open-project", controllers.OpenProject)
		protected.POST("/save-project", controllers.SaveProject)
		
		// Project specific routes
		protected.GET("/projects", controllers.ListProjects)
		protected.POST("/projects/:id/close", controllers.CloseProject)
		protected.DELETE("/projects/:id", controllers.DeleteProject)
		protected.GET("/projects/:id/port", controllers.GetProjectPort)
		protected.GET("/projects/:id/tree", controllers.GetFileTree)
		protected.GET("/projects/:id/file", controllers.GetFileContent)
		protected.POST("/projects/:id/file", controllers.SaveFileContent)
	}

	// WebSocket route (can be outside protected group or inside if using token in query/header)
	r.GET("/ws/terminal/:id", controllers.TerminalWebsocket)
}
