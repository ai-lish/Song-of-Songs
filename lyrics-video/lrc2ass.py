#!/usr/bin/env python3
"""
LRC → ASS Converter for Song-of-Songs lyric videos.
Converts timed LRC lyrics to ASS subtitle format with karaoke styling.
"""

import re
import sys
from pathlib import Path


def parse_time(time_str: str) -> float:
    """Parse LRC time tag [mm:ss.xx] to seconds."""
    # Remove brackets
    time_str = time_str.strip("[]")
    parts = time_str.split(":")
    if len(parts) == 2:
        minutes = int(parts[0])
        seconds = float(parts[1])
        return minutes * 60 + seconds
    return 0.0


def format_ass_time(seconds: float) -> str:
    """Format seconds to ASS timestamp H:MM:SS.cc"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours}:{minutes:02d}:{secs:05.2f}"


def lrc_to_ass(
    lrc_content: str,
    title: str = "Song of Songs",
    font_size: int = 54,
    font_name: str = "Arial",
    primary_color: str = "&H00FFFFFF",  # White
    outline_color: str = "&H00000000",   # Black outline
    alignment: int = 5,  # 5 = center-bottom
) -> str:
    """Convert LRC content to ASS format."""

    lines = lrc_content.strip().split("\n")

    ass = []
    ass.append("[Script Info]")
    ass.append(f"Title: {title}")
    ass.append("ScriptType: v4.00+")
    ass.append("PlayDepth: 0")
    ass.append("")
    ass.append("[V4+ Styles]")
    ass.append(
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding"
    )
    ass.append(
        f"Style: Default,{font_name},{font_size},{primary_color},"
        f"&H008080FF,{outline_color},&H80000000,"
        f"-1,0,0,0,100,100,0,0,1,2,2,{alignment},10,10,10,1"
    )
    ass.append("")
    ass.append("[Events]")
    ass.append("Format: Layer, Start, End, Style, Text")
    ass.append("")

    duration = 5.0  # default duration per line

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Match LRC time tags: [mm:ss.xx] or [mm:ss]
        time_tags = re.findall(r"\[\d+:\d+(?:\.\d+)?\]", line)
        if not time_tags:
            continue

        # Extract the lyric text (remove all time tags)
        text = re.sub(r"\[\d+:\d+(?:\.\d+)?\]", "", line).strip()
        if not text:
            continue

        # Handle multiple time tags on same line (same text at different times)
        start_times = [parse_time(tag) for tag in time_tags]

        for i, start in enumerate(start_times):
            end = start + duration
            # For last line, set a long duration
            if i < len(start_times) - 1:
                end = start_times[i + 1]

            start_ass = format_ass_time(start)
            end_ass = format_ass_time(end)

            ass.append(f"Dialogue: 0,{start_ass},{end_ass},Default,{text}")

    return "\n".join(ass)


def main():
    if len(sys.argv) < 3:
        print("Usage: python lrc2ass.py <input.lrc> <output.ass>")
        sys.exit(1)

    lrc_path = Path(sys.argv[1])
    ass_path = Path(sys.argv[2])

    lrc_content = lrc_path.read_text(encoding="utf-8")

    title = lrc_path.stem  # use filename as title
    ass_content = lrc_to_ass(lrc_content, title=title)

    ass_path.write_text(ass_content, encoding="utf-8")
    print(f"✅ Converted: {lrc_path} → {ass_path}")
    print(f"   Lines processed: {ass_content.count('Dialogue:')}")


if __name__ == "__main__":
    main()
