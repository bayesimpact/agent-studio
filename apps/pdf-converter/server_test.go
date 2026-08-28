package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/bayesimpact/bayes-platform/apps/pdf-converter/internal/render"
	"github.com/bayesimpact/bayes-platform/apps/pdf-converter/internal/render/pdftest"
)

type fakeStore struct {
	objects map[string][]byte
}

func (store *fakeStore) Size(ctx context.Context, object string) (int64, error) {
	data, found := store.objects[object]
	if !found {
		return 0, errObjectNotFound
	}
	return int64(len(data)), nil
}

func (store *fakeStore) Download(ctx context.Context, object string) ([]byte, error) {
	data, found := store.objects[object]
	if !found {
		return nil, errObjectNotFound
	}
	return data, nil
}

func (store *fakeStore) Upload(ctx context.Context, object string, contentType string, data []byte) error {
	store.objects[object] = data
	return nil
}

func newTestServer(t *testing.T, store *fakeStore) http.Handler {
	t.Helper()
	renderer, err := render.NewRenderer()
	if err != nil {
		t.Fatalf("NewRenderer: %v", err)
	}
	return newServer(store, renderer, 50*1024*1024, time.Minute)
}

func postRender(handler http.Handler, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodPost, "/render-document", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder
}

func TestRenderDocumentHappyPath(t *testing.T) {
	store := &fakeStore{objects: map[string][]byte{
		"org1/proj1/doc1.pdf": pdftest.BuildPdfWithPages(2, 200),
	}}
	handler := newTestServer(t, store)
	response := postRender(handler,
		`{"sourceObject":"org1/proj1/doc1.pdf","outputPrefix":"org1/proj1/derived/doc1/","maxPages":20,"maxPixelsPerPage":4000000}`)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	var parsed struct {
		PageCount int `json:"pageCount"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &parsed); err != nil || parsed.PageCount != 2 {
		t.Fatalf("expected pageCount 2, got %s", response.Body.String())
	}
	pageOne := store.objects["org1/proj1/derived/doc1/page-1.png"]
	if !bytes.HasPrefix(pageOne, []byte{0x89, 0x50, 0x4e, 0x47}) {
		t.Fatalf("page-1.png missing or not a png")
	}
	if _, found := store.objects["org1/proj1/derived/doc1/page-2.png"]; !found {
		t.Fatalf("page-2.png missing")
	}
}

func TestRenderDocumentPageLimit(t *testing.T) {
	store := &fakeStore{objects: map[string][]byte{
		"org1/proj1/doc1.pdf": pdftest.BuildPdfWithPages(3, 200),
	}}
	response := postRender(newTestServer(t, store),
		`{"sourceObject":"org1/proj1/doc1.pdf","outputPrefix":"org1/proj1/derived/doc1/","maxPages":2,"maxPixelsPerPage":4000000}`)
	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", response.Code)
	}
}

func TestRenderDocumentSourceMissing(t *testing.T) {
	response := postRender(newTestServer(t, &fakeStore{objects: map[string][]byte{}}),
		`{"sourceObject":"org1/proj1/nope.pdf","outputPrefix":"org1/proj1/derived/nope/","maxPages":20,"maxPixelsPerPage":4000000}`)
	if response.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", response.Code)
	}
}

// sourceDeletedBetweenSizeAndDownloadStore simulates the TOCTOU window where a
// source object is removed after Size() succeeds but before Download() runs:
// Size() reports a size, while Download() returns errObjectNotFound, exactly
// as gcsStore's Download does when the underlying object is gone.
type sourceDeletedBetweenSizeAndDownloadStore struct {
	sourceSize int64
}

func (store *sourceDeletedBetweenSizeAndDownloadStore) Size(ctx context.Context, object string) (int64, error) {
	return store.sourceSize, nil
}

func (store *sourceDeletedBetweenSizeAndDownloadStore) Download(ctx context.Context, object string) ([]byte, error) {
	return nil, errObjectNotFound
}

func (store *sourceDeletedBetweenSizeAndDownloadStore) Upload(ctx context.Context, object string, contentType string, data []byte) error {
	return nil
}

func TestRenderDocumentSourceMissingOnDownload(t *testing.T) {
	renderer, err := render.NewRenderer()
	if err != nil {
		t.Fatalf("NewRenderer: %v", err)
	}
	handler := newServer(&sourceDeletedBetweenSizeAndDownloadStore{sourceSize: 1024}, renderer, 50*1024*1024, time.Minute)
	response := postRender(handler,
		`{"sourceObject":"org1/proj1/doc1.pdf","outputPrefix":"org1/proj1/derived/doc1/","maxPages":20,"maxPixelsPerPage":4000000}`)
	if response.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", response.Code, response.Body.String())
	}
}

func TestRenderDocumentInvalidPdf(t *testing.T) {
	store := &fakeStore{objects: map[string][]byte{"org1/proj1/doc1.pdf": []byte("not a pdf")}}
	response := postRender(newTestServer(t, store),
		`{"sourceObject":"org1/proj1/doc1.pdf","outputPrefix":"org1/proj1/derived/doc1/","maxPages":20,"maxPixelsPerPage":4000000}`)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", response.Code)
	}
}

func TestRenderDocumentValidation(t *testing.T) {
	handler := newTestServer(t, &fakeStore{objects: map[string][]byte{}})
	for _, body := range []string{
		`{`,
		`{"sourceObject":"","outputPrefix":"a/","maxPages":20,"maxPixelsPerPage":4000000}`,
		`{"sourceObject":"../etc/x.pdf","outputPrefix":"a/","maxPages":20,"maxPixelsPerPage":4000000}`,
		`{"sourceObject":"a/b.pdf","outputPrefix":"a/derived/b","maxPages":20,"maxPixelsPerPage":4000000}`,
	} {
		if response := postRender(handler, body); response.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for %q, got %d", body, response.Code)
		}
	}
}

// stalledUploadStore serves the source pdf normally but its uploads hang
// until the request is cancelled, simulating a render pipeline that stalls
// mid-document.
type stalledUploadStore struct {
	objects map[string][]byte
}

func (store *stalledUploadStore) Size(ctx context.Context, object string) (int64, error) {
	return int64(len(store.objects[object])), nil
}

func (store *stalledUploadStore) Download(ctx context.Context, object string) ([]byte, error) {
	return store.objects[object], nil
}

func (store *stalledUploadStore) Upload(ctx context.Context, object string, contentType string, data []byte) error {
	<-ctx.Done()
	return ctx.Err()
}

func TestRenderDocumentTimesOutWhenRenderingStalls(t *testing.T) {
	store := &stalledUploadStore{objects: map[string][]byte{
		"org1/proj1/doc1.pdf": pdftest.BuildPdfWithPages(2, 200),
	}}
	renderer, err := render.NewRenderer()
	if err != nil {
		t.Fatalf("NewRenderer: %v", err)
	}
	handler := newServer(store, renderer, 50*1024*1024, 50*time.Millisecond)
	response := postRender(handler,
		`{"sourceObject":"org1/proj1/doc1.pdf","outputPrefix":"org1/proj1/derived/doc1/","maxPages":20,"maxPixelsPerPage":4000000}`)
	if response.Code != http.StatusGatewayTimeout {
		t.Fatalf("expected 504, got %d: %s", response.Code, response.Body.String())
	}
	if !strings.Contains(response.Body.String(), "timed out") {
		t.Fatalf("expected a timeout message, got %s", response.Body.String())
	}
}

func postPageCount(handler http.Handler, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodPost, "/page-count", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder
}

func TestPageCountHappyPath(t *testing.T) {
	store := &fakeStore{objects: map[string][]byte{
		"org1/proj1/doc1.pdf": pdftest.BuildPdfWithPages(3, 200),
	}}
	response := postPageCount(newTestServer(t, store), `{"sourceObject":"org1/proj1/doc1.pdf"}`)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	var parsed struct {
		PageCount int `json:"pageCount"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &parsed); err != nil || parsed.PageCount != 3 {
		t.Fatalf("expected pageCount 3, got %s", response.Body.String())
	}
	if len(store.objects) != 1 {
		t.Fatalf("expected no uploads, store has %d objects", len(store.objects))
	}
}

func TestPageCountSourceMissing(t *testing.T) {
	response := postPageCount(newTestServer(t, &fakeStore{objects: map[string][]byte{}}),
		`{"sourceObject":"org1/proj1/nope.pdf"}`)
	if response.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", response.Code)
	}
}

func TestPageCountInvalidPdf(t *testing.T) {
	store := &fakeStore{objects: map[string][]byte{"org1/proj1/doc1.pdf": []byte("not a pdf")}}
	response := postPageCount(newTestServer(t, store), `{"sourceObject":"org1/proj1/doc1.pdf"}`)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", response.Code)
	}
}

func TestPageCountValidation(t *testing.T) {
	handler := newTestServer(t, &fakeStore{objects: map[string][]byte{}})
	for _, body := range []string{
		`{`,
		`{"sourceObject":""}`,
		`{"sourceObject":"../etc/x.pdf"}`,
	} {
		if response := postPageCount(handler, body); response.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for %q, got %d", body, response.Code)
		}
	}
}

func TestHealthz(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	recorder := httptest.NewRecorder()
	newTestServer(t, &fakeStore{objects: map[string][]byte{}}).ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
}
