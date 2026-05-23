package util

import (
	"bytes"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
)

var md = goldmark.New(
	goldmark.WithExtensions(extension.GFM),
)

var ugcPolicy = bluemonday.UGCPolicy()

func MarkdownToSafeHTML(source string) (string, error) {
	var buf bytes.Buffer
	if err := md.Convert([]byte(source), &buf); err != nil {
		return "", err
	}
	return string(ugcPolicy.SanitizeBytes(buf.Bytes())), nil
}
