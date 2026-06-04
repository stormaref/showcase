package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

var ErrSizeNotFound = errors.New("size not found")

type SizeRepository struct {
	db *gorm.DB
}

func NewSizeRepository(db *gorm.DB) *SizeRepository {
	return &SizeRepository{db: db}
}

func (r *SizeRepository) List(ctx context.Context) ([]model.TileSize, error) {
	var sizes []model.TileSize
	err := r.db.WithContext(ctx).Order("width_mm ASC, height_mm ASC").Find(&sizes).Error
	return sizes, err
}

func (r *SizeRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.TileSize, error) {
	var size model.TileSize
	err := r.db.WithContext(ctx).First(&size, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSizeNotFound
		}
		return nil, err
	}
	return &size, nil
}

func (r *SizeRepository) FindByDimensions(ctx context.Context, widthMM, heightMM int) (*model.TileSize, error) {
	var size model.TileSize
	err := r.db.WithContext(ctx).
		Where("width_mm = ? AND height_mm = ?", widthMM, heightMM).
		First(&size).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSizeNotFound
		}
		return nil, err
	}
	return &size, nil
}

func (r *SizeRepository) Create(ctx context.Context, size *model.TileSize) error {
	return r.db.WithContext(ctx).Create(size).Error
}

func (r *SizeRepository) Update(ctx context.Context, size *model.TileSize) error {
	return r.db.WithContext(ctx).Save(size).Error
}

func (r *SizeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	res := r.db.WithContext(ctx).Delete(&model.TileSize{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrSizeNotFound
	}
	return nil
}

func (r *SizeRepository) IsReferenced(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Raw(`
		SELECT (
			(SELECT COUNT(*) FROM design_sizes WHERE size_id = ?) +
			(SELECT COUNT(*) FROM design_images WHERE size_id = ?)
		) AS total
	`, id, id).Scan(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *SizeRepository) ExistsAll(ctx context.Context, ids []uuid.UUID) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.TileSize{}).
		Where("id IN ?", ids).Count(&count).Error; err != nil {
		return false, err
	}
	return int(count) == len(ids), nil
}
