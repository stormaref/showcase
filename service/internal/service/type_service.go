package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
)

var ErrTypeInUse = errors.New("type in use")

type TypeService struct {
	repo *repository.TypeRepository
}

func NewTypeService(repo *repository.TypeRepository) *TypeService {
	return &TypeService{repo: repo}
}

type TypeTranslationInput struct {
	Name string `json:"name"`
}

type TypeInput struct {
	SortOrder    int                             `json:"sort_order"`
	Translations map[string]TypeTranslationInput `json:"translations"`
}

type TypeResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	SortOrder int       `json:"sort_order"`
	InUse     bool      `json:"in_use,omitempty"`
}

type AdminTypeResponse struct {
	TypeResponse
	Translations map[string]TypeTranslationInput `json:"translations"`
}

func pickTypeTranslation(t *model.DesignType, locale string) *model.DesignTypeTranslation {
	for i := range t.Translations {
		if t.Translations[i].Locale == locale {
			return &t.Translations[i]
		}
	}
	if locale != model.LocaleEN {
		for i := range t.Translations {
			if t.Translations[i].Locale == model.LocaleEN {
				return &t.Translations[i]
			}
		}
	}
	if len(t.Translations) > 0 {
		return &t.Translations[0]
	}
	return nil
}

func (s *TypeService) translationsMap(t *model.DesignType) map[string]TypeTranslationInput {
	out := make(map[string]TypeTranslationInput)
	for _, tr := range t.Translations {
		out[tr.Locale] = TypeTranslationInput{Name: tr.Name}
	}
	return out
}

func (s *TypeService) toAdminResponse(t *model.DesignType, inUse bool) AdminTypeResponse {
	tr := pickTypeTranslation(t, model.LocaleEN)
	name := ""
	if tr != nil {
		name = tr.Name
	}
	return AdminTypeResponse{
		TypeResponse: TypeResponse{
			ID:        t.ID,
			Name:      name,
			SortOrder: t.SortOrder,
			InUse:     inUse,
		},
		Translations: s.translationsMap(t),
	}
}

func (s *TypeService) toResponse(t *model.DesignType, locale string) TypeResponse {
	tr := pickTypeTranslation(t, locale)
	name := ""
	if tr != nil {
		name = tr.Name
	}
	return TypeResponse{
		ID:        t.ID,
		Name:      name,
		SortOrder: t.SortOrder,
	}
}

func (s *TypeService) validateInput(in TypeInput) error {
	en, ok := in.Translations[model.LocaleEN]
	if !ok || en.Name == "" {
		return errors.New("english name is required")
	}
	return nil
}

func (s *TypeService) upsertTranslations(ctx context.Context, typeID uuid.UUID, translations map[string]TypeTranslationInput) error {
	for loc, in := range translations {
		if in.Name == "" {
			continue
		}
		if loc != model.LocaleEN && loc != model.LocaleFA {
			continue
		}
		tr := &model.DesignTypeTranslation{
			TypeID: typeID,
			Locale: loc,
			Name:   in.Name,
		}
		if err := s.repo.UpsertTranslation(ctx, tr); err != nil {
			return err
		}
	}
	return nil
}

func (s *TypeService) List(ctx context.Context) ([]AdminTypeResponse, error) {
	types, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]AdminTypeResponse, len(types))
	for i := range types {
		inUse, _ := s.repo.IsReferenced(ctx, types[i].ID)
		out[i] = s.toAdminResponse(&types[i], inUse)
	}
	return out, nil
}

func (s *TypeService) Get(ctx context.Context, id uuid.UUID) (*AdminTypeResponse, error) {
	t, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	inUse, _ := s.repo.IsReferenced(ctx, id)
	resp := s.toAdminResponse(t, inUse)
	return &resp, nil
}

func (s *TypeService) Create(ctx context.Context, in TypeInput) (*AdminTypeResponse, error) {
	if err := s.validateInput(in); err != nil {
		return nil, err
	}
	t := &model.DesignType{SortOrder: in.SortOrder}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	if err := s.upsertTranslations(ctx, t.ID, in.Translations); err != nil {
		return nil, err
	}
	return s.Get(ctx, t.ID)
}

func (s *TypeService) Update(ctx context.Context, id uuid.UUID, in TypeInput) (*AdminTypeResponse, error) {
	if err := s.validateInput(in); err != nil {
		return nil, err
	}
	t, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	t.SortOrder = in.SortOrder
	if err := s.repo.Update(ctx, t); err != nil {
		return nil, err
	}
	if err := s.upsertTranslations(ctx, t.ID, in.Translations); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *TypeService) Delete(ctx context.Context, id uuid.UUID) error {
	inUse, err := s.repo.IsReferenced(ctx, id)
	if err != nil {
		return err
	}
	if inUse {
		return ErrTypeInUse
	}
	return s.repo.Delete(ctx, id)
}

func typeResponses(types []model.DesignType, locale string) []TypeResponse {
	out := make([]TypeResponse, len(types))
	for i := range types {
		out[i] = TypeResponse{
			ID:        types[i].ID,
			SortOrder: types[i].SortOrder,
		}
		tr := pickTypeTranslation(&types[i], locale)
		if tr != nil {
			out[i].Name = tr.Name
		}
	}
	return out
}
