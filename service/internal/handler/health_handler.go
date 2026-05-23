package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stormaref/showcase/service/internal/storage"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db    *gorm.DB
	store storage.ObjectStore
}

func NewHealthHandler(db *gorm.DB, store storage.ObjectStore) *HealthHandler {
	return &HealthHandler{db: db, store: store}
}

func (h *HealthHandler) Live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.PingContext(ctx) != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "db": false})
		return
	}
	if err := h.store.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "minio": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ready"})
}
