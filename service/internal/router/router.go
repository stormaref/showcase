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
	Health    *handler.HealthHandler
	Auth      *handler.AuthHandler
	Posts     *handler.PostHandler
	Designs   *handler.DesignHandler
	Sizes     *handler.SizeHandler
	Types     *handler.TypeHandler
	Finishes  *handler.FinishHandler
	BrandInfo *handler.BrandInfoHandler
	Brands    *handler.BrandHandler
	Upload    *handler.UploadHandler
	Audit     *handler.AuditHandler
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
		registerPublicRoutes(v1, h)
		registerAuthRoutes(cfg, v1, h)
		registerAdminRoutes(cfg, v1, h)
	}
	return r
}

func registerPublicRoutes(v1 *gin.RouterGroup, h Handlers) {
	public := v1.Group("/public")

	posts := public.Group("/posts")
	{
		posts.GET("", h.Posts.ListPublic)
		posts.GET("/:slug", h.Posts.GetPublic)
	}

	designs := public.Group("/designs")
	{
		designs.GET("", h.Designs.ListPublic)
		designs.GET("/:id", h.Designs.GetPublic)
	}

	brands := public.Group("/brands")
	{
		brands.GET("", h.Brands.ListPublic)
	}

	types := public.Group("/types")
	{
		types.GET("", h.Types.ListPublic)
	}

	public.GET("/brand-info", h.BrandInfo.GetPublic)
}

func registerAuthRoutes(cfg *config.Config, v1 *gin.RouterGroup, h Handlers) {
	auth := v1.Group("/auth")
	auth.Use(middleware.SetCSRFCookie(cfg))

	auth.POST("/login", middleware.RateLimit(cfg.LoginRateLimit), h.Auth.Login)
	auth.POST("/refresh", middleware.CSRF(cfg), h.Auth.Refresh)
	auth.GET("/csrf", h.Auth.CSRFToken)

	logout := auth.Group("")
	logout.Use(middleware.CSRF(cfg))
	logout.POST("/logout", h.Auth.Logout)
}

func registerAdminRoutes(cfg *config.Config, v1 *gin.RouterGroup, h Handlers) {
	admin := v1.Group("/admin")
	admin.Use(middleware.AuthJWT(cfg), middleware.SetCSRFCookie(cfg), middleware.CSRF(cfg))

	admin.GET("/me", h.Auth.Me)

	posts := admin.Group("/posts")
	{
		posts.GET("", h.Posts.ListAdmin)
		posts.GET("/:id", h.Posts.GetAdmin)
		posts.POST("", h.Posts.Create)
		posts.PUT("/:id", h.Posts.Update)
		posts.DELETE("/:id", h.Posts.Delete)
	}

	designs := admin.Group("/designs")
	{
		designs.GET("", h.Designs.ListAdmin)
		designs.GET("/:id", h.Designs.GetAdmin)
		designs.POST("", h.Designs.Create)
		designs.PUT("/:id", h.Designs.Update)
		designs.DELETE("/:id", h.Designs.Delete)
	}

	sizes := admin.Group("/sizes")
	{
		sizes.GET("", h.Sizes.List)
		sizes.POST("", h.Sizes.Create)
		sizes.PUT("/:id", h.Sizes.Update)
		sizes.DELETE("/:id", h.Sizes.Delete)
	}

	types := admin.Group("/types")
	{
		types.GET("", h.Types.List)
		types.POST("", h.Types.Create)
		types.PUT("/:id", h.Types.Update)
		types.DELETE("/:id", h.Types.Delete)
	}

	finishes := admin.Group("/finishes")
	{
		finishes.GET("", h.Finishes.List)
		finishes.POST("", h.Finishes.Create)
		finishes.PUT("/:id", h.Finishes.Update)
		finishes.DELETE("/:id", h.Finishes.Delete)
	}

	brands := admin.Group("/brands")
	{
		brands.GET("", h.Brands.ListAdmin)
		brands.GET("/:id", h.Brands.GetAdmin)
		brands.POST("", h.Brands.Create)
		brands.PUT("/:id", h.Brands.Update)
		brands.DELETE("/:id", h.Brands.Delete)
	}

	brandInfo := admin.Group("/brand-info")
	{
		brandInfo.GET("", h.BrandInfo.GetAdmin)
		brandInfo.PUT("", h.BrandInfo.Update)
	}

	admin.POST("/uploads", h.Upload.Upload)
	admin.GET("/audit-logs", h.Audit.List)
}
