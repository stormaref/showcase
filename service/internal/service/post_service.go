package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"github.com/stormaref/showcase/service/internal/repository"
	"github.com/stormaref/showcase/service/internal/storage"
	"github.com/stormaref/showcase/service/internal/util"
	"gorm.io/gorm"
)

type PostService struct {
	repo  *repository.PostRepository
	store storage.ObjectStore
	audit *AuditService
}

func NewPostService(repo *repository.PostRepository, store storage.ObjectStore, audit *AuditService) *PostService {
	return &PostService{repo: repo, store: store, audit: audit}
}

type PostTranslationInput struct {
	Title           string `json:"title"`
	Excerpt         string `json:"excerpt"`
	ContentMD       string `json:"content_md"`
	Slug            string `json:"slug"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
}

type PostInput struct {
	Status       string                          `json:"status"`
	OGImageKey   string                          `json:"og_image_key"`
	Translations map[string]PostTranslationInput `json:"translations"`
}

type PostResponse struct {
	ID              uuid.UUID `json:"id"`
	Slug            string    `json:"slug"`
	Title           string    `json:"title"`
	Excerpt         string    `json:"excerpt"`
	ContentMD       string    `json:"content_md,omitempty"`
	ContentHTML     string    `json:"content_html,omitempty"`
	Status          string    `json:"status"`
	Locale          string    `json:"locale,omitempty"`
	MetaTitle       string    `json:"meta_title"`
	MetaDescription string    `json:"meta_description"`
	OGImageKey      string    `json:"og_image_key,omitempty"`
	ImageURL        string    `json:"og_image_url,omitempty"`
	AuthorID        uuid.UUID `json:"author_id,omitempty"`
	PublishedAt     *time.Time `json:"published_at,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	HasFA           bool      `json:"has_fa,omitempty"`
	Translations    map[string]PostTranslationInput `json:"translations,omitempty"`
}

type AdminPostResponse struct {
	PostResponse
	Translations map[string]PostTranslationInput `json:"translations"`
}

func pickTranslation(post *model.BlogPost, locale string) *model.BlogPostTranslation {
	for i := range post.Translations {
		if post.Translations[i].Locale == locale {
			return &post.Translations[i]
		}
	}
	if locale != model.LocaleEN {
		for i := range post.Translations {
			if post.Translations[i].Locale == model.LocaleEN {
				return &post.Translations[i]
			}
		}
	}
	if len(post.Translations) > 0 {
		return &post.Translations[0]
	}
	return nil
}

func (s *PostService) buildResponse(post *model.BlogPost, tr *model.BlogPostTranslation, resolvedLocale string) PostResponse {
	resp := PostResponse{
		ID:          post.ID,
		Status:      string(post.Status),
		OGImageKey:  post.OGImageKey,
		AuthorID:    post.AuthorID,
		PublishedAt: post.PublishedAt,
		CreatedAt:   post.CreatedAt,
		UpdatedAt:   post.UpdatedAt,
		Locale:      resolvedLocale,
	}
	if tr != nil {
		resp.Slug = tr.Slug
		resp.Title = tr.Title
		resp.Excerpt = tr.Excerpt
		resp.ContentMD = tr.ContentMD
		resp.MetaTitle = tr.MetaTitle
		resp.MetaDescription = tr.MetaDescription
		if html, err := util.MarkdownToSafeHTML(tr.ContentMD); err == nil {
			resp.ContentHTML = html
		}
	}
	if post.OGImageKey != "" {
		resp.ImageURL = s.store.PublicURL(post.OGImageKey)
	}
	return resp
}

func (s *PostService) translationsMap(post *model.BlogPost) map[string]PostTranslationInput {
	out := make(map[string]PostTranslationInput)
	for _, tr := range post.Translations {
		out[tr.Locale] = PostTranslationInput{
			Title:           tr.Title,
			Excerpt:         tr.Excerpt,
			ContentMD:       tr.ContentMD,
			Slug:            tr.Slug,
			MetaTitle:       tr.MetaTitle,
			MetaDescription: tr.MetaDescription,
		}
	}
	return out
}

func (s *PostService) hasFA(ctx context.Context, postID uuid.UUID) bool {
	ok, _ := s.repo.HasTranslation(ctx, postID, model.LocaleFA)
	return ok
}

func (s *PostService) ListPublic(ctx context.Context, locale string, page, limit int) ([]PostResponse, int64, error) {
	posts, total, err := s.repo.ListPublished(ctx, locale, limit, (page-1)*limit)
	if err != nil {
		return nil, 0, err
	}
	out := make([]PostResponse, 0, len(posts))
	for i := range posts {
		tr := pickTranslation(&posts[i], locale)
		if tr == nil {
			continue
		}
		resolved := locale
		if tr.Locale != locale {
			resolved = tr.Locale
		}
		out = append(out, s.buildResponse(&posts[i], tr, resolved))
	}
	return out, total, nil
}

func (s *PostService) GetPublicBySlug(ctx context.Context, slug, locale string) (*PostResponse, error) {
	post, err := s.repo.FindPublishedBySlug(ctx, slug, locale)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) && locale != model.LocaleEN {
			post, err = s.repo.FindPublishedBySlug(ctx, slug, model.LocaleEN)
			if err != nil {
				return nil, err
			}
			locale = model.LocaleEN
		} else {
			return nil, err
		}
	}
	tr := pickTranslation(post, locale)
	if tr == nil {
		return nil, gorm.ErrRecordNotFound
	}
	resolved := locale
	if tr.Locale != locale {
		resolved = tr.Locale
	}
	r := s.buildResponse(post, tr, resolved)
	return &r, nil
}

