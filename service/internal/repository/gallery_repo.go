package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

type GalleryRepository struct {
	db *gorm.DB
}

func NewGalleryRepository(db *gorm.DB) *GalleryRepository {
	return &GalleryRepository{db: db}
}

func (r *GalleryRepository) ListPublished(ctx context.Context) ([]model.GalleryItem, error) {
	var items []model.GalleryItem
	err := r.db.WithContext(ctx).Where("is_published = ?", true).Order("sort_order ASC, created_at DESC").Find(&items).Error
	return items, err
}

func (r *GalleryRepository) ListAll(ctx context.Context) ([]model.GalleryItem, error) {
	var items []model.GalleryItem
	err := r.db.WithContext(ctx).Order("sort_order ASC, created_at DESC").Find(&items).Error
	return items, err
}

func (r *GalleryRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.GalleryItem, error) {
	var item model.GalleryItem
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *GalleryRepository) Create(ctx context.Context, item *model.GalleryItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *GalleryRepository) Update(ctx context.Context, item *model.GalleryItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *GalleryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.GalleryItem{}, "id = ?", id).Error
}
