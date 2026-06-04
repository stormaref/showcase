package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostStatus string

const (
	StatusDraft     PostStatus = "draft"
	StatusPublished PostStatus = "published"
)

const (
	LocaleEN = "en"
	LocaleFA = "fa"
)

type Admin struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type BlogPost struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Status      PostStatus `gorm:"size:20;index;not null;default:draft" json:"status"`
	OGImageKey  string     `gorm:"size:500" json:"og_image_key"`
	AuthorID    uuid.UUID  `gorm:"type:uuid;index" json:"author_id"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Translations []BlogPostTranslation `gorm:"foreignKey:PostID" json:"translations,omitempty"`
}

func (p *BlogPost) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type BlogPostTranslation struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	PostID          uuid.UUID `gorm:"type:uuid;index:idx_post_locale,unique;not null" json:"post_id"`
	Locale          string    `gorm:"size:5;index:idx_post_locale,unique;index:idx_slug_locale,unique;not null" json:"locale"`
	Slug            string    `gorm:"size:255;index:idx_slug_locale,unique;not null" json:"slug"`
	Title           string    `gorm:"size:500;not null" json:"title"`
	Excerpt         string    `gorm:"type:text" json:"excerpt"`
	ContentMD       string    `gorm:"type:text;not null" json:"content_md"`
	MetaTitle       string    `gorm:"size:255" json:"meta_title"`
	MetaDescription string    `gorm:"size:500" json:"meta_description"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (t *BlogPostTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type GalleryItem struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ObjectKey      string    `gorm:"size:500;not null" json:"object_key"`
	ThumbObjectKey string    `gorm:"size:500" json:"thumb_object_key"`
	SortOrder      int       `gorm:"index;default:0" json:"sort_order"`
	IsPublished    bool      `gorm:"index;default:false" json:"is_published"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	Translations []GalleryItemTranslation `gorm:"foreignKey:ItemID" json:"translations,omitempty"`
}

func (g *GalleryItem) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

type GalleryItemTranslation struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ItemID    uuid.UUID `gorm:"type:uuid;index:idx_item_locale,unique;not null" json:"item_id"`
	Locale    string    `gorm:"size:5;index:idx_item_locale,unique;not null" json:"locale"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Caption   string    `gorm:"type:text" json:"caption"`
	AltText   string    `gorm:"size:500" json:"alt_text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (t *GalleryItemTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type RefreshToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey"`
	AdminID   uuid.UUID  `gorm:"type:uuid;index;not null"`
	TokenHash string     `gorm:"uniqueIndex;size:128;not null"`
	ExpiresAt time.Time  `gorm:"index;not null"`
	RevokedAt *time.Time `gorm:"index"`
	CreatedAt time.Time
}

func (r *RefreshToken) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

type AuditLog struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ActorID    uuid.UUID `gorm:"type:uuid;index" json:"actor_id"`
	Action     string    `gorm:"size:100;not null" json:"action"`
	EntityType string    `gorm:"size:50;not null" json:"entity_type"`
	EntityID   uuid.UUID `gorm:"type:uuid" json:"entity_id"`
	Metadata   string    `gorm:"type:jsonb" json:"metadata"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// LegacyBlogPost is used only during one-time migration from the old schema.
type LegacyBlogPost struct {
	ID              uuid.UUID
	Slug            string
	Title           string
	Excerpt         string
	ContentMD       string
	Status          PostStatus
	MetaTitle       string
	MetaDescription string
	OGImageKey      string
	AuthorID        uuid.UUID
	PublishedAt     *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (LegacyBlogPost) TableName() string { return "blog_posts" }

// LegacyGalleryItem is used only during one-time migration from the old schema.
type LegacyGalleryItem struct {
	ID             uuid.UUID
	Title          string
	Caption        string
	AltText        string
	ObjectKey      string
	ThumbObjectKey string
	SortOrder      int
	IsPublished    bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (LegacyGalleryItem) TableName() string { return "gallery_items" }
