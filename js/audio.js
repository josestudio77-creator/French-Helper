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

        state.selectedFrVoice = state.frVoices.find(v => v.name.includes('Amelie') || v.name.includes('Thomas')) || state.frVoices[0] || null;

        state.cachedEnVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Neural')) || voices.find(v => v.lang.startsWith('en')) || null;

        console.log('[Audio] Voices loaded: fr=' + (state.selectedFrVoice ? state.selectedFrVoice.name : 'default') + ', en=' + (state.cachedEnVoice ? state.cachedEnVoice.name : 'default'));

        // Warn if no French voice available

        if (state.frVoices.length === 0 && !state._voiceWarningShown) {

            state._voiceWarningShown = true;

            console.warn('[Audio] No French voice found — showing install instructions');

            setTimeout(() => showVoiceInstructions(), 500);

        }

    };

    setVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = setVoices;

    setTimeout(setVoices, 1000);

    setTimeout(setVoices, 3000);

}



       

function showVoiceInstructions() {

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    const isAndroid = /Android/.test(navigator.userAgent);

    

    let msg = 'No French voice detected on your device.\n\nWithout it, pronunciations may sound wrong or produce no audio.\n\n';

    

    if (isIOS) {

        msg += 'iPhone/iPad:\n';

        msg += '1. Open Settings app\n';

        msg += '2. Accessibility → Spoken Content → Voices\n';

        msg += '3. Tap French\n';

        msg += '4. Download "Amelie" (France) or "Canadian French"\n';

        msg += '   ➡️ For immersion, "Canadian French" is recommended\n';

        msg += '5. Return to this app and reload\n';

    } else if (isAndroid) {

        msg += 'Android:\n';

        msg += '1. Settings → System → Languages & input\n';

        msg += '2. Tap Text-to-speech output\n';

        msg += '3. Tap gear icon → "Install voice data"\n';

        msg += '4. Choose French → "French (Canada)"\n';

        msg += '   ➡️ Canadian French recommended for immersion\n';

        msg += '5. Return to this app and reload\n';

    } else {

        msg += 'Windows/macOS:\n';

        msg += '1. Open System Settings\n';

        msg += '2. Go to Language & Region\n';

        msg += '3. Add French as a language\n';

        msg += '4. Restart browser and reload\n';

    }

    

    msg += '\nℹ️ After installing, reload the app and the voice will be used automatically.';

    

    openAppModal({ title: '🔊 French Voice Required', text: msg, mode: 'view' });

}

function norm(t) { 

    return t ? t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''; 

}



function spk(t, lang, forceInterrupt = false, speedOverride = null, isLetterMode = false) {

    try {

        if (forceInterrupt) {

            window.speechSynthesis.cancel();

        }



        let textToSpeak = t;

        if (lang === 'fr-FR' && t.trim().length === 1) {

            if (isLetterMode) {

                const upper = t.trim().toUpperCase();

                textToSpeak = FRENCH_LETTER_NAMES[upper] || t;

            } else {

                // Fix for French TTS engines that spell out single characters

                // We map them to their phonetic equivalent so they sound like natural words

                const charLower = t.trim().toLowerCase();

                if (charLower === 'à' || charLower === 'â') textToSpeak = 'a';

                else if (charLower === 'y') textToSpeak = 'i'; // 'y' sounds like 'i' in French

                else if (charLower === 'ô') textToSpeak = 'o';

                else if (charLower === 'é' || charLower === 'è' || charLower === 'ê' || charLower === 'ë') textToSpeak = 'é';

            }

        }



        const u = new SpeechSynthesisUtterance(textToSpeak);

        u.lang = lang;

        u.rate = speedOverride || state.speechSpeed;

        // Only set voice if we have one — null can cause silent failure in PWAs

        const v = (lang === 'fr-FR') ? state.selectedFrVoice : state.cachedEnVoice;

        if (v) u.voice = v;

        u.onerror = (e) => console.warn('[Audio] TTS utterance error:', e.error);



        setTimeout(() => {

            window.speechSynthesis.cancel();

            window.speechSynthesis.speak(u);

        }, 50);

    } catch (e) {

        console.error("📢 Speech Synthesis Error:", e);

        // Fallback: update message so user knows why it's silent

        const msg = document.getElementById('gameMsg');

        if (msg) msg.textContent = "🔇 Audio Error";

    }

}



