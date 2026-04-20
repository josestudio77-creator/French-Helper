/* ==========================================
   js/audio.js - Speech synthesis and sound
   French Helper
   =========================================== */

function initSpeechSpeed() {
    const slider = document.getElementById('speedSlider');
    const display = document.getElementById('speedValue');
    
    // On Android, the effective minimum is higher due to scaling
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
        // On Android, slider values below 0.2 all give same speed due to hardware limit
        slider.min = 0.2;
    } else {
        slider.min = 0.05; // Computer can go super slow
    }
    
    slider.max = 1.2;
    
    // Ensure current speed is within limits
    if (state.speechSpeed < slider.min) state.speechSpeed = parseFloat(slider.min);
    if (state.speechSpeed > slider.max) state.speechSpeed = 1.2;
    
    slider.value = state.speechSpeed;
    display.textContent = state.speechSpeed.toFixed(2);
}

// NEW: Just updates the number while sliding (silent)
function updateSpeechLabel(value) {
    document.getElementById('speedValue').textContent = parseFloat(value).toFixed(2);
}

function updateSpeechSpeed(value) {
    state.speechSpeed = parseFloat(value);
    document.getElementById('speedValue').textContent = state.speechSpeed.toFixed(2);
    localStorage.setItem('speechSpeed', state.speechSpeed);
    
    // If we're in auto-play mode, DON'T interrupt - just update the speed
    // The next phrase will use the new speed automatically
    if (!state.isAutoPlaying) {
        // Only speak the test word when not in auto-play
        spk("Bonjour", "fr-FR", true);
    }
    // When in auto-play, do nothing - the speed change will affect the next phrase
}

function initVoices() {
    const setVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;
        state.frVoices = voices.filter(v => v.lang.toLowerCase().includes('fr'));
        state.cachedEnVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Neural')) || voices.find(v => v.lang.startsWith('en'));
    };
    setVoices(); 
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = setVoices;
}

       
function showVoiceInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let msg = '📱 To access more French voices:\n\n';
    
    if (isIOS) {
        msg += 'iPhone/iPad:\n';
        msg += '1. Open Settings app\n';
        msg += '2. Accessibility → Spoken Content\n';
        msg += '3. Tap Voices → French\n';
        msg += '4. Download voices (I, II, III, IV)\n';
        msg += '5. Return here and reload\n';
    } else if (isAndroid) {
        msg += 'Android:\n';
        msg += '1. Open Settings app\n';
        msg += '2. Accessibility → Text-to-speech\n';
        msg += '3. Tap gear icon → Language\n';
        msg += '4. Install French language data\n';
        msg += '5. Return here and reload\n';
    } else {
        msg += 'Check your device Settings\n';
        msg += 'for Speech or Voice options.';
    }
    
    alert(msg);
}

function norm(t) { 
    return t ? t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''; 
}

function spk(t, lang, forceInterrupt = false, speedOverride = null) {
    try {
        if (forceInterrupt) {
            window.speechSynthesis.cancel();
        }

        let textToSpeak = t;
        if (lang === 'fr-FR' && t.trim().length === 1) {
            const upper = t.trim().toUpperCase();
            textToSpeak = FRENCH_LETTER_NAMES[upper] || t;
        }

        const u = new SpeechSynthesisUtterance(textToSpeak);
        u.lang = lang;
        u.rate = speedOverride || state.speechSpeed;
        u.voice = (lang === 'fr-FR') ? state.selectedFrVoice : state.cachedEnVoice;

        setTimeout(() => {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(" ")); 
            window.speechSynthesis.speak(u);
        }, 50);
    } catch (e) {
        console.error("📢 Speech Synthesis Error:", e);
        // Fallback: update message so user knows why it's silent
        const msg = document.getElementById('gameMsg');
        if (msg) msg.textContent = "🔇 Audio Error";
    }
}

 function spellWord() {
    if (!state.gameActive || !state.targetWord) return;
    
    state.isSpelling = true; 
    const letters = state.targetWord.split('');
    window.speechSynthesis.cancel();
    
    // Identify all the boxes in the Hangman display
    const slots = document.querySelectorAll('#hangmanDisplay .bee-slot');

    // SURGICAL ENGINE: This function calls itself only when the voice is done
    function speakNext(index) {
        // Exit if we finished the word or the user closed the game
        if (index >= letters.length || !state.gameActive) {
            state.isSpelling = false;
            return;
        }

        const upper = letters[index].toUpperCase();
        const nameToSpeak = FRENCH_LETTER_NAMES[upper] || letters[index];

        // 1. Visual Highlight ON
        if (slots[index]) {
            slots[index].style.backgroundColor = '#FFD700'; // Your Gold
            slots[index].style.transform = 'scale(1.15)';
            slots[index].style.zIndex = '10';
        }

        // 2. Prepare the Voice
        const u = new SpeechSynthesisUtterance(nameToSpeak);
        u.lang = 'fr-FR';
        u.rate = state.speechSpeed * 0.85;
        u.voice = state.selectedFrVoice;

        // 3. THE SYNC FIX: Wait for this specific letter to finish
        u.onend = () => {
            // A short 200ms pause for a "natural" gap between letters
            setTimeout(() => {
                // Visual Highlight OFF
                if (slots[index]) {
                    // Return to your specific green if filled, otherwise white
                    slots[index].style.backgroundColor = slots[index].classList.contains('filled') ? '#f0fdf4' : 'white';
                    slots[index].style.transform = '';
                    slots[index].style.zIndex = '';
                }
                // MOVE TO NEXT LETTER
                speakNext(index + 1);
            }, 200);
        };

        window.speechSynthesis.speak(u);
    }

    // Start the recursive chain at the first letter
    speakNext(0);
}

