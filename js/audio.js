async function toggleStudentRecording(btn, phrase) {
    const RECORD_MAX_MS = 30000;
    
    if (state.isRecording) {
        _stopRecording(btn, phrase);
        return;
    }

    try {
        window.speechSynthesis.cancel();
        if (state.currentlyPlayingAudio) {
            state.currentlyPlayingAudio.pause();
            state.currentlyPlayingAudio = null;
        }
        if (state.activeRecordingSource) {
            try { state.activeRecordingSource.stop(); } catch(e){}
            state.activeRecordingSource = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.activeAudioStream = stream;
        currentAudioChunks = [];
        
        state.mediaRecorder = new MediaRecorder(stream);
        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) currentAudioChunks.push(e.data);
        };
        
        state.mediaRecorder.onstop = async () => {
            const blob = new Blob(currentAudioChunks, { type: 'audio/webm' });
            try {
                const arrayBuffer = await blob.arrayBuffer();
                const ctx = state.voiceContext || new (window.AudioContext || window.webkitAudioContext)();
                if (!state.voiceContext) state.voiceContext = ctx;
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                const trimmedBuffer = trimSilence(audioBuffer, 0.015);
                if (trimmedBuffer) {
                    state.recordings[phrase] = trimmedBuffer;
                    const card = btn.closest('.phrase-card');
                    if (card) {
                        const playBtn = card.querySelector('.play-record-btn');
                        if (playBtn) playBtn.style.display = 'inline-block';
                    }
                }
            } catch (err) {
                console.error("Error processing recording:", err);
            }
        };
        
        state.mediaRecorder.start();
        state.isRecording = true;
        
        btn.innerHTML = '<span>🛑</span><div class="record-progress"></div>';
        btn.classList.add('btn-recording');
        
        const card = btn.closest('.phrase-card');
        if (card) {
            const playBtn = card.querySelector('.play-record-btn');
            if (playBtn) playBtn.style.display = 'none';
        }
        
        const startTime = Date.now();
        _startProgressBar(btn, startTime, RECORD_MAX_MS);
        
        state.recordingTimeout = setTimeout(() => {
            if (state.isRecording) _stopRecording(btn, phrase);
        }, RECORD_MAX_MS);
        
    } catch (err) {
        console.error("Microphone access denied:", err);
        openAppModal({ title: 'Microphone Required', text: 'Please allow microphone access to record your pronunciation.', mode: 'view' });
    }
}

function _startProgressBar(btn, startTime, maxMs) {
    const progress = btn.querySelector('.record-progress');
    if (!progress) return;
    function frame() {
        if (!state.isRecording) { progress.style.width = '0%'; return; }
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / maxMs) * 100);
        progress.style.width = pct + '%';
        if (elapsed < maxMs) state.recordingAnimFrame = requestAnimationFrame(frame);
    }
    state.recordingAnimFrame = requestAnimationFrame(frame);
}

function _stopRecording(btn, phrase) {
    if (state.recordingTimeout) { clearTimeout(state.recordingTimeout); state.recordingTimeout = null; }
    if (state.recordingAnimFrame) { cancelAnimationFrame(state.recordingAnimFrame); state.recordingAnimFrame = null; }
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') state.mediaRecorder.stop();
    state.isRecording = false;
    btn.innerHTML = '<span>🎤</span>';
    btn.classList.remove('btn-recording');
    const card = btn.closest('.phrase-card');
    if (card && state.recordings[phrase]) {
        const playBtn = card.querySelector('.play-record-btn');
        if (playBtn) playBtn.style.display = 'block';
    }
    if (state.activeAudioStream) {
        state.activeAudioStream.getTracks().forEach(track => track.stop());
        state.activeAudioStream = null;
    }
}