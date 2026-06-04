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

func (r *PostRepository) ListPublished(ctx context.Context, locale string, limit, offset int) ([]model.BlogPost, int64, error) {
	var posts []model.BlogPost
	var total int64
	q := r.db.WithContext(ctx).Model(&model.BlogPost{}).Where("status = ?", model.StatusPublished)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Preload("Translations", "locale = ?", locale).
		Order("published_at DESC NULLS LAST, created_at DESC").
		Limit(limit).Offset(offset).Find(&posts).Error
	return posts, total, err
}

func (r *PostRepository) FindPublishedBySlug(ctx context.Context, slug, locale string) (*model.BlogPost, error) {
	var tr model.BlogPostTranslation
	err := r.db.WithContext(ctx).
		Where("slug = ? AND locale = ?", slug, locale).
		First(&tr).Error
	if err != nil {
		return nil, err
	}
	var post model.BlogPost
	err = r.db.WithContext(ctx).
		Preload("Translations", "locale = ?", locale).
		Where("id = ? AND status = ?", tr.PostID, model.StatusPublished).
		First(&post).Error
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
	err := q.Preload("Translations").
		Order("updated_at DESC").
		Limit(limit).Offset(offset).Find(&posts).Error
	return posts, total, err
}

func (r *PostRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.BlogPost, error) {
	var post model.BlogPost
	err := r.db.WithContext(ctx).Preload("Translations").First(&post, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) FindTranslationBySlug(ctx context.Context, slug, locale string) (*model.BlogPostTranslation, error) {
	var tr model.BlogPostTranslation
	err := r.db.WithContext(ctx).Where("slug = ? AND locale = ?", slug, locale).First(&tr).Error
	if err != nil {
		return nil, err
	}
	return &tr, nil
}

func (r *PostRepository) Create(ctx context.Context, post *model.BlogPost) error {
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *PostRepository) Update(ctx context.Context, post *model.BlogPost) error {
	return r.db.WithContext(ctx).Save(post).Error
}

func (r *PostRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("post_id = ?", id).Delete(&model.BlogPostTranslation{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.BlogPost{}, "id = ?", id).Error
	})
}

func (r *PostRepository) UpsertTranslation(ctx context.Context, tr *model.BlogPostTranslation) error {
	var existing model.BlogPostTranslation
	err := r.db.WithContext(ctx).
		Where("post_id = ? AND locale = ?", tr.PostID, tr.Locale).
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

func (r *PostRepository) HasTranslation(ctx context.Context, postID uuid.UUID, locale string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.BlogPostTranslation{}).
		Where("post_id = ? AND locale = ?", postID, locale).
		Count(&count).Error
	return count > 0, err
}
