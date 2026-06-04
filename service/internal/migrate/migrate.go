package migrate

import (
	"log/slog"

	"github.com/stormaref/showcase/service/internal/domain/model"
	"gorm.io/gorm"
)

func RunPre(db *gorm.DB) error {
	return renameGalleryToDesigns(db)
}

func RunPost(db *gorm.DB) error {
	if err := migrateLegacyGalleryTitles(db); err != nil {
		return err
	}
	if err := migrateDesignImages(db); err != nil {
		return err
	}
	return nil
}

func Run(db *gorm.DB) error {
	if err := migrateBlogPosts(db); err != nil {
		return err
	}
	return nil
}

func renameGalleryToDesigns(db *gorm.DB) error {
	m := db.Migrator()
	if m.HasTable("gallery_items") && !m.HasTable("designs") {
		if err := m.RenameTable("gallery_items", "designs"); err != nil {
			return err
		}
		slog.Info("renamed gallery_items to designs")
	}
	if m.HasTable("gallery_item_translations") && !m.HasTable("design_translations") {
		if err := m.RenameTable("gallery_item_translations", "design_translations"); err != nil {
			return err
		}
		slog.Info("renamed gallery_item_translations to design_translations")
	}
	if m.HasTable("design_translations") && m.HasColumn("design_translations", "item_id") {
		if err := m.RenameColumn("design_translations", "item_id", "design_id"); err != nil {
			return err
		}
		slog.Info("renamed design_translations.item_id to design_id")
	}
	return nil
}

func migrateLegacyGalleryTitles(db *gorm.DB) error {
	m := db.Migrator()
	if !m.HasTable("designs") || !m.HasColumn("designs", "title") {
		return nil
	}
	var count int64
	if err := db.Model(&model.DesignTranslation{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return dropLegacyDesignColumns(db)
	}

	var legacy []model.LegacyGalleryItem
	if err := db.Table("designs").
		Select("id, title, caption, alt_text, object_key, thumb_object_key, sort_order, is_published, created_at, updated_at").
		Find(&legacy).Error; err != nil {
		return err
	}
	for _, row := range legacy {
		design := model.Design{
			ID:          row.ID,
			SortOrder:   row.SortOrder,
			IsPublished: row.IsPublished,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		}
		if err := db.Save(&design).Error; err != nil {
			return err
		}
		tr := model.DesignTranslation{
			DesignID: row.ID,
			Locale:   model.LocaleEN,
			Title:    row.Title,
			Caption:  row.Caption,
			AltText:  row.AltText,
		}
		if err := db.Create(&tr).Error; err != nil {
			return err
		}
	}
	slog.Info("migrated design title columns to translation tables", "count", len(legacy))
	return dropLegacyDesignColumns(db)
}

func dropLegacyDesignColumns(db *gorm.DB) error {
	m := db.Migrator()
	cols := []string{"title", "caption", "alt_text"}
	for _, col := range cols {
		if m.HasColumn(&model.Design{}, col) {
			if err := m.DropColumn(&model.Design{}, col); err != nil {
				return err
			}
		}
	}
	return nil
}

func migrateDesignImages(db *gorm.DB) error {
	m := db.Migrator()
	if !m.HasTable("designs") || !m.HasColumn("designs", "object_key") {
		return nil
	}

	var rows []model.LegacyDesignWithKeys
	if err := db.Model(&model.LegacyDesignWithKeys{}).
		Where("object_key <> ''").
		Find(&rows).Error; err != nil {
		return err
	}

	for _, row := range rows {
		var existing int64
		if err := db.Model(&model.DesignImage{}).Where("design_id = ?", row.ID).Count(&existing).Error; err != nil {
			return err
		}
		if existing > 0 {
			continue
		}
		img := model.DesignImage{
			DesignID:       row.ID,
			ObjectKey:      row.ObjectKey,
			ThumbObjectKey: row.ThumbObjectKey,
			SortOrder:      0,
		}
		if err := db.Create(&img).Error; err != nil {
			return err
		}
	}
	if len(rows) > 0 {
		slog.Info("migrated design object keys to design_images", "count", len(rows))
	}

	for _, col := range []string{"object_key", "thumb_object_key"} {
		if m.HasColumn(&model.Design{}, col) {
			if err := m.DropColumn(&model.Design{}, col); err != nil {
				return err
			}
		}
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
