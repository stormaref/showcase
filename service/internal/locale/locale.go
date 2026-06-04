package locale

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/stormaref/showcase/service/internal/domain/model"
)

const ctxLocale = "locale"

func Parse(raw string) string {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == model.LocaleFA || strings.HasPrefix(raw, "fa") {
		return model.LocaleFA
	}
	return model.LocaleEN
}

func FromRequest(c *gin.Context) string {
	if q := c.Query("locale"); q != "" {
		return Parse(q)
	}
	if h := c.GetHeader("Accept-Language"); h != "" {
		parts := strings.Split(h, ",")
		if len(parts) > 0 {
			tag := strings.TrimSpace(strings.Split(parts[0], ";")[0])
			return Parse(tag)
		}
	}
	return model.LocaleEN
}

func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		loc := FromRequest(c)
		if strings.HasPrefix(c.Request.URL.Path, "/api/v1/admin") {
			loc = model.LocaleEN
		}
		c.Set(ctxLocale, loc)
		c.Next()
	}
}

func Get(c *gin.Context) string {
	if v, ok := c.Get(ctxLocale); ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return model.LocaleEN
}
