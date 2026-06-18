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

NEEDS_CONVERT=false

for img in "${files[@]}"; do
  filename=$(basename "$img")
  base="${filename%.*}"

  # Skip if all 3 outputs already exist
  if [ -f "$THUMB_DIR/${base}.webp" ] && [ -f "$DISPLAY_DIR/${base}.webp" ] && [ -f "$OG_DIR/${base}.jpg" ]; then
    echo "Skipping (cached): $filename"
    continue
  fi

  NEEDS_CONVERT=true
  echo "Processing: $filename"

  # 1. Thumbnail for gallery grid (400px wide, webp)
  convert "$img" \
    -resize 400x \
    -quality 80 \
    "$THUMB_DIR/${base}.webp"

  # 2. Display image (original size, watermarked with logo + text, webp)
  LOGO="public/pwa-512x512.png"
  convert "$img" \
    \( "$LOGO" -resize x28 -alpha set -channel A -evaluate Multiply 0.35 +channel \) \
    -gravity southeast \
    -geometry +80+16 \
    -composite \
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

echo "Gallery processing complete. ${#files[@]} images found."

# Signal to CI whether ImageMagick was actually needed
if [ "$NEEDS_CONVERT" = false ]; then
  echo "All images were cached — no conversion needed."
fi
