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

type GalleryInput struct {
	Title          string `json:"title" binding:"required,max=255"`
	Caption        string `json:"caption"`
	AltText        string `json:"alt_text"`
	ObjectKey      string `json:"object_key" binding:"required"`
	ThumbObjectKey string `json:"thumb_object_key"`
	SortOrder      int    `json:"sort_order"`
	IsPublished    bool   `json:"is_published"`
}

type GalleryResponse struct {
	model.GalleryItem
	ImageURL string `json:"image_url"`
	ThumbURL string `json:"thumb_url"`
}

func (s *GalleryService) enrich(item *model.GalleryItem) GalleryResponse {
	resp := GalleryResponse{GalleryItem: *item}
	resp.ImageURL = s.store.PublicURL(item.ObjectKey)
	if item.ThumbObjectKey != "" {
		resp.ThumbURL = s.store.PublicURL(item.ThumbObjectKey)
	} else {
		resp.ThumbURL = resp.ImageURL
	}
	return resp
}

func (s *GalleryService) ListPublic(ctx context.Context) ([]GalleryResponse, error) {
	items, err := s.repo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]GalleryResponse, len(items))
	for i := range items {
		out[i] = s.enrich(&items[i])
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
		out[i] = s.enrich(&items[i])
	}
	return out, nil
}

func (s *GalleryService) Create(ctx context.Context, actorID uuid.UUID, in GalleryInput) (*model.GalleryItem, error) {
	item := &model.GalleryItem{
		Title:          in.Title,
		Caption:        in.Caption,
		AltText:        in.AltText,
		ObjectKey:      in.ObjectKey,
		ThumbObjectKey: in.ThumbObjectKey,
		SortOrder:      in.SortOrder,
		IsPublished:    in.IsPublished,
	}
	if err := s.repo.Create(ctx, item); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, actorID, "gallery.create", "gallery_item", item.ID, nil)
	return item, nil
}

func (s *GalleryService) Update(ctx context.Context, actorID, id uuid.UUID, in GalleryInput) (*model.GalleryItem, error) {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if in.Title != "" {
		item.Title = in.Title
	}
	item.Caption = in.Caption
	item.AltText = in.AltText
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
	s.audit.Log(ctx, actorID, "gallery.update", "gallery_item", item.ID, nil)
	return item, nil
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
