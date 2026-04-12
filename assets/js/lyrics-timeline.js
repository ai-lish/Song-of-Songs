// Very small lyrics timeline helper
// Usage: load audio file via input#audioFile, play, then press "Mark Timestamp" to capture current time
// Export: LRC format (timestamped lines)
(() => {
  const audioInput = document.getElementById('audioFile');
  const audio = document.getElementById('audio');
  const startBtn = document.getElementById('startMark');
  const markBtn = document.getElementById('mark');
  const exportBtn = document.getElementById('exportLRC');
  const lyricsText = document.getElementById('lyricsText');
  const marksList = document.getElementById('marksList');

  let marks = []; // {time, text}
  let marking = false;
  let currentLine = 0;
  const lines = lyricsText.innerText.trim().split(/\n\n|\n/).map(l=>l.trim()).filter(Boolean);

  audioInput.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    audio.src = url;
  });

  startBtn.addEventListener('click', ()=>{
    marking = !marking;
    startBtn.textContent = marking? 'Stop Marking' : 'Start Marking';
  });

  markBtn.addEventListener('click', ()=>{
    if(!audio.src){ alert('請先載入音訊檔'); return; }
    const t = audio.currentTime;
    const line = lines[Math.min(currentLine, lines.length-1)] || '';
    marks.push({time: t, text: line});
    const li = document.createElement('li');
    li.textContent = `${formatTime(t)} — ${line}`;
    marksList.appendChild(li);
    currentLine += 1;
  });

  exportBtn.addEventListener('click', ()=>{
    if(marks.length===0){ alert('無標記'); return; }
    const lrc = marks.map(m => `[${lrcTimestamp(m.time)}]${m.text}`).join('\n');
    const blob = new Blob([lrc], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revival-of-light.lrc';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  function formatTime(sec){
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }
  function lrcTimestamp(sec){
    const mm = Math.floor(sec/60).toString().padStart(2,'0');
    const ss = Math.floor(sec%60).toString().padStart(2,'0');
    const cs = Math.floor((sec - Math.floor(sec))*100).toString().padStart(2,'0');
    return `${mm}:${ss}.${cs}`;
  }
})();
