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

WATERMARK_TEXT="© ArijitK.in"
LOGO="public/pwa-512x512.png"

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

  # Detect panoramic images (ratio > 2:1) — skip watermark for display
  if command -v magick &>/dev/null; then
    IMG_W=$($MAGICK identify -format "%w" "$img[0]")
    IMG_H=$($MAGICK identify -format "%h" "$img[0]")
  else
    IMG_W=$(identify -format "%w" "$img[0]")
    IMG_H=$(identify -format "%h" "$img[0]")
  fi
  IS_PANO=false
  if [ "$IMG_H" -gt 0 ] && [ $((IMG_W / IMG_H)) -ge 2 ]; then
    IS_PANO=true
    echo "  → Panoramic image detected (${IMG_W}x${IMG_H})"
  fi

  # 1. Thumbnail for gallery grid (400px wide, webp)
  $MAGICK "$img" \
    -auto-orient \
    -resize 400x \
    -quality 75 \
    \( \
      \( "$LOGO" -resize x13 -alpha set -channel A -evaluate Multiply 0.6 +channel \) \
      \( -background none -fill "rgba(255,255,255,0.35)" -font "DejaVu-Sans" -pointsize 10 label:"$WATERMARK_TEXT" \) \
      -gravity center +append \
    \) \
    -gravity southeast -geometry +7+5 -composite \
    "$THUMB_DIR/${filename}.webp"

  # 2. Display image (original size, watermarked, webp)
  $MAGICK "$img" \
    -auto-orient \
    \( \
      \( "$LOGO" -resize x32 -alpha set -channel A -evaluate Multiply 0.6 +channel \) \
      \( -background none -fill "rgba(255,255,255,0.35)" -font "DejaVu-Sans" -pointsize 28 label:"$WATERMARK_TEXT" \) \
      -gravity center +append \
    \) \
    -gravity southeast -geometry +20+16 -composite \
    "$DISPLAY_DIR/${filename}.webp"

  # 3. OG image for social previews (1200x630, jpg for max compatibility)
  $MAGICK "$img" \
    -auto-orient \
    -resize "1200x630^" \
    -gravity center \
    -extent 1200x630 \
    \( \
      \( "$LOGO" -resize x28 -alpha set -channel A -evaluate Multiply 0.6 +channel \) \
      \( -background none -fill "rgba(255,255,255,0.35)" -font "DejaVu-Sans" -pointsize 24 label:"$WATERMARK_TEXT" \) \
      -gravity center +append \
    \) \
    -gravity southeast -geometry +16+12 -composite \
    -quality 85 \
    "$OG_DIR/${filename}.jpg"

  echo "  ✓ thumb, display, og"
done

echo "Gallery processing complete. ${#files[@]} images found."

# Signal to CI whether ImageMagick was actually needed
if [ "$NEEDS_CONVERT" = false ]; then
  echo "All images were cached — no conversion needed."
fi
