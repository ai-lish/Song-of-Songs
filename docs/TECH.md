# 歌詞影片技術方案

## 音頻素材確認

- **檔案**: `audio/Step1_latest.m4a`
- **時長**: 139.8 秒（2分20秒）
- **格式**: AAC 44.1kHz 立體聲，108kbps
- **容器**: M4A (MP4)
- **無需轉碼** — ffmpeg 可直接使用 M4A 作為輸入

---

## 技術方案架構

### 歌詞檔案格式：LRC + ASS

| 格式 | 用途 | 優缺點 |
|------|------|--------|
| **LRC** | 原始歌詞格式 | 純文字、易編輯、無樣式 |
| **ASS** | ffmpeg 字幕渲染 | 支持彩色、位置、動畫效果 |
| **SRT** | 通用字幕格式 | 支援廣但功能少 |

**方案**: 歌詞以 LRC 存儲 → 轉換為 ASS → ffmpeg 燒錄進 MP4

### 歌詞時間軸對齊

**兩種模式**：

1. **手動對齊（推薦先用）**  
   - 由人工在 LRC 檔案中標記 `[mm:ss.xx]` 時間標籤  
   - 適用於：已知歌詞內容，可逐行對時

2. **Whisper 自動對齊（未來擴展）**  
   - 使用 OpenAI Whisper 自動生成時間軸  
   - 需要歌詞文本餵入對齊  
   - 適用於：沒有人工對時的原始音頻

### 影片生成方式：ffmpeg + ASS 字幕

**核心思路**：
```
音頻 (M4A) + 背景圖/漸層 + ASS 字幕 → MP4 影片
```

**三種字幕疊加方式對比**：

| 方式 | 命令複雜度 | 字幕效果 | 推薦場景 |
|------|-----------|----------|----------|
| `drawtext` filter | 中 | 單色、位置固定 | 快速測試 |
| **ASS subtitle** | 低 | 彩色、位置、淡入淡出、卡拉OK效果 | **主力方案** |
| `subtitles` filter | 低 | SRT/ASS 燒錄 | 替換方案 |

**推薦方案：ASS + `subtitles` filter**

---

## 實作流程

```
Step 1: 準備歌詞 (LRC)
    ↓
Step 2: 轉換為 ASS 格式（含樣式）
    ↓
Step 3: 準備背景（漸層圖 / 抽象視覺）
    ↓
Step 4: ffmpeg 合成 MP4
```

### Step 1 — 準備歌詞 (LRC)

格式範例：
```lrc
[00:12.00]耶穌道路 何等寬廣
[00:16.50]主恩如江河 滋潤我心
[00:21.00]我要讚美 直到永遠
```

### Step 2 — 轉換為 ASS 樣式檔

使用 Python 脚本 `lrc2ass.py` 轉換，包含：
- 字幕位置（底部居中 or 中央）
- 字體大小：48-64px
- 卡拉 OK 漸變效果（当前行高亮）
- 淡入淡出動畫
- 背景模糊

### Step 3 — 準備背景

方案 A：**固態顏色 + 簡單漸層**（最簡單）
- ffmpeg 內建即可生成

方案 B：**抽象幾何背景**（推薦）
- Python PIL 生成彩色漸層
- 或使用 Unsplash 免費圖片作為背景

方案 C：**音頻波形視覺化**（未來擴展）
- ffmpeg `showwaves` filter
- 波形作為動態背景

### Step 4 — ffmpeg 合成

**命令參考**：
```bash
ffmpeg -y \
  -loop 1 -i background.png \
  -i audio/Step1_latest.m4a \
  -vf "ass=lyrics.ass,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset fast -crf 18 \
  -c:a copy \
  -shortest \
  output/lyrics_video.mp4
```

**或使用 `subtitles` filter（燒錄 ASS）**：
```bash
ffmpeg -y \
  -i background.png \
  -i audio/Step1_latest.m4a \
  -filter_complex "[0:v][1:a][2:v]ass=lyrics.ass[out]" \
  -map "[out]" -map "1:a" \
  output/lyrics_video.mp4
```

---

## 目錄結構

```
song-of-songs/
├── audio/
│   └── Step1_latest.m4a        # 輸入音頻
├── lyrics-video/               # 本模組工作目錄
│   ├── lrc2ass.py              # LRC → ASS 轉換脚本
│   ├── generate_video.py       # 主生成脚本（整合流程）
│   ├── sample.ass              # 範例 ASS 字幕檔
│   ├── sample.lrc              # 範例 LRC 歌詞
│   └── output/                 # 輸出影片
├── docs/
│   └── TECH.md                 # 本技術文檔
└── README.md
```

---

## 歌詞卡拉OK樣式 ASS 範例

```ass
[Script Info]
Title: Song of Songs Lyrics
ScriptType: v4.00+
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,54,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,2,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Text
Dialogue: 0,0:00:12.00,0:00:16.50,Default,耶穌道路 何等寬廣
Dialogue: 0,0:00:16.50,0:00:21.00,Default,主恩如江河 滋潤我心
```

---

## 技術棧

| 工具 | 用途 | 安裝方式 |
|------|------|----------|
| **ffmpeg** | 影片合成、格式轉換 | `brew install ffmpeg` |
| **Python 3** | 腳本自動化 | 系統內建 |
| **Pillow** | 背景圖生成 | `pip install pillow` |
| **lrc-parse** | LRC 解析 | `pip install lrc-parse` (可選) |

---

## 下一步行動

- [ ] 師弟：撰寫 `lrc2ass.py` 轉換脚本
- [ ] 師弟：撰寫 `generate_video.py` 主脚本
- [ ] 師弟：生成測試用的 sample.ass / sample.lrc
- [ ] T仔：提供測試歌詞內容（確認歌曲名稱、完整歌詞）
- [ ] 書記：更新 PROGRESS.md 進度
- [ ] 畫家：設計背景視覺風格（待確認）

---

*最後更新: 2026-03-28 21:40*
