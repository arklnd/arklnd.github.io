#!/bin/bash
set -euo pipefail

# Process gallery images: generate thumbnails, watermarked display, and OG images
# Requires: ImageMagick (convert)

GALLERY_DIR="public/images/gallery"
THUMB_DIR="$GALLERY_DIR/thumbs"
DISPLAY_DIR="$GALLERY_DIR/display"
OG_DIR="$GALLERY_DIR/og"

mkdir -p "$THUMB_DIR" "$DISPLAY_DIR" "$OG_DIR"

WATERMARK_TEXT="ArijitK.in"

shopt -s nullglob
files=("$GALLERY_DIR"/*.jpg "$GALLERY_DIR"/*.jpeg "$GALLERY_DIR"/*.png "$GALLERY_DIR"/*.webp)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "No gallery images found."
  exit 0
fi

for img in "${files[@]}"; do
  filename=$(basename "$img")
  base="${filename%.*}"

  echo "Processing: $filename"

  # 1. Thumbnail for gallery grid (400px wide, webp)
  convert "$img" \
    -resize 400x \
    -quality 80 \
    "$THUMB_DIR/${base}.webp"

  # 2. Display image (original size, watermarked, webp)
  convert "$img" \
    -gravity southeast \
    -fill "rgba(255,255,255,0.35)" \
    -font "DejaVu-Sans" \
    -pointsize 28 \
    -annotate +20+20 "$WATERMARK_TEXT" \
    -quality 85 \
    "$DISPLAY_DIR/${base}.webp"

  # 3. OG image for social previews (1200x630, jpg for max compatibility)
  convert "$img" \
    -resize "1200x630^" \
    -gravity center \
    -extent 1200x630 \
    -quality 85 \
    "$OG_DIR/${base}.jpg"

  echo "  ✓ thumb, display, og"
done

echo "Gallery processing complete. ${#files[@]} images processed."
