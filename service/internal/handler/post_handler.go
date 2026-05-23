package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/middleware"
	"github.com/stormaref/showcase/service/internal/service"
	"gorm.io/gorm"
)

type PostHandler struct {
	posts *service.PostService
}

func NewPostHandler(posts *service.PostService) *PostHandler {
	return &PostHandler{posts: posts}
}

func (h *PostHandler) ListPublic(c *gin.Context) {
	page, limit := middleware.ParsePage(c)
	items, total, err := h.posts.ListPublic(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "total": total, "page": page, "limit": limit})
}

func (h *PostHandler) GetPublic(c *gin.Context) {
	item, err := h.posts.GetPublicBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "not_found", "message": "post not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *PostHandler) ListAdmin(c *gin.Context) {
	page, limit := middleware.ParsePage(c)
	items, total, err := h.posts.ListAdmin(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "total": total, "page": page, "limit": limit})
}

func (h *PostHandler) GetAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": "invalid id"}})
		return
	}
	item, err := h.posts.GetAdmin(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "not_found", "message": "post not found"}})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *PostHandler) Create(c *gin.Context) {
	var in service.PostInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": err.Error()}})
		return
	}
	item, err := h.posts.Create(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *PostHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": "invalid id"}})
		return
	}
	var in service.PostInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": err.Error()}})
		return
	}
	item, err := h.posts.Update(c.Request.Context(), middleware.AdminID(c), id, in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *PostHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "validation", "message": "invalid id"}})
		return
	}
	if err := h.posts.Delete(c.Request.Context(), middleware.AdminID(c), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "internal", "message": err.Error()}})
		return
	}
	c.Status(http.StatusNoContent)
}
