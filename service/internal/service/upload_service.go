package service

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"path/filepath"
	"strings"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	"github.com/stormaref/showcase/service/internal/config"
	"github.com/stormaref/showcase/service/internal/storage"
)

var allowedTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type UploadService struct {
	cfg   *config.Config
	store storage.ObjectStore
}

func NewUploadService(cfg *config.Config, store storage.ObjectStore) *UploadService {
	return &UploadService{cfg: cfg, store: store}
}

type UploadResult struct {
	ObjectKey      string `json:"object_key"`
	ThumbObjectKey string `json:"thumb_object_key"`
	URL            string `json:"url"`
	ThumbURL       string `json:"thumb_url"`
}

func (s *UploadService) UploadImage(ctx context.Context, filename string, contentType string, r io.Reader) (*UploadResult, error) {
	ext, ok := allowedTypes[contentType]
	if !ok {
		return nil, fmt.Errorf("unsupported content type")
	}
	data, err := io.ReadAll(io.LimitReader(r, s.cfg.MaxUploadBytes+1))
	if err != nil {
		return nil, err
	}
	if int64(len(data)) > s.cfg.MaxUploadBytes {
		return nil, fmt.Errorf("file too large")
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("invalid image")
	}
	id := uuid.New().String()
	prefix := filepath.Join("uploads", id)
	origKey := prefix + "/original" + ext
	if err := s.store.Put(ctx, origKey, bytes.NewReader(data), int64(len(data)), contentType); err != nil {
		return nil, err
	}
	thumb := imaging.Resize(img, 400, 0, imaging.Lanczos)
	var thumbBuf bytes.Buffer
	if err := imaging.Encode(&thumbBuf, thumb, imaging.JPEG, imaging.JPEGQuality(85)); err != nil {
		return nil, err
	}
	thumbKey := prefix + "/thumb.jpg"
	if err := s.store.Put(ctx, thumbKey, &thumbBuf, int64(thumbBuf.Len()), "image/jpeg"); err != nil {
		return nil, err
	}
	_ = strings.TrimSuffix(filename, filepath.Ext(filename))
	return &UploadResult{
		ObjectKey:      origKey,
		ThumbObjectKey: thumbKey,
		URL:            s.store.PublicURL(origKey),
		ThumbURL:       s.store.PublicURL(thumbKey),
	}, nil
}
