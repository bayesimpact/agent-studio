package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/bayesimpact/bayes-platform/apps/pdf-converter/internal/render"
)

type renderDocumentRequest struct {
	SourceObject     string `json:"sourceObject"`
	OutputPrefix     string `json:"outputPrefix"`
	MaxPages         int    `json:"maxPages"`
	MaxPixelsPerPage int    `json:"maxPixelsPerPage"`
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

func newServer(store objectStore, renderer *render.Renderer, maxSourceBytes int64) http.Handler {
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

		size, err := store.Size(request.Context(), body.SourceObject)
		if errors.Is(err, errObjectNotFound) {
			writeError(response, http.StatusNotFound, "source pdf not found")
			return
		}
		if err != nil {
			log.Printf("size check failed: %v", err)
			writeError(response, http.StatusInternalServerError, "failed to stat source pdf")
			return
		}
		if size > maxSourceBytes {
			writeError(response, http.StatusRequestEntityTooLarge,
				fmt.Sprintf("source pdf is %dMB, max is %dMB", size/1024/1024, maxSourceBytes/1024/1024))
			return
		}

		pdfBytes, err := store.Download(request.Context(), body.SourceObject)
		if err != nil {
			log.Printf("download failed: %v", err)
			writeError(response, http.StatusInternalServerError, "failed to download source pdf")
			return
		}

		pageCount, err := renderer.RenderPages(pdfBytes, body.MaxPages, body.MaxPixelsPerPage,
			func(pageNumber int, pngBytes []byte) error {
				object := fmt.Sprintf("%spage-%d.png", body.OutputPrefix, pageNumber)
				return store.Upload(request.Context(), object, "image/png", pngBytes)
			})
		if errors.Is(err, render.ErrTooManyPages) {
			writeError(response, http.StatusUnprocessableEntity, err.Error())
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

	return mux
}
