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
	"github.com/stormaref/showcase/service/internal/migrate"
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

	if err := migrate.RunPre(db); err != nil {
		log.Fatalf("migrate pre: %v", err)
	}

	if err := db.AutoMigrate(
		&model.Admin{},
		&model.BlogPost{},
		&model.BlogPostTranslation{},
		&model.Design{},
		&model.DesignTranslation{},
		&model.TileSize{},
		&model.DesignSize{},
		&model.DesignImage{},
		&model.RefreshToken{},
		&model.AuditLog{},
		&model.BrandInfoTranslation{},
	); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := migrate.RunPost(db); err != nil {
		log.Fatalf("migrate post: %v", err)
	}
	if err := migrate.Run(db); err != nil {
		log.Fatalf("data migrate: %v", err)
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
	designRepo := repository.NewDesignRepository(db)
	sizeRepo := repository.NewSizeRepository(db)
	brandRepo := repository.NewBrandRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	auditSvc := service.NewAuditService(auditRepo)
	authSvc := service.NewAuthService(cfg, adminRepo, tokenRepo, auditSvc)
	postSvc := service.NewPostService(postRepo, store, auditSvc)
	designSvc := service.NewDesignService(designRepo, sizeRepo, store, auditSvc)
	sizeSvc := service.NewSizeService(sizeRepo)
	brandSvc := service.NewBrandService(brandRepo, auditSvc)
	uploadSvc := service.NewUploadService(cfg, store)

	if err := authSvc.BootstrapAdmin(ctx); err != nil {
		log.Fatalf("bootstrap admin: %v", err)
	}
	if err := brandSvc.SeedDefaults(ctx); err != nil {
		log.Fatalf("seed brand info: %v", err)
	}

	handlers := router.Handlers{
		Health:  handler.NewHealthHandler(db, store),
		Auth:    handler.NewAuthHandler(cfg, authSvc),
		Posts:   handler.NewPostHandler(postSvc),
		Designs: handler.NewDesignHandler(designSvc),
		Sizes:   handler.NewSizeHandler(sizeSvc),
		Brand:   handler.NewBrandHandler(brandSvc),
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
