#!/bin/bash
set -euo pipefail

# Process gallery images: generate thumbnails, watermarked display, and OG images
# Requires: ImageMagick (v6 or v7)

# ImageMagick v7 uses 'magick', v6 uses 'convert'/'identify'
if command -v magick &>/dev/null; then
  MAGICK="magick"
else
  MAGICK="convert"
fi

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

  # Skip if all 3 outputs already exist
  if [ -f "$THUMB_DIR/${filename}.webp" ] && [ -f "$DISPLAY_DIR/${filename}.webp" ] && [ -f "$OG_DIR/${filename}.jpg" ]; then
    echo "Skipping (cached): $filename"
    continue
  fi

  NEEDS_CONVERT=true
  echo "Processing: $filename"

  # 1. Thumbnail for gallery grid (400px wide, webp)
  $MAGICK "$img" \
    -resize 400x \
    -quality 75 \
    "$THUMB_DIR/${filename}.webp"

  # 2. Display image (original size, watermarked with logo + text, webp)
  LOGO="public/pwa-512x512.png"
  $MAGICK "$img" \
    \( \
      \( "$LOGO" -resize x32 -alpha set -channel A -evaluate Multiply 0.6 +channel \) \
      \( -background none -fill "rgba(255,255,255,0.35)" -font "DejaVu-Sans" -pointsize 28 label:"$WATERMARK_TEXT" \) \
      -gravity center +append \
    \) \
    -gravity southeast -geometry +20+16 -composite \
    "$DISPLAY_DIR/${filename}.webp"

  # 3. OG image for social previews (1200x630, jpg for max compatibility)
  $MAGICK "$img" \
    -resize "1200x630^" \
    -gravity center \
    -extent 1200x630 \
    -quality 85 \
    "$OG_DIR/${filename}.jpg"

  echo "  ✓ thumb, display, og"
done

echo "Gallery processing complete. ${#files[@]} images found."

# Signal to CI whether ImageMagick was actually needed
if [ "$NEEDS_CONVERT" = false ]; then
  echo "All images were cached — no conversion needed."
fi
