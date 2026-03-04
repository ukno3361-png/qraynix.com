(() => {
    const root = document.getElementById('music-app');
    if (!root) return;

    const tracksNode = document.getElementById('music-tracks-json');
    const tracks = JSON.parse(tracksNode?.textContent || '[]');
    if (!tracks.length) return;

    const audio = document.getElementById('music-audio');
    const cover = document.getElementById('music-cover');
    const titleEl = document.getElementById('music-title');
    const artistEl = document.getElementById('music-artist');
    const albumEl = document.getElementById('music-album');
    const notesEl = document.getElementById('music-notes');
    const currentEl = document.getElementById('music-current');
    const durationEl = document.getElementById('music-duration');
    const seek = document.getElementById('music-seek');
    const volume = document.getElementById('music-volume');
    const btnRestart = document.getElementById('music-restart');
    const btnPrev = document.getElementById('music-prev');
    const btnPlay = document.getElementById('music-play');
    const btnNext = document.getElementById('music-next');
    const btnForward = document.getElementById('music-forward');
    const playlist = document.getElementById('music-playlist');
    const eqCanvas = document.getElementById('music-eq');
    const eqCtx = eqCanvas.getContext('2d');

    const fallbackCover = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#1a1712"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#c9a84c" font-family="Cinzel" font-size="56">♫</text></svg>');

    let index = 0;
    let raf = null;
    let analyser = null;
    let dataArray = null;

    const formatTime = (sec) => {
        if (!Number.isFinite(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const renderPlaylist = () => {
        playlist.innerHTML = '';
        tracks.forEach((track, i) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = `music-track-item ${i === index ? 'active' : ''}`;
            row.innerHTML = `<strong>${track.title || 'Untitled'}</strong><span>${track.artist || 'Unknown artist'}</span>`;
            row.addEventListener('click', () => {
                loadTrack(i, true);
            });
            playlist.appendChild(row);
        });
    };

    const ensureAudioGraph = () => {
        if (analyser) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;

        const audioCtx = new Ctx();
        const source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    };

    const drawEq = () => {
        if (!eqCtx) return;
        eqCtx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);

        if (!analyser || audio.paused) {
            const barW = 8;
            const gap = 5;
            const bars = Math.floor(eqCanvas.width / (barW + gap));
            for (let i = 0; i < bars; i++) {
                const h = 8 + Math.sin((Date.now() / 300) + i) * 5;
                const x = i * (barW + gap);
                const y = eqCanvas.height - h;
                eqCtx.fillStyle = 'rgba(201, 168, 76, 0.25)';
                eqCtx.fillRect(x, y, barW, h);
            }
            raf = requestAnimationFrame(drawEq);
            return;
        }

        analyser.getByteFrequencyData(dataArray);
        const barW = (eqCanvas.width / dataArray.length) - 2;
        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 255;
            const h = Math.max(4, v * eqCanvas.height * 0.95);
            const x = i * (barW + 2);
            const y = eqCanvas.height - h;
            eqCtx.fillStyle = i % 3 === 0 ? 'rgba(240, 192, 96, 0.85)' : 'rgba(201, 168, 76, 0.65)';
            eqCtx.fillRect(x, y, barW, h);
        }

        raf = requestAnimationFrame(drawEq);
    };

    const loadTrack = (nextIndex, autoplay = false) => {
        index = ((nextIndex % tracks.length) + tracks.length) % tracks.length;
        const track = tracks[index];

        audio.src = track.audio_url;
        cover.src = track.cover_url || fallbackCover;
        titleEl.textContent = track.title || 'Untitled';
        artistEl.textContent = track.artist || 'Unknown artist';
        albumEl.textContent = track.album || 'Unknown album';
        notesEl.textContent = track.notes || 'No notes for this track yet.';
        seek.value = 0;
        currentEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        btnPlay.textContent = '▶ Play';

        renderPlaylist();

        if (autoplay) {
            ensureAudioGraph();
            audio.play().then(() => {
                btnPlay.textContent = '⏸ Pause';
            }).catch(() => {});
        }
    };

    btnPlay.addEventListener('click', () => {
        if (audio.paused) {
            ensureAudioGraph();
            audio.play().then(() => {
                btnPlay.textContent = '⏸ Pause';
            }).catch(() => {});
        } else {
            audio.pause();
            btnPlay.textContent = '▶ Play';
        }
    });

    btnPrev.addEventListener('click', () => loadTrack(index - 1, true));
    btnNext.addEventListener('click', () => loadTrack(index + 1, true));
    btnRestart.addEventListener('click', () => {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        btnPlay.textContent = '⏸ Pause';
    });
    btnForward.addEventListener('click', () => {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
    });

    audio.addEventListener('timeupdate', () => {
        currentEl.textContent = formatTime(audio.currentTime);
        if (audio.duration) {
            seek.value = (audio.currentTime / audio.duration) * 100;
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        loadTrack(index + 1, true);
    });

    seek.addEventListener('input', () => {
        if (!audio.duration) return;
        const pct = parseFloat(seek.value) / 100;
        audio.currentTime = pct * audio.duration;
    });

    volume.addEventListener('input', () => {
        audio.volume = parseFloat(volume.value);
    });

    loadTrack(0, false);
    audio.volume = parseFloat(volume.value);
    drawEq();

    window.addEventListener('beforeunload', () => {
        if (raf) cancelAnimationFrame(raf);
    });
})();
