package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/config"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/util"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUnauthorized       = errors.New("unauthorized")
)

type AuthService struct {
	cfg       *config.Config
	admins    *repository.AdminRepository
	tokens    *repository.TokenRepository
	audit     *AuditService
}

func NewAuthService(cfg *config.Config, admins *repository.AdminRepository, tokens *repository.TokenRepository, audit *AuditService) *AuthService {
	return &AuthService{cfg: cfg, admins: admins, tokens: tokens, audit: audit}
}

func (s *AuthService) BootstrapAdmin(ctx context.Context) error {
	if s.cfg.BootstrapAdminEmail == "" || s.cfg.BootstrapAdminPass == "" {
		return nil
	}
	n, err := s.admins.Count(ctx)
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(s.cfg.BootstrapAdminPass), 12)
	if err != nil {
		return err
	}
	return s.admins.Create(ctx, &model.Admin{
		Email:        s.cfg.BootstrapAdminEmail,
		PasswordHash: string(hash),
		IsActive:     true,
	})
}

func (s *AuthService) Login(ctx context.Context, email, password string) (access string, expiresIn int64, refresh string, admin *model.Admin, err error) {
	admin, err = s.admins.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", 0, "", nil, ErrInvalidCredentials
		}
		return "", 0, "", nil, err
	}
	if err = bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)); err != nil {
		return "", 0, "", nil, ErrInvalidCredentials
	}
	access, expiresIn, err = util.IssueAccessToken(s.cfg, admin.ID, admin.Email)
	if err != nil {
		return "", 0, "", nil, err
	}
	plain, hash, err := util.NewRefreshToken()
	if err != nil {
		return "", 0, "", nil, err
	}
	rt := &model.RefreshToken{
		AdminID:   admin.ID,
		TokenHash: hash,
		ExpiresAt: time.Now().Add(s.cfg.JWTRefreshTTL),
	}
	if err = s.tokens.Create(ctx, rt); err != nil {
		return "", 0, "", nil, err
	}
	s.audit.Log(ctx, admin.ID, "auth.login", "admin", admin.ID, nil)
	return access, expiresIn, plain, admin, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshPlain string) (access string, expiresIn int64, newRefresh string, err error) {
	hash := util.HashToken(refreshPlain)
	rt, err := s.tokens.FindValid(ctx, hash)
	if err != nil {
		return "", 0, "", ErrUnauthorized
	}
	admin, err := s.admins.FindByID(ctx, rt.AdminID)
	if err != nil {
		return "", 0, "", ErrUnauthorized
	}
	_ = s.tokens.Revoke(ctx, rt.ID)
	access, expiresIn, err = util.IssueAccessToken(s.cfg, admin.ID, admin.Email)
	if err != nil {
		return "", 0, "", err
	}
	plain, newHash, err := util.NewRefreshToken()
	if err != nil {
		return "", 0, "", err
	}
	newRT := &model.RefreshToken{
		AdminID:   admin.ID,
		TokenHash: newHash,
		ExpiresAt: time.Now().Add(s.cfg.JWTRefreshTTL),
	}
	if err = s.tokens.Create(ctx, newRT); err != nil {
		return "", 0, "", err
	}
	return access, expiresIn, plain, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshPlain string, adminID uuid.UUID) error {
	if refreshPlain != "" {
		hash := util.HashToken(refreshPlain)
		if rt, err := s.tokens.FindValid(ctx, hash); err == nil {
			_ = s.tokens.Revoke(ctx, rt.ID)
		}
	}
	if adminID != uuid.Nil {
		s.audit.Log(ctx, adminID, "auth.logout", "admin", adminID, nil)
	}
	return nil
}

func (s *AuthService) Me(ctx context.Context, adminID uuid.UUID) (*model.Admin, error) {
	return s.admins.FindByID(ctx, adminID)
}
