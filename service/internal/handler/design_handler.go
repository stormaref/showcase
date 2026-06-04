package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/locale"
	"github.com/stormaref/showcase/service/internal/middleware"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/service"
)

type DesignHandler struct {
	designs *service.DesignService
}

func NewDesignHandler(designs *service.DesignService) *DesignHandler {
	return &DesignHandler{designs: designs}
}

func (h *DesignHandler) ListPublic(c *gin.Context) {
	loc := locale.Get(c)
	items, err := h.designs.ListPublic(c.Request.Context(), loc)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "locale": loc})
}

func (h *DesignHandler) ListAdmin(c *gin.Context) {
	items, err := h.designs.ListAdmin(c.Request.Context())
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *DesignHandler) GetAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	item, err := h.designs.GetAdmin(c.Request.Context(), id)
	if err != nil {
		httpx.JSON(c, http.StatusNotFound, "not_found", "error.design_not_found")
		return
	}
	c.JSON(http.StatusOK, item)
}

func parseDesignInput(c *gin.Context) (service.DesignInput, error) {
	var in service.DesignInput
	if err := c.ShouldBindJSON(&in); err != nil {
		return service.DesignInput{}, err
	}
	return in, nil
}

func (h *DesignHandler) Create(c *gin.Context) {
	in, err := parseDesignInput(c)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.designs.Create(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *DesignHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	in, err := parseDesignInput(c)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.designs.Update(c.Request.Context(), middleware.AdminID(c), id, in)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *DesignHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	if err := h.designs.Delete(c.Request.Context(), middleware.AdminID(c), id); err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.Status(http.StatusNoContent)
}

type SizeHandler struct {
	sizes *service.SizeService
}

func NewSizeHandler(sizes *service.SizeService) *SizeHandler {
	return &SizeHandler{sizes: sizes}
}

func (h *SizeHandler) List(c *gin.Context) {
	items, err := h.sizes.List(c.Request.Context())
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *SizeHandler) Create(c *gin.Context) {
	var in service.SizeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.sizes.Create(c.Request.Context(), in)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *SizeHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	var in service.SizeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.sizes.Update(c.Request.Context(), id, in)
	if err != nil {
		if errors.Is(err, service.ErrSizeInUse) {
			httpx.JSON(c, http.StatusConflict, "size_in_use", "error.size_in_use")
			return
		}
		if errors.Is(err, repository.ErrSizeNotFound) {
			httpx.JSON(c, http.StatusNotFound, "not_found", "error.size_not_found")
			return
		}
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *SizeHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	if err := h.sizes.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, service.ErrSizeInUse) {
			httpx.JSON(c, http.StatusConflict, "size_in_use", "error.size_in_use")
			return
		}
		if errors.Is(err, repository.ErrSizeNotFound) {
			httpx.JSON(c, http.StatusNotFound, "not_found", "error.size_not_found")
			return
		}
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.Status(http.StatusNoContent)
}
