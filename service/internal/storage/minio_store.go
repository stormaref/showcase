package storage

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/stormaref/showcase/service/internal/config"
)

type MinIOStore struct {
	client *minio.Client
	bucket string
	base   string
}

func NewMinIOStore(cfg *config.Config) (*MinIOStore, error) {
	client, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, err
	}
	return &MinIOStore{
		client: client,
		bucket: cfg.MinioBucket,
		base:   cfg.MediaPublicBaseURL,
	}, nil
}

func (s *MinIOStore) EnsureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if !exists {
		return s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{})
	}
	return nil
}

func (s *MinIOStore) Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{ContentType: contentType})
	return err
}

func (s *MinIOStore) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

func (s *MinIOStore) PublicURL(key string) string {
	key = strings.TrimPrefix(key, "/")
	return fmt.Sprintf("%s/%s", strings.TrimRight(s.base, "/"), key)
}

func (s *MinIOStore) Ping(ctx context.Context) error {
	_, err := s.client.ListBuckets(ctx)
	return err
}
