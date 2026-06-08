package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

var ErrFinishNotFound = errors.New("finish not found")

type FinishRepository struct {
	db *gorm.DB
}

func NewFinishRepository(db *gorm.DB) *FinishRepository {
	return &FinishRepository{db: db}
}

func (r *FinishRepository) List(ctx context.Context) ([]model.SurfaceFinish, error) {
	var finishes []model.SurfaceFinish
	err := r.db.WithContext(ctx).
		Preload("Translations").
		Order("sort_order ASC, created_at ASC").
		Find(&finishes).Error
	return finishes, err
}

func (r *FinishRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.SurfaceFinish, error) {
	var f model.SurfaceFinish
	err := r.db.WithContext(ctx).
		Preload("Translations").
		First(&f, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFinishNotFound
		}
		return nil, err
	}
	return &f, nil
}

func (r *FinishRepository) Create(ctx context.Context, f *model.SurfaceFinish) error {
	return r.db.WithContext(ctx).Create(f).Error
}

func (r *FinishRepository) Update(ctx context.Context, f *model.SurfaceFinish) error {
	return r.db.WithContext(ctx).Save(f).Error
}

func (r *FinishRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("finish_id = ?", id).Delete(&model.SurfaceFinishTranslation{}).Error; err != nil {
			return err
		}
		res := tx.Delete(&model.SurfaceFinish{}, "id = ?", id)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrFinishNotFound
		}
		return nil
	})
}

func (r *FinishRepository) UpsertTranslation(ctx context.Context, tr *model.SurfaceFinishTranslation) error {
	var existing model.SurfaceFinishTranslation
	err := r.db.WithContext(ctx).
		Where("finish_id = ? AND locale = ?", tr.FinishID, tr.Locale).
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

func (r *FinishRepository) IsReferenced(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.DesignSurfaceFinish{}).
		Where("finish_id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *FinishRepository) ExistsAll(ctx context.Context, ids []uuid.UUID) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.SurfaceFinish{}).
		Where("id IN ?", ids).Count(&count).Error; err != nil {
		return false, err
	}
	return int(count) == len(ids), nil
}
