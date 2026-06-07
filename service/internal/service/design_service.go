package service

import (
	"context"
	"errors"
	"sort"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/storage"
	"gorm.io/gorm"
)

type DesignService struct {
	repo     *repository.DesignRepository
	sizeRepo *repository.SizeRepository
	typeRepo *repository.TypeRepository
	store    storage.ObjectStore
	audit    *AuditService
}

func NewDesignService(
	repo *repository.DesignRepository,
	sizeRepo *repository.SizeRepository,
	typeRepo *repository.TypeRepository,
	store storage.ObjectStore,
	audit *AuditService,
) *DesignService {
	return &DesignService{repo: repo, sizeRepo: sizeRepo, typeRepo: typeRepo, store: store, audit: audit}
}

type DesignTranslationInput struct {
	Title   string `json:"title"`
	Caption string `json:"caption"`
	AltText string `json:"alt_text"`
}

type DesignImageInput struct {
	ObjectKey      string     `json:"object_key"`
	ThumbObjectKey string     `json:"thumb_object_key"`
	SizeID         *uuid.UUID `json:"size_id"`
	TypeID         *uuid.UUID `json:"type_id"`
	SortOrder      int        `json:"sort_order"`
}

type DesignInput struct {
	SortOrder    int                                `json:"sort_order"`
	IsPublished  bool                               `json:"is_published"`
	SizeIDs      []uuid.UUID                        `json:"size_ids"`
	TypeIDs      []uuid.UUID                        `json:"type_ids"`
	Images       []DesignImageInput                 `json:"images"`
	Translations map[string]DesignTranslationInput  `json:"translations"`
}

type DesignImageResponse struct {
	ID             uuid.UUID  `json:"id"`
	SizeID         *uuid.UUID `json:"size_id"`
	TypeID         *uuid.UUID `json:"type_id"`
	ObjectKey      string     `json:"object_key,omitempty"`
	ThumbObjectKey string     `json:"thumb_object_key,omitempty"`
	ImageURL       string     `json:"image_url"`
	ThumbURL       string     `json:"thumb_url"`
	SortOrder      int        `json:"sort_order"`
}

type DesignResponse struct {
	ID               uuid.UUID           `json:"id"`
	Title            string              `json:"title"`
	Caption          string              `json:"caption"`
	AltText          string              `json:"alt_text"`
	Locale           string              `json:"locale,omitempty"`
	Sizes            []SizeResponse      `json:"sizes"`
	Types            []TypeResponse      `json:"types"`
	Images           []DesignImageResponse `json:"images"`
	PrimaryImageURL  string              `json:"primary_image_url"`
	PrimaryThumbURL  string              `json:"primary_thumb_url"`
	SortOrder        int                 `json:"sort_order"`
	IsPublished      bool                `json:"is_published"`
	HasFA            bool                `json:"has_fa,omitempty"`
	ImageCount       int                 `json:"image_count,omitempty"`
	CreatedAt        string              `json:"created_at,omitempty"`
}

type AdminDesignResponse struct {
	DesignResponse
	Translations map[string]DesignTranslationInput `json:"translations"`
}

func pickDesignTranslation(design *model.Design, locale string) *model.DesignTranslation {
	for i := range design.Translations {
		if design.Translations[i].Locale == locale {
			return &design.Translations[i]
		}
	}
	if locale != model.LocaleEN {
		for i := range design.Translations {
			if design.Translations[i].Locale == model.LocaleEN {
				return &design.Translations[i]
			}
		}
	}
	if len(design.Translations) > 0 {
		return &design.Translations[0]
	}
	return nil
}

func (s *DesignService) imageResponse(img *model.DesignImage) DesignImageResponse {
	resp := DesignImageResponse{
		ID:             img.ID,
		SizeID:         img.SizeID,
		TypeID:         img.TypeID,
		ObjectKey:      img.ObjectKey,
		ThumbObjectKey: img.ThumbObjectKey,
		SortOrder:      img.SortOrder,
		ImageURL:       s.store.PublicURL(img.ObjectKey),
	}
	if img.ThumbObjectKey != "" {
		resp.ThumbURL = s.store.PublicURL(img.ThumbObjectKey)
	} else {
		resp.ThumbURL = resp.ImageURL
	}
	return resp
}

