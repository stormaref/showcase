package service

import (
	"context"
	"errors"
	"html"
	"net/mail"
	"net/url"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/storage"
)

type BrandInfoService struct {
	repo  *repository.BrandInfoRepository
	store storage.ObjectStore
	audit *AuditService
}

func NewBrandInfoService(repo *repository.BrandInfoRepository, store storage.ObjectStore, audit *AuditService) *BrandInfoService {
	return &BrandInfoService{repo: repo, store: store, audit: audit}
}

type BrandInfoInput struct {
	Name               string `json:"name"`
	Tagline            string `json:"tagline"`
	About              string `json:"about"`
	AddressLine1       string `json:"address_line_1"`
	AddressLine2       string `json:"address_line_2"`
	AddressLine3       string `json:"address_line_3"`
	Phone              string `json:"phone"`
	Email              string `json:"email"`
	HeroImageObjectKey string `json:"hero_image_object_key"`
	HeroTextTone       string `json:"hero_text_tone"`
	WhatsApp           string `json:"whatsapp"`
	Instagram          string `json:"instagram"`
	Telegram           string `json:"telegram"`
	LinkedIn           string `json:"linkedin"`
	MapURL             string `json:"map_url"`
	MapEmbedURL        string `json:"map_embed_url"`
	Hours              string `json:"hours"`
}

type BrandInfoResponse struct {
	Locale             string `json:"locale"`
	Name               string `json:"name"`
	Tagline            string `json:"tagline"`
	About              string `json:"about"`
	AddressLine1       string `json:"address_line_1"`
	AddressLine2       string `json:"address_line_2"`
	AddressLine3       string `json:"address_line_3"`
	Phone              string `json:"phone"`
	Email              string `json:"email"`
	HeroImageObjectKey string `json:"hero_image_object_key"`
	HeroImageURL       string `json:"hero_image_url,omitempty"`
	HeroTextTone       string `json:"hero_text_tone"`
	WhatsApp           string `json:"whatsapp"`
	Instagram          string `json:"instagram"`
	Telegram           string `json:"telegram"`
	LinkedIn           string `json:"linkedin"`
	MapURL             string `json:"map_url"`
	MapEmbedURL        string `json:"map_embed_url"`
	Hours              string `json:"hours"`
}

type BrandInfoUpdateInput struct {
	Translations map[string]BrandInfoInput `json:"translations"`
}

func (s *BrandInfoService) toResponse(row *model.BrandInfoTranslation) BrandInfoResponse {
	resp := BrandInfoResponse{
		Locale:             row.Locale,
		Name:               row.Name,
		Tagline:            row.Tagline,
		About:              row.About,
		AddressLine1:       row.AddressLine1,
		AddressLine2:       row.AddressLine2,
		AddressLine3:       row.AddressLine3,
		Phone:              row.Phone,
		Email:              row.Email,
		HeroImageObjectKey: row.HeroImageObjectKey,
		HeroTextTone:       normalizeHeroTextTone(row.HeroTextTone),
		WhatsApp:           row.WhatsApp,
		Instagram:          row.Instagram,
		Telegram:           row.Telegram,
		LinkedIn:           row.LinkedIn,
		MapURL:             row.MapURL,
		MapEmbedURL:        row.MapEmbedURL,
		Hours:              row.Hours,
	}
	if row.HeroImageObjectKey != "" {
		resp.HeroImageURL = s.store.PublicURL(row.HeroImageObjectKey)
	}
	return resp
}

func (s *BrandInfoService) GetAll(ctx context.Context) (map[string]BrandInfoResponse, error) {
	rows, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make(map[string]BrandInfoResponse, len(rows))
	for i := range rows {
		out[rows[i].Locale] = s.toResponse(&rows[i])
	}
	return out, nil
}

func (s *BrandInfoService) GetPublic(ctx context.Context, locale string) (*BrandInfoResponse, error) {
	row, err := s.repo.FindByLocale(ctx, locale)
	if err != nil {
		if errors.Is(err, repository.ErrBrandInfoNotFound) && locale != model.LocaleEN {
			return s.GetPublic(ctx, model.LocaleEN)
		}
		return nil, err
	}
	resp := s.toResponse(row)
	return &resp, nil
}

func validateBrandInfoInput(locale string, in BrandInfoInput) error {
	if locale == model.LocaleEN {
		if strings.TrimSpace(in.Name) == "" {
			return errors.New("english name is required")
		}
		if strings.TrimSpace(in.Email) == "" {
			return errors.New("english email is required")
		}
	}
	switch strings.TrimSpace(in.HeroTextTone) {
	case "", model.HeroTextToneDark, model.HeroTextToneLight:
	default:
		return errors.New("hero text tone must be dark or light")
	}
	if mapURL := strings.TrimSpace(in.MapURL); mapURL != "" {
		u, err := url.Parse(mapURL)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			return errors.New("map link must be an http(s) URL")
		}
	}
	if embed := normalizeMapEmbed(in.MapEmbedURL); embed != "" && !isGoogleMapsEmbed(embed) {
		return errors.New("map embed must be a Google Maps embed link or iframe")
	}
	email := strings.TrimSpace(in.Email)
	if email != "" {
		if _, err := mail.ParseAddress(email); err != nil {
			return errors.New("invalid email address")
		}
	}
	return nil
}

var iframeSrc = regexp.MustCompile(`(?i)\bsrc\s*=\s*["']([^"']+)["']`)

