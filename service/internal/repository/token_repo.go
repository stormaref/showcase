package repository

import (
	"context"
	"time"

	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

type TokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

func (r *TokenRepository) Create(ctx context.Context, token *model.RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *TokenRepository) FindValid(ctx context.Context, hash string) (*model.RefreshToken, error) {
	var token model.RefreshToken
	err := r.db.WithContext(ctx).
		Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", hash, time.Now()).
		First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *TokenRepository) Revoke(ctx context.Context, id interface{}) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&model.RefreshToken{}).Where("id = ?", id).Update("revoked_at", now).Error
}

func (r *TokenRepository) RevokeAllForAdmin(ctx context.Context, adminID interface{}) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&model.RefreshToken{}).
		Where("admin_id = ? AND revoked_at IS NULL", adminID).
		Update("revoked_at", now).Error
}
