package service

import (
	"context"
	"errors"
	"net/mail"
	"strings"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
)

type BrandService struct {
	repo  *repository.BrandRepository
	audit *AuditService
}

func NewBrandService(repo *repository.BrandRepository, audit *AuditService) *BrandService {
	return &BrandService{repo: repo, audit: audit}
}

type BrandInput struct {
	Name         string `json:"name"`
	Tagline      string `json:"tagline"`
	About        string `json:"about"`
	AddressLine1 string `json:"address_line_1"`
	AddressLine2 string `json:"address_line_2"`
	AddressLine3 string `json:"address_line_3"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
}

type BrandResponse struct {
	Locale       string `json:"locale"`
	Name         string `json:"name"`
	Tagline      string `json:"tagline"`
	About        string `json:"about"`
	AddressLine1 string `json:"address_line_1"`
	AddressLine2 string `json:"address_line_2"`
	AddressLine3 string `json:"address_line_3"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
}

type BrandUpdateInput struct {
	Translations map[string]BrandInput `json:"translations"`
}

func (s *BrandService) toResponse(row *model.BrandInfoTranslation) BrandResponse {
	return BrandResponse{
		Locale:       row.Locale,
		Name:         row.Name,
		Tagline:      row.Tagline,
		About:        row.About,
		AddressLine1: row.AddressLine1,
		AddressLine2: row.AddressLine2,
		AddressLine3: row.AddressLine3,
		Phone:        row.Phone,
		Email:        row.Email,
	}
}

func (s *BrandService) GetAll(ctx context.Context) (map[string]BrandResponse, error) {
	rows, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make(map[string]BrandResponse, len(rows))
	for i := range rows {
		out[rows[i].Locale] = s.toResponse(&rows[i])
	}
	return out, nil
}

func (s *BrandService) GetPublic(ctx context.Context, locale string) (*BrandResponse, error) {
	row, err := s.repo.FindByLocale(ctx, locale)
	if err != nil {
		if errors.Is(err, repository.ErrBrandNotFound) && locale != model.LocaleEN {
			return s.GetPublic(ctx, model.LocaleEN)
		}
		return nil, err
	}
	resp := s.toResponse(row)
	return &resp, nil
}

func validateBrandInput(locale string, in BrandInput) error {
	if locale == model.LocaleEN {
		if strings.TrimSpace(in.Name) == "" {
			return errors.New("english name is required")
		}
		if strings.TrimSpace(in.Email) == "" {
			return errors.New("english email is required")
		}
	}
	email := strings.TrimSpace(in.Email)
	if email != "" {
		if _, err := mail.ParseAddress(email); err != nil {
			return errors.New("invalid email address")
		}
	}
	return nil
}

func inputToModel(locale string, in BrandInput) *model.BrandInfoTranslation {
	return &model.BrandInfoTranslation{
		Locale:       locale,
		Name:         strings.TrimSpace(in.Name),
		Tagline:      strings.TrimSpace(in.Tagline),
		About:        strings.TrimSpace(in.About),
		AddressLine1: strings.TrimSpace(in.AddressLine1),
		AddressLine2: strings.TrimSpace(in.AddressLine2),
		AddressLine3: strings.TrimSpace(in.AddressLine3),
		Phone:        strings.TrimSpace(in.Phone),
		Email:        strings.TrimSpace(in.Email),
	}
}

func isEmptyBrandInput(in BrandInput) bool {
	return strings.TrimSpace(in.Name) == "" &&
		strings.TrimSpace(in.Tagline) == "" &&
		strings.TrimSpace(in.About) == "" &&
		strings.TrimSpace(in.AddressLine1) == "" &&
		strings.TrimSpace(in.AddressLine2) == "" &&
		strings.TrimSpace(in.AddressLine3) == "" &&
		strings.TrimSpace(in.Phone) == "" &&
		strings.TrimSpace(in.Email) == ""
}

func (s *BrandService) Update(ctx context.Context, actorID uuid.UUID, in BrandUpdateInput) (map[string]BrandResponse, error) {
	en, ok := in.Translations[model.LocaleEN]
	if !ok {
		return nil, errors.New("english translation is required")
	}
	if err := validateBrandInput(model.LocaleEN, en); err != nil {
		return nil, err
	}
	if err := s.repo.Upsert(ctx, inputToModel(model.LocaleEN, en)); err != nil {
		return nil, err
	}

	if fa, ok := in.Translations[model.LocaleFA]; ok {
		if err := validateBrandInput(model.LocaleFA, fa); err != nil {
			return nil, err
		}
		if !isEmptyBrandInput(fa) {
			if err := s.repo.Upsert(ctx, inputToModel(model.LocaleFA, fa)); err != nil {
				return nil, err
			}
		}
	}

	s.audit.Log(ctx, actorID, "brand_info.update", "brand_info", uuid.Nil, nil)
	return s.GetAll(ctx)
}

func (s *BrandService) SeedDefaults(ctx context.Context) error {
	count, err := s.repo.Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	defaults := []model.BrandInfoTranslation{
		{
			Locale:       model.LocaleEN,
			Name:         "Art Ceramic",
			Tagline:      "Custom tile designs for every space",
			About:        "Art Ceramic is a tile design studio specializing in patterns, glazes, and formats for kitchens, bathrooms, and architectural surfaces. Each design is available in multiple sizes — browse the catalog to find the right look for your project.",
			AddressLine1: "42 Kiln Street",
			AddressLine2: "Pottery District",
			AddressLine3: "Portland, OR 97201",
			Phone:        "+1 (555) 123-4567",
			Email:        "hello@artceramic.example",
		},
		{
			Locale:       model.LocaleFA,
			Name:         "آرت سرامیک",
			Tagline:      "طرح‌های کاشی سفارشی برای هر فضا",
			About:        "آرت سرامیک استودیوی طراحی کاشی است که در نقش‌ها، لعاب‌ها و ابعاد مختلف برای آشپزخانه، حمام و سطوح معماری تخصص دارد. هر طرح در چند سایز موجود است — کاتالوگ را مرور کنید تا طرح مناسب پروژه خود را پیدا کنید.",
			AddressLine1: "خیابان کوره ۴۲",
			AddressLine2: "محله سفالگری",
			AddressLine3: "پورتلند، OR 97201",
			Phone:        "+1 (555) 123-4567",
			Email:        "hello@artceramic.example",
		},
	}
	for i := range defaults {
		if err := s.repo.Upsert(ctx, &defaults[i]); err != nil {
			return err
		}
	}
	return nil
}
