package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/stormaref/showcase/service/internal/config"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/handler"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/router"
	"github.com/stormaref/showcase/service/internal/service"
	"github.com/stormaref/showcase/service/internal/storage"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	gormLog := logger.Default.LogMode(logger.Warn)
	if cfg.AppEnv == "development" {
		gormLog = logger.Default.LogMode(logger.Info)
	}
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{Logger: gormLog})
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	if err := db.AutoMigrate(
		&model.Admin{},
		&model.BlogPost{},
		&model.GalleryItem{},
		&model.RefreshToken{},
		&model.AuditLog{},
	); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	store, err := storage.NewMinIOStore(cfg)
	if err != nil {
		log.Fatalf("minio: %v", err)
	}
	ctx := context.Background()
	if err := store.EnsureBucket(ctx); err != nil {
		log.Fatalf("minio bucket: %v", err)
	}

	adminRepo := repository.NewAdminRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	postRepo := repository.NewPostRepository(db)
	galleryRepo := repository.NewGalleryRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	auditSvc := service.NewAuditService(auditRepo)
	authSvc := service.NewAuthService(cfg, adminRepo, tokenRepo, auditSvc)
	postSvc := service.NewPostService(postRepo, store, auditSvc)
	gallerySvc := service.NewGalleryService(galleryRepo, store, auditSvc)
	uploadSvc := service.NewUploadService(cfg, store)

	if err := authSvc.BootstrapAdmin(ctx); err != nil {
		log.Fatalf("bootstrap admin: %v", err)
	}

	handlers := router.Handlers{
		Health:  handler.NewHealthHandler(db, store),
		Auth:    handler.NewAuthHandler(cfg, authSvc),
		Posts:   handler.NewPostHandler(postSvc),
		Gallery: handler.NewGalleryHandler(gallerySvc),
		Upload:  handler.NewUploadHandler(uploadSvc),
		Audit:   handler.NewAuditHandler(auditSvc),
	}

	engine := router.New(cfg, handlers)
	srv := &http.Server{
		Addr:              cfg.ListenAddr(),
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		slog.Info("api listening", "addr", cfg.ListenAddr())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
