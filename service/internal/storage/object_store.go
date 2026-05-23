package storage

import (
	"context"
	"io"
)

type ObjectStore interface {
	EnsureBucket(ctx context.Context) error
	Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error
	Delete(ctx context.Context, key string) error
	PublicURL(key string) string
	Ping(ctx context.Context) error
}
