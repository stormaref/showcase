package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/locale"
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
	loc := locale.Get(c)
	items, err := h.gallery.ListPublic(c.Request.Context(), loc)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "locale": loc})
}

func (h *GalleryHandler) ListAdmin(c *gin.Context) {
	items, err := h.gallery.ListAdmin(c.Request.Context())
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func parseGalleryInput(c *gin.Context) (service.GalleryInput, error) {
	var raw json.RawMessage
	if err := c.ShouldBindJSON(&raw); err != nil {
		return service.GalleryInput{}, err
	}
	var in service.GalleryInput
	if err := json.Unmarshal(raw, &in); err != nil {
		return service.GalleryInput{}, err
	}
	if len(in.Translations) == 0 {
		var legacy service.LegacyGalleryInput
		if err := json.Unmarshal(raw, &legacy); err != nil {
			return service.GalleryInput{}, err
		}
		in = service.LegacyToGalleryInput(legacy)
	}
	return in, nil
}

func (h *GalleryHandler) Create(c *gin.Context) {
	in, err := parseGalleryInput(c)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.gallery.Create(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *GalleryHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	in, err := parseGalleryInput(c)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.gallery.Update(c.Request.Context(), middleware.AdminID(c), id, in)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *GalleryHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	if err := h.gallery.Delete(c.Request.Context(), middleware.AdminID(c), id); err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.Status(http.StatusNoContent)
}
