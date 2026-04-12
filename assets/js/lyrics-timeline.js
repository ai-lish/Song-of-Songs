// Lyrics Timeline Helper with MV Image Display
// Features:
//  - Real-time lyric highlighting based on audio playback
//  - MV images change according to current time
//  - Pin button to set/update timestamp for each lyric line
//  - Mark timestamps for unmarked lines
//  - Export to LRC format
//  - NO auto-scroll of lyrics table (highlight stays in place)
(() => {
  const audioInput = document.getElementById('audioFile');
  const audio = document.getElementById('audio');
  const startMarkBtn = document.getElementById('startMark');
  const markBtn = document.getElementById('mark');
  const exportBtn = document.getElementById('exportLRC');
  const resetBtn = document.getElementById('resetMarks');
  const marksList = document.getElementById('marksList');
  const currentLyricText = document.getElementById('currentLyricText');
  const lyricsTable = document.getElementById('lyricsTable');
  const mvImage = document.getElementById('mvImage');
  const mvImageNum = document.getElementById('mvImageNum');

  let marking = false;
  let marks = []; // {time, text}
  let currentRowIndex = 0;
  let lastActiveIndex = -1;
  let lastImageIndex = -1;

  // MV Image URLs (17 images, 21 time entries)
  // 每張圖約5秒，後面副歌重複歌詞 reuse 圖片
  const mvImages = [
    { num: 1,  timeStart: 0,     timeEnd: 13.51, url: '../assets/mv/mv-01.png' },   // 0:00
    { num: 2,  timeStart: 13.51, timeEnd: 15.99, url: '../assets/mv/mv-02.png' },   // 0:13 沉睡
    { num: 3,  timeStart: 15.99, timeEnd: 20.18, url: '../assets/mv/mv-03.png' },   // 0:15 萬物甦醒
    { num: 4,  timeStart: 20.18, timeEnd: 22.44, url: '../assets/mv/mv-04.png' },   // 0:20 比你創立
    { num: 5,  timeStart: 22.44, timeEnd: 26.28, url: '../assets/mv/mv-05.png' },   // 0:22 還要更大
    { num: 6,  timeStart: 26.28, timeEnd: 28.41, url: '../assets/mv/mv-06.png' },   // 0:26 你說有光
    { num: 7,  timeStart: 28.41, timeEnd: 32.05, url: '../assets/mv/mv-07.png' },   // 0:28 星辰節令
    { num: 8,  timeStart: 32.05, timeEnd: 34.48, url: '../assets/mv/mv-08.png' },   // 0:32 一切都是
    { num: 9,  timeStart: 34.48, timeEnd: 38.86, url: '../assets/mv/mv-09.png' },   // 0:34 只為今日
    { num: 10, timeStart: 38.86, timeEnd: 43.74, url: '../assets/mv/mv-10.png' },   // 0:38 復活的主
    { num: 11, timeStart: 43.74, timeEnd: 46.99, url: '../assets/mv/mv-11.png' },   // 0:43 黑暗盡散
    { num: 12, timeStart: 46.99, timeEnd: 50.29, url: '../assets/mv/mv-12.png' },   // 0:46 你牽我
    { num: 13, timeStart: 50.29, timeEnd: 55.68, url: '../assets/mv/mv-13.png' },   // 0:50 進入你永遠
    { num: 14, timeStart: 55.68, timeEnd: 58.52, url: '../assets/mv/mv-14.png' },   // 0:55 你用話語
    { num: 15, timeStart: 58.52, timeEnd: 61.34, url: '../assets/mv/mv-15.png' },   // 0:58 你用慈愛
    { num: 16, timeStart: 61.34, timeEnd: 63.94, url: '../assets/mv/mv-16.png' },   // 1:01 復活的喜樂
    { num: 17, timeStart: 63.94, timeEnd: 65.72, url: '../assets/mv/mv-17.png' },   // 1:03 新的創造
    // Chorus repetitions (reuse images)
    { num: 18, timeStart: 65.72, timeEnd: 67.93, url: '../assets/mv/mv-16.png' },   // 1:05 一切星辰
    { num: 19, timeStart: 67.93, timeEnd: 70.95, url: '../assets/mv/mv-17.png' },   // 1:07 節令更迭
    { num: 20, timeStart: 70.95, timeEnd: 74.48, url: '../assets/mv/mv-11.png' },   // 1:10 萬物都在 → 黑暗盡散 reuse
    { num: 21, timeStart: 74.48, timeEnd: 78.91, url: '../assets/mv/mv-12.png' },   // 1:14 看見永遠 → 你牽我 reuse
    { num: 22, timeStart: 78.91, timeEnd: 83.69, url: '../assets/mv/mv-13.png' },   // 1:18 復活的主 → 進入你永遠 reuse
    { num: 23, timeStart: 83.69, timeEnd: 86.97, url: '../assets/mv/mv-14.png' },   // 1:23 黑暗盡散2 → 你用話語 reuse
    { num: 24, timeStart: 86.97, timeEnd: 90.28, url: '../assets/mv/mv-15.png' },   // 1:26 你牽我2 → 你用慈愛 reuse
    { num: 25, timeStart: 90.28, timeEnd: 95.72, url: '../assets/mv/mv-16.png' },   // 1:30 進入你永遠2 → 復活的喜樂 reuse
    { num: 26, timeStart: 95.72, timeEnd: 100.17, url: '../assets/mv/mv-17.png' },  // 1:35 永遠的愛 → 新的創造 reuse
    { num: 27, timeStart: 100.17, timeEnd: 102.30, url: '../assets/mv/mv-13.png' }, // 1:40 你用復活開啟 → 進入你永遠 reuse
    { num: 28, timeStart: 102.30, timeEnd: 105.79, url: '../assets/mv/mv-14.png' }, // 1:42 我不再懼怕 → 你用話語 reuse
    { num: 29, timeStart: 105.79, timeEnd: 110.69, url: '../assets/mv/mv-15.png' }, // 1:45 因你是 → 你用慈愛 reuse
    { num: 30, timeStart: 110.69, timeEnd: 115.34, url: '../assets/mv/mv-16.png' }, // 1:50 復活的主3 → 復活的喜樂 reuse
    { num: 31, timeStart: 115.34, timeEnd: 118.67, url: '../assets/mv/mv-17.png' }, // 1:55 黑暗盡散3 → 新的創造 reuse
    { num: 32, timeStart: 118.67, timeEnd: 121.95, url: '../assets/mv/mv-13.png' }, // 1:58 你牽我3 → 進入你永遠 reuse
    { num: 33, timeStart: 121.95, timeEnd: 125.67, url: '../assets/mv/mv-14.png' }, // 2:01 進入你永遠3 → 你用話語 reuse
  ];

  // Check if audio source is loaded
  function hasAudioSource() {
    return !!(
      audio &&
      (audio.currentSrc ||
        (audioInput && audioInput.files && audioInput.files.length > 0) ||
        audio.readyState > 0)
    );
  }

  // Get all lyric rows (excluding section headers which have no pin button)
  function getLyricRows() {
    return Array.from(lyricsTable.querySelectorAll('tr:not(.section-row)'));
  }

  // Format seconds to MM:SS
  function formatTime(sec) {
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Format seconds to LRC format [MM:SS.xx]
  function lrcTimestamp(sec) {
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = Math.floor(sec % 60).toString().padStart(2, '0');
    const cs = Math.floor((sec % 1) * 100).toString().padStart(2, '0');
    return `${mm}:${ss}.${cs}`;
  }

  // Get current image based on time
  function getCurrentImage(time) {
    for (const img of mvImages) {
      if (time >= img.timeStart && time < img.timeEnd) {
        return img;
      }
    }
    return mvImages[0]; // fallback to first image
  }

  // Update real-time lyric display, table highlight, and MV image
  function updateCurrentLyric() {
    // Always update MV image, even without audio
    const img = getCurrentImage(audio.currentTime || 0);
    if (lastImageIndex !== img.num) {
      if (mvImage && img) {
        mvImage.src = img.url;
        if (mvImageNum) {
          mvImageNum.textContent = `圖 ${img.num}/33 (實際 ${Math.min(img.num, 17)}/17)`;
        }
        lastImageIndex = img.num;
      }
    }

    // If no audio source loaded, show hint and skip lyric updates
    if (!hasAudioSource()) {
      currentLyricText.textContent = '按下播放開始...';
      return;
    }

    const currentTime = audio.currentTime;
    const rows = getLyricRows();
    if (!rows || rows.length === 0) {
      currentLyricText.textContent = '';
      return;
    }

    // Build array of {row, time} with valid numeric time
    const timedRows = rows.map((row, idx) => {
      const t = parseFloat(row.dataset.time);
      return { row, time: isFinite(t) ? t : null, idx };
    });

    // Sort by time (nulls last, maintain original order for equal times)
    timedRows.sort((a, b) => {
      if (a.time === null && b.time === null) return a.idx - b.idx;
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      return a.time - b.time;
    });

    // Find last row whose time <= currentTime
    let activeIndex = -1;
    for (let i = 0; i < timedRows.length; i++) {
      if (timedRows[i].time !== null && currentTime >= timedRows[i].time) {
        activeIndex = i;
      } else if (timedRows[i].time !== null && currentTime < timedRows[i].time) {
        break;
      }
    }

    // Fallback to first row if none found
    if (activeIndex < 0 && timedRows[0].time !== null) {
      activeIndex = 0;
    }

    const activeRow = timedRows[activeIndex >= 0 ? activeIndex : 0].row;

    // Only update DOM when active row changed
    if (lastActiveIndex !== activeIndex) {
      rows.forEach(r => r.classList.remove('current'));
      activeRow.classList.add('current');

      // NO auto-scroll - highlight stays in place
      // activeRow.scrollIntoView({ behavior: 'auto', block: 'center' }); // REMOVED

      const lyricText = activeRow.querySelector('td:nth-child(2)').textContent || '';
      currentLyricText.textContent = lyricText;

      currentRowIndex = rows.indexOf(activeRow);
      lastActiveIndex = activeIndex;
    }

    // MV image already updated at the top of this function
  }

  // Set up audio file input
  audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audio.src = url;
    marks = []; // Reset marks when new file loaded
    marksList.innerHTML = '';
    lastActiveIndex = -1; // Reset highlight state
    lastImageIndex = -1;
  });

  // Audio timeupdate event for real-time highlighting
  audio.addEventListener('timeupdate', updateCurrentLyric);

  // Toggle marking mode
  startMarkBtn.addEventListener('click', () => {
    marking = !marking;
    startMarkBtn.textContent = marking ? '⏹ 停止標記' : '🎯 開始標記';
    startMarkBtn.style.background = marking ? '#e74c3c' : '';
    startMarkBtn.style.color = marking ? 'white' : '';
  });

  // Mark current lyric timestamp
  markBtn.addEventListener('click', () => {
    if (!hasAudioSource()) {
      alert('請先載入音訊檔');
      return;
    }

    const rows = getLyricRows();
    if (rows.length === 0) return;

    const targetRow = rows[Math.min(currentRowIndex, rows.length - 1)];
    const t = audio.currentTime;
    const lyric = targetRow.querySelector('td:nth-child(2)').textContent;
    const timeCell = targetRow.querySelector('td.time');
    const pinBtn = targetRow.querySelector('.pin-btn');

    // Update the row's time
    targetRow.dataset.time = t;
    timeCell.textContent = formatTime(t);

    // Mark pin button as pinned
    if (pinBtn) {
      pinBtn.classList.add('pinned');
      pinBtn.textContent = '✓ 已扣';
    }

    // Add to marks list
    marks.push({ time: t, text: lyric });
    const li = document.createElement('li');
    li.style.padding = '4px 0';
    li.textContent = `[${formatTime(t)}] ${lyric}`;
    marksList.appendChild(li);

    // Move to next line
    if (marking && currentRowIndex < rows.length - 1) {
      currentRowIndex++;
    }
  });

  // Pin button click - set this row's time to current audio position
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!hasAudioSource()) {
        alert('請先播放音訊');
        return;
      }

      const row = e.target.closest('tr');
      const t = audio.currentTime;
      const timeCell = row.querySelector('td.time');
      const lyric = row.querySelector('td:nth-child(2)').textContent;

      // Update time
      row.dataset.time = t;
      timeCell.textContent = formatTime(t);

      // Mark as pinned
      e.target.classList.add('pinned');
      e.target.textContent = '✓ 已扣';

      // Add/update in marks
      const existingIndex = marks.findIndex(m => m.text === lyric);
      if (existingIndex >= 0) {
        marks[existingIndex].time = t;
        const listItems = marksList.querySelectorAll('li');
        listItems[existingIndex].textContent = `[${formatTime(t)}] ${lyric}`;
      } else {
        marks.push({ time: t, text: lyric });
        const li = document.createElement('li');
        li.style.padding = '4px 0';
        li.textContent = `[${formatTime(t)}] ${lyric}`;
        marksList.appendChild(li);
      }

      // Re-sort marks by time
      marks.sort((a, b) => a.time - b.time);
      marksList.innerHTML = '';
      marks.forEach(m => {
        const li = document.createElement('li');
        li.style.padding = '4px 0';
        li.textContent = `[${formatTime(m.time)}] ${m.text}`;
        marksList.appendChild(li);
      });
    });
  });

  // Export to LRC
  exportBtn.addEventListener('click', () => {
    const rows = getLyricRows();
    const allLines = [];

    rows.forEach(row => {
      const time = parseFloat(row.dataset.time);
      const text = row.querySelector('td:nth-child(2)').textContent;
      if (isFinite(time)) {
        allLines.push({ time, text });
      }
    });

    // Sort by time
    allLines.sort((a, b) => a.time - b.time);

    // Generate LRC
    const lrc = allLines.map(m => `[${lrcTimestamp(m.time)}]${m.text}`).join('\n');
    const blob = new Blob([lrc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revival-of-light.lrc';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Reset all marks
  resetBtn.addEventListener('click', () => {
    if (!confirm('確定要重置所有標記？')) return;
    marks = [];
    marksList.innerHTML = '';
    lastActiveIndex = -1;
    document.querySelectorAll('.pin-btn').forEach(btn => {
      btn.classList.remove('pinned');
      btn.textContent = '📌 扣';
    });
  });

  // Click on a row to seek to that time
  lyricsTable.addEventListener('click', (e) => {
    // Ignore clicks on buttons
    if (e.target.closest('button')) return;

    const row = e.target.closest('tr');
    if (!row) return;

    const time = parseFloat(row.dataset.time);
    if (isNaN(time)) return;

    if (hasAudioSource()) {
      audio.currentTime = time;
      audio.play();
    }
  });

  // Initialize: highlight first row
  updateCurrentLyric();
})();
