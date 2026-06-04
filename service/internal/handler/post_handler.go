package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/locale"
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
	loc := locale.Get(c)
	items, total, err := h.posts.ListPublic(c.Request.Context(), loc, page, limit)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "total": total, "page": page, "limit": limit, "locale": loc})
}

func (h *PostHandler) GetPublic(c *gin.Context) {
	loc := locale.Get(c)
	item, err := h.posts.GetPublicBySlug(c.Request.Context(), c.Param("slug"), loc)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			httpx.JSON(c, http.StatusNotFound, "not_found", "error.post_not_found")
			return
		}
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *PostHandler) ListAdmin(c *gin.Context) {
	page, limit := middleware.ParsePage(c)
	items, total, err := h.posts.ListAdmin(c.Request.Context(), page, limit)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "total": total, "page": page, "limit": limit})
}

func (h *PostHandler) GetAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	item, err := h.posts.GetAdmin(c.Request.Context(), id)
	if err != nil {
		httpx.JSON(c, http.StatusNotFound, "not_found", "error.post_not_found")
		return
	}
	c.JSON(http.StatusOK, item)
}

func parsePostInput(c *gin.Context) (service.PostInput, error) {
	var raw json.RawMessage
	if err := c.ShouldBindJSON(&raw); err != nil {
		return service.PostInput{}, err
	}
	var in service.PostInput
	if err := json.Unmarshal(raw, &in); err != nil {
		return service.PostInput{}, err
	}
	if len(in.Translations) == 0 {
		var legacy service.LegacyPostInput
		if err := json.Unmarshal(raw, &legacy); err != nil {
			return service.PostInput{}, err
		}
		in = service.LegacyToPostInput(legacy)
	}
	return in, nil
}

func (h *PostHandler) Create(c *gin.Context) {
	in, err := parsePostInput(c)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.posts.Create(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *PostHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	in, err := parsePostInput(c)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.posts.Update(c.Request.Context(), middleware.AdminID(c), id, in)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *PostHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	if err := h.posts.Delete(c.Request.Context(), middleware.AdminID(c), id); err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.Status(http.StatusNoContent)
}
