// Package render rasterizes PDF pages to PNG using go-pdfium's WebAssembly
// backend: no cgo, and a malicious PDF is confined to the wazero sandbox.
package render

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image/png"
	"math"
	"time"

	"github.com/klippa-app/go-pdfium"
	"github.com/klippa-app/go-pdfium/requests"
	"github.com/klippa-app/go-pdfium/webassembly"
	"github.com/tetratelabs/wazero"
)

var (
	ErrTooManyPages = errors.New("page limit exceeded")
	ErrInvalidPdf   = errors.New("invalid pdf")
	ErrAborted      = errors.New("pdf processing aborted")
)

// PDF points are 1/72"; scale 2 renders ~144dpi so extracted text stays
// legible.
const renderScale = 2.0

const instanceAcquireTimeout = 30 * time.Second

type Renderer struct {
	pool pdfium.Pool
}

func NewRenderer() (*Renderer, error) {
	pool, err := webassembly.Init(webassembly.Config{
		MinIdle:  0,
		MaxIdle:  1,
		MaxTotal: 4,
		// Without CloseOnContextDone, an in-flight pdfium call cannot be
		// interrupted: Kill would leave a hostile PDF spinning in the wasm
		// sandbox and its pool slot lost until process restart.
		RuntimeConfig: wazero.NewRuntimeConfig().WithCloseOnContextDone(true),
		// Mount no host filesystem: untrusted PDFs are confined to the
		// wazero sandbox.
		FSConfig: wazero.NewFSConfig(),
	})
	if err != nil {
		return nil, fmt.Errorf("init pdfium webassembly pool: %w", err)
	}
	return &Renderer{pool: pool}, nil
}

// withInstance runs work on a pooled pdfium instance under ctx. When ctx ends
// while work is in flight, the instance is killed — interrupting the wasm
// execution (CloseOnContextDone above) and invalidating the worker so the
// pool re-creates it — and ErrAborted is returned. A PDF that hangs pdfium
// can therefore never hold a pool slot beyond the caller's deadline.
func (renderer *Renderer) withInstance(
	ctx context.Context,
	work func(instance pdfium.Pdfium) (int, error),
) (int, error) {
	if err := ctx.Err(); err != nil {
		return 0, fmt.Errorf("%w: %w", ErrAborted, err)
	}
	acquireCtx, cancelAcquire := context.WithTimeout(ctx, instanceAcquireTimeout)
	defer cancelAcquire()
	instance, err := renderer.pool.GetInstanceWithContext(acquireCtx)
	if err != nil {
		return 0, fmt.Errorf("get pdfium instance: %w", err)
	}

	type workResult struct {
		pageCount int
		err       error
	}
	done := make(chan workResult, 1)
	go func() {
		pageCount, workErr := work(instance)
		done <- workResult{pageCount: pageCount, err: workErr}
	}()
	select {
	case result := <-done:
		instance.Close()
		if result.err != nil && ctx.Err() != nil {
			return 0, fmt.Errorf("%w: %w", ErrAborted, ctx.Err())
		}
		return result.pageCount, result.err
	case <-ctx.Done():
		// Close would wait for the stuck call; Kill cancels the worker
		// context instead. The abandoned goroutine's next instance call
		// returns "instance is closed" and it exits.
		instance.Kill()
		return 0, fmt.Errorf("%w: %w", ErrAborted, ctx.Err())
	}
}

// GetPageCount opens the document and returns its page count without
// rendering any page.
func (renderer *Renderer) GetPageCount(ctx context.Context, pdfBytes []byte) (int, error) {
	return renderer.withInstance(ctx, func(instance pdfium.Pdfium) (int, error) {
		document, err := instance.OpenDocument(&requests.OpenDocument{File: &pdfBytes})
		if err != nil {
			return 0, fmt.Errorf("%w: %v", ErrInvalidPdf, err)
		}
		defer instance.FPDF_CloseDocument(&requests.FPDF_CloseDocument{Document: document.Document})

		pageCountResponse, err := instance.FPDF_GetPageCount(&requests.FPDF_GetPageCount{
			Document: document.Document,
		})
		if err != nil {
			return 0, fmt.Errorf("%w: %v", ErrInvalidPdf, err)
		}
		return pageCountResponse.PageCount, nil
	})
}

// RenderPages rasterizes every page as PNG and hands each to emit with a
// 1-based page number. Returns the page count.
func (renderer *Renderer) RenderPages(
	ctx context.Context,
	pdfBytes []byte,
	maxPages int,
	maxPixelsPerPage int,
	emit func(pageNumber int, pngBytes []byte) error,
) (int, error) {
	return renderer.withInstance(ctx, func(instance pdfium.Pdfium) (int, error) {
		document, err := instance.OpenDocument(&requests.OpenDocument{File: &pdfBytes})
		if err != nil {
			return 0, fmt.Errorf("%w: %v", ErrInvalidPdf, err)
		}
		defer instance.FPDF_CloseDocument(&requests.FPDF_CloseDocument{Document: document.Document})

		pageCountResponse, err := instance.FPDF_GetPageCount(&requests.FPDF_GetPageCount{
			Document: document.Document,
		})
		if err != nil {
			return 0, fmt.Errorf("%w: %v", ErrInvalidPdf, err)
		}
		pageCount := pageCountResponse.PageCount
		if pageCount > maxPages {
			return 0, fmt.Errorf("%w: pdf has %d pages, max is %d", ErrTooManyPages, pageCount, maxPages)
		}

		for pageIndex := 0; pageIndex < pageCount; pageIndex++ {
			page := requests.Page{ByIndex: &requests.PageByIndex{
				Document: document.Document,
				Index:    pageIndex,
			}}
			size, err := instance.GetPageSize(&requests.GetPageSize{Page: page})
			if err != nil {
				return 0, fmt.Errorf("get size of page %d: %w", pageIndex+1, err)
			}
			scale := renderScale
			if size.Width*size.Height*scale*scale > float64(maxPixelsPerPage) {
				scale = math.Sqrt(float64(maxPixelsPerPage) / (size.Width * size.Height))
			}
			// Floor to 1px: a dimension truncated to 0 would either fail the
			// render (0x0) or be silently recomputed from the page aspect
			// ratio by go-pdfium (single 0), bypassing maxPixelsPerPage.
			width := max(1, int(size.Width*scale))
			height := max(1, int(size.Height*scale))
			// Flooring a sub-pixel dimension to 1 can leave the other past
			// the budget on extreme aspect ratios; cap it.
			if width*height > maxPixelsPerPage {
				if width > height {
					width = maxPixelsPerPage / height
				} else {
					height = maxPixelsPerPage / width
				}
			}
			rendered, err := instance.RenderPageInPixels(&requests.RenderPageInPixels{
				Page:   page,
				Width:  width,
				Height: height,
			})
			if err != nil {
				return 0, fmt.Errorf("render page %d: %w", pageIndex+1, err)
			}
			var pngBuffer bytes.Buffer
			// Encode before Cleanup: in WebAssembly mode the pixel buffer is only
			// valid until Cleanup is called. Use RenderedImage, not the
			// deprecated Image field.
			if err := png.Encode(&pngBuffer, rendered.Result.RenderedImage); err != nil {
				rendered.Cleanup()
				return 0, fmt.Errorf("encode page %d: %w", pageIndex+1, err)
			}
			rendered.Cleanup()
			if err := emit(pageIndex+1, pngBuffer.Bytes()); err != nil {
				return 0, err
			}
		}
		return pageCount, nil
	})
}
