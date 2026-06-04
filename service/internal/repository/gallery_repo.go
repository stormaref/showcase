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

func (r *GalleryRepository) ListPublished(ctx context.Context, locale string) ([]model.GalleryItem, error) {
	var items []model.GalleryItem
	err := r.db.WithContext(ctx).
		Where("is_published = ?", true).
		Preload("Translations", "locale = ?", locale).
		Order("sort_order ASC, created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *GalleryRepository) ListAll(ctx context.Context) ([]model.GalleryItem, error) {
	var items []model.GalleryItem
	err := r.db.WithContext(ctx).
		Preload("Translations").
		Order("sort_order ASC, created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *GalleryRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.GalleryItem, error) {
	var item model.GalleryItem
	err := r.db.WithContext(ctx).Preload("Translations").First(&item, "id = ?", id).Error
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
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("item_id = ?", id).Delete(&model.GalleryItemTranslation{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.GalleryItem{}, "id = ?", id).Error
	})
}

func (r *GalleryRepository) UpsertTranslation(ctx context.Context, tr *model.GalleryItemTranslation) error {
	var existing model.GalleryItemTranslation
	err := r.db.WithContext(ctx).
		Where("item_id = ? AND locale = ?", tr.ItemID, tr.Locale).
		First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.WithContext(ctx).Create(tr).Error
	}
	if err != nil {
		return err
	}
	tr.ID = existing.ID
	tr.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Save(tr).Error
}

func (r *GalleryRepository) HasTranslation(ctx context.Context, itemID uuid.UUID, locale string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.GalleryItemTranslation{}).
		Where("item_id = ? AND locale = ?", itemID, locale).
		Count(&count).Error
	return count > 0, err
}
