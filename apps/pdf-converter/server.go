package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/bayesimpact/bayes-platform/apps/pdf-converter/internal/render"
)

type renderDocumentRequest struct {
	SourceObject     string `json:"sourceObject"`
	OutputPrefix     string `json:"outputPrefix"`
	MaxPages         int    `json:"maxPages"`
	MaxPixelsPerPage int    `json:"maxPixelsPerPage"`
}

type pageCountRequest struct {
	SourceObject string `json:"sourceObject"`
}

func writeJSON(response http.ResponseWriter, status int, payload any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	json.NewEncoder(response).Encode(payload)
}

func writeError(response http.ResponseWriter, status int, message string) {
	writeJSON(response, status, map[string]string{"message": message})
}

func validObjectPath(path string) bool {
	return path != "" && !strings.HasPrefix(path, "/") && !strings.Contains(path, "..")
}

// fetchSourcePdf downloads the source pdf under the size cap, writing the
// error response and returning ok=false when it cannot.
func fetchSourcePdf(
	response http.ResponseWriter,
	request *http.Request,
	store objectStore,
	sourceObject string,
	maxSourceBytes int64,
) ([]byte, bool) {
	pdfBytes, err := store.Download(request.Context(), sourceObject, maxSourceBytes)
	if errors.Is(err, errObjectNotFound) {
		writeError(response, http.StatusNotFound, "source pdf not found")
		return nil, false
	}
	var tooLarge *objectTooLargeError
	if errors.As(err, &tooLarge) {
		writeError(response, http.StatusRequestEntityTooLarge,
			fmt.Sprintf("source pdf is %dMB, max is %dMB", tooLarge.size/1024/1024, tooLarge.maxBytes/1024/1024))
		return nil, false
	}
	if err != nil {
		log.Printf("download failed: %v", err)
		writeError(response, http.StatusInternalServerError, "failed to download source pdf")
		return nil, false
	}
	return pdfBytes, true
}

func newServer(
	store objectStore,
	renderer *render.Renderer,
	maxSourceBytes int64,
	renderTimeout time.Duration,
) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(response http.ResponseWriter, request *http.Request) {
		writeJSON(response, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("POST /render-document", func(response http.ResponseWriter, request *http.Request) {
		var body renderDocumentRequest
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			writeError(response, http.StatusBadRequest, "invalid json body")
			return
		}
		if !validObjectPath(body.SourceObject) || !validObjectPath(body.OutputPrefix) ||
			!strings.HasSuffix(body.OutputPrefix, "/") {
			writeError(response, http.StatusBadRequest,
				"sourceObject and outputPrefix must be relative object paths; outputPrefix must end with /")
			return
		}
		if body.MaxPages < 1 || body.MaxPages > 100 || body.MaxPixelsPerPage < 1 || body.MaxPixelsPerPage > 16_000_000 {
			writeError(response, http.StatusBadRequest, "maxPages must be 1-100 and maxPixelsPerPage 1-16000000")
			return
		}

		pdfBytes, ok := fetchSourcePdf(response, request, store, body.SourceObject, maxSourceBytes)
		if !ok {
			return
		}

		renderCtx, cancelRender := context.WithTimeout(request.Context(), renderTimeout)
		defer cancelRender()
		pageCount, err := renderer.RenderPages(renderCtx, pdfBytes, body.MaxPages, body.MaxPixelsPerPage,
			func(pageNumber int, pngBytes []byte) error {
				object := fmt.Sprintf("%spage-%d.png", body.OutputPrefix, pageNumber)
				return store.Upload(renderCtx, object, "image/png", pngBytes)
			})
		if errors.Is(err, render.ErrTooManyPages) {
			writeError(response, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if errors.Is(err, render.ErrAborted) {
			writeError(response, http.StatusGatewayTimeout, "pdf rendering timed out or was cancelled")
			return
		}
		if errors.Is(err, render.ErrInvalidPdf) {
			writeError(response, http.StatusBadRequest, err.Error())
			return
		}
		if err != nil {
			log.Printf("render failed: %v", err)
			writeError(response, http.StatusInternalServerError, "pdf rendering failed")
			return
		}
		writeJSON(response, http.StatusOK, map[string]int{"pageCount": pageCount})
	})

	mux.HandleFunc("POST /page-count", func(response http.ResponseWriter, request *http.Request) {
		var body pageCountRequest
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			writeError(response, http.StatusBadRequest, "invalid json body")
			return
		}
		if !validObjectPath(body.SourceObject) {
			writeError(response, http.StatusBadRequest, "sourceObject must be a relative object path")
			return
		}

		pdfBytes, ok := fetchSourcePdf(response, request, store, body.SourceObject, maxSourceBytes)
		if !ok {
			return
		}

		countCtx, cancelCount := context.WithTimeout(request.Context(), renderTimeout)
		defer cancelCount()
		pageCount, err := renderer.GetPageCount(countCtx, pdfBytes)
		if errors.Is(err, render.ErrInvalidPdf) {
			writeError(response, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, render.ErrAborted) {
			writeError(response, http.StatusGatewayTimeout, "pdf page count timed out or was cancelled")
			return
		}
		if err != nil {
			log.Printf("page count failed: %v", err)
			writeError(response, http.StatusInternalServerError, "pdf page count failed")
			return
		}
		writeJSON(response, http.StatusOK, map[string]int{"pageCount": pageCount})
	})

	return mux
}
