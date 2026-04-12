// Lyrics Timeline Helper
// Features:
//  - Real-time lyric highlighting based on audio playback
//  - Pin button to set/update timestamp for each lyric line
//  - Mark timestamps for unmarked lines
//  - Export to LRC format
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

  let marking = false;
  let marks = []; // {time, text}
  let currentRowIndex = 0;

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

  // Update real-time lyric display and table highlight
  function updateCurrentLyric() {
    if (!audio.src && !audioInput.files[0]) {
      currentLyricText.textContent = '按下播放開始...';
      return;
    }

    const currentTime = audio.currentTime;
    const rows = getLyricRows();

    // Find the current row based on time
    let activeRow = rows[0];
    for (const row of rows) {
      const rowTime = parseFloat(row.dataset.time);
      if (currentTime >= rowTime) {
        activeRow = row;
      } else {
        break;
      }
    }

    // Update table highlight
    rows.forEach(row => row.classList.remove('current'));
    activeRow.classList.add('current');

    // Scroll into view
    activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update display
    const lyricText = activeRow.querySelector('td:nth-child(2)').textContent;
    currentLyricText.textContent = lyricText;

    // Update mark button state
    currentRowIndex = rows.indexOf(activeRow);
  }

  // Set up audio file input
  audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audio.src = url;
    marks = []; // Reset marks when new file loaded
    marksList.innerHTML = '';
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
    if (!audio.src && !audioInput.files[0]) {
      alert('請先載入音訊檔');
      return;
    }

    const rows = getLyricRows();
    if (rows.length === 0) return;

    // If marking mode, mark sequentially; otherwise mark current line
    let targetRow;
    if (marking) {
      targetRow = rows[Math.min(currentRowIndex, rows.length - 1)];
    } else {
      targetRow = rows[Math.min(currentRowIndex, rows.length - 1)];
    }

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
      if (!audio.src && !audioInput.files[0]) {
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
        // Update marks list
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
      allLines.push({ time, text });
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

    if (audio.src || audioInput.files[0]) {
      audio.currentTime = time;
      audio.play();
    }
  });

  // Initialize: highlight first row
  updateCurrentLyric();
})();
