package main

import (
	"context"
	"errors"
	"fmt"
	"io"

	"cloud.google.com/go/storage"
)

// errObjectNotFound normalizes "missing object" across the real GCS store and
// test fakes so the handler can map it to a 404.
var errObjectNotFound = errors.New("object not found")

// objectTooLargeError reports an object whose size exceeds the caller's
// limit, before any of its content is read.
type objectTooLargeError struct {
	size     int64
	maxBytes int64
}

func (err *objectTooLargeError) Error() string {
	return fmt.Sprintf("object is %d bytes, max is %d", err.size, err.maxBytes)
}

type objectStore interface {
	Download(ctx context.Context, object string, maxBytes int64) ([]byte, error)
	Upload(ctx context.Context, object string, contentType string, data []byte) error
}

type gcsStore struct {
	bucket *storage.BucketHandle
}

func (store *gcsStore) Download(ctx context.Context, object string, maxBytes int64) ([]byte, error) {
	reader, err := store.bucket.Object(object).NewReader(ctx)
	if errors.Is(err, storage.ErrObjectNotExist) {
		return nil, errObjectNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", object, err)
	}
	defer reader.Close()
	// The reader's own attrs carry the size, so no separate stat RPC is
	// needed to enforce the limit before buffering the object.
	if reader.Attrs.Size > maxBytes {
		return nil, &objectTooLargeError{size: reader.Attrs.Size, maxBytes: maxBytes}
	}
	data, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", object, err)
	}
	return data, nil
}

func (store *gcsStore) Upload(ctx context.Context, object string, contentType string, data []byte) error {
	writer := store.bucket.Object(object).NewWriter(ctx)
	writer.ContentType = contentType
	// The payload is fully in memory and small (a page PNG); ChunkSize 0
	// uploads it in a single request instead of staging a 16MiB resumable
	// buffer.
	writer.ChunkSize = 0
	if _, err := writer.Write(data); err != nil {
		writer.Close()
		return fmt.Errorf("write %s: %w", object, err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close %s: %w", object, err)
	}
	return nil
}
