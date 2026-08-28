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

type objectStore interface {
	Size(ctx context.Context, object string) (int64, error)
	Download(ctx context.Context, object string) ([]byte, error)
	Upload(ctx context.Context, object string, contentType string, data []byte) error
}

type gcsStore struct {
	bucket *storage.BucketHandle
}

func (store *gcsStore) Size(ctx context.Context, object string) (int64, error) {
	attrs, err := store.bucket.Object(object).Attrs(ctx)
	if errors.Is(err, storage.ErrObjectNotExist) {
		return 0, errObjectNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("stat %s: %w", object, err)
	}
	return attrs.Size, nil
}

func (store *gcsStore) Download(ctx context.Context, object string) ([]byte, error) {
	reader, err := store.bucket.Object(object).NewReader(ctx)
	if errors.Is(err, storage.ErrObjectNotExist) {
		return nil, errObjectNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", object, err)
	}
	defer reader.Close()
	data, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", object, err)
	}
	return data, nil
}

func (store *gcsStore) Upload(ctx context.Context, object string, contentType string, data []byte) error {
	writer := store.bucket.Object(object).NewWriter(ctx)
	writer.ContentType = contentType
	if _, err := writer.Write(data); err != nil {
		writer.Close()
		return fmt.Errorf("write %s: %w", object, err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close %s: %w", object, err)
	}
	return nil
}
