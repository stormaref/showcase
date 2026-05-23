package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/middleware"
	"github.com/stormaref/showcase/service/internal/service"
)

type GalleryHandler struct {
	gallery *service.GalleryService
}

func NewGalleryHandler(gallery *service.GalleryService) *GalleryHandler {
	return &GalleryHandler{gallery: gallery}
}

func (h *GalleryHandler) ListPublic(c *gin.Context) {
	items, err := h.gallery.ListPublic(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *GalleryHandler) ListAdmin(c *gin.Context) {
	items, err := h.gallery.ListAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *GalleryHandler) Create(c *gin.Context) {
	var in service.GalleryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": err.Error()}})
		return
	}
	item, err := h.gallery.Create(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *GalleryHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": "invalid id"}})
		return
	}
	var in service.GalleryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": err.Error()}})
		return
	}
	item, err := h.gallery.Update(c.Request.Context(), middleware.AdminID(c), id, in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *GalleryHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": "invalid id"}})
		return
	}
	if err := h.gallery.Delete(c.Request.Context(), middleware.AdminID(c), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.Status(http.StatusNoContent)
}
