package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

var ErrBrandNotFound = errors.New("brand not found")

type BrandRepository struct {
	db *gorm.DB
}

func NewBrandRepository(db *gorm.DB) *BrandRepository {
	return &BrandRepository{db: db}
}

func (r *BrandRepository) List(ctx context.Context) ([]model.Brand, error) {
	var brands []model.Brand
	err := r.db.WithContext(ctx).
		Preload("Translations").
		Order("sort_order ASC, created_at ASC").
		Find(&brands).Error
	return brands, err
}

func (r *BrandRepository) ListPublished(ctx context.Context) ([]model.Brand, error) {
	var brands []model.Brand
	err := r.db.WithContext(ctx).
		Preload("Translations").
		Where("is_published = ?", true).
		Order("sort_order ASC, created_at ASC").
		Find(&brands).Error
	return brands, err
}

func (r *BrandRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Brand, error) {
	var b model.Brand
	err := r.db.WithContext(ctx).
		Preload("Translations").
		First(&b, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBrandNotFound
		}
		return nil, err
	}
	return &b, nil
}

func (r *BrandRepository) Create(ctx context.Context, b *model.Brand) error {
	return r.db.WithContext(ctx).Create(b).Error
}

func (r *BrandRepository) Update(ctx context.Context, b *model.Brand) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *BrandRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("brand_id = ?", id).Delete(&model.BrandTranslation{}).Error; err != nil {
			return err
		}
		res := tx.Delete(&model.Brand{}, "id = ?", id)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrBrandNotFound
		}
		return nil
	})
}

func (r *BrandRepository) UpsertTranslation(ctx context.Context, tr *model.BrandTranslation) error {
	var existing model.BrandTranslation
	err := r.db.WithContext(ctx).
		Where("brand_id = ? AND locale = ?", tr.BrandID, tr.Locale).
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

// IsReferenced reports whether any design is assigned to this brand.
func (r *BrandRepository) IsReferenced(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Design{}).
		Where("brand_id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *BrandRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.Brand{}).
		Where("id = ?", id).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