const AUDIO_FILE_MAP = {

    'a': 'a.wav', 'b': 'b.wav', 'c': 'c.wav', 'd': 'd.wav', 'e': 'e.wav',

    'f': 'f.wav', 'g': 'g.wav', 'h': 'h.wav', 'i': 'i.wav', 'j': 'j.wav',

    'k': 'k.wav', 'l': 'l.wav', 'm': 'm.wav', 'n': 'n.wav', 'o': 'o.wav',

    'p': 'p.wav', 'q': 'q.wav', 'r': 'r.wav', 's': 's.wav', 't': 't.wav',

    'u': 'u.wav', 'v': 'v.wav', 'w': 'w.wav', 'x': 'x.wav', 'y': 'y.wav', 'z': 'z.wav',

    'é': 'e_accent_aigu.wav', 'è': 'e_accent_grave.wav', 'ê': 'e_accent_circonflexe.wav',

    'ë': 'e_accent_trema.wav', 'à': 'a_accent_grave.wav', 'â': 'a_accent_circonflexe.wav',

    'î': 'i_accent_circonflexe.wav', 'ï': 'i_accent_trema.wav', 'ô': 'o_accent_circonflexe.wav',

    'û': 'u_accent_circonflexe.wav', 'ù': 'u_accent_grave.wav', 'ç': 'c_cedille.wav',

    'œ': 'oe_ligature.wav', 'æ': 'ae_ligature.wav',

    'aa': 'deux_a.wav', 'bb': 'deux_b.wav', 'cc': 'deux_c.wav', 'dd': 'deux_d.wav',

    'ee': 'deux_e.wav', 'ff': 'deux_f.wav', 'gg': 'deux_g.wav', 'hh': 'deux_h.wav',

    'ii': 'deux_i.wav', 'jj': 'deux_j.wav', 'kk': 'deux_k.wav', 'll': 'deux_l.wav',

    'mm': 'deux_m.wav', 'nn': 'deux_n.wav', 'oo': 'deux_o.wav', 'pp': 'deux_p.wav',

    'qq': 'deux_q.wav', 'rr': 'deux_r.wav', 'ss': 'deux_s.wav', 'tt': 'deux_t.wav',

    'uu': 'deux_u.wav', 'vv': 'deux_v.wav', 'ww': 'deux_w.wav', 'xx': 'deux_x.wav',

    'yy': 'deux_y.wav', 'zz': 'deux_z.wav'

};



async function preloadAlphabetAudio() {

    const basePath = 'assets/audio/french_alphabet_raw_wav/';

    

    // Using HTML5 Audio elements instead of AudioContext to bypass CORS restrictions on file:/// protocol

    Object.entries(AUDIO_FILE_MAP).forEach(([key, filename]) => {

        if (!state.audioBuffers[key]) {

            const audioObj = new Audio(basePath + filename);

            audioObj.preload = 'auto'; // Force RAM preload

            state.audioBuffers[key] = audioObj;

        }

    });

    

    console.log("🔊 All Alphabet Audio Preloaded via HTML5 Audio!");

}



function playLetterAudio(key, onEnded) {

    const audioObj = state.audioBuffers[key.toLowerCase()];

    

    if (!audioObj) {

        console.warn("Audio missing for", key, "- falling back to TTS");

        fallbackToTTS(key, onEnded);

        return;

    }

    

    // Play using HTML5 Audio

    try {

        audioObj.playbackRate = 1.0; // NEVER alter .wav speed, prevents pitch distortion

        audioObj.currentTime = 0; // Reset to start

        

        // Single-use onended handler

        audioObj.onended = () => {

            audioObj.onended = null;

            if (onEnded) onEnded();

        };

        

        const playPromise = audioObj.play();

        if (playPromise !== undefined) {

            playPromise.catch(e => {

                console.warn("HTML5 Audio play failed for", key, "- falling back to TTS:", e);

                fallbackToTTS(key, onEnded);

            });

        }

    } catch (e) {

        fallbackToTTS(key, onEnded);

    }

}



function fallbackToTTS(key, onEnded) {

    const ttsKey = FRENCH_LETTER_NAMES[key.toUpperCase()] || key;

    const u = new SpeechSynthesisUtterance(ttsKey);

    u.lang = 'fr-FR';

    u.rate = state.speechSpeed;

    u.voice = state.selectedFrVoice;

    if (onEnded) u.onend = onEnded;

    window.speechSynthesis.speak(u);

}



