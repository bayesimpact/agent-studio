// Package render rasterizes PDF pages to PNG using go-pdfium's WebAssembly
// backend: no cgo, and a malicious PDF is confined to the wazero sandbox.
package render

import (
	"bytes"
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
)

// PDF points are 1/72"; scale 2 renders ~144dpi so extracted text stays
// legible.
const renderScale = 2.0

type Renderer struct {
	pool pdfium.Pool
}

func NewRenderer() (*Renderer, error) {
	pool, err := webassembly.Init(webassembly.Config{
		MinIdle:  0,
		MaxIdle:  1,
		MaxTotal: 4,
		// Mount no host filesystem: untrusted PDFs are confined to the
		// wazero sandbox.
		FSConfig: wazero.NewFSConfig(),
	})
	if err != nil {
		return nil, fmt.Errorf("init pdfium webassembly pool: %w", err)
	}
	return &Renderer{pool: pool}, nil
}

// GetPageCount opens the document and returns its page count without
// rendering any page.
func (renderer *Renderer) GetPageCount(pdfBytes []byte) (int, error) {
	instance, err := renderer.pool.GetInstance(30 * time.Second)
	if err != nil {
		return 0, fmt.Errorf("get pdfium instance: %w", err)
	}
	defer instance.Close()

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
}

// RenderPages rasterizes every page as PNG and hands each to emit with a
// 1-based page number. Returns the page count.
func (renderer *Renderer) RenderPages(
	pdfBytes []byte,
	maxPages int,
	maxPixelsPerPage int,
	emit func(pageNumber int, pngBytes []byte) error,
) (int, error) {
	instance, err := renderer.pool.GetInstance(30 * time.Second)
	if err != nil {
		return 0, fmt.Errorf("get pdfium instance: %w", err)
	}
	defer instance.Close()

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
		rendered, err := instance.RenderPageInPixels(&requests.RenderPageInPixels{
			Page:   page,
			Width:  int(size.Width * scale),
			Height: int(size.Height * scale),
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
}