// normalizeMapEmbed accepts the iframe code Google Maps' "Embed a map" gives,
// or just its src, and returns the URL.
func normalizeMapEmbed(value string) string {
	v := strings.TrimSpace(value)
	if m := iframeSrc.FindStringSubmatch(v); m != nil {
		v = strings.TrimSpace(m[1])
	}
	return html.UnescapeString(v)
}

// isGoogleMapsEmbed keeps the About page iframe to Google Maps only.
func isGoogleMapsEmbed(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" {
		return false
	}
	switch strings.ToLower(u.Host) {
	case "www.google.com", "google.com", "maps.google.com":
	default:
		return false
	}
	return strings.HasPrefix(u.Path, "/maps")
}

// normalizeHeroTextTone maps anything but "light" to the dark default.
func normalizeHeroTextTone(tone string) string {
	if strings.TrimSpace(tone) == model.HeroTextToneLight {
		return model.HeroTextToneLight
	}
	return model.HeroTextToneDark
}

func inputToModel(locale string, in BrandInfoInput) *model.BrandInfoTranslation {
	return &model.BrandInfoTranslation{
		Locale:             locale,
		Name:               strings.TrimSpace(in.Name),
		Tagline:            strings.TrimSpace(in.Tagline),
		About:              strings.TrimSpace(in.About),
		AddressLine1:       strings.TrimSpace(in.AddressLine1),
		AddressLine2:       strings.TrimSpace(in.AddressLine2),
		AddressLine3:       strings.TrimSpace(in.AddressLine3),
		Phone:              strings.TrimSpace(in.Phone),
		Email:              strings.TrimSpace(in.Email),
		HeroImageObjectKey: strings.TrimSpace(in.HeroImageObjectKey),
		HeroTextTone:       normalizeHeroTextTone(in.HeroTextTone),
		WhatsApp:           strings.TrimSpace(in.WhatsApp),
		Instagram:          strings.TrimSpace(in.Instagram),
		Telegram:           strings.TrimSpace(in.Telegram),
		LinkedIn:           strings.TrimSpace(in.LinkedIn),
		MapURL:             strings.TrimSpace(in.MapURL),
		MapEmbedURL:        normalizeMapEmbed(in.MapEmbedURL),
		Hours:              strings.TrimSpace(in.Hours),
	}
}

func isEmptyBrandInfoInput(in BrandInfoInput) bool {
	return strings.TrimSpace(in.Name) == "" &&
		strings.TrimSpace(in.Tagline) == "" &&
		strings.TrimSpace(in.About) == "" &&
		strings.TrimSpace(in.AddressLine1) == "" &&
		strings.TrimSpace(in.AddressLine2) == "" &&
		strings.TrimSpace(in.AddressLine3) == "" &&
		strings.TrimSpace(in.Phone) == "" &&
		strings.TrimSpace(in.Email) == "" &&
		strings.TrimSpace(in.Hours) == "" &&
		strings.TrimSpace(in.HeroImageObjectKey) == ""
}

func (s *BrandInfoService) Update(ctx context.Context, actorID uuid.UUID, in BrandInfoUpdateInput) (map[string]BrandInfoResponse, error) {
	en, ok := in.Translations[model.LocaleEN]
	if !ok {
		return nil, errors.New("english translation is required")
	}
	if err := validateBrandInfoInput(model.LocaleEN, en); err != nil {
		return nil, err
	}
	if err := s.repo.Upsert(ctx, inputToModel(model.LocaleEN, en)); err != nil {
		return nil, err
	}

	if fa, ok := in.Translations[model.LocaleFA]; ok {
		if err := validateBrandInfoInput(model.LocaleFA, fa); err != nil {
			return nil, err
		}
		if !isEmptyBrandInfoInput(fa) {
			if err := s.repo.Upsert(ctx, inputToModel(model.LocaleFA, fa)); err != nil {
				return nil, err
			}
		}
	}

	s.audit.Log(ctx, actorID, "brand_info.update", "brand_info", uuid.Nil, nil)
	return s.GetAll(ctx)
}

func (s *BrandInfoService) SeedDefaults(ctx context.Context) error {
	count, err := s.repo.Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	defaults := []model.BrandInfoTranslation{
		{
			Locale:       model.LocaleEN,
			Name:         "Art Ceramic",
			Tagline:      "Custom tile designs for every space",
			About:        "Art Ceramic is a tile design studio specializing in patterns, glazes, and formats for kitchens, bathrooms, and architectural surfaces. Each design is available in multiple sizes — browse the catalog to find the right look for your project.",
			AddressLine1: "42 Kiln Street",
			AddressLine2: "Pottery District",
			AddressLine3: "Portland, OR 97201",
			Phone:        "+1 (555) 123-4567",
			Email:        "hello@artceramic.example",
		},
		{
			Locale:       model.LocaleFA,
			Name:         "آرت سرامیک",
			Tagline:      "طرح‌های کاشی سفارشی برای هر فضا",
			About:        "آرت سرامیک استودیوی طراحی کاشی است که در نقش‌ها، لعاب‌ها و ابعاد مختلف برای آشپزخانه، حمام و سطوح معماری تخصص دارد. هر طرح در چند سایز موجود است — کاتالوگ را مرور کنید تا طرح مناسب پروژه خود را پیدا کنید.",
			AddressLine1: "خیابان کوره ۴۲",
			AddressLine2: "محله سفالگری",
			AddressLine3: "پورتلند، OR 97201",
			Phone:        "+1 (555) 123-4567",
			Email:        "hello@artceramic.example",
		},
	}
	for i := range defaults {
		if err := s.repo.Upsert(ctx, &defaults[i]); err != nil {
			return err
		}
	}
	return nil
}
