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

type PostInput struct {
	Title           string `json:"title" binding:"required,max=500"`
	Excerpt         string `json:"excerpt"`
	ContentMD       string `json:"content_md" binding:"required"`
	Slug            string `json:"slug"`
	Status          string `json:"status"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OGImageKey      string `json:"og_image_key"`
}

type PostResponse struct {
	model.BlogPost
	ContentHTML string `json:"content_html,omitempty"`
	ImageURL    string `json:"og_image_url,omitempty"`
}

func (s *PostService) enrich(post *model.BlogPost) PostResponse {
	resp := PostResponse{BlogPost: *post}
	if html, err := util.MarkdownToSafeHTML(post.ContentMD); err == nil {
		resp.ContentHTML = html
	}
	if post.OGImageKey != "" {
		resp.ImageURL = s.store.PublicURL(post.OGImageKey)
	}
	return resp
}

func (s *PostService) ListPublic(ctx context.Context, page, limit int) ([]PostResponse, int64, error) {
	posts, total, err := s.repo.ListPublished(ctx, limit, (page-1)*limit)
	if err != nil {
		return nil, 0, err
	}
	out := make([]PostResponse, len(posts))
	for i := range posts {
		out[i] = s.enrich(&posts[i])
	}
	return out, total, nil
}

func (s *PostService) GetPublicBySlug(ctx context.Context, slug string) (*PostResponse, error) {
	post, err := s.repo.FindPublishedBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	r := s.enrich(post)
	return &r, nil
}

func (s *PostService) ListAdmin(ctx context.Context, page, limit int) ([]model.BlogPost, int64, error) {
	return s.repo.ListAll(ctx, limit, (page-1)*limit)
}

func (s *PostService) GetAdmin(ctx context.Context, id uuid.UUID) (*model.BlogPost, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *PostService) Create(ctx context.Context, actorID uuid.UUID, in PostInput) (*model.BlogPost, error) {
	slug := in.Slug
	if slug == "" {
		slug = util.Slugify(in.Title)
	}
	if existing, err := s.repo.FindBySlug(ctx, slug); err == nil && existing != nil {
		slug = slug + "-" + uuid.New().String()[:8]
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	status := model.PostStatus(in.Status)
	if status == "" {
		status = model.StatusDraft
	}
	post := &model.BlogPost{
		Slug:            slug,
		Title:           in.Title,
		Excerpt:         in.Excerpt,
		ContentMD:       in.ContentMD,
		Status:          status,
		MetaTitle:       in.MetaTitle,
		MetaDescription: in.MetaDescription,
		OGImageKey:      in.OGImageKey,
		AuthorID:        actorID,
	}
	if status == model.StatusPublished {
		now := time.Now()
		post.PublishedAt = &now
	}
	if err := s.repo.Create(ctx, post); err != nil {
		return nil, err
	}
	s.audit.Log(ctx, actorID, "post.create", "blog_post", post.ID, map[string]interface{}{"slug": slug})
	return post, nil
}

func (s *PostService) Update(ctx context.Context, actorID, id uuid.UUID, in PostInput) (*model.BlogPost, error) {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if in.Title != "" {
		post.Title = in.Title
	}
	if in.Excerpt != "" || in.Excerpt == "" {
		post.Excerpt = in.Excerpt
	}
	if in.ContentMD != "" {
		post.ContentMD = in.ContentMD
	}
	if in.Slug != "" {
		post.Slug = in.Slug
	}
	if in.MetaTitle != "" {
		post.MetaTitle = in.MetaTitle
	}
	if in.MetaDescription != "" {
		post.MetaDescription = in.MetaDescription
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
	s.audit.Log(ctx, actorID, "post.update", "blog_post", post.ID, nil)
	return post, nil
}

func (s *PostService) Delete(ctx context.Context, actorID, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	s.audit.Log(ctx, actorID, "post.delete", "blog_post", id, nil)
	return nil
}
