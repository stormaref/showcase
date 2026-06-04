package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/service"
)

type UploadHandler struct {
	uploads *service.UploadService
}

func NewUploadHandler(uploads *service.UploadService) *UploadHandler {
	return &UploadHandler{uploads: uploads}
}

func (h *UploadHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		httpx.JSON(c, http.StatusBadRequest, "validation", "error.file_required")
		return
	}
	f, err := file.Open()
	if err != nil {
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.internal")
		return
	}
	defer f.Close()
	contentType := file.Header.Get("Content-Type")
	result, err := h.uploads.UploadImage(c.Request.Context(), file.Filename, contentType, f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "upload", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, result)
}
