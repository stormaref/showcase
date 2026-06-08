package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
)

var ErrFinishInUse = errors.New("finish in use")

type FinishService struct {
	repo *repository.FinishRepository
}

func NewFinishService(repo *repository.FinishRepository) *FinishService {
	return &FinishService{repo: repo}
}

type FinishTranslationInput struct {
	Name string `json:"name"`
}

type FinishInput struct {
	SortOrder    int                              `json:"sort_order"`
	Translations map[string]FinishTranslationInput `json:"translations"`
}

type FinishResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	SortOrder int       `json:"sort_order"`
	InUse     bool      `json:"in_use,omitempty"`
}

type AdminFinishResponse struct {
	FinishResponse
	Translations map[string]FinishTranslationInput `json:"translations"`
}

func pickFinishTranslation(f *model.SurfaceFinish, locale string) *model.SurfaceFinishTranslation {
	for i := range f.Translations {
		if f.Translations[i].Locale == locale {
			return &f.Translations[i]
		}
	}
	if locale != model.LocaleEN {
		for i := range f.Translations {
			if f.Translations[i].Locale == model.LocaleEN {
				return &f.Translations[i]
			}
		}
	}
	if len(f.Translations) > 0 {
		return &f.Translations[0]
	}
	return nil
}

func (s *FinishService) translationsMap(f *model.SurfaceFinish) map[string]FinishTranslationInput {
	out := make(map[string]FinishTranslationInput)
	for _, tr := range f.Translations {
		out[tr.Locale] = FinishTranslationInput{Name: tr.Name}
	}
	return out
}

func (s *FinishService) toAdminResponse(f *model.SurfaceFinish, inUse bool) AdminFinishResponse {
	tr := pickFinishTranslation(f, model.LocaleEN)
	name := ""
	if tr != nil {
		name = tr.Name
	}
	return AdminFinishResponse{
		FinishResponse: FinishResponse{
			ID:        f.ID,
			Name:      name,
			SortOrder: f.SortOrder,
			InUse:     inUse,
		},
		Translations: s.translationsMap(f),
	}
}

func (s *FinishService) validateInput(in FinishInput) error {
	en, ok := in.Translations[model.LocaleEN]
	if !ok || en.Name == "" {
		return errors.New("english name is required")
	}
	return nil
}

func (s *FinishService) upsertTranslations(ctx context.Context, finishID uuid.UUID, translations map[string]FinishTranslationInput) error {
	for loc, in := range translations {
		if in.Name == "" {
			continue
		}
		if loc != model.LocaleEN && loc != model.LocaleFA {
			continue
		}
		tr := &model.SurfaceFinishTranslation{
			FinishID: finishID,
			Locale:   loc,
			Name:     in.Name,
		}
		if err := s.repo.UpsertTranslation(ctx, tr); err != nil {
			return err
		}
	}
	return nil
}

func (s *FinishService) List(ctx context.Context) ([]AdminFinishResponse, error) {
	finishes, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]AdminFinishResponse, len(finishes))
	for i := range finishes {
		inUse, _ := s.repo.IsReferenced(ctx, finishes[i].ID)
		out[i] = s.toAdminResponse(&finishes[i], inUse)
	}
	return out, nil
}

func (s *FinishService) Get(ctx context.Context, id uuid.UUID) (*AdminFinishResponse, error) {
	f, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	inUse, _ := s.repo.IsReferenced(ctx, id)
	resp := s.toAdminResponse(f, inUse)
	return &resp, nil
}

func (s *FinishService) Create(ctx context.Context, in FinishInput) (*AdminFinishResponse, error) {
	if err := s.validateInput(in); err != nil {
		return nil, err
	}
	f := &model.SurfaceFinish{SortOrder: in.SortOrder}
	if err := s.repo.Create(ctx, f); err != nil {
		return nil, err
	}
	if err := s.upsertTranslations(ctx, f.ID, in.Translations); err != nil {
		return nil, err
	}
	return s.Get(ctx, f.ID)
}

func (s *FinishService) Update(ctx context.Context, id uuid.UUID, in FinishInput) (*AdminFinishResponse, error) {
	if err := s.validateInput(in); err != nil {
		return nil, err
	}
	f, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	f.SortOrder = in.SortOrder
	if err := s.repo.Update(ctx, f); err != nil {
		return nil, err
	}
	if err := s.upsertTranslations(ctx, f.ID, in.Translations); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *FinishService) Delete(ctx context.Context, id uuid.UUID) error {
	inUse, err := s.repo.IsReferenced(ctx, id)
	if err != nil {
		return err
	}
	if inUse {
		return ErrFinishInUse
	}
	return s.repo.Delete(ctx, id)
}

func finishResponses(finishes []model.SurfaceFinish, locale string) []FinishResponse {
	out := make([]FinishResponse, len(finishes))
	for i := range finishes {
		out[i] = FinishResponse{
			ID:        finishes[i].ID,
			SortOrder: finishes[i].SortOrder,
		}
		tr := pickFinishTranslation(&finishes[i], locale)
		if tr != nil {
			out[i].Name = tr.Name
		}
	}
	return out
}
