#!/usr/bin/env bash
# Convert a GIF or video into web-ready media for this site.
#
# Usage:
#   tools/convert-media.sh INPUT NAME [--start SEC] [--duration SEC] [--crf N] [--webm]
#
# Writes:
#   assets/videos/NAME.mp4          H.264, max 1280 px wide, 30 fps, no audio, fast start
#   assets/videos/NAME.webm         only with --webm (VP9, usually 20-40% smaller)
#   assets/images/NAME-poster.webp  still frame used as the poster (JPEG if WebP is unavailable)
#
# Examples:
#   tools/convert-media.sh ~/Downloads/eth_flight.gif eth-world-model
#   tools/convert-media.sh raw/aermani_run.mov aermani-diffusion --start 12 --duration 10
#
# Aim for 5-15 s loops under ~4 MB. Needs ffmpeg: macOS `brew install ffmpeg`,
# Ubuntu `sudo apt install ffmpeg`, Windows `winget install ffmpeg` (run this in Git Bash).

set -euo pipefail

usage() { sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
[ $# -lt 2 ] && usage
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found. Install it first (see the top of this script)." >&2; exit 1; }

input=$1; name=$2; shift 2
start=""; duration=""; crf=24; webm=0
while [ $# -gt 0 ]; do
  case $1 in
    --start)    start=$2; shift 2 ;;
    --duration) duration=$2; shift 2 ;;
    --crf)      crf=$2; shift 2 ;;
    --webm)     webm=1; shift ;;
    *)          usage ;;
  esac
done
[ -f "$input" ] || { echo "Input not found: $input" >&2; exit 1; }

root=$(cd "$(dirname "$0")/.." && pwd)
videos="$root/assets/videos"
images="$root/assets/images"
mkdir -p "$videos" "$images"

trim=()
if [ -n "$start" ]; then trim+=(-ss "$start"); fi
if [ -n "$duration" ]; then trim+=(-t "$duration"); fi

# Even dimensions, at most 1280 px wide, 30 fps, 4:2:0 color (required by Safari and iOS).
vf="fps=30,scale='trunc(min(1280,iw)/2)*2':-2:flags=lanczos,format=yuv420p"

echo "Encoding $name.mp4 (H.264)..."
ffmpeg -hide_banner -loglevel error -y ${trim[@]+"${trim[@]}"} -i "$input" -vf "$vf" \
  -c:v libx264 -preset slow -crf "$crf" -profile:v high -movflags +faststart -an \
  "$videos/$name.mp4"

if [ "$webm" -eq 1 ]; then
  echo "Encoding $name.webm (VP9)..."
  ffmpeg -hide_banner -loglevel error -y ${trim[@]+"${trim[@]}"} -i "$input" -vf "$vf" \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an \
    "$videos/$name.webm"
fi

echo "Extracting poster..."
poster="$images/$name-poster.webp"
if ! ffmpeg -hide_banner -loglevel error -y -i "$videos/$name.mp4" -vf "thumbnail=60" -frames:v 1 \
     -c:v libwebp -quality 72 "$poster" 2>/dev/null; then
  rm -f "$poster"
  poster="$images/$name-poster.jpg"
  ffmpeg -hide_banner -loglevel error -y -i "$videos/$name.mp4" -vf "thumbnail=60" -frames:v 1 -q:v 4 "$poster"
  echo "  WebP encoder not available, so the poster is a JPEG: change data-poster in index.html to .jpg."
fi

bytes() { wc -c < "$1" | tr -d ' '; }
mb() { awk -v b="$1" 'BEGIN { printf "%.1f MB", b / 1048576 }'; }
kb() { awk -v b="$1" 'BEGIN { printf "%.0f KB", b / 1024 }'; }

dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$videos/$name.mp4" 2>/dev/null || true)
mp4_bytes=$(bytes "$videos/$name.mp4")

echo
echo "Done:"
echo "  assets/videos/$name.mp4  $(mb "$mp4_bytes")  $dims"
if [ "$webm" -eq 1 ]; then echo "  assets/videos/$name.webm  $(mb "$(bytes "$videos/$name.webm")")"; fi
echo "  ${poster#"$root"/}  $(kb "$(bytes "$poster")")"

if [ "$mp4_bytes" -gt 4194304 ]; then
  echo
  echo "The MP4 is over 4 MB. Shorten it (--duration 10) or raise --crf to 27 or 28."
fi
if [ -n "$dims" ]; then
  w=${dims%x*}; h=${dims#*x}
  echo
  echo "In index.html, set width=\"$w\" height=\"$h\" on this <video>."
  if [ $((w * 9)) -ne $((h * 16)) ]; then
    echo "The clip is not 16:9: add style=\"--ar: $w / $h\" to its <div class=\"media__frame\">."
  fi
fi
