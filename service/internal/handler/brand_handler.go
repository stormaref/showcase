package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/locale"
	"github.com/stormaref/showcase/service/internal/middleware"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/service"
)

type BrandHandler struct {
	brand *service.BrandService
}

func NewBrandHandler(brand *service.BrandService) *BrandHandler {
	return &BrandHandler{brand: brand}
}

func (h *BrandHandler) GetPublic(c *gin.Context) {
	loc := locale.Get(c)
	item, err := h.brand.GetPublic(c.Request.Context(), loc)
	if err != nil {
		if errors.Is(err, repository.ErrBrandNotFound) {
			httpx.JSON(c, http.StatusNotFound, "not_found", "error.brand_not_found")
			return
		}
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *BrandHandler) GetAdmin(c *gin.Context) {
	items, err := h.brand.GetAll(c.Request.Context())
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	c.JSON(http.StatusOK, gin.H{"translations": items})
}

func (h *BrandHandler) Update(c *gin.Context) {
	var in service.BrandUpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	items, err := h.brand.Update(c.Request.Context(), middleware.AdminID(c), in)
	if err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"translations": items})
}