function playVictorySound() {
    if (!state.musicContext) state.musicContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.musicContext.state === 'suspended') state.musicContext.resume();
    
    const melody = [
        {freq: 440, start: 0, duration: 0.15},
        {freq: 440, start: 0.15, duration: 0.15},
        {freq: 440, start: 0.3, duration: 0.15},
        {freq: 554.37, start: 0.5, duration: 0.4}
    ];
    
    const now = state.musicContext.currentTime;
    
    melody.forEach(note => {
        const osc = state.musicContext.createOscillator();
        const gain = state.musicContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        
        gain.gain.setValueAtTime(0, now + note.start);
        gain.gain.linearRampToValueAtTime(0.3, now + note.start + 0.02);
        gain.gain.linearRampToValueAtTime(0.25, now + note.start + note.duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration);
        
        osc.connect(gain);
        gain.connect(state.musicContext.destination);
        
        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration);
    });
}

function playTheaterIntro() {
    if (!state.theaterAudioCtx) {
        state.theaterAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume if suspended (browser policy)
    if (state.theaterAudioCtx.state === 'suspended') {
        state.theaterAudioCtx.resume();
    }
    
    const now = state.theaterAudioCtx.currentTime;
    // A magical ascending arpeggio: C - E - G - C
    const notes = [261.63, 329.63, 392.00, 523.25];
    
    notes.forEach((freq, index) => {
        const osc = state.theaterAudioCtx.createOscillator();
        const gain = state.theaterAudioCtx.createGain();
        
        osc.type = 'triangle'; // Soft, bell-like sound
        osc.frequency.setValueAtTime(freq, now + (index * 0.15));
        
        // Volume envelope: fade in quickly, then fade out
        gain.gain.setValueAtTime(0, now + (index * 0.15));
        gain.gain.linearRampToValueAtTime(0.25, now + (index * 0.15) + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc.connect(gain);
        gain.connect(state.theaterAudioCtx.destination);
        
        osc.start(now + (index * 0.15));
        osc.stop(now + 1.2);
    });
}

function playDingSound() {
    if (!state.musicContext) state.musicContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.musicContext.state === 'suspended') state.musicContext.resume();
    const now = state.musicContext.currentTime;
    const osc = state.musicContext.createOscillator();
    const gain = state.musicContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(state.musicContext.destination);
    osc.start();
    osc.stop(now + 0.2);
}

function playBuzzSound() {
    if (!state.musicContext) state.musicContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.musicContext.state === 'suspended') state.musicContext.resume();
    const now = state.musicContext.currentTime;
    const osc = state.musicContext.createOscillator();
    const gain = state.musicContext.createGain();

    osc.type = 'triangle'; // Softer than sawtooth
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.1, now); // Much quieter
    gain.gain.linearRampToValueAtTime(0, now + 0.15); // Shorter

    osc.connect(gain);
    gain.connect(state.musicContext.destination);

    osc.start();
    osc.stop(now + 0.15);
}

