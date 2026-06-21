#!/usr/bin/env python3
"""
Watermark photos and videos with a logo + text overlay (bottom-right).
Maintains original video format and quality.

Requirements:
  pip install Pillow
  ffmpeg must be on PATH (for video)

Usage:
  python watermark.py photo input.jpg -o output.jpg
  python watermark.py video input.mp4 -o output.mp4
  python watermark.py photo input.png --logo logo.png --text "MyBrand"
  python watermark.py video input.mov --logo logo.png --text "MyBrand" --padding 20
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

DEFAULT_TEXT = "ArijitK.in"
DEFAULT_LOGO = "public/pwa-512x512.png"
LOGO_HEIGHT = 32
TEXT_SIZE = 28
LOGO_OPACITY = 0.6
TEXT_OPACITY = 0.35
PADDING_X = 20
PADDING_Y = 16


def build_watermark_image(logo_path: str, text: str, scale: float = 1.0) -> Image.Image:
    """Create a combined logo+text watermark strip with transparency."""
    logo_h = max(1, int(LOGO_HEIGHT * scale))
    text_size = max(8, int(TEXT_SIZE * scale))

    # --- logo ---
    logo = Image.open(logo_path).convert("RGBA")
    aspect = logo.width / logo.height
    logo = logo.resize((int(logo_h * aspect), logo_h), Image.LANCZOS)

    # apply opacity
    r, g, b, a = logo.split()
    a = a.point(lambda p: int(p * LOGO_OPACITY))
    logo = Image.merge("RGBA", (r, g, b, a))

    # --- text ---
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", text_size)
    except OSError:
        try:
            font = ImageFont.truetype("arial.ttf", text_size)
        except OSError:
            font = ImageFont.load_default()

    tmp = Image.new("RGBA", (1, 1))
    draw = ImageDraw.Draw(tmp)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    text_img = Image.new("RGBA", (tw + 4, th + 4), (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_img)
    text_alpha = int(255 * TEXT_OPACITY)
    draw.text((-bbox[0], -bbox[1]), text, font=font, fill=(255, 255, 255, text_alpha))

    # --- combine horizontally, vertically centered ---
    gap = max(4, int(6 * scale))
    w = logo.width + gap + text_img.width
    h = max(logo.height, text_img.height)
    combined = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    logo_y = (h - logo.height) // 2
    text_y = (h - text_img.height) // 2
    combined.paste(logo, (0, logo_y), logo)
    combined.paste(text_img, (logo.width + gap, text_y), text_img)

    return combined


def watermark_photo(
    input_path: str,
    output_path: str,
    logo_path: str,
    text: str,
    padding: int | None = None,
):
    """Apply watermark to a photo, preserving format and quality."""
    img = Image.open(input_path)
    img = img.convert("RGBA")

    # scale watermark relative to image size
    scale = max(img.width, img.height) / 1200
    wm = build_watermark_image(logo_path, text, scale)

    pad_x = padding if padding is not None else max(8, int(PADDING_X * scale))
    pad_y = padding if padding is not None else max(8, int(PADDING_Y * scale))

    x = img.width - wm.width - pad_x
    y = img.height - wm.height - pad_y
    img.paste(wm, (x, y), wm)

    # save in the original format
    out = Path(output_path)
    fmt = out.suffix.lower().lstrip(".")
    save_kwargs: dict = {}

    if fmt in ("jpg", "jpeg"):
        img = img.convert("RGB")
        save_kwargs["quality"] = 95
        save_kwargs["subsampling"] = 0
    elif fmt == "png":
        pass
    elif fmt == "webp":
        save_kwargs["quality"] = 95
        save_kwargs["method"] = 6

    img.save(output_path, **save_kwargs)
    print(f"✓ Photo watermarked → {output_path}")


def watermark_video(
    input_path: str,
    output_path: str,
    logo_path: str,
    text: str,
    padding: int | None = None,
):
    """
    Apply watermark to a video using ffmpeg.
    Preserves original codec, resolution, frame rate, and audio.
    """
    if not shutil.which("ffmpeg"):
        sys.exit("Error: ffmpeg not found on PATH")
    if not shutil.which("ffprobe"):
        sys.exit("Error: ffprobe not found on PATH")

    # probe video dimensions to scale watermark
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,codec_name,r_frame_rate,pix_fmt",
            "-of", "csv=p=0",
            input_path,
        ],
        capture_output=True, text=True, check=True,
    )
    parts = probe.stdout.strip().split(",")
    vid_w, vid_h = int(parts[0]), int(parts[1])
    codec = parts[2]
    pix_fmt = parts[4] if len(parts) > 4 else "yuv420p"

    scale = max(vid_w, vid_h) / 1200
    wm = build_watermark_image(logo_path, text, scale)

    pad_x = padding if padding is not None else max(8, int(PADDING_X * scale))
    pad_y = padding if padding is not None else max(8, int(PADDING_Y * scale))

    # write watermark to a temp PNG
    tmp_wm = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    wm.save(tmp_wm.name)
    tmp_wm.close()

    # map input codec to ffmpeg encoder
    encoder_map = {
        "h264": "libx264",
        "hevc": "libx265",
        "h265": "libx265",
        "vp8": "libvpx",
        "vp9": "libvpx-vp9",
        "av1": "libaom-av1",
        "mpeg4": "mpeg4",
        "prores": "prores_ks",
    }
    encoder = encoder_map.get(codec, "libx264")

    # quality settings per encoder
    quality_args: list[str] = []
    if encoder in ("libx264", "libx265"):
        quality_args = ["-crf", "17", "-preset", "slow"]
    elif encoder in ("libvpx", "libvpx-vp9"):
        quality_args = ["-crf", "18", "-b:v", "0"]
    elif encoder == "libaom-av1":
        quality_args = ["-crf", "20", "-b:v", "0"]
    elif encoder == "mpeg4":
        quality_args = ["-q:v", "2"]

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-i", tmp_wm.name,
        "-filter_complex",
        f"[1:v]format=rgba[wm];[0:v][wm]overlay=W-w-{pad_x}:H-h-{pad_y}:format=auto",
        "-c:v", encoder,
        *quality_args,
        "-pix_fmt", pix_fmt,
        "-c:a", "copy",          # keep audio untouched
        "-map_metadata", "0",    # preserve metadata
        "-movflags", "+faststart",
        output_path,
    ]

    print(f"Watermarking video ({codec} → {encoder}) ...")
    subprocess.run(cmd, check=True)

    Path(tmp_wm.name).unlink(missing_ok=True)
    print(f"✓ Video watermarked → {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Watermark photos and videos")
    sub = parser.add_subparsers(dest="mode", required=True)

    for name in ("photo", "video"):
        sp = sub.add_parser(name)
        sp.add_argument("input", help="Input file path")
        sp.add_argument("-o", "--output", help="Output file path (default: <name>_wm.<ext>)")
        sp.add_argument("--logo", default=DEFAULT_LOGO, help="Logo image path")
        sp.add_argument("--text", default=DEFAULT_TEXT, help="Watermark text")
        sp.add_argument("--padding", type=int, default=None, help="Override padding (px)")

    args = parser.parse_args()

    inp = Path(args.input)
    if not inp.is_file():
        sys.exit(f"Error: {inp} not found")

    out = args.output or f"{inp.stem}_wm{inp.suffix}"

    if args.mode == "photo":
        watermark_photo(str(inp), out, args.logo, args.text, args.padding)
    else:
        watermark_video(str(inp), out, args.logo, args.text, args.padding)


if __name__ == "__main__":
    main()
