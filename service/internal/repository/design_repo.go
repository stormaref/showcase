package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

type DesignRepository struct {
	db *gorm.DB
}

func NewDesignRepository(db *gorm.DB) *DesignRepository {
	return &DesignRepository{db: db}
}

func (r *DesignRepository) preloadAll(q *gorm.DB) *gorm.DB {
	return q.Preload("Translations").
		Preload("Sizes").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, created_at ASC")
		})
}

func (r *DesignRepository) ListPublished(ctx context.Context, locale string) ([]model.Design, error) {
	var items []model.Design
	err := r.preloadAll(r.db.WithContext(ctx)).
		Where("is_published = ?", true).
		Order("sort_order ASC, created_at DESC").
		Find(&items).Error
	_ = locale
	return items, err
}

func (r *DesignRepository) ListAll(ctx context.Context) ([]model.Design, error) {
	var items []model.Design
	err := r.preloadAll(r.db.WithContext(ctx)).
		Order("sort_order ASC, created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *DesignRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Design, error) {
	var item model.Design
	err := r.preloadAll(r.db.WithContext(ctx)).First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *DesignRepository) Create(ctx context.Context, design *model.Design) error {
	return r.db.WithContext(ctx).Create(design).Error
}

func (r *DesignRepository) Update(ctx context.Context, design *model.Design) error {
	return r.db.WithContext(ctx).Save(design).Error
}

func (r *DesignRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("design_id = ?", id).Delete(&model.DesignImage{}).Error; err != nil {
			return err
		}
		if err := tx.Where("design_id = ?", id).Delete(&model.DesignSize{}).Error; err != nil {
			return err
		}
		if err := tx.Where("design_id = ?", id).Delete(&model.DesignTranslation{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Design{}, "id = ?", id).Error
	})
}

func (r *DesignRepository) UpsertTranslation(ctx context.Context, tr *model.DesignTranslation) error {
	var existing model.DesignTranslation
	err := r.db.WithContext(ctx).
		Where("design_id = ? AND locale = ?", tr.DesignID, tr.Locale).
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

func (r *DesignRepository) HasTranslation(ctx context.Context, designID uuid.UUID, locale string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.DesignTranslation{}).
		Where("design_id = ? AND locale = ?", designID, locale).
		Count(&count).Error
	return count > 0, err
}

func (r *DesignRepository) ReplaceSizes(ctx context.Context, designID uuid.UUID, sizeIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("design_id = ?", designID).Delete(&model.DesignSize{}).Error; err != nil {
			return err
		}
		for _, sid := range sizeIDs {
			if err := tx.Create(&model.DesignSize{DesignID: designID, SizeID: sid}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *DesignRepository) ReplaceImages(ctx context.Context, designID uuid.UUID, images []model.DesignImage) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("design_id = ?", designID).Delete(&model.DesignImage{}).Error; err != nil {
			return err
		}
		for i := range images {
			images[i].DesignID = designID
			if err := tx.Create(&images[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *DesignRepository) ListImages(ctx context.Context, designID uuid.UUID) ([]model.DesignImage, error) {
	var images []model.DesignImage
	err := r.db.WithContext(ctx).
		Where("design_id = ?", designID).
		Order("sort_order ASC, created_at ASC").
		Find(&images).Error
	return images, err
}