func (s *DesignService) sizeResponses(sizes []model.TileSize) []SizeResponse {
	out := make([]SizeResponse, len(sizes))
	for i := range sizes {
		out[i] = SizeResponse{
			ID:       sizes[i].ID,
			WidthMM:  sizes[i].WidthMM,
			HeightMM: sizes[i].HeightMM,
			Label:    sizes[i].DisplayLabel(),
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].WidthMM != out[j].WidthMM {
			return out[i].WidthMM < out[j].WidthMM
		}
		return out[i].HeightMM < out[j].HeightMM
	})
	return out
}

func isShowcaseImage(img model.DesignImage) bool {
	return img.SizeID == nil && img.TypeID == nil
}

func (s *DesignService) primaryImage(images []model.DesignImage) (string, string) {
	if len(images) == 0 {
		return "", ""
	}
	sorted := append([]model.DesignImage(nil), images...)
	sort.Slice(sorted, func(i, j int) bool {
		aShowcase := isShowcaseImage(sorted[i])
		bShowcase := isShowcaseImage(sorted[j])
		if aShowcase != bShowcase {
			return aShowcase
		}
		if sorted[i].SortOrder != sorted[j].SortOrder {
			return sorted[i].SortOrder < sorted[j].SortOrder
		}
		return sorted[i].CreatedAt.Before(sorted[j].CreatedAt)
	})
	img := sorted[0]
	resp := s.imageResponse(&img)
	return resp.ImageURL, resp.ThumbURL
}

func hasDesignTranslation(translations []model.DesignTranslation, locale string) bool {
	for _, tr := range translations {
		if tr.Locale == locale && tr.Title != "" {
			return true
		}
	}
	return false
}

func (s *DesignService) enrich(design *model.Design, tr *model.DesignTranslation, resolvedLocale string) DesignResponse {
	images := make([]DesignImageResponse, len(design.Images))
	for i := range design.Images {
		images[i] = s.imageResponse(&design.Images[i])
	}
	primaryURL, primaryThumb := s.primaryImage(design.Images)
	resp := DesignResponse{
		ID:              design.ID,
		Sizes:           s.sizeResponses(design.Sizes),
		Types:           typeResponses(design.Types, resolvedLocale),
		Images:          images,
		ImageCount:      len(design.Images),
		PrimaryImageURL: primaryURL,
		PrimaryThumbURL: primaryThumb,
		SortOrder:       design.SortOrder,
		IsPublished:     design.IsPublished,
		Locale:          resolvedLocale,
	}
	if tr != nil {
		resp.Title = tr.Title
		resp.Caption = tr.Caption
		resp.AltText = tr.AltText
	}
	return resp
}

func (s *DesignService) enrichList(
	design *model.Design,
	tr *model.DesignTranslation,
	resolvedLocale string,
	primary *model.DesignImage,
	imageCount int64,
) DesignResponse {
	resp := DesignResponse{
		ID:          design.ID,
		Sizes:       s.sizeResponses(design.Sizes),
		Types:       typeResponses(design.Types, resolvedLocale),
		Images:      nil,
		ImageCount:  int(imageCount),
		SortOrder:   design.SortOrder,
		IsPublished: design.IsPublished,
		Locale:      resolvedLocale,
	}
	if primary != nil {
		imgResp := s.imageResponse(primary)
		resp.PrimaryImageURL = imgResp.ImageURL
		resp.PrimaryThumbURL = imgResp.ThumbURL
	}
	if tr != nil {
		resp.Title = tr.Title
		resp.Caption = tr.Caption
		resp.AltText = tr.AltText
	}
	return resp
}

func (s *DesignService) translationsMap(design *model.Design) map[string]DesignTranslationInput {
	out := make(map[string]DesignTranslationInput)
	for _, tr := range design.Translations {
		out[tr.Locale] = DesignTranslationInput{
			Title:   tr.Title,
			Caption: tr.Caption,
			AltText: tr.AltText,
		}
	}
	return out
}

