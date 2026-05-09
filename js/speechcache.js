/* ==========================================
   js/speechcache.js — Google TTS caching engine
   French Helper
   
   Fetches high-quality French TTS audio from Google Translate
   and caches MP3 blobs in IndexedDB for offline playback.
   =========================================== */

const TTS_GOOGLE_BASE = 'https://translate.google.com/translate_tts';
const TTS_RATE_LIMIT_MS = 350;
const TTS_MAX_TEXT_LENGTH = 180;
const TTS_MAX_CONCURRENT = 3;

let _fetchQueue = [];
let _activeFetches = 0;
let _fetchResolve = null;

/* ===== MAIN ENTRY POINT ===== */

async function fetchTTSForHomework(phrasesText, onProgress) {
    // Google TTS fetch doesn't work from browsers (CORS).
    // The app uses SpeechSynthesis with "Google francais" voice instead.
    // This function remains as a no-op for future native app caching.
    if (onProgress) onProgress('', 0, 0, true);
    return 0;
}

async function _processNextFetch(onProgress, total) {
    if (_fetchQueue.length === 0) {
        _activeFetches--;
        if (_activeFetches <= 0 && _fetchResolve) {
            _fetchResolve(total);
            _fetchResolve = null;
        }
        return;
    }
    
    const token = _fetchQueue.shift();
    _activeFetches++;
    
    try {
        const key = typeof norm === 'function' ? norm(token) : token.toLowerCase();
        const blob = await _fetchGoogleTTS(token);
        
        if (blob && blob.size > 100) {
            await StorageDB.storeAudio(key, blob);
            console.log('[SpeechCache] CACHED: "' + token + '" (' + (blob.size / 1024).toFixed(1) + ' KB)');
        }
    } catch (err) {
        console.warn('[SpeechCache] FAILED for "' + token + '":', err.message || err);
    }
    
    const done = total - _fetchQueue.length;
    if (onProgress) {
        const displayToken = token.length > 30 ? token.substring(0, 30) + '...' : token;
        onProgress(displayToken, done, total, _fetchQueue.length === 0);
    }
    
    _activeFetches--;
    setTimeout(() => {
        if (_fetchQueue.length > 0) {
            _processNextFetch(onProgress, total);
        } else if (_activeFetches <= 0 && _fetchResolve) {
            _fetchResolve(done);
            _fetchResolve = null;
        }
    }, TTS_RATE_LIMIT_MS);
}

/* ===== FETCH A SINGLE TTS MP3 ===== */

async function _fetchGoogleTTS(text, lang = 'fr') {
    let textToFetch = text;
    if (text.length > TTS_MAX_TEXT_LENGTH) {
        const truncated = text.substring(0, TTS_MAX_TEXT_LENGTH);
        const lastSpace = truncated.lastIndexOf(' ');
        textToFetch = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
    }
    
    const directUrl = TTS_GOOGLE_BASE + '?ie=UTF-8&client=gtx&tl=' + lang + '&q=' + encodeURIComponent(textToFetch);
    
    // Attempt 1: direct fetch (works on deployed HTTPS, fails on file:// due to CORS)
    try {
        const blob = await _tryFetch(directUrl);
        if (blob) return blob;
    } catch (e) {
        console.log('[SpeechCache] Direct fetch failed, trying CORS proxy...');
    }
    
    // Attempt 2: via CORS proxy (works from any origin including file://)
    try {
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(directUrl);
        const blob = await _tryFetch(proxyUrl);
        if (blob) {
            console.log('[SpeechCache] CORS proxy succeeded');
            return blob;
        }
    } catch (e) {
        console.warn('[SpeechCache] CORS proxy also failed');
    }
    
    // Attempt 3: audio element direct playback (bypasses CORS, can't cache)
    throw new Error('All fetch methods failed');
}

async function _tryFetch(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'audio/mpeg, audio/*'
        }
    });
    
    if (!response.ok) {
        throw new Error('HTTP ' + response.status);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        throw new Error('Returned HTML instead of audio');
    }
    
    const blob = await response.blob();
    if (blob.size < 100) {
        throw new Error('Audio blob too small (' + blob.size + ' bytes)');
    }
    
    return blob;
}

/* ===== ON-DEMAND FETCH ===== */

async function preloadTTSForWord(text, lang = 'fr') {
    const key = typeof norm === 'function' ? norm(text) : text.toLowerCase();
    const hasIt = await StorageDB.hasAudio(key);
    if (hasIt) return true;
    
    try {
        const blob = await _fetchGoogleTTS(text, lang);
        if (blob && blob.size > 100) {
            await StorageDB.storeAudio(key, blob);
            console.log('[SpeechCache] On-demand cached: "' + text + '"');
            return true;
        }
    } catch (err) {
        console.warn('[SpeechCache] On-demand failed for "' + text + '":', err.message || err);
    }
    return false;
}

/* ===== DIAGNOSTIC UTILITY ===== */

function dumpCacheStatus() {
    console.log('=== SpeechCache Status ===');
    console.log('To check if a phrase is cached, open DevTools (F12) and run:');
    console.log('  StorageDB.hasAudio(norm("your phrase here")).then(r => console.log("Cached:", r));');
    console.log('=========================');
}

/* ===== PLAYBACK WITH VISUAL INDICATOR ===== */

async function playCachedAudio(text, lang, forceInterrupt, speedOverride, isLetterMode) {
    if (lang === undefined) lang = 'fr-FR';
    if (forceInterrupt === undefined) forceInterrupt = false;
    if (!text || !text.trim()) return;
    
    const key = typeof norm === 'function' ? norm(text) : text.toLowerCase();
    
    try {
        const blob = await StorageDB.getAudio(key);
        
        if (blob && blob.size > 100) {
            // CACHED AUDIO AVAILABLE
            console.log('[SpeechCache] PLAYING CACHED: "' + text + '"');
            
            if (forceInterrupt) {
                window.speechSynthesis.cancel();
                if (state.currentlyPlayingAudio) {
                    state.currentlyPlayingAudio.pause();
                    state.currentlyPlayingAudio = null;
                }
            }
            
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            state.currentlyPlayingAudio = audio;
            
            audio.onended = () => {
                URL.revokeObjectURL(url);
                if (state.currentlyPlayingAudio === audio) {
                    state.currentlyPlayingAudio = null;
                }
            };
            
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                if (state.currentlyPlayingAudio === audio) {
                    state.currentlyPlayingAudio = null;
                }
                console.warn('[SpeechCache] Playback error, falling back to browser TTS');
                if (typeof spk === 'function') {
                    spk(text, lang, forceInterrupt, speedOverride, isLetterMode);
                }
            };
            
            await audio.play();
            return;
        }
    } catch (err) {
        console.warn('[SpeechCache] Lookup error, falling back to browser TTS:', err.message || err);
    }
    
    // No cached audio — use browser TTS (Google TTS streaming blocked by Google from web origins)
    // On native Capacitor app, TTS audio will be fetched and cached via native HTTP.
    console.log('[SpeechCache] FALLBACK TO BROWSER TTS: "' + text + '"');
    if (typeof spk === 'function') {
        spk(text, lang, forceInterrupt, speedOverride, isLetterMode);
    }
}



async function fetchAndPlay(text, lang) {
    if (!lang) lang = 'fr-FR';
    await preloadTTSForWord(text, lang === 'fr-FR' ? 'fr' : 'en');
    await playCachedAudio(text, lang, true);
}

/* ===== Expose ===== */
window.SpeechCache = {
    fetchTTSForHomework,
    playCachedAudio,
    preloadTTSForWord,
    fetchAndPlay,
    dumpCacheStatus
};
