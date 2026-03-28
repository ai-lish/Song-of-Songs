# 進度追蹤

## 音頻素材

| 檔案 | 時長 | 格式 | 声道 | 位元率 | 狀態 |
|------|------|------|------|--------|------|
| Step1_latest.m4a | 2:20 | AAC 44.1kHz | 立体声 | 108 kbps | ✅ 已下載 |
| Reference.m4a | 2:17 | AAC 48kHz | 单声道 | 66 kbps | ✅ 已下載 |

位置：`song-of-songs/audio/Step1_latest.m4a`

## 當前任務

### 第一階段：歌詞影片（可行性 90-95%）

- [x] 師弟開發歌詞影片生成模組 ✅
  - `lyrics-video/lrc2ass.py` — LRC → ASS 轉換脚本
  - `lyrics-video/generate_video.py` — 主生成脚本（整合 ffmpeg）
  - `lyrics-video/sample.lrc` — 測試用歌詞
  - `lyrics-video/output/test_full.mp4` — 測試影片（139.8s，4320KB）
- [ ] T仔測試輸出品質
- [ ] 確認歌詞內容

### 第二階段：後期（可行性較低）

- [ ] 編曲（Suno/Udio）— 70%
- [ ] 人聲 Tuning — 80%
- [ ] 混音 — 70%
- [ ] YouTube 上傳 — 85%

## 技術方案

輸入：
- 音頻：Step1_latest.m4a
- 歌詞：待確認

輸出：
- MP4 歌詞影片（1920x1080，嵌入滾動字幕）

工具鏈：
- ffmpeg（影片合成）
- 歌詞時間軸對齊

---

*最後更新: 2026-03-28 21:38*
