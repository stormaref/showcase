package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
)

var ErrSizeInUse = errors.New("size in use")

type SizeService struct {
	repo *repository.SizeRepository
}

func NewSizeService(repo *repository.SizeRepository) *SizeService {
	return &SizeService{repo: repo}
}

type SizeInput struct {
	WidthMM  int    `json:"width_mm"`
	HeightMM int    `json:"height_mm"`
	Label    string `json:"label"`
}

type SizeResponse struct {
	ID       uuid.UUID `json:"id"`
	WidthMM  int       `json:"width_mm"`
	HeightMM int       `json:"height_mm"`
	Label    string    `json:"label"`
	InUse    bool      `json:"in_use,omitempty"`
}

func (s *SizeService) toResponse(size *model.TileSize, inUse bool) SizeResponse {
	return SizeResponse{
		ID:       size.ID,
		WidthMM:  size.WidthMM,
		HeightMM: size.HeightMM,
		Label:    size.DisplayLabel(),
		InUse:    inUse,
	}
}

func (s *SizeService) List(ctx context.Context) ([]SizeResponse, error) {
	sizes, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]SizeResponse, len(sizes))
	for i := range sizes {
		inUse, _ := s.repo.IsReferenced(ctx, sizes[i].ID)
		out[i] = s.toResponse(&sizes[i], inUse)
	}
	return out, nil
}

func (s *SizeService) Get(ctx context.Context, id uuid.UUID) (*SizeResponse, error) {
	size, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	inUse, _ := s.repo.IsReferenced(ctx, id)
	resp := s.toResponse(size, inUse)
	return &resp, nil
}

func (s *SizeService) Create(ctx context.Context, in SizeInput) (*SizeResponse, error) {
	if in.WidthMM <= 0 || in.HeightMM <= 0 {
		return nil, errors.New("width and height must be positive")
	}
	size := &model.TileSize{
		WidthMM:  in.WidthMM,
		HeightMM: in.HeightMM,
		Label:    in.Label,
	}
	if err := s.repo.Create(ctx, size); err != nil {
		return nil, err
	}
	resp := s.toResponse(size, false)
	return &resp, nil
}

func (s *SizeService) Update(ctx context.Context, id uuid.UUID, in SizeInput) (*SizeResponse, error) {
	size, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	dimsChanged := in.WidthMM != size.WidthMM || in.HeightMM != size.HeightMM
	if dimsChanged {
		inUse, err := s.repo.IsReferenced(ctx, id)
		if err != nil {
			return nil, err
		}
		if inUse {
			return nil, ErrSizeInUse
		}
		if in.WidthMM <= 0 || in.HeightMM <= 0 {
			return nil, errors.New("width and height must be positive")
		}
		size.WidthMM = in.WidthMM
		size.HeightMM = in.HeightMM
	}
	size.Label = in.Label
	if err := s.repo.Update(ctx, size); err != nil {
		return nil, err
	}
	inUse, _ := s.repo.IsReferenced(ctx, id)
	resp := s.toResponse(size, inUse)
	return &resp, nil
}

func (s *SizeService) Delete(ctx context.Context, id uuid.UUID) error {
	inUse, err := s.repo.IsReferenced(ctx, id)
	if err != nil {
		return err
	}
	if inUse {
		return ErrSizeInUse
	}
	return s.repo.Delete(ctx, id)
}
