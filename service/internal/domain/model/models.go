package model

import (
	"strconv"
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
	Status      PostStatus `gorm:"size:20;index:idx_posts_status_published,priority:1;not null;default:draft" json:"status"`
	OGImageKey  string     `gorm:"size:500" json:"og_image_key"`
	AuthorID    uuid.UUID  `gorm:"type:uuid;index" json:"author_id"`
	PublishedAt *time.Time `gorm:"index:idx_posts_status_published,priority:2" json:"published_at"`
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

type Design struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SortOrder   int       `gorm:"index:idx_designs_published_sort,priority:2;default:0" json:"sort_order"`
	IsPublished bool      `gorm:"index:idx_designs_published_sort,priority:1;default:false" json:"is_published"`
	CreatedAt   time.Time `gorm:"index:idx_designs_published_sort,priority:3" json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Translations []DesignTranslation `gorm:"foreignKey:DesignID" json:"translations,omitempty"`
	Sizes        []TileSize          `gorm:"many2many:design_sizes;joinReferences:size_id" json:"sizes,omitempty"`
	Images       []DesignImage       `gorm:"foreignKey:DesignID" json:"images,omitempty"`
}

func (d *Design) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

type DesignTranslation struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	DesignID  uuid.UUID `gorm:"type:uuid;index:idx_design_locale,unique;not null" json:"design_id"`
	Locale    string    `gorm:"size:5;index:idx_design_locale,unique;not null" json:"locale"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Caption   string    `gorm:"type:text" json:"caption"`
	AltText   string    `gorm:"size:500" json:"alt_text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (t *DesignTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type TileSize struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	WidthMM   int       `gorm:"not null;uniqueIndex:idx_tile_size_dims" json:"width_mm"`
	HeightMM  int       `gorm:"not null;uniqueIndex:idx_tile_size_dims" json:"height_mm"`
	Label     string    `gorm:"size:100" json:"label"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *TileSize) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (s TileSize) DisplayLabel() string {
	if s.Label != "" {
		return s.Label
	}
	return FormatTileSizeLabel(s.WidthMM, s.HeightMM)
}

func FormatTileSizeLabel(widthMM, heightMM int) string {
	w := widthMM / 10
	h := heightMM / 10
	if widthMM%10 != 0 || heightMM%10 != 0 {
		return formatDim(widthMM) + "×" + formatDim(heightMM) + " mm"
	}
	return formatDim(w) + "×" + formatDim(h) + " cm"
}

func formatDim(v int) string {
	return strconv.Itoa(v)
}

type DesignSize struct {
	DesignID uuid.UUID `gorm:"type:uuid;primaryKey" json:"design_id"`
	SizeID   uuid.UUID `gorm:"type:uuid;primaryKey;index:idx_design_sizes_size_id" json:"size_id"`
}

type DesignImage struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	DesignID       uuid.UUID  `gorm:"type:uuid;index:idx_design_images_design_sort,priority:1;not null" json:"design_id"`
	SizeID         *uuid.UUID `gorm:"type:uuid;index" json:"size_id"`
	ObjectKey      string     `gorm:"size:500;not null" json:"object_key"`
	ThumbObjectKey string     `gorm:"size:500" json:"thumb_object_key"`
	SortOrder      int        `gorm:"default:0;index:idx_design_images_design_sort,priority:2" json:"sort_order"`
	CreatedAt      time.Time  `gorm:"index:idx_design_images_design_sort,priority:3" json:"created_at"`
}

func (i *DesignImage) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
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

type BrandInfoTranslation struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Locale       string    `gorm:"size:5;uniqueIndex;not null" json:"locale"`
	Name         string    `gorm:"size:255;not null" json:"name"`
	Tagline      string    `gorm:"size:500" json:"tagline"`
	About        string    `gorm:"type:text" json:"about"`
	AddressLine1 string    `gorm:"size:255" json:"address_line_1"`
	AddressLine2 string    `gorm:"size:255" json:"address_line_2"`
	AddressLine3 string    `gorm:"size:255" json:"address_line_3"`
	Phone        string    `gorm:"size:50" json:"phone"`
	Email        string    `gorm:"size:255" json:"email"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (b *BrandInfoTranslation) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
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

// LegacyDesignWithKeys is used during migration when object_key columns still exist on designs.
type LegacyDesignWithKeys struct {
	ID             uuid.UUID
	ObjectKey      string
	ThumbObjectKey string
}

func (LegacyDesignWithKeys) TableName() string { return "designs" }