func (s *DesignService) validateInput(ctx context.Context, in DesignInput) error {
	if len(in.SizeIDs) > 0 {
		ok, err := s.sizeRepo.ExistsAll(ctx, in.SizeIDs)
		if err != nil {
			return err
		}
		if !ok {
			return errors.New("one or more size IDs are invalid")
		}
	}
	if len(in.TypeIDs) > 0 {
		ok, err := s.typeRepo.ExistsAll(ctx, in.TypeIDs)
		if err != nil {
			return err
		}
		if !ok {
			return errors.New("one or more type IDs are invalid")
		}
	}
	sizeSet := make(map[uuid.UUID]struct{}, len(in.SizeIDs))
	for _, id := range in.SizeIDs {
		sizeSet[id] = struct{}{}
	}
	typeSet := make(map[uuid.UUID]struct{}, len(in.TypeIDs))
	for _, id := range in.TypeIDs {
		typeSet[id] = struct{}{}
	}
	for _, img := range in.Images {
		if img.ObjectKey == "" {
			return errors.New("image object_key is required")
		}
		hasSize := img.SizeID != nil
		hasType := img.TypeID != nil
		if hasSize && !hasType {
			if _, ok := sizeSet[*img.SizeID]; !ok {
				return errors.New("image references a size not assigned to this design")
			}
			continue
		}
		if hasSize != hasType {
			return errors.New("variant images must specify both size and type")
		}
		if hasSize {
			if _, ok := sizeSet[*img.SizeID]; !ok {
				return errors.New("image references a size not assigned to this design")
			}
			if _, ok := typeSet[*img.TypeID]; !ok {
				return errors.New("image references a type not assigned to this design")
			}
		}
	}
	return nil
}

func (s *DesignService) ListPublic(ctx context.Context, locale string) ([]DesignResponse, error) {
	items, err := s.repo.ListPublished(ctx, locale)
	if err != nil {
		return nil, err
	}
	ids := make([]uuid.UUID, len(items))
	for i := range items {
		ids[i] = items[i].ID
	}
	primaryImages, err := s.repo.PrimaryImagesByDesignIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]DesignResponse, 0, len(items))
	for i := range items {
		tr := pickDesignTranslation(&items[i], locale)
		if tr == nil {
			continue
		}
		resolved := locale
		if tr.Locale != locale {
			resolved = tr.Locale
		}
		var primary *model.DesignImage
		if img, ok := primaryImages[items[i].ID]; ok {
			imgCopy := img
			primary = &imgCopy
		}
		out = append(out, s.enrichList(&items[i], tr, resolved, primary, 0))
	}
	return out, nil
}

func (s *DesignService) GetPublic(ctx context.Context, id uuid.UUID, locale string) (*DesignResponse, error) {
	design, err := s.repo.FindPublishedByID(ctx, id, locale)
	if err != nil {
		return nil, err
	}
	tr := pickDesignTranslation(design, locale)
	if tr == nil {
		return nil, gorm.ErrRecordNotFound
	}
	resolved := locale
	if tr.Locale != locale {
		resolved = tr.Locale
	}
	resp := s.enrich(design, tr, resolved)
	return &resp, nil
}

func (s *DesignService) ListAdmin(ctx context.Context) ([]DesignResponse, error) {
	items, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	ids := make([]uuid.UUID, len(items))
	for i := range items {
		ids[i] = items[i].ID
	}
	imageCounts, err := s.repo.CountImagesByDesignIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	primaryImages, err := s.repo.PrimaryImagesByDesignIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]DesignResponse, len(items))
	for i := range items {
		tr := pickDesignTranslation(&items[i], model.LocaleEN)
		var primary *model.DesignImage
		if img, ok := primaryImages[items[i].ID]; ok {
			imgCopy := img
			primary = &imgCopy
		}
		resp := s.enrichList(&items[i], tr, model.LocaleEN, primary, imageCounts[items[i].ID])
		resp.HasFA = hasDesignTranslation(items[i].Translations, model.LocaleFA)
		out[i] = resp
	}
	return out, nil
}

func (s *DesignService) GetAdmin(ctx context.Context, id uuid.UUID) (*AdminDesignResponse, error) {
	design, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	tr := pickDesignTranslation(design, model.LocaleEN)
	resp := AdminDesignResponse{
		DesignResponse: s.enrich(design, tr, model.LocaleEN),
		Translations:   s.translationsMap(design),
	}
	resp.HasFA = hasDesignTranslation(design.Translations, model.LocaleFA)
	return &resp, nil
}

