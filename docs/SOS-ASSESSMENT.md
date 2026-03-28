# Song-of-Songs 歌詞影片模組評估報告

**評估者**: 小詩 (Researcher/Analyst)
**日期**: 2026-03-28
**模組**: `lyrics-video/`

---

## 📋 現有資產

| 檔案 | 狀態 | 備註 |
|------|------|------|
| `lrc2ass.py` | ✅ 可用 | 21行歌詞轉換正確 |
| `generate_video.py` | ⚠️ 需音頻才能測試 | CLI完整，邏輯基本正確 |
| `sample.lrc` | ⚠️ 示範歌詞 | 21行，時間軸為假設值（非實際歌曲） |
| `sample.ass` | ✅ 已生成 | 21條Dialogue，格式正確 |
| `test_full.mp4` | ❌ 不存在 | PROGRESS.md聲稱存在，但repo中找不到 |
| `audio/Step1_latest.m4a` | ❌ 不存在 | 關鍵依賴缺失 |

---

## 🔬 測試結果

### lrc2ass.py
```
✅ Converted: sample.lrc → test_output.ass
   Lines processed: 21
```
轉換正常。ASS格式符合v4.00+，時間戳`H:MM:SS.cc`正確。

### ffmpeg 環境
- **ffmpeg** (regular): 8.1, 缺少`libass` → **無法燃燒字幕**
- **ffmpeg-full**: 8.1, 含`--enable-libass` → **✅ 可用**
- `generate_video.py`的`get_ffmpeg()`正確找到`/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg`

### 未能執行完整測試的原因
**音頻檔案 `audio/Step1_latest.m4a` 不存在**。無法驗證視頻生成流程是否 end-to-end 正確。

---

## 🚨 關鍵技術缺口

### 1. 音頻檔案缺失（P0 - 阻斷性）
`audio/Step1_latest.m4a` 不在repo中，也不在本地檔案系統中。沒有音頻就無法生成實際影片。這是當前最大的 blocker。

### 2. 測試影片 `test_full.mp4` 不存在（P1）
PROGRESS.md 聲稱已生成 `test_full.mp4 (139.8s, 4320KB)`，但 `lyrics-video/output/` 目錄根本不存在，repo中也找不到此檔案。如果師弟曾經生成過，可能是：
- 生成了但沒有commit
- 用的是缺少libass的普通ffmpeg（字幕沒有實際燒進去）

### 3. 硬編碼行時長 = 5秒（P1）
```python
duration = 5.0  # default duration per line
```
`lrc2ass.py` 對每行歌詞固定5秒。實際歌曲每行時長差異很大（如[00:12.00]到[00:16.50]是4.5秒，但[00:35.00]到[01:02.00]是27秒空檔）。需要從LRC相鄰時間戳計算真實時長。

### 4. 純色背景 = 無視覺吸引力（P1）
```python
"-f", "lavfi", "-i", f"color=c={bg_color}:s=1920x1080:d={dur:.1f}:r=30",
```
當前只是深紫色純色背景。YouTube詩歌頻道競爭激烈，純色背景不符合頻道風格需求。

### 5. 無 karaoke/highlight 效果（P2）
ASS樣式只有基本outline，沒有用ASS的`\k`（karaoke）標籤做逐字/逐句高亮。敬拜詩歌影片的標配是歌詞逐步高亮。

### 6. 缺少字體Fallback（P2）
指定 `font_name="Arial"`，但Arial在macOS上的中文渲染較差。應該指定中文字體如`PingFang SC`、`Noto Sans CJK TC`並提供fallback。

### 7. 無錯誤處理 / 參數驗證（P2）
- 沒有try-except包裝音頻獲取
- LRC解析遇到空行/格式異常會靜默跳過
- 音頻解碼失敗時只給定140.0s預設值，沒有任何警告

### 8. 無 dependency 宣告（P2）
沒有 `requirements.txt` 或 `pyproject.toml`。依賴只有Python 3標準庫（`re`, `pathlib`, `subprocess`, `shutil`, `argparse`），但文檔應說明ffmpeg-full是必要條件。

---

## 🏆 Top 3 立即行動

### 行動 1：確認音頻檔案位置並完成端到端測試
**負責人**: T仔或師弟
**理由**: 當前無法驗證整個pipeline是否真正work。音頻檔案是 blocker。

**具體步驟**:
1. 確認 `Step1_latest.m4a` 的實際位置（下載了？還沒下載？）
2. 如果音頻已存在 → 放到正確路徑，立即跑一次 `generate_video.py`
3. 如果音頻不存在 → 確認下載流程/URL，更新 PROGRESS.md
4. **必須commit生成的 test_full.mp4 到repo**，這樣團隊每個人都能驗證

**成功標準**: 生成包含正確燃燒字幕的 MP4，字幕時間軸與音頻對得上

---

### 行動 2：修復 LRC 時間軸邏輯
**負責人**: 師弟
**理由**: 硬編碼5秒/行會導致長間奏時字幕「等太久」或「消失太快」，明顯錯誤。

**修復方向**:
```python
# 正確做法：用下一行的時間戳計算當前行結束時間
for i, start in enumerate(start_times):
    if i < len(start_times) - 1:
        end = start_times[i + 1]  # 下一行的開始時間
    else:
        end = start + 5.0  # 最後一行保留5秒default

    # 額外處理：空時間標籤行（如 [00:30.00] = 純間奏）
    if text == "":
        continue  # 或給予適當的啞行樣式
```

**成功標準**: sample.lrc 中 `[01:02.00] 主的愛比天更高` 到 `[01:06.50] 主的恩比海更深` 這個4.5秒段落被正確處理，不是5秒

---

### 行動 3：設計視覺背景方案
**負責人**: 畫家 + 師弟
**理由**: 純色背景無法用於實際YouTube發布。詩歌頻道需要情感氛圍。

**選項分析**:

| 方案 | 可行性 | 工作量 | 缺點 |
|------|--------|--------|------|
| AI生成抽象背景圖（每首歌一張） | 高 | 中 | 需測試合適的prompt |
| 聖經/大自然Stock圖 | 高 | 低 | 版權風險 |
| 粒子/光效動態背景 | 中 | 高 | ffmpeg filter復雜 |
| 每首歌定制背景圖（畫家負責） | 中 | 高 | 無法完全自動化 |

**建議**: 短期用「每首歌一張AI生成背景圖」，通過ffmpeg的`overlay`或`movie` filter疊加。長期考慮動態背景。

**成功標準**: 生成的MP4有視覺吸引力（不只是純色），且仍保留歌詞疊加

---

## 📊 補充觀察

- **90-95%可行性評估合理** — 技術上只要音頻+歌詞到位，ffmpeg-full可以完成影片生成
- **歌詞來源仍需確認** — sample.lrc是示範內容，真實歌曲需要從師弟那邊確認LRC格式和來源
- **輸出格式單一** — 目前只有1920x1080 MP4，未來可能需要不同解析度/格式
- **ASS樣式可改進** — 可以增加gradient、shadow depth、動畫效果（ASS支持`\t`動畫標籤）

---

*報告完*
