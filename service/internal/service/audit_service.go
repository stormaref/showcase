package service

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
)

type AuditService struct {
	repo *repository.AuditRepository
}

func NewAuditService(repo *repository.AuditRepository) *AuditService {
	return &AuditService{repo: repo}
}

func (s *AuditService) Log(ctx context.Context, actorID uuid.UUID, action, entityType string, entityID uuid.UUID, meta map[string]interface{}) {
	payload := "{}"
	if meta != nil {
		if b, err := json.Marshal(meta); err == nil {
			payload = string(b)
		}
	}
	_ = s.repo.Create(ctx, &model.AuditLog{
		ActorID:    actorID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Metadata:   payload,
	})
}

func (s *AuditService) List(ctx context.Context, page, limit int) ([]model.AuditLog, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.repo.List(ctx, limit, offset)
}
