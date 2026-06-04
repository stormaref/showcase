package i18n

import (
	"embed"
	"encoding/json"
	"sync"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"golang.org/x/text/language"
)

//go:embed locales/*.json
var localeFS embed.FS

var (
	bundle *i18n.Bundle
	once   sync.Once
)

func initBundle() {
	bundle = i18n.NewBundle(language.English)
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)
	for _, loc := range []string{model.LocaleEN, model.LocaleFA} {
		data, err := localeFS.ReadFile("locales/" + loc + ".json")
		if err != nil {
			panic(err)
		}
		bundle.MustParseMessageFileBytes(data, loc+".json")
	}
}

func T(locale, messageID string) string {
	once.Do(initBundle)
	tag := language.English
	if locale == model.LocaleFA {
		tag = language.Persian
	}
	msg, err := i18n.NewLocalizer(bundle, tag.String()).Localize(&i18n.LocalizeConfig{MessageID: messageID})
	if err != nil {
		return messageID
	}
	return msg
}
