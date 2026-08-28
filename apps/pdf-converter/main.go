// pdf-converter: GCS-native PDF -> PNG page rasterizer for image-only LLMs.
// Auth is Cloud Run invoker IAM (no in-app auth).
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"cloud.google.com/go/storage"

	"github.com/bayesimpact/bayes-platform/apps/pdf-converter/internal/render"
)

func main() {
	bucketName := os.Getenv("GCS_STORAGE_BUCKET_NAME")
	if bucketName == "" {
		log.Fatal("GCS_STORAGE_BUCKET_NAME is required")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}
	maxSourceBytes := int64(50 * 1024 * 1024)
	if fromEnv := os.Getenv("PDF_CONVERTER_MAX_PDF_BYTES"); fromEnv != "" {
		parsed, err := strconv.ParseInt(fromEnv, 10, 64)
		if err != nil {
			log.Fatalf("invalid PDF_CONVERTER_MAX_PDF_BYTES: %v", err)
		}
		maxSourceBytes = parsed
	}
	// Hard per-request rendering deadline: a PDF that hangs pdfium is killed
	// and its pool instance re-created, so it cannot wedge the service. Must
	// stay below the API client's request timeout (120s) so the converter
	// aborts first.
	renderTimeout := 60 * time.Second
	if fromEnv := os.Getenv("PDF_CONVERTER_RENDER_TIMEOUT_MS"); fromEnv != "" {
		parsed, err := strconv.ParseInt(fromEnv, 10, 64)
		if err != nil || parsed <= 0 {
			log.Fatalf("invalid PDF_CONVERTER_RENDER_TIMEOUT_MS: %q", fromEnv)
		}
		renderTimeout = time.Duration(parsed) * time.Millisecond
	}

	client, err := storage.NewClient(context.Background())
	if err != nil {
		log.Fatalf("gcs client: %v", err)
	}
	renderer, err := render.NewRenderer()
	if err != nil {
		log.Fatalf("renderer: %v", err)
	}

	server := newServer(&gcsStore{bucket: client.Bucket(bucketName)}, renderer, maxSourceBytes, renderTimeout)
	log.Printf("pdf-converter listening on :%s (bucket %s)", port, bucketName)
	log.Fatal(http.ListenAndServe(":"+port, server))
}
