package main

import (
	"server/config"
	"server/router"
	"server/ws"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func initializer() {
	godotenv.Load()
	config.ConnectDB()
}

func main() {
	initializer()

	// Start character-level / file-level broadcast hub
	go ws.GlobalHub.Run()

	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	router.SetupRoutes(r)

	r.Run(":3000")
}
