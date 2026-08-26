// Package pdftest builds minimal valid PDFs for converter tests.
package pdftest

import (
	"fmt"
	"strings"
)

// BuildPdfWithPages returns a minimal but valid PDF containing pageCount empty
// pages of pageSizePoints x pageSizePoints.
func BuildPdfWithPages(pageCount int, pageSizePoints int) []byte {
	kids := make([]string, pageCount)
	for pageIndex := range kids {
		kids[pageIndex] = fmt.Sprintf("%d 0 R", pageIndex+3)
	}
	objects := []string{
		"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
		fmt.Sprintf("2 0 obj\n<< /Type /Pages /Kids [%s] /Count %d >>\nendobj\n",
			strings.Join(kids, " "), pageCount),
	}
	for pageIndex := 0; pageIndex < pageCount; pageIndex++ {
		objects = append(objects, fmt.Sprintf(
			"%d 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] >>\nendobj\n",
			pageIndex+3, pageSizePoints, pageSizePoints))
	}
	body := "%PDF-1.4\n"
	offsets := make([]int, 0, len(objects))
	for _, object := range objects {
		offsets = append(offsets, len(body))
		body += object
	}
	xrefOffset := len(body)
	xref := fmt.Sprintf("xref\n0 %d\n0000000000 65535 f \n", len(objects)+1)
	for _, offset := range offsets {
		xref += fmt.Sprintf("%010d 00000 n \n", offset)
	}
	trailer := fmt.Sprintf(
		"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF",
		len(objects)+1, xrefOffset)
	return []byte(body + xref + trailer)
}
