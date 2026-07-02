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

type BrandHandler struct {
	brands *service.BrandService
}

func NewBrandHandler(brands *service.BrandService) *BrandHandler {
	return &BrandHandler{brands: brands}
}

func (h *BrandHandler) ListPublic(c *gin.Context) {
	loc := locale.Get(c)
	items, err := h.brands.ListPublic(c.Request.Context(), loc)
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "locale": loc})
}

func (h *BrandHandler) ListAdmin(c *gin.Context) {
	items, err := h.brands.List(c.Request.Context())
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *BrandHandler) GetAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	item, err := h.brands.Get(c.Request.Context(), id)
	if err != nil {
		httpx.JSON(c, http.StatusNotFound, "not_found", "error.brand_not_found")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *BrandHandler) Create(c *gin.Context) {
	var in service.BrandInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.brands.Create(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *BrandHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	var in service.BrandInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	item, err := h.brands.Update(c.Request.Context(), middleware.AdminID(c), id, in)
	if err != nil {
		if errors.Is(err, repository.ErrBrandNotFound) {
			httpx.JSON(c, http.StatusNotFound, "not_found", "error.brand_not_found")
			return
		}
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *BrandHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.invalid_id")
		return
	}
	if err := h.brands.Delete(c.Request.Context(), middleware.AdminID(c), id); err != nil {
		if errors.Is(err, service.ErrBrandInUse) {
			httpx.JSON(c, http.StatusConflict, "brand_in_use", "error.brand_in_use")
			return
		}
		if errors.Is(err, repository.ErrBrandNotFound) {
			httpx.JSON(c, http.StatusNotFound, "not_found", "error.brand_not_found")
			return
		}
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.Status(http.StatusNoContent)
}
