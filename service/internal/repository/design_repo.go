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

func translationLocales(locale string) []string {
	if locale == model.LocaleEN {
		return []string{model.LocaleEN}
	}
	return []string{locale, model.LocaleEN}
}

func (r *DesignRepository) preloadForList(q *gorm.DB, locale string) *gorm.DB {
	return q.Preload("Translations", "locale IN ?", translationLocales(locale)).
		Preload("Sizes")
}

func (r *DesignRepository) preloadForAdminList(q *gorm.DB) *gorm.DB {
	return q.Preload("Translations").Preload("Sizes")
}

func (r *DesignRepository) preloadFull(q *gorm.DB, locale string) *gorm.DB {
	return q.Preload("Translations", "locale IN ?", translationLocales(locale)).
		Preload("Sizes").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, created_at ASC")
		})
}

func (r *DesignRepository) ListPublished(ctx context.Context, locale string) ([]model.Design, error) {
	var items []model.Design
	err := r.preloadForList(r.db.WithContext(ctx), locale).
		Where("is_published = ?", true).
		Order("sort_order ASC, created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *DesignRepository) ListAll(ctx context.Context) ([]model.Design, error) {
	var items []model.Design
	err := r.preloadForAdminList(r.db.WithContext(ctx)).
		Order("sort_order ASC, created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *DesignRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Design, error) {
	var item model.Design
	err := r.db.WithContext(ctx).
		Preload("Translations").
		Preload("Sizes").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, created_at ASC")
		}).
		First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *DesignRepository) FindPublishedByID(ctx context.Context, id uuid.UUID, locale string) (*model.Design, error) {
	var item model.Design
	err := r.preloadFull(r.db.WithContext(ctx), locale).
		Where("is_published = ?", true).
		First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *DesignRepository) FindMetaByID(ctx context.Context, id uuid.UUID) (*model.Design, error) {
	var item model.Design
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
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

func (r *DesignRepository) CountImagesByDesignIDs(ctx context.Context, designIDs []uuid.UUID) (map[uuid.UUID]int64, error) {
	out := make(map[uuid.UUID]int64, len(designIDs))
	if len(designIDs) == 0 {
		return out, nil
	}
	type row struct {
		DesignID uuid.UUID
		Count    int64
	}
	var rows []row
	err := r.db.WithContext(ctx).Model(&model.DesignImage{}).
		Select("design_id, COUNT(*) AS count").
		Where("design_id IN ?", designIDs).
		Group("design_id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.DesignID] = row.Count
	}
	return out, nil
}

func (r *DesignRepository) PrimaryImagesByDesignIDs(ctx context.Context, designIDs []uuid.UUID) (map[uuid.UUID]model.DesignImage, error) {
	out := make(map[uuid.UUID]model.DesignImage, len(designIDs))
	if len(designIDs) == 0 {
		return out, nil
	}
	var images []model.DesignImage
	err := r.db.WithContext(ctx).Raw(`
		SELECT DISTINCT ON (design_id) *
		FROM design_images
		WHERE design_id IN ?
		ORDER BY design_id, (size_id IS NULL) DESC, sort_order ASC, created_at ASC
	`, designIDs).Scan(&images).Error
	if err != nil {
		return nil, err
	}
	for _, img := range images {
		out[img.DesignID] = img
	}
	return out, nil
}

func (r *DesignRepository) ReplaceRelations(
	ctx context.Context,
	designID uuid.UUID,
	sizeIDs []uuid.UUID,
	images []model.DesignImage,
) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("design_id = ?", designID).Delete(&model.DesignSize{}).Error; err != nil {
			return err
		}
		if len(sizeIDs) > 0 {
			rows := make([]model.DesignSize, len(sizeIDs))
			for i, sid := range sizeIDs {
				rows[i] = model.DesignSize{DesignID: designID, SizeID: sid}
			}
			if err := tx.CreateInBatches(rows, 100).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("design_id = ?", designID).Delete(&model.DesignImage{}).Error; err != nil {
			return err
		}
		if len(images) > 0 {
			for i := range images {
				images[i].DesignID = designID
			}
			if err := tx.CreateInBatches(images, 100).Error; err != nil {
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
