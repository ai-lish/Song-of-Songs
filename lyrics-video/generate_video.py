#!/usr/bin/env python3
"""
Song-of-Songs Lyric Video Generator
Generates a 1920x1080 MP4 lyric video from an audio file and LRC lyrics.

Usage:
    python generate_video.py --audio ../audio/Step1_latest.m4a --lrc sample.lrc --output output/
"""

import argparse
import subprocess
import sys
import shutil
from pathlib import Path
from typing import Optional


def get_ffmpeg() -> str:
    # Prefer ffmpeg-full (has libass for ASS subtitles)
    ffmpeg_full = Path("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg")
    if ffmpeg_full.exists():
        return str(ffmpeg_full)
    f = shutil.which("ffmpeg")
    if not f:
        raise RuntimeError("ffmpeg not found. Install with: brew install ffmpeg")
    return f


def get_ffprobe() -> str:
    f = shutil.which("ffprobe")
    return f or "ffprobe"


def get_audio_duration(audio_path: Path) -> float:
    """Get audio duration using ffprobe."""
    cmd = [get_ffprobe(), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(audio_path)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(result.stdout.strip())
    except (ValueError, OSError):
        return 140.0


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def check_subtitle_filter():
    """Check which subtitle filters are available in ffmpeg."""
    result = subprocess.run([get_ffmpeg(), "-filters"], capture_output=True, text=True)
    filters = result.stdout
    has_ass = "ass" in filters and " V->V " in filters
    has_subtitles = "subtitles" in filters and " V->V " in filters
    return has_ass, has_subtitles


def build_cmd(
    ffmpeg_bin: str,
    audio_path: Path,
    ass_path: Path,
    output_path: Path,
    bg_color: str = "0x1a0a2e",
    duration: Optional[float] = None,
) -> list[str]:
    """Build ffmpeg command for lyric video."""

    dur = duration or get_audio_duration(audio_path)

    # Check available subtitle filters
    has_ass, has_subtitles = check_subtitle_filter()

    if has_ass:
        subtitle_filter = f"ass={ass_path}"
    elif has_subtitles:
        subtitle_filter = f"subtitles={ass_path}"
    else:
        print("⚠️  Warning: No ASS/subtitles filter available. Lyrics will NOT be burned in.")
        print("   Install ffmpeg-full: brew install ffmpeg-full")
        subtitle_filter = None

    if subtitle_filter:
        vf = f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,{subtitle_filter}"
    else:
        vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"

    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", f"color=c={bg_color}:s=1920x1080:d={dur:.1f}:r=30",
        "-i", str(audio_path),
        "-vf", vf,
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(output_path),
    ]
    return cmd


def run(cmd: list[str]) -> bool:
    print(f"\n🎬 Running ffmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ ffmpeg failed:")
        # Print last 1500 chars of stderr
        print(result.stderr[-1500:])
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate lyric video for Song-of-Songs")
    parser.add_argument("--audio", "-a", required=True, type=Path, help="Audio file (M4A/MP3/WAV)")
    parser.add_argument("--lrc", "-l", required=True, type=Path, help="LRC lyric file")
    parser.add_argument("--ass", type=Path, help="ASS subtitle file (optional, auto-generated from LRC)")
    parser.add_argument("--output", "-o", type=Path, default=Path("output"), help="Output directory")
    parser.add_argument("--name", "-n", default="lyrics_video", help="Output filename (without ext)")
    parser.add_argument("--bg-color", default="0x1a0a2e", help="Background color hex (default: 0x1a0a2e)")
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    audio_path = args.audio if args.audio.is_absolute() else script_dir / args.audio
    lrc_path = args.lrc if args.lrc.is_absolute() else script_dir / args.lrc
    output_dir = args.output if args.output.is_absolute() else script_dir / args.output
    ensure_dir(output_dir)

    ffmpeg_bin = get_ffmpeg()

    # Check subtitle support
    has_ass, has_subtitles = check_subtitle_filter()
    if not (has_ass or has_subtitles):
        print("⚠️  WARNING: Your ffmpeg lacks libass (--enable-libass).")
        print("   Subtitle filters not available.")
        print("   Install ffmpeg with libass: brew install ffmpeg-full")
        print("   OR: brew install libass && brew reinstall ffmpeg --with-libass")
        print()

    # Step 1: Convert LRC → ASS if needed
    if args.ass:
        ass_path = args.ass if args.ass.is_absolute() else script_dir / args.ass
    else:
        ass_path = output_dir / lrc_path.with_suffix(".ass").name
        print(f"🔄 Converting LRC → ASS...")
        from lrc2ass import lrc_to_ass
        lrc_content = lrc_path.read_text(encoding="utf-8")
        ass_content = lrc_to_ass(lrc_content, title=lrc_path.stem)
        ass_path.write_text(ass_content, encoding="utf-8")
        lines = ass_content.count("Dialogue:")
        print(f"✅ ASS saved: {ass_path} ({lines} lyric lines)")

    # Step 2: Build and run ffmpeg
    output_path = output_dir / f"{args.name}.mp4"
    dur = get_audio_duration(audio_path)

    print(f"\n📋 Audio:    {audio_path} ({dur:.1f}s)")
    print(f"📋 Lyrics:   {lrc_path}")
    print(f"📋 ASS:      {ass_path}")
    print(f"📋 Output:   {output_path}")
    print(f"📋 BG Color: {args.bg_color}")
    print(f"📋 FFmpeg:   {ffmpeg_bin}")
    print(f"📋 ASS filter available: {has_ass}")
    print(f"📋 Subtitles filter available: {has_subtitles}")

    cmd = build_cmd(ffmpeg_bin, audio_path, ass_path, output_path, args.bg_color, dur)
    success = run(cmd)

    if success:
        size_kb = output_path.stat().st_size // 1024
        print(f"\n🎉 Done! Lyric video created:")
        print(f"   📄 {output_path} ({size_kb} KB, {dur:.1f}s)")
    else:
        print("\n❌ Video generation failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
