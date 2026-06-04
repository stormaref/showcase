package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/storage"
)

type GalleryService struct {
	repo  *repository.GalleryRepository
	store storage.ObjectStore
	audit *AuditService
}

func NewGalleryService(repo *repository.GalleryRepository, store storage.ObjectStore, audit *AuditService) *GalleryService {
	return &GalleryService{repo: repo, store: store, audit: audit}
}

type GalleryTranslationInput struct {
	Title    string `json:"title"`
	Caption  string `json:"caption"`
	AltText  string `json:"alt_text"`
}

type GalleryInput struct {
	ObjectKey      string                             `json:"object_key"`
	ThumbObjectKey string                             `json:"thumb_object_key"`
	SortOrder      int                                `json:"sort_order"`
	IsPublished    bool                               `json:"is_published"`
	Translations   map[string]GalleryTranslationInput `json:"translations"`
}

type GalleryResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Caption     string    `json:"caption"`
	AltText     string    `json:"alt_text"`
	Locale      string    `json:"locale,omitempty"`
	ObjectKey   string    `json:"object_key,omitempty"`
	ImageURL    string    `json:"image_url"`
	ThumbURL    string    `json:"thumb_url"`
	SortOrder   int       `json:"sort_order"`
	IsPublished bool      `json:"is_published"`
	HasFA       bool      `json:"has_fa,omitempty"`
	CreatedAt   string    `json:"created_at,omitempty"`
}

type AdminGalleryResponse struct {
	GalleryResponse
	Translations map[string]GalleryTranslationInput `json:"translations"`
}

func pickGalleryTranslation(item *model.GalleryItem, locale string) *model.GalleryItemTranslation {
	for i := range item.Translations {
		if item.Translations[i].Locale == locale {
			return &item.Translations[i]
		}
	}
	if locale != model.LocaleEN {
		for i := range item.Translations {
			if item.Translations[i].Locale == model.LocaleEN {
				return &item.Translations[i]
			}
		}
	}
	if len(item.Translations) > 0 {
		return &item.Translations[0]
	}
	return nil
}

func (s *GalleryService) enrich(item *model.GalleryItem, tr *model.GalleryItemTranslation, resolvedLocale string) GalleryResponse {
	resp := GalleryResponse{
		ID:          item.ID,
		ObjectKey:   item.ObjectKey,
		SortOrder:   item.SortOrder,
		IsPublished: item.IsPublished,
		Locale:      resolvedLocale,
		ImageURL:    s.store.PublicURL(item.ObjectKey),
	}
	if item.ThumbObjectKey != "" {
		resp.ThumbURL = s.store.PublicURL(item.ThumbObjectKey)
	} else {
		resp.ThumbURL = resp.ImageURL
	}
	if tr != nil {
		resp.Title = tr.Title
		resp.Caption = tr.Caption
		resp.AltText = tr.AltText
	}
	return resp
}

func (s *GalleryService) translationsMap(item *model.GalleryItem) map[string]GalleryTranslationInput {
	out := make(map[string]GalleryTranslationInput)
	for _, tr := range item.Translations {
		out[tr.Locale] = GalleryTranslationInput{
			Title:   tr.Title,
			Caption: tr.Caption,
			AltText: tr.AltText,
		}
	}
	return out
}

func (s *GalleryService) ListPublic(ctx context.Context, locale string) ([]GalleryResponse, error) {
	items, err := s.repo.ListPublished(ctx, locale)
	if err != nil {
		return nil, err
	}
	out := make([]GalleryResponse, 0, len(items))
	for i := range items {
		tr := pickGalleryTranslation(&items[i], locale)
		if tr == nil {
			continue
		}
		resolved := locale
		if tr.Locale != locale {
			resolved = tr.Locale
		}
		out = append(out, s.enrich(&items[i], tr, resolved))
	}
	return out, nil
}

func (s *GalleryService) ListAdmin(ctx context.Context) ([]GalleryResponse, error) {
	items, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]GalleryResponse, len(items))
	for i := range items {
		tr := pickGalleryTranslation(&items[i], model.LocaleEN)
		resp := s.enrich(&items[i], tr, model.LocaleEN)
		ok, _ := s.repo.HasTranslation(ctx, items[i].ID, model.LocaleFA)
		resp.HasFA = ok
		out[i] = resp
	}
	return out, nil
}

