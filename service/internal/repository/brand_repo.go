package repository

import (
	"context"
	"errors"

	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

var ErrBrandNotFound = errors.New("brand info not found")

type BrandRepository struct {
	db *gorm.DB
}

func NewBrandRepository(db *gorm.DB) *BrandRepository {
	return &BrandRepository{db: db}
}

func (r *BrandRepository) List(ctx context.Context) ([]model.BrandInfoTranslation, error) {
	var rows []model.BrandInfoTranslation
	err := r.db.WithContext(ctx).Order("locale ASC").Find(&rows).Error
	return rows, err
}

func (r *BrandRepository) FindByLocale(ctx context.Context, locale string) (*model.BrandInfoTranslation, error) {
	var row model.BrandInfoTranslation
	err := r.db.WithContext(ctx).Where("locale = ?", locale).First(&row).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBrandNotFound
		}
		return nil, err
	}
	return &row, nil
}

func (r *BrandRepository) Upsert(ctx context.Context, row *model.BrandInfoTranslation) error {
	var existing model.BrandInfoTranslation
	err := r.db.WithContext(ctx).Where("locale = ?", row.Locale).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.WithContext(ctx).Create(row).Error
	}
	if err != nil {
		return err
	}
	row.ID = existing.ID
	row.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Save(row).Error
}

func (r *BrandRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.BrandInfoTranslation{}).Count(&count).Error
	return count, err
}