func (s *PostService) ListAdmin(ctx context.Context, page, limit int) ([]PostResponse, int64, error) {
	posts, total, err := s.repo.ListAll(ctx, limit, (page-1)*limit)
	if err != nil {
		return nil, 0, err
	}
	out := make([]PostResponse, len(posts))
	for i := range posts {
		tr := pickTranslation(&posts[i], model.LocaleEN)
		resp := s.buildResponse(&posts[i], tr, model.LocaleEN)
		resp.HasFA = s.hasFA(ctx, posts[i].ID)
		out[i] = resp
	}
	return out, total, nil
}

func (s *PostService) GetAdmin(ctx context.Context, id uuid.UUID) (*AdminPostResponse, error) {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	tr := pickTranslation(post, model.LocaleEN)
	resp := AdminPostResponse{
		PostResponse: s.buildResponse(post, tr, model.LocaleEN),
		Translations: s.translationsMap(post),
	}
	resp.HasFA = s.hasFA(ctx, post.ID)
	return &resp, nil
}

func (s *PostService) resolveSlug(ctx context.Context, postID uuid.UUID, locale string, in PostTranslationInput) (string, error) {
	slug := in.Slug
	if slug == "" && in.Title != "" {
		slug = util.Slugify(in.Title)
	}
	if slug == "" {
		return "", errors.New("slug required")
	}
	existing, err := s.repo.FindTranslationBySlug(ctx, slug, locale)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", err
	}
	if existing != nil && existing.PostID != postID {
		slug = slug + "-" + uuid.New().String()[:8]
	}
	return slug, nil
}

func (s *PostService) upsertTranslations(ctx context.Context, postID uuid.UUID, translations map[string]PostTranslationInput) error {
	for loc, in := range translations {
		if in.Title == "" && in.ContentMD == "" {
			continue
		}
		if loc != model.LocaleEN && loc != model.LocaleFA {
			continue
		}
		slug, err := s.resolveSlug(ctx, postID, loc, in)
		if err != nil {
			return err
		}
		tr := &model.BlogPostTranslation{
			PostID:          postID,
			Locale:          loc,
			Slug:            slug,
			Title:           in.Title,
			Excerpt:         in.Excerpt,
			ContentMD:       in.ContentMD,
			MetaTitle:       in.MetaTitle,
			MetaDescription: in.MetaDescription,
		}
		if err := s.repo.UpsertTranslation(ctx, tr); err != nil {
			return err
		}
	}
	return nil
}

func (s *PostService) Create(ctx context.Context, actorID uuid.UUID, in PostInput) (*AdminPostResponse, error) {
	status := model.PostStatus(in.Status)
	if status == "" {
		status = model.StatusDraft
	}
	post := &model.BlogPost{
		Status:     status,
		OGImageKey: in.OGImageKey,
		AuthorID:   actorID,
	}
	if status == model.StatusPublished {
		now := time.Now()
		post.PublishedAt = &now
	}
	if err := s.repo.Create(ctx, post); err != nil {
		return nil, err
	}
	translations := in.Translations
	if len(translations) == 0 {
		translations = map[string]PostTranslationInput{model.LocaleEN: {}}
	}
	if err := s.upsertTranslations(ctx, post.ID, translations); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, actorID, "post.create", "blog_post", post.ID, nil)
	return s.GetAdmin(ctx, post.ID)
}

func (s *PostService) Update(ctx context.Context, actorID, id uuid.UUID, in PostInput) (*AdminPostResponse, error) {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if in.OGImageKey != "" {
		post.OGImageKey = in.OGImageKey
	}
	if in.Status != "" {
		newStatus := model.PostStatus(in.Status)
		if newStatus == model.StatusPublished && post.Status != model.StatusPublished {
			now := time.Now()
			post.PublishedAt = &now
		}
		post.Status = newStatus
	}
	if err := s.repo.Update(ctx, post); err != nil {
		return nil, err
	}
	if len(in.Translations) > 0 {
		if err := s.upsertTranslations(ctx, post.ID, in.Translations); err != nil {
			return nil, err
		}
	}
	s.audit.Log(ctx, actorID, "post.update", "blog_post", post.ID, nil)
	return s.GetAdmin(ctx, post.ID)
}

func (s *PostService) Delete(ctx context.Context, actorID, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	s.audit.Log(ctx, actorID, "post.delete", "blog_post", id, nil)
	return nil
}

// LegacyPostInput supports old admin clients sending flat fields (English only).
type LegacyPostInput struct {
	Title           string `json:"title"`
	Excerpt         string `json:"excerpt"`
	ContentMD       string `json:"content_md"`
	Slug            string `json:"slug"`
	Status          string `json:"status"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OGImageKey      string `json:"og_image_key"`
}

func LegacyToPostInput(legacy LegacyPostInput) PostInput {
	return PostInput{
		Status:     legacy.Status,
		OGImageKey: legacy.OGImageKey,
		Translations: map[string]PostTranslationInput{
			model.LocaleEN: {
				Title:           legacy.Title,
				Excerpt:         legacy.Excerpt,
				ContentMD:       legacy.ContentMD,
				Slug:            legacy.Slug,
				MetaTitle:       legacy.MetaTitle,
				MetaDescription: legacy.MetaDescription,
			},
		},
	}
}
