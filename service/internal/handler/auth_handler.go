package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/config"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/middleware"
	"github.com/stormaref/showcase/service/internal/service"
)

type AuthHandler struct {
	cfg  *config.Config
	auth *service.AuthService
}

func NewAuthHandler(cfg *config.Config, auth *service.AuthService) *AuthHandler {
	return &AuthHandler{cfg: cfg, auth: auth}
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err.Error())
		return
	}
	access, exp, refresh, admin, err := h.auth.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			httpx.JSON(c, http.StatusUnauthorized, "invalid_credentials", "error.invalid_credentials")
			return
		}
		httpx.JSON(c, http.StatusInternalServerError, "internal", "error.login_failed")
		return
	}
	middleware.SetRefreshCookie(c, h.cfg, refresh)
	csrf, _ := c.Get("csrfToken")
	c.JSON(http.StatusOK, gin.H{
		"access_token": access,
		"expires_in":   exp,
		"token_type":   "Bearer",
		"csrf_token":   csrf,
		"admin": gin.H{
			"id":    admin.ID,
			"email": admin.Email,
		},
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refresh := middleware.GetRefreshFromCookie(c)
	if refresh == "" {
		var body struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = c.ShouldBindJSON(&body)
		refresh = body.RefreshToken
	}
	access, exp, newRefresh, err := h.auth.Refresh(c.Request.Context(), refresh)
	if err != nil {
		httpx.JSON(c, http.StatusUnauthorized, "unauthorized", "error.invalid_refresh_token")
		return
	}
	middleware.SetRefreshCookie(c, h.cfg, newRefresh)
	csrf, _ := c.Get("csrfToken")
	c.JSON(http.StatusOK, gin.H{
		"access_token": access,
		"expires_in":   exp,
		"token_type":   "Bearer",
		"csrf_token":   csrf,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	refresh := middleware.GetRefreshFromCookie(c)
	var adminID uuid.UUID
	if v, ok := c.Get("adminID"); ok {
		adminID = v.(uuid.UUID)
	}
	_ = h.auth.Logout(c.Request.Context(), refresh, adminID)
	middleware.ClearRefreshCookie(c, h.cfg)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AuthHandler) Me(c *gin.Context) {
	admin, err := h.auth.Me(c.Request.Context(), middleware.AdminID(c))
	if err != nil {
		httpx.JSON(c, http.StatusNotFound, "not_found", "error.admin_not_found")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":    admin.ID,
		"email": admin.Email,
	})
}

func (h *AuthHandler) CSRFToken(c *gin.Context) {
	csrf, _ := c.Get("csrfToken")
	c.JSON(http.StatusOK, gin.H{"csrf_token": csrf})
}