func (s *DesignService) upsertTranslations(ctx context.Context, designID uuid.UUID, translations map[string]DesignTranslationInput) error {
	for loc, in := range translations {
		if in.Title == "" {
			continue
		}
		if loc != model.LocaleEN && loc != model.LocaleFA {
			continue
		}
		tr := &model.DesignTranslation{
			DesignID: designID,
			Locale:   loc,
			Title:    in.Title,
			Caption:  in.Caption,
			AltText:  in.AltText,
		}
		if err := s.repo.UpsertTranslation(ctx, tr); err != nil {
			return err
		}
	}
	return nil
}

func (s *DesignService) applyRelations(ctx context.Context, designID uuid.UUID, in DesignInput) error {
	images := make([]model.DesignImage, len(in.Images))
	for i, imgIn := range in.Images {
		images[i] = model.DesignImage{
			ObjectKey:      imgIn.ObjectKey,
			ThumbObjectKey: imgIn.ThumbObjectKey,
			SizeID:         imgIn.SizeID,
			TypeID:         imgIn.TypeID,
			SortOrder:      imgIn.SortOrder,
		}
	}
	return s.repo.ReplaceRelations(ctx, designID, in.SizeIDs, in.TypeIDs, images)
}

func (s *DesignService) Create(ctx context.Context, actorID uuid.UUID, in DesignInput) (*AdminDesignResponse, error) {
	if err := s.validateInput(ctx, in); err != nil {
		return nil, err
	}
	design := &model.Design{
		SortOrder:   in.SortOrder,
		IsPublished: in.IsPublished,
	}
	if err := s.repo.Create(ctx, design); err != nil {
		return nil, err
	}
	translations := in.Translations
	if len(translations) == 0 {
		translations = map[string]DesignTranslationInput{model.LocaleEN: {Title: "Untitled"}}
	}
	if err := s.upsertTranslations(ctx, design.ID, translations); err != nil {
		return nil, err
	}
	if err := s.applyRelations(ctx, design.ID, in); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, actorID, "design.create", "design", design.ID, nil)
	return s.GetAdmin(ctx, design.ID)
}

func (s *DesignService) Update(ctx context.Context, actorID, id uuid.UUID, in DesignInput) (*AdminDesignResponse, error) {
	if err := s.validateInput(ctx, in); err != nil {
		return nil, err
	}
	oldImages, err := s.repo.ListImages(ctx, id)
	if err != nil {
		return nil, err
	}
	design, err := s.repo.FindMetaByID(ctx, id)
	if err != nil {
		return nil, err
	}
	design.SortOrder = in.SortOrder
	design.IsPublished = in.IsPublished
	if err := s.repo.Update(ctx, design); err != nil {
		return nil, err
	}
	if len(in.Translations) > 0 {
		if err := s.upsertTranslations(ctx, design.ID, in.Translations); err != nil {
			return nil, err
		}
	}
	if err := s.applyRelations(ctx, design.ID, in); err != nil {
		return nil, err
	}
	s.deleteOrphanImages(ctx, oldImages, in.Images)
	s.audit.Log(ctx, actorID, "design.update", "design", design.ID, nil)
	return s.GetAdmin(ctx, design.ID)
}

func (s *DesignService) deleteOrphanImages(ctx context.Context, old []model.DesignImage, newIn []DesignImageInput) {
	newKeys := make(map[string]struct{}, len(newIn))
	for _, img := range newIn {
		newKeys[img.ObjectKey] = struct{}{}
		if img.ThumbObjectKey != "" {
			newKeys[img.ThumbObjectKey] = struct{}{}
		}
	}
	for _, img := range old {
		if _, ok := newKeys[img.ObjectKey]; !ok {
			_ = s.store.Delete(ctx, img.ObjectKey)
		}
		if img.ThumbObjectKey != "" {
			if _, ok := newKeys[img.ThumbObjectKey]; !ok {
				_ = s.store.Delete(ctx, img.ThumbObjectKey)
			}
		}
	}
}

func (s *DesignService) Delete(ctx context.Context, actorID, id uuid.UUID) error {
	images, err := s.repo.ListImages(ctx, id)
	if err != nil {
		return err
	}
	for _, img := range images {
		_ = s.store.Delete(ctx, img.ObjectKey)
		if img.ThumbObjectKey != "" {
			_ = s.store.Delete(ctx, img.ThumbObjectKey)
		}
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	s.audit.Log(ctx, actorID, "design.delete", "design", id, nil)
	return nil
}
