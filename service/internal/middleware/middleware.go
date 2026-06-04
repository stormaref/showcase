package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/config"
	"github.com/stormaref/showcase/service/internal/httpx"
	"github.com/stormaref/showcase/service/internal/util"
	limiter "github.com/ulule/limiter/v3"
	memory "github.com/ulule/limiter/v3/drivers/store/memory"
)

const (
	ctxAdminID   = "adminID"
	ctxAdminEmail = "adminEmail"
	refreshCookie = "showcase_refresh"
	csrfCookie    = "showcase_csrf"
	csrfHeader    = "X-CSRF-Token"
)

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-ID")
		if id == "" {
			b := make([]byte, 8)
			_, _ = rand.Read(b)
			id = hex.EncodeToString(b)
		}
		c.Set("requestID", id)
		c.Writer.Header().Set("X-Request-ID", id)
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		slog.Info("request",
			"request_id", c.GetString("requestID"),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	}
}

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Next()
	}
}

func MaxBodySize(max int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, max)
		c.Next()
	}
}

func RateLimit(perMinute int) gin.HandlerFunc {
	rate := limiter.Rate{Period: time.Minute, Limit: int64(perMinute)}
	store := memory.NewStore()
	instance := limiter.New(store, rate)
	return func(c *gin.Context) {
		key := c.ClientIP()
		ctx, cancel := c.Request.Context(), func() {}
		defer cancel()
		lctx, err := instance.Get(ctx, key)
		if err != nil {
			httpx.Abort(c, http.StatusInternalServerError, "rate_limit", "error.rate_limit")
			return
		}
		if lctx.Reached {
			httpx.Abort(c, http.StatusTooManyRequests, "rate_limited", "error.rate_limited")
			return
		}
		c.Next()
	}
}

func AuthJWT(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			httpx.Abort(c, http.StatusUnauthorized, "unauthorized", "error.missing_token")
			return
		}
		token := strings.TrimPrefix(auth, "Bearer ")
		claims, err := util.ParseAccessToken(cfg, token)
		if err != nil {
			httpx.Abort(c, http.StatusUnauthorized, "unauthorized", "error.invalid_token")
			return
		}
		adminID, err := uuid.Parse(claims.Subject)
		if err != nil {
			httpx.Abort(c, http.StatusUnauthorized, "unauthorized", "error.invalid_subject")
			return
		}
		c.Set(ctxAdminID, adminID)
		c.Set(ctxAdminEmail, claims.Email)
		c.Next()
	}
}

func AdminID(c *gin.Context) uuid.UUID {
	id, _ := c.Get(ctxAdminID)
	return id.(uuid.UUID)
}

func CSRF(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		cookieToken, err := c.Cookie(csrfCookie)
		headerToken := c.GetHeader(csrfHeader)
		if err != nil || cookieToken == "" || headerToken == "" || cookieToken != headerToken {
			httpx.Abort(c, http.StatusForbidden, "csrf", "error.csrf_failed")
			return
		}
		c.Next()
	}
}

func SetCSRFCookie(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(csrfCookie)
		if err != nil || token == "" {
			b := make([]byte, 16)
			_, _ = rand.Read(b)
			token = hex.EncodeToString(b)
			secure := cfg.AppEnv == "production"
			c.SetCookie(csrfCookie, token, 3600*24, "/", cfg.CookieDomain, secure, false)
		}
		c.Set("csrfToken", token)
		c.Next()
	}
}

func RefreshCookieName() string  { return refreshCookie }
func CSRFCookieName() string     { return csrfCookie }
func CSRFHeaderName() string     { return csrfHeader }

func SetRefreshCookie(c *gin.Context, cfg *config.Config, token string) {
	secure := cfg.AppEnv == "production"
	maxAge := int(cfg.JWTRefreshTTL.Seconds())
	c.SetCookie(refreshCookie, token, maxAge, "/api/v1/auth", cfg.CookieDomain, secure, true)
}

func ClearRefreshCookie(c *gin.Context, cfg *config.Config) {
	secure := cfg.AppEnv == "production"
	c.SetCookie(refreshCookie, "", -1, "/api/v1/auth", cfg.CookieDomain, secure, true)
}

func GetRefreshFromCookie(c *gin.Context) string {
	t, _ := c.Cookie(refreshCookie)
	return t
}

func ParsePage(c *gin.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}