function toggleMusic() {
    const btn = document.getElementById('musicToggleBtn');
    const volumeControl = document.getElementById('musicVolumeControl');
    
    if (state.musicNode) { 
        // Turn music OFF
        if (state.musicNode.stop) {
            state.musicNode.stop();
        }
        state.musicNode = null; 
        btn.textContent = "🎵 Music: Off"; 
        btn.style.background = '#fef3c7';
        btn.style.color = '#92400e';
        volumeControl.style.display = 'none';
    } else { 
        // Turn music ON
        if (!state.musicContext) {
            state.musicContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume if suspended
        if (state.musicContext.state === 'suspended') {
            state.musicContext.resume();
        }
        
        // Create gain node for volume control
        state.musicGainNode = state.musicContext.createGain();
        state.musicGainNode.gain.setValueAtTime(state.musicVolume / 100, state.musicContext.currentTime);
        state.musicGainNode.connect(state.musicContext.destination);
        
        // Small delay to ensure context is running
        setTimeout(() => {
            playHappyLoop();
        }, 100);
        
        btn.textContent = "🎵 Music: On"; 
        btn.style.background = '#4cd964';
        btn.style.color = 'white';
        volumeControl.style.display = 'block';
        document.getElementById('musicVolumeValue').textContent = state.musicVolume + '%';
        document.getElementById('musicVolumeSlider').value = state.musicVolume;
    }
}

function updateMusicVolume(value) {
    state.musicVolume = parseInt(value);
    localStorage.setItem('musicVolume', state.musicVolume);
    document.getElementById('musicVolumeValue').textContent = state.musicVolume + '%';
    
    if (state.musicGainNode) {
        state.musicGainNode.gain.setValueAtTime(state.musicVolume / 100, state.musicContext.currentTime);
    }
}

function playHappyLoop() {
    if (!state.musicContext || !state.musicGainNode) return;
    
    // Ensure audio context is running
    if (state.musicContext.state === 'suspended') {
        state.musicContext.resume();
    }
    
    let isActive = true;
    let currentTimer = null;
    let nextNoteTime = state.musicContext.currentTime + 0.1; // Start slightly in the future
    
    const melody = [110.00, 110.00, 130.81, 146.83, 110.00, 110.00, 164.81, 146.83];
    const noteDuration = 0.4; // seconds per note
    const loopDuration = melody.length * noteDuration; // 3.2 seconds
    
    const playNote = (freq, startTime) => { 
        if (!isActive || !state.musicGainNode) return; 
        
        const osc = state.musicContext.createOscillator(); 
        const noteGain = state.musicContext.createGain();
        
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(freq, startTime); 
        
        // Volume envelope to avoid clicks
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(state.musicVolume / 100, startTime + 0.02);
        noteGain.gain.linearRampToValueAtTime(0, startTime + noteDuration - 0.02);
        
        osc.connect(noteGain);
        noteGain.connect(state.musicGainNode);
        
        osc.start(startTime); 
        osc.stop(startTime + noteDuration);
        
        // Clean up
        osc.onended = () => {
            osc.disconnect();
            noteGain.disconnect();
        };
    };
    
    // Schedule the first loop
    melody.forEach((note, index) => {
        playNote(note, nextNoteTime + (index * noteDuration));
    });
    
    // Schedule subsequent loops
    const scheduleLoop = () => {
        if (!isActive || !state.musicNode) return;
        
        nextNoteTime += loopDuration;
        
        melody.forEach((note, index) => {
            playNote(note, nextNoteTime + (index * noteDuration));
        });
        
        currentTimer = setTimeout(scheduleLoop, loopDuration * 1000 - 50); // Slightly before next loop
    };
    
    currentTimer = setTimeout(scheduleLoop, loopDuration * 1000 - 50);
    
    // Store everything in state.musicNode
    state.musicNode = { 
        stop: () => { 
            isActive = false;
            if (currentTimer) {
                clearTimeout(currentTimer);
            }
            if (state.musicGainNode) {
                // Quick fade out
                state.musicGainNode.gain.linearRampToValueAtTime(0, state.musicContext.currentTime + 0.1);
                setTimeout(() => {
                    if (state.musicGainNode) {
                        state.musicGainNode.disconnect();
                        state.musicGainNode = null;
                    }
                }, 150);
            }
        },
        timer: currentTimer
    }; 
}


