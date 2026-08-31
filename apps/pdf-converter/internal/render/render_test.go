package render

import (
	"bytes"
	"context"
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
	pageCount, err := renderer.RenderPages(context.Background(), pdfBytes, maxPages, maxPixels,
		func(pageNumber int, pngBytes []byte) error {
			rendered = append(rendered, pngBytes)
			return nil
		})
	if err != nil {
		t.Fatalf("RenderPages: %v", err)
	}
	return pageCount, rendered
}

// interruptRender starts a render whose emit cancels the context and then
// blocks until test cleanup, so cancellation always lands while the render
// call is in flight and only an instance kill can end it promptly.
func interruptRender(t *testing.T, renderer *Renderer, release <-chan struct{}) error {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	_, err := renderer.RenderPages(ctx, pdftest.BuildPdfWithPages(2, 200), 20, 4_000_000,
		func(pageNumber int, pngBytes []byte) error {
			cancel()
			<-release
			return nil
		})
	return err
}

func TestRenderPagesReturnsAbortedWhenCancelledMidRender(t *testing.T) {
	renderer := newTestRenderer(t)
	release := make(chan struct{})
	t.Cleanup(func() { close(release) })
	err := interruptRender(t, renderer, release)
	if !errors.Is(err, ErrAborted) {
		t.Fatalf("expected ErrAborted, got %v", err)
	}
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("expected error to wrap context.Canceled, got %v", err)
	}
}

func TestInterruptedRendersDoNotExhaustThePool(t *testing.T) {
	renderer := newTestRenderer(t)
	release := make(chan struct{})
	t.Cleanup(func() { close(release) })
	// One more interruption than the pool holds instances (MaxTotal 4): if an
	// interrupted render leaked its instance, the pool would be exhausted.
	for attempt := 0; attempt < 5; attempt++ {
		if err := interruptRender(t, renderer, release); !errors.Is(err, ErrAborted) {
			t.Fatalf("attempt %d: expected ErrAborted, got %v", attempt, err)
		}
	}
	pageCount, rendered := collectPages(t, renderer, pdftest.BuildPdfWithPages(1, 200), 20, 4_000_000)
	if pageCount != 1 || len(rendered) != 1 {
		t.Fatalf("expected a working pool after interruptions, got pageCount=%d rendered=%d",
			pageCount, len(rendered))
	}
}

func TestRenderPagesReturnsAbortedWhenContextAlreadyCancelled(t *testing.T) {
	renderer := newTestRenderer(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := renderer.RenderPages(ctx, pdftest.BuildPdfWithPages(3, 200), 20, 4_000_000,
		func(pageNumber int, pngBytes []byte) error { return nil })
	if !errors.Is(err, ErrAborted) {
		t.Fatalf("expected ErrAborted, got %v", err)
	}
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
	pageCount, err := renderer.RenderPages(context.Background(), pdftest.BuildPdfWithPages(3, 200), 2, 4_000_000,
		func(pageNumber int, pngBytes []byte) error { return nil })
	if !errors.Is(err, ErrTooManyPages) {
		t.Fatalf("expected ErrTooManyPages, got %v", err)
	}
	if pageCount != 3 {
		t.Fatalf("expected the rejected page count 3 alongside the error, got %d", pageCount)
	}
}

func TestRejectsInvalidPdf(t *testing.T) {
	renderer := newTestRenderer(t)
	_, err := renderer.RenderPages(context.Background(), []byte("not a pdf at all"), 20, 4_000_000,
		func(pageNumber int, pngBytes []byte) error { return nil })
	if !errors.Is(err, ErrInvalidPdf) {
		t.Fatalf("expected ErrInvalidPdf, got %v", err)
	}
}
