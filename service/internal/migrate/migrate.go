package migrate

import (
	"log/slog"

	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

func Run(db *gorm.DB) error {
	if err := migrateBlogPosts(db); err != nil {
		return err
	}
	if err := migrateGalleryItems(db); err != nil {
		return err
	}
	return nil
}

func migrateBlogPosts(db *gorm.DB) error {
	m := db.Migrator()
	if !m.HasTable("blog_posts") || !m.HasColumn("blog_posts", "title") {
		return nil
	}
	var count int64
	if err := db.Model(&model.BlogPostTranslation{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return dropLegacyBlogColumns(db)
	}

	var legacy []model.LegacyBlogPost
	if err := db.Model(&model.LegacyBlogPost{}).Find(&legacy).Error; err != nil {
		return err
	}
	for _, row := range legacy {
		post := model.BlogPost{
			ID:          row.ID,
			Status:      row.Status,
			OGImageKey:  row.OGImageKey,
			AuthorID:    row.AuthorID,
			PublishedAt: row.PublishedAt,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		}
		if err := db.Save(&post).Error; err != nil {
			return err
		}
		tr := model.BlogPostTranslation{
			PostID:          row.ID,
			Locale:          model.LocaleEN,
			Slug:            row.Slug,
			Title:           row.Title,
			Excerpt:         row.Excerpt,
			ContentMD:       row.ContentMD,
			MetaTitle:       row.MetaTitle,
			MetaDescription: row.MetaDescription,
		}
		if err := db.Create(&tr).Error; err != nil {
			return err
		}
	}
	slog.Info("migrated blog posts to translation tables", "count", len(legacy))
	return dropLegacyBlogColumns(db)
}

func dropLegacyBlogColumns(db *gorm.DB) error {
	m := db.Migrator()
	cols := []string{"slug", "title", "excerpt", "content_md", "meta_title", "meta_description"}
	for _, col := range cols {
		if m.HasColumn(&model.BlogPost{}, col) {
			if err := m.DropColumn(&model.BlogPost{}, col); err != nil {
				return err
			}
		}
	}
	return nil
}

func migrateGalleryItems(db *gorm.DB) error {
	m := db.Migrator()
	if !m.HasTable("gallery_items") || !m.HasColumn("gallery_items", "title") {
		return nil
	}
	var count int64
	if err := db.Model(&model.GalleryItemTranslation{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return dropLegacyGalleryColumns(db)
	}

	var legacy []model.LegacyGalleryItem
	if err := db.Model(&model.LegacyGalleryItem{}).Find(&legacy).Error; err != nil {
		return err
	}
	for _, row := range legacy {
		item := model.GalleryItem{
			ID:             row.ID,
			ObjectKey:      row.ObjectKey,
			ThumbObjectKey: row.ThumbObjectKey,
			SortOrder:      row.SortOrder,
			IsPublished:    row.IsPublished,
			CreatedAt:      row.CreatedAt,
			UpdatedAt:      row.UpdatedAt,
		}
		if err := db.Save(&item).Error; err != nil {
			return err
		}
		tr := model.GalleryItemTranslation{
			ItemID:  row.ID,
			Locale:  model.LocaleEN,
			Title:   row.Title,
			Caption: row.Caption,
			AltText: row.AltText,
		}
		if err := db.Create(&tr).Error; err != nil {
			return err
		}
	}
	slog.Info("migrated gallery items to translation tables", "count", len(legacy))
	return dropLegacyGalleryColumns(db)
}

func dropLegacyGalleryColumns(db *gorm.DB) error {
	m := db.Migrator()
	cols := []string{"title", "caption", "alt_text"}
	for _, col := range cols {
		if m.HasColumn(&model.GalleryItem{}, col) {
			if err := m.DropColumn(&model.GalleryItem{}, col); err != nil {
				return err
			}
		}
	}
	return nil
}
