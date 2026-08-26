package render

import (
	"bytes"
	"errors"
	"image/png"
	"testing"

	"github.com/bayesimpact/bayes-platform/apps/pdf-converter/internal/render/pdftest"
)

func newTestRenderer(t *testing.T) *Renderer {
	t.Helper()
	renderer, err := NewRenderer()
	if err != nil {
		t.Fatalf("NewRenderer: %v", err)
	}
	return renderer
}

func collectPages(t *testing.T, renderer *Renderer, pdfBytes []byte, maxPages, maxPixels int) (int, [][]byte) {
	t.Helper()
	rendered := [][]byte{}
	pageCount, err := renderer.RenderPages(pdfBytes, maxPages, maxPixels,
		func(pageNumber int, pngBytes []byte) error {
			rendered = append(rendered, pngBytes)
			return nil
		})
	if err != nil {
		t.Fatalf("RenderPages: %v", err)
	}
	return pageCount, rendered
}

func TestRendersEachPageAsPng(t *testing.T) {
	renderer := newTestRenderer(t)
	pageCount, rendered := collectPages(t, renderer, pdftest.BuildPdfWithPages(2, 200), 20, 4_000_000)
	if pageCount != 2 || len(rendered) != 2 {
		t.Fatalf("expected 2 pages, got pageCount=%d rendered=%d", pageCount, len(rendered))
	}
	image, err := png.Decode(bytes.NewReader(rendered[0]))
	if err != nil {
		t.Fatalf("first page is not a png: %v", err)
	}
	// 200pt page at scale 2 -> 400px.
	if image.Bounds().Dx() != 400 || image.Bounds().Dy() != 400 {
		t.Fatalf("expected 400x400, got %v", image.Bounds())
	}
}

func TestCapsPixelsPerPage(t *testing.T) {
	renderer := newTestRenderer(t)
	// 4000pt at scale 2 would be 8000x8000 = 64M px; the 4M cap must shrink it.
	_, rendered := collectPages(t, renderer, pdftest.BuildPdfWithPages(1, 4000), 20, 4_000_000)
	image, err := png.Decode(bytes.NewReader(rendered[0]))
	if err != nil {
		t.Fatalf("page is not a png: %v", err)
	}
	pixels := image.Bounds().Dx() * image.Bounds().Dy()
	if pixels > 4_000_000 {
		t.Fatalf("expected <= 4M pixels, got %d (%v)", pixels, image.Bounds())
	}
}

func TestRejectsTooManyPages(t *testing.T) {
	renderer := newTestRenderer(t)
	_, err := renderer.RenderPages(pdftest.BuildPdfWithPages(3, 200), 2, 4_000_000,
		func(pageNumber int, pngBytes []byte) error { return nil })
	if !errors.Is(err, ErrTooManyPages) {
		t.Fatalf("expected ErrTooManyPages, got %v", err)
	}
}

func TestRejectsInvalidPdf(t *testing.T) {
	renderer := newTestRenderer(t)
	_, err := renderer.RenderPages([]byte("not a pdf at all"), 20, 4_000_000,
		func(pageNumber int, pngBytes []byte) error { return nil })
	if !errors.Is(err, ErrInvalidPdf) {
		t.Fatalf("expected ErrInvalidPdf, got %v", err)
	}
}
