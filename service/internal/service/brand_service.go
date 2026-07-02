package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/storage"
)

var ErrBrandInUse = errors.New("brand in use")

type BrandService struct {
	repo  *repository.BrandRepository
	store storage.ObjectStore
	audit *AuditService
}

func NewBrandService(repo *repository.BrandRepository, store storage.ObjectStore, audit *AuditService) *BrandService {
	return &BrandService{repo: repo, store: store, audit: audit}
}

type BrandTranslationInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type BrandInput struct {
	LogoObjectKey string                           `json:"logo_object_key"`
	WebsiteURL    string                           `json:"website_url"`
	SortOrder     int                              `json:"sort_order"`
	IsPublished   bool                             `json:"is_published"`
	Translations  map[string]BrandTranslationInput `json:"translations"`
}

type BrandResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	LogoURL     string    `json:"logo_url,omitempty"`
	WebsiteURL  string    `json:"website_url,omitempty"`
	SortOrder   int       `json:"sort_order"`
	IsPublished bool      `json:"is_published"`
	InUse       bool      `json:"in_use,omitempty"`
}

type AdminBrandResponse struct {
	BrandResponse
	LogoObjectKey string                           `json:"logo_object_key"`
	Translations  map[string]BrandTranslationInput `json:"translations"`
}

func pickBrandTranslation(b *model.Brand, locale string) *model.BrandTranslation {
	for i := range b.Translations {
		if b.Translations[i].Locale == locale {
			return &b.Translations[i]
		}
	}
	if locale != model.LocaleEN {
		for i := range b.Translations {
			if b.Translations[i].Locale == model.LocaleEN {
				return &b.Translations[i]
			}
		}
	}
	if len(b.Translations) > 0 {
		return &b.Translations[0]
	}
	return nil
}

func (s *BrandService) logoURL(b *model.Brand) string {
	if b.LogoObjectKey == "" {
		return ""
	}
	return s.store.PublicURL(b.LogoObjectKey)
}

func (s *BrandService) translationsMap(b *model.Brand) map[string]BrandTranslationInput {
	out := make(map[string]BrandTranslationInput)
	for _, tr := range b.Translations {
		out[tr.Locale] = BrandTranslationInput{Name: tr.Name, Description: tr.Description}
	}
	return out
}

func (s *BrandService) toResponse(b *model.Brand, locale string) BrandResponse {
	resp := BrandResponse{
		ID:          b.ID,
		LogoURL:     s.logoURL(b),
		WebsiteURL:  b.WebsiteURL,
		SortOrder:   b.SortOrder,
		IsPublished: b.IsPublished,
	}
	if tr := pickBrandTranslation(b, locale); tr != nil {
		resp.Name = tr.Name
		resp.Description = tr.Description
	}
	return resp
}

func (s *BrandService) toAdminResponse(b *model.Brand, inUse bool) AdminBrandResponse {
	base := s.toResponse(b, model.LocaleEN)
	base.InUse = inUse
	return AdminBrandResponse{
		BrandResponse: base,
		LogoObjectKey: b.LogoObjectKey,
		Translations:  s.translationsMap(b),
	}
}

func (s *BrandService) validateInput(in BrandInput) error {
	en, ok := in.Translations[model.LocaleEN]
	if !ok || strings.TrimSpace(en.Name) == "" {
		return errors.New("english name is required")
	}
	return nil
}

func (s *BrandService) upsertTranslations(ctx context.Context, brandID uuid.UUID, translations map[string]BrandTranslationInput) error {
	for loc, in := range translations {
		if strings.TrimSpace(in.Name) == "" {
			continue
		}
		if loc != model.LocaleEN && loc != model.LocaleFA {
			continue
		}
		tr := &model.BrandTranslation{
			BrandID:     brandID,
			Locale:      loc,
			Name:        strings.TrimSpace(in.Name),
			Description: strings.TrimSpace(in.Description),
		}
		if err := s.repo.UpsertTranslation(ctx, tr); err != nil {
			return err
		}
	}
	return nil
}

func (s *BrandService) ListPublic(ctx context.Context, locale string) ([]BrandResponse, error) {
	brands, err := s.repo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]BrandResponse, 0, len(brands))
	for i := range brands {
		resp := s.toResponse(&brands[i], locale)
		resp.InUse = false
		out = append(out, resp)
	}
	return out, nil
}

func (s *BrandService) List(ctx context.Context) ([]AdminBrandResponse, error) {
	brands, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]AdminBrandResponse, len(brands))
	for i := range brands {
		inUse, _ := s.repo.IsReferenced(ctx, brands[i].ID)
		out[i] = s.toAdminResponse(&brands[i], inUse)
	}
	return out, nil
}

func (s *BrandService) Get(ctx context.Context, id uuid.UUID) (*AdminBrandResponse, error) {
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	inUse, _ := s.repo.IsReferenced(ctx, id)
	resp := s.toAdminResponse(b, inUse)
	return &resp, nil
}

func (s *BrandService) Create(ctx context.Context, actorID uuid.UUID, in BrandInput) (*AdminBrandResponse, error) {
	if err := s.validateInput(in); err != nil {
		return nil, err
	}
	b := &model.Brand{
		LogoObjectKey: strings.TrimSpace(in.LogoObjectKey),
		WebsiteURL:    strings.TrimSpace(in.WebsiteURL),
		SortOrder:     in.SortOrder,
		IsPublished:   in.IsPublished,
	}
	if err := s.repo.Create(ctx, b); err != nil {
		return nil, err
	}
	if err := s.upsertTranslations(ctx, b.ID, in.Translations); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, actorID, "brand.create", "brand", b.ID, nil)
	return s.Get(ctx, b.ID)
}

func (s *BrandService) Update(ctx context.Context, actorID, id uuid.UUID, in BrandInput) (*AdminBrandResponse, error) {
	if err := s.validateInput(in); err != nil {
		return nil, err
	}
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	oldLogo := b.LogoObjectKey
	newLogo := strings.TrimSpace(in.LogoObjectKey)
	b.LogoObjectKey = newLogo
	b.WebsiteURL = strings.TrimSpace(in.WebsiteURL)
	b.SortOrder = in.SortOrder
	b.IsPublished = in.IsPublished
	if err := s.repo.Update(ctx, b); err != nil {
		return nil, err
	}
	if err := s.upsertTranslations(ctx, b.ID, in.Translations); err != nil {
		return nil, err
	}
	if oldLogo != "" && oldLogo != newLogo {
		_ = s.store.Delete(ctx, oldLogo)
	}
	s.audit.Log(ctx, actorID, "brand.update", "brand", b.ID, nil)
	return s.Get(ctx, id)
}

func (s *BrandService) Delete(ctx context.Context, actorID, id uuid.UUID) error {
	inUse, err := s.repo.IsReferenced(ctx, id)
	if err != nil {
		return err
	}
	if inUse {
		return ErrBrandInUse
	}
	b, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	if b.LogoObjectKey != "" {
		_ = s.store.Delete(ctx, b.LogoObjectKey)
	}
	s.audit.Log(ctx, actorID, "brand.delete", "brand", id, nil)
	return nil
}