func (s *GalleryService) GetAdmin(ctx context.Context, id uuid.UUID) (*AdminGalleryResponse, error) {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	tr := pickGalleryTranslation(item, model.LocaleEN)
	resp := AdminGalleryResponse{
		GalleryResponse: s.enrich(item, tr, model.LocaleEN),
		Translations:    s.translationsMap(item),
	}
	ok, _ := s.repo.HasTranslation(ctx, item.ID, model.LocaleFA)
	resp.HasFA = ok
	return &resp, nil
}

func (s *GalleryService) upsertTranslations(ctx context.Context, itemID uuid.UUID, translations map[string]GalleryTranslationInput) error {
	for loc, in := range translations {
		if in.Title == "" {
			continue
		}
		if loc != model.LocaleEN && loc != model.LocaleFA {
			continue
		}
		tr := &model.GalleryItemTranslation{
			ItemID:  itemID,
			Locale:  loc,
			Title:   in.Title,
			Caption: in.Caption,
			AltText: in.AltText,
		}
		if err := s.repo.UpsertTranslation(ctx, tr); err != nil {
			return err
		}
	}
	return nil
}

func (s *GalleryService) Create(ctx context.Context, actorID uuid.UUID, in GalleryInput) (*AdminGalleryResponse, error) {
	item := &model.GalleryItem{
		ObjectKey:      in.ObjectKey,
		ThumbObjectKey: in.ThumbObjectKey,
		SortOrder:      in.SortOrder,
		IsPublished:    in.IsPublished,
	}
	if err := s.repo.Create(ctx, item); err != nil {
		return nil, err
	}
	translations := in.Translations
	if len(translations) == 0 {
		translations = map[string]GalleryTranslationInput{model.LocaleEN: {Title: "Untitled"}}
	}
	if err := s.upsertTranslations(ctx, item.ID, translations); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, actorID, "gallery.create", "gallery_item", item.ID, nil)
	return s.GetAdmin(ctx, item.ID)
}

func (s *GalleryService) Update(ctx context.Context, actorID, id uuid.UUID, in GalleryInput) (*AdminGalleryResponse, error) {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if in.ObjectKey != "" {
		item.ObjectKey = in.ObjectKey
	}
	if in.ThumbObjectKey != "" {
		item.ThumbObjectKey = in.ThumbObjectKey
	}
	item.SortOrder = in.SortOrder
	item.IsPublished = in.IsPublished
	if err := s.repo.Update(ctx, item); err != nil {
		return nil, err
	}
	if len(in.Translations) > 0 {
		if err := s.upsertTranslations(ctx, item.ID, in.Translations); err != nil {
			return nil, err
		}
	}
	s.audit.Log(ctx, actorID, "gallery.update", "gallery_item", item.ID, nil)
	return s.GetAdmin(ctx, item.ID)
}

func (s *GalleryService) Delete(ctx context.Context, actorID, id uuid.UUID) error {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	_ = s.store.Delete(ctx, item.ObjectKey)
	if item.ThumbObjectKey != "" {
		_ = s.store.Delete(ctx, item.ThumbObjectKey)
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	s.audit.Log(ctx, actorID, "gallery.delete", "gallery_item", id, nil)
	return nil
}

// LegacyGalleryInput supports old admin clients sending flat fields.
type LegacyGalleryInput struct {
	Title          string `json:"title" binding:"required,max=255"`
	Caption        string `json:"caption"`
	AltText        string `json:"alt_text"`
	ObjectKey      string `json:"object_key" binding:"required"`
	ThumbObjectKey string `json:"thumb_object_key"`
	SortOrder      int    `json:"sort_order"`
	IsPublished    bool   `json:"is_published"`
}

func LegacyToGalleryInput(legacy LegacyGalleryInput) GalleryInput {
	return GalleryInput{
		ObjectKey:      legacy.ObjectKey,
		ThumbObjectKey: legacy.ThumbObjectKey,
		SortOrder:      legacy.SortOrder,
		IsPublished:    legacy.IsPublished,
		Translations: map[string]GalleryTranslationInput{
			model.LocaleEN: {
				Title:   legacy.Title,
				Caption: legacy.Caption,
				AltText: legacy.AltText,
			},
		},
	}
}
