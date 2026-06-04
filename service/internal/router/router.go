package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/stormaref/showcase/service/internal/config"
	"github.com/stormaref/showcase/service/internal/handler"
	"github.com/stormaref/showcase/service/internal/locale"
	"github.com/stormaref/showcase/service/internal/middleware"
)

type Handlers struct {
	Health  *handler.HealthHandler
	Auth    *handler.AuthHandler
	Posts   *handler.PostHandler
	Designs *handler.DesignHandler
	Sizes   *handler.SizeHandler
	Upload  *handler.UploadHandler
	Audit   *handler.AuditHandler
}

func New(cfg *config.Config, h Handlers) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery(), middleware.RequestID(), middleware.Logger(), middleware.SecurityHeaders(), locale.Middleware())
	r.Use(middleware.MaxBodySize(cfg.MaxUploadBytes + 1024*1024))
	r.Use(middleware.RateLimit(cfg.RateLimitPerMinute))

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept-Language", middleware.CSRFHeaderName(), "X-Request-ID"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", h.Health.Live)
	r.GET("/ready", h.Health.Ready)

	v1 := r.Group("/api/v1")
	{
		public := v1.Group("/public")
		{
			public.GET("/posts", h.Posts.ListPublic)
			public.GET("/posts/:slug", h.Posts.GetPublic)
			public.GET("/designs", h.Designs.ListPublic)
		}

		auth := v1.Group("/auth")
		auth.Use(middleware.SetCSRFCookie(cfg))
		{
			auth.POST("/login", middleware.RateLimit(cfg.LoginRateLimit), h.Auth.Login)
			auth.POST("/refresh", middleware.CSRF(cfg), h.Auth.Refresh)
			auth.GET("/csrf", h.Auth.CSRFToken)
			logout := auth.Group("")
			logout.Use(middleware.CSRF(cfg))
			logout.POST("/logout", h.Auth.Logout)
		}

		admin := v1.Group("/admin")
		admin.Use(middleware.AuthJWT(cfg), middleware.SetCSRFCookie(cfg), middleware.CSRF(cfg))
		{
			admin.GET("/me", h.Auth.Me)
			admin.GET("/posts", h.Posts.ListAdmin)
			admin.GET("/posts/:id", h.Posts.GetAdmin)
			admin.POST("/posts", h.Posts.Create)
			admin.PUT("/posts/:id", h.Posts.Update)
			admin.DELETE("/posts/:id", h.Posts.Delete)
			admin.GET("/designs", h.Designs.ListAdmin)
			admin.GET("/designs/:id", h.Designs.GetAdmin)
			admin.POST("/designs", h.Designs.Create)
			admin.PUT("/designs/:id", h.Designs.Update)
			admin.DELETE("/designs/:id", h.Designs.Delete)
			admin.GET("/sizes", h.Sizes.List)
			admin.POST("/sizes", h.Sizes.Create)
			admin.PUT("/sizes/:id", h.Sizes.Update)
			admin.DELETE("/sizes/:id", h.Sizes.Delete)
			admin.POST("/uploads", h.Upload.Upload)
			admin.GET("/audit-logs", h.Audit.List)
		}
	}
	return r
}
