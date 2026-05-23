package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) ListPublished(ctx context.Context, limit, offset int) ([]model.BlogPost, int64, error) {
	var posts []model.BlogPost
	var total int64
	q := r.db.WithContext(ctx).Model(&model.BlogPost{}).Where("status = ?", model.StatusPublished)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("published_at DESC NULLS LAST, created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, total, err
}

func (r *PostRepository) FindPublishedBySlug(ctx context.Context, slug string) (*model.BlogPost, error) {
	var post model.BlogPost
	err := r.db.WithContext(ctx).Where("slug = ? AND status = ?", slug, model.StatusPublished).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) ListAll(ctx context.Context, limit, offset int) ([]model.BlogPost, int64, error) {
	var posts []model.BlogPost
	var total int64
	q := r.db.WithContext(ctx).Model(&model.BlogPost{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("updated_at DESC").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, total, err
}

func (r *PostRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.BlogPost, error) {
	var post model.BlogPost
	err := r.db.WithContext(ctx).First(&post, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) FindBySlug(ctx context.Context, slug string) (*model.BlogPost, error) {
	var post model.BlogPost
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) Create(ctx context.Context, post *model.BlogPost) error {
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *PostRepository) Update(ctx context.Context, post *model.BlogPost) error {
	return r.db.WithContext(ctx).Save(post).Error
}

func (r *PostRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.BlogPost{}, "id = ?", id).Error
}
