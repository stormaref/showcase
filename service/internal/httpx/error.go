package httpx

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/i18n"
	"github.com/stormaref/showcase/service/internal/locale"
)

func Abort(c *gin.Context, status int, code, messageID string) {
	loc := locale.Get(c)
	c.AbortWithStatusJSON(status, gin.H{
		"error": gin.H{
			"code":    code,
			"message": i18n.T(loc, messageID),
		},
	})
}

func JSON(c *gin.Context, status int, code, messageID string) {
	loc := locale.Get(c)
	c.JSON(status, gin.H{
		"error": gin.H{
			"code":    code,
			"message": i18n.T(loc, messageID),
		},
	})
}

func ValidationError(c *gin.Context, detail string) {
	loc := locale.Get(c)
	msg := i18n.T(loc, "error.validation")
	if detail != "" && loc == model.LocaleEN {
		msg = detail
	}
	c.JSON(http.StatusBadRequest, gin.H{
		"error": gin.H{
			"code":    "validation",
			"message": msg,
		},
	})
}
