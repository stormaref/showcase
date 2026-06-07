package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

var ErrTypeNotFound = errors.New("type not found")

type TypeRepository struct {
	db *gorm.DB
}

func NewTypeRepository(db *gorm.DB) *TypeRepository {
	return &TypeRepository{db: db}
}

func (r *TypeRepository) List(ctx context.Context) ([]model.DesignType, error) {
	var types []model.DesignType
	err := r.db.WithContext(ctx).
		Preload("Translations").
		Order("sort_order ASC, created_at ASC").
		Find(&types).Error
	return types, err
}

func (r *TypeRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.DesignType, error) {
	var t model.DesignType
	err := r.db.WithContext(ctx).
		Preload("Translations").
		First(&t, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTypeNotFound
		}
		return nil, err
	}
	return &t, nil
}

func (r *TypeRepository) Create(ctx context.Context, t *model.DesignType) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *TypeRepository) Update(ctx context.Context, t *model.DesignType) error {
	return r.db.WithContext(ctx).Save(t).Error
}

func (r *TypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("type_id = ?", id).Delete(&model.DesignTypeTranslation{}).Error; err != nil {
			return err
		}
		res := tx.Delete(&model.DesignType{}, "id = ?", id)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrTypeNotFound
		}
		return nil
	})
}

func (r *TypeRepository) UpsertTranslation(ctx context.Context, tr *model.DesignTypeTranslation) error {
	var existing model.DesignTypeTranslation
	err := r.db.WithContext(ctx).
		Where("type_id = ? AND locale = ?", tr.TypeID, tr.Locale).
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

func (r *TypeRepository) IsReferenced(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Raw(`
		SELECT (
			(SELECT COUNT(*) FROM design_types WHERE type_id = ?) +
			(SELECT COUNT(*) FROM design_images WHERE type_id = ?)
		) AS total
	`, id, id).Scan(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *TypeRepository) ExistsAll(ctx context.Context, ids []uuid.UUID) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.DesignType{}).
		Where("id IN ?", ids).Count(&count).Error; err != nil {
		return false, err
	}
	return int(count) == len(ids), nil
}