function spellWord() {

    if (!state.gameActive || !state.targetWord) return;

    

    state.isSpelling = true; 

    const letters = state.targetWord.split('');

    window.speechSynthesis.cancel();

    

    const slots = document.querySelectorAll('#hangmanDisplay .bee-slot');



    function speakNext(index) {

        if (index >= letters.length || !state.gameActive) {

            state.isSpelling = false;

            return;

        }



        let keyToPlay = letters[index].toLowerCase();

        let lettersConsumed = 1;

        

        // Look ahead for double letters

        if (index + 1 < letters.length && letters[index].toLowerCase() === letters[index + 1].toLowerCase()) {

            const doubleKey = keyToPlay + keyToPlay;

            if (AUDIO_FILE_MAP[doubleKey]) {

                keyToPlay = doubleKey;

                lettersConsumed = 2;

            }

        }



        // 1. Visual Highlight ON

        for (let i = 0; i < lettersConsumed; i++) {

            if (slots[index + i]) {

                slots[index + i].style.backgroundColor = '#FFD700';

                slots[index + i].style.transform = 'scale(1.15)';

                slots[index + i].style.zIndex = '10';

            }

        }



        // 3. Play the studio audio

        playLetterAudio(keyToPlay, () => {

            setTimeout(() => {

                // Visual Highlight OFF

                for (let i = 0; i < lettersConsumed; i++) {

                    if (slots[index + i]) {

                        slots[index + i].style.backgroundColor = slots[index + i].classList.contains('filled') ? '#f0fdf4' : 'white';

                        slots[index + i].style.transform = '';

                        slots[index + i].style.zIndex = '';

                    }

                }

                speakNext(index + lettersConsumed);

            }, 200); // Natural gap between letters

        });

    }



    // Start immediately so the first audio play happens synchronously within the user's click event stack!

    // This satisfies the browser's strict autoplay policies and allows the HTML5 Audio to play.

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



function playTheaterExit() {

    if (!state.musicContext) {

        state.musicContext = new (window.AudioContext || window.webkitAudioContext)();

    }

    

    if (state.musicContext.state === 'suspended') {

        state.musicContext.resume();

    }

    

    const now = state.musicContext.currentTime;

    // Descending arpeggio to signify exiting: G - E - C

    const notes = [392.00, 329.63, 261.63];

    

    notes.forEach((freq, index) => {

        const osc = state.musicContext.createOscillator();

        const gain = state.musicContext.createGain();

        

        osc.type = 'triangle'; 

        const startTime = now + (index * 0.15);

        osc.frequency.setValueAtTime(freq, startTime);

        

        gain.gain.setValueAtTime(0, startTime);

        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);

        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

        

        osc.connect(gain);

        gain.connect(state.musicContext.destination);

        

        osc.start(startTime);

        osc.stop(startTime + 1.0);

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



/**

 * FRENCH SYLLABIFICATION ENGINE

 * Breaks a word into syllables based on standard French rules.

 */

function getSyllables(word) {

    if (!word) return [];

    if (word.length <= 3) return [word]; // Too short to split reliably



    const cleanLower = word.toLowerCase();

    

    // Check dynamic user overrides first

    if (typeof state !== 'undefined' && state.syllableOverrides && state.syllableOverrides[cleanLower]) {

        return state.syllableOverrides[cleanLower];

    }

    

    // Then check static hardcoded overrides

    if (typeof SYLLABLE_OVERRIDES !== 'undefined' && SYLLABLE_OVERRIDES[cleanLower]) {

        return SYLLABLE_OVERRIDES[cleanLower];

    }



    const vowels = "aeiouàâéèêëîïôûùœæ"; // No 'y'

    // Extended clusters including double consonants and digraphs for phonetic chunking

    const clusters = [

        "bl", "cl", "fl", "gl", "pl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "vr", 

        "ch", "ph", "th", "gn", "qu", "gu",

        "bb", "cc", "dd", "ff", "gg", "ll", "mm", "nn", "pp", "rr", "ss", "tt", "xx", "zz"

    ];

    // Vowel clusters (digraphs/trigraphs)

    const vClusters = [

        "eau", "au", "ou", "eu", "œu", "oi", "ai", "ei", "ui", "ie", "ia", "io", "ieu", "oui", "oe"

    ];

    

    let chars = word.toLowerCase().split('');

    let units = [];

    

    // Step 1: Group characters into logical phonetic units (clusters vs individual letters)

    for (let i = 0; i < chars.length; i++) {

        let isApostrophe = chars[i+1] === "'" || chars[i+1] === "’";

        let baseText = chars[i];

        

        if (isApostrophe) {

            units.push({ text: baseText + chars[i+1], type: 'C' });

            i++;

            continue;

        }



        if (i < chars.length - 2 && vClusters.includes(chars[i] + chars[i+1] + chars[i+2])) {

            units.push({ text: chars[i] + chars[i+1] + chars[i+2], type: 'V' });

            i += 2;

        } else if (i < chars.length - 1 && vClusters.includes(chars[i] + chars[i+1])) {

            units.push({ text: chars[i] + chars[i+1], type: 'V' });

            i++;

        } else if (i < chars.length - 1 && clusters.includes(chars[i] + chars[i+1])) {

            units.push({ text: chars[i] + chars[i+1], type: 'C' });

            i++;

        } else {

            let isV = vowels.includes(chars[i]);

            if (chars[i] === 'y') {

                // If y is followed by a vowel, it's a consonant (Ya, Ye). Otherwise V (Mythe)

                isV = (i === chars.length - 1 || !vowels.includes(chars[i+1]));

            }

            units.push({ text: chars[i], type: isV ? 'V' : 'C' });

        }

    }

    

    let res = [];

    let current = "";

    

    // Step 2: Apply French phonics rules on the logical units

    for (let i = 0; i < units.length; i++) {

        current += units[i].text;

        

        const next = units[i+1];

        const afterNext = units[i+2];

        

        if (!next) {

            continue; // Keep the rest attached to the current syllable

        }

        

        // RULE 1: V-CV (Split between Vowel and Single Consonant followed by a Vowel)

        if (units[i].type === 'V' && next.type === 'C' && afterNext && afterNext.type === 'V') {

            res.push(current);

            current = "";

            continue;

        }

        

        // RULE 2: VC-CV (Split between Two Consonants if followed by a Vowel)

        if (units[i].type === 'C' && next.type === 'C' && afterNext && afterNext.type === 'V') {

            res.push(current);

            current = "";

            continue;

        }

        

        // RULE 3: V-V Hiatus (Split between two separate vowel units, e.g., jou-er)

        if (units[i].type === 'V' && next.type === 'V') {

            res.push(current);

            current = "";

            continue;

        }

    }

    

    if (current) res.push(current);



    // POST-PROCESSING: Fix silent "e" at the end.

    if (res.length > 1) {

        let lastSyl = res[res.length - 1];

        // Match consonant cluster + 'e' or 'es' (e.g. lle, ppe, re, tes)

        if (lastSyl.match(/^[^aeiouyàâéèêëîïôûùœæ]*e[s]?$/i)) {

            let prev = res[res.length - 2];

            res[res.length - 2] = prev + lastSyl;

            res.pop();

        }

    }



    // Maintain original case

    let originalIndex = 0;

    let finalRes = [];

    for (let syl of res) {

        let originalSyl = word.substring(originalIndex, originalIndex + syl.length);

        finalRes.push(originalSyl);

        originalIndex += syl.length;

    }

    

    return finalRes.filter(s => s.length > 0);

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



/* ==========================================

   STUDENT RECORDING FEATURE

   ========================================== */



let currentAudioChunks = [];



async function toggleStudentRecording(btn, phrase) {
    const RECORD_MAX_MS = 15000;
    
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

        // Reuse persistent stream if we already have permission
        if (!state.persistentAudioStream) {
            state.persistentAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        const stream = state.persistentAudioStream;
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
    // Don't stop tracks — keeps microphone permission alive
    state.activeAudioStream = null;
}function trimSilence(audioBuffer, threshold = 0.05) {

    const channelData = audioBuffer.getChannelData(0);

    let start = 0;

    let end = channelData.length - 1;



    // Find first non-silent sample

    while (start < end && Math.abs(channelData[start]) < threshold) {

        start++;

    }

    // Find last non-silent sample

    while (end > start && Math.abs(channelData[end]) < threshold) {

        end--;

    }



    if (start >= end) return null; // completely silent



    // Add a ~150ms padding to prevent clipping the attack/decay of the voice

    const paddingSamples = Math.floor(audioBuffer.sampleRate * 0.15); 

    start = Math.max(0, start - paddingSamples);

    end = Math.min(channelData.length - 1, end + paddingSamples);



    const length = end - start + 1;

    const ctx = state.voiceContext || new (window.AudioContext || window.webkitAudioContext)();

    const trimmedBuffer = ctx.createBuffer(

        audioBuffer.numberOfChannels,

        length,

        audioBuffer.sampleRate

    );



    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {

        trimmedBuffer.copyToChannel(audioBuffer.getChannelData(i).subarray(start, end + 1), i);

    }

    

    return trimmedBuffer;

}



function playStudentRecording(phrase) {

    const trimmedBuffer = state.recordings[phrase];

    if (!trimmedBuffer) return;

    

    // Stop any existing playing recording

    if (state.activeRecordingSource) {

        try { state.activeRecordingSource.stop(); } catch(e){}

        state.activeRecordingSource = null;

    }

    

    // Stop TTS or spelling audio as well

    window.speechSynthesis.cancel();

    if (state.currentlyPlayingAudio) {

        state.currentlyPlayingAudio.pause();

        state.currentlyPlayingAudio = null;

    }

    

    const ctx = state.voiceContext || new (window.AudioContext || window.webkitAudioContext)();

    if (!state.voiceContext) state.voiceContext = ctx;

    

    if (ctx.state === 'suspended') ctx.resume();

    

    const source = ctx.createBufferSource();

    source.buffer = trimmedBuffer;

    source.connect(ctx.destination);

    

    source.onended = () => {

        if (state.activeRecordingSource === source) {

            state.activeRecordingSource = null;

        }

    };

    

    state.activeRecordingSource = source;

    source.start(0);

}

