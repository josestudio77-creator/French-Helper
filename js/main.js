/* ==========================================
   js/main.js - App entry point & event listeners
   French Helper
   =========================================== */

function playWelcomeChime() {
    if (!state.musicContext) state.musicContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.musicContext.state === 'suspended') state.musicContext.resume();
    
    const now = state.musicContext.currentTime;
    // A beautiful "C-Major" uplifting chord
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    
    notes.forEach((freq, i) => {
const osc = state.musicContext.createOscillator();
const gain = state.musicContext.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(freq, now + (i * 0.1)); // Arpeggio effect

gain.gain.setValueAtTime(0, now + (i * 0.1));
gain.gain.linearRampToValueAtTime(0.1, now + (i * 0.1) + 0.1);
gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

osc.connect(gain);
gain.connect(state.musicContext.destination);
osc.start(now + (i * 0.1));
osc.stop(now + 1.5);
    });
}

function startAppTransition() {
    const splash = document.getElementById('customSplash');
    if (!splash || splash.style.display === 'none') return;

    state.allowExit = false; 
    state.exitAttempts = 0;
    window.history.replaceState('app-active', null, "");
    window.history.pushState('app-active', null, "");

    const icon = document.getElementById('splashIcon');
    const text = document.getElementById('splashText');
    const container = document.querySelector('.container');

    const isModalOpen = document.getElementById('appModal').style.display === 'block';
    if (!isModalOpen) {
        playWelcomeChime();
        preloadAlphabetAudio(); // Preload all WAV files to RAM on first user interaction
    }

    icon.classList.add('splash-immersive-zoom');
    text.classList.add('splash-text-fade');
    splash.style.pointerEvents = 'none';

    setTimeout(() => {
container.classList.add('app-visible');
splash.style.opacity = '0';
    }, 100);

    setTimeout(() => {
splash.style.display = 'none';
// ✅ CHECK FOR IMPORT AFTER SPLASH IS COMPLETELY GONE
checkForImport();
    }, 1500); 
}

function initExitGuard() {
    // Initial state.history setup to catch the first swipe
    if (window.history.state !== 'app-active') {
window.history.replaceState('app-active', null, "");
window.history.pushState('app-active', null, "");
    }

    window.onpopstate = function(event) {
if (state.allowExit) return;

// 1. Check for open Drawers (Backpack, Settings, etc.)
const visibleOverlays = Array.from(document.querySelectorAll('.overlay'))
                             .filter(ov => ov.style.display === 'block' && ov.id !== 'customSplash');

if (visibleOverlays.length > 0) {
    // SCENARIO A: A drawer is open. 
    const topOverlayId = visibleOverlays[visibleOverlays.length - 1].id;

    // --- SAFETY CHECK FOR HOMEWORK DRAWER ---
    if (topOverlayId === 'hwDrawer' && hasUnsavedHomework()) {
        // Instead of closing, trigger the "Discard Changes?" modal
        cancelEdit();
    } else {
        // For all other drawers (Backpack, Parent, etc.), just close normally
        closeOverlay(topOverlayId);
        window.history.pushState('app-active', null, "");
    }
    
} else {
    // 2. Check if we are inside a homework set or on the main list
    // (If state.currentSetName is not empty, we are practicing a set)
    const isPracticingSet = state.currentSetName && state.currentSetName !== '';
    
    if (isPracticingSet) {
        // SCENARIO B: Inside a set. Swipe back goes to the main Practice List.
        navJump(null); 
        window.history.pushState('app-active', null, "");
    } else {
        // SCENARIO C: On the Main List. Show exit instructions.
        state.exitAttempts++;
        
        if (state.exitAttempts === 1) {
            openAppModal({
                title: "👋 Leaving so soon?",
                text: "To close the app:\n\n• Mobile: Swipe up from the bottom of your phone.\n• Desktop: Close this browser tab.",
                mode: 'view',
                saveText: "Got it",
                onAction: () => {
                    window.history.pushState('app-active', null, "");
                    state.exitAttempts = 0;
                }
            });
        } else {
            // If they swipe again immediately, give them a shorter reminder
            openAppModal({
                title: "📱 Just a reminder",
                text: "French Phrases Helper stays ready for you! Use your phone's Home gesture to exit.",
                mode: 'view',
                saveText: "OK",
                onAction: () => {
                    window.history.pushState('app-active', null, "");
                    state.exitAttempts = 0;
                }
            });
        }
        // Re-trap the state.history so the next swipe works
        window.history.pushState('app-active', null, "");
    }
}
    };
}
     
window.onload = () => {
    // 1. Initial Pop-in of Logo and Text
    setTimeout(() => {
const icon = document.getElementById('splashIcon');
const text = document.getElementById('splashText');
if(icon) icon.classList.add('splash-pop-in');
if(text) text.style.opacity = "1";
if(text) text.style.transform = "translateY(0)";
    }, 100);

    // 2. AUTO-TRANSITION: If they don't click, the app materializes normally
    setTimeout(() => {
        startAppTransition();
    }, 1200);
    
    console.log('App loading...');

    initExitGuard();
    updateAiBtnUI();

    // ✅ THE SAFETY RESET: Clear any "ghost" print data from the last time the app was used
    const ghostPrint = document.getElementById('printArea');
    if (ghostPrint) {
ghostPrint.innerHTML = '';
    }
    state.isPrinting = false;

    const raw = localStorage.getItem('homeworkPhrases');
    document.getElementById('hwInput').value = (raw && raw !== "undefined") ? raw : "";
    state.lastLoadedHomework = raw || '';
    
    // Load last homework on startup if exists
    if (raw && raw.trim()) {
console.log('Loading last homework:', raw);

let foundName = '';
let foundIsDialogue = false;
let foundAudio = null;

for (let name in state.history) {
    try {
        const hwData = JSON.parse(state.history[name]);
        if (hwData.words === raw) {
            foundName = name;
            foundIsDialogue = hwData.isDialogue || false;
            foundAudio = hwData.audio || null;
            break;
        }
    } catch (e) {
        // Old format, skip
    }
}

if (foundName) {
    state.currentSetName = foundName;
    localStorage.setItem('currentSetName', foundName);
    state.currentIsDialogue = foundIsDialogue;
    
    if (foundAudio) {
        state.currentWeekAudio = foundAudio;
        localStorage.setItem('currentWeekAudio', JSON.stringify(foundAudio));
        
        if (state.viewMode !== 'dialogue') {
            state.viewMode = 'dialogue';
            localStorage.setItem('viewMode', 'dialogue');
        }
    } else {
        state.currentWeekAudio = null;
        localStorage.removeItem('currentWeekAudio');
    }
    
} else {
    state.currentSetName = '';
    localStorage.removeItem('currentSetName');
    state.currentIsDialogue = false;
    state.currentWeekAudio = null;
    localStorage.removeItem('currentWeekAudio');
}

loadCurrentHomework();
displayAudioPlayer();

    } else {
console.log('No homework found in storage. Checking for import or landing on BP.');
state.currentSetName = '';
localStorage.removeItem('currentSetName');
state.currentIsDialogue = false;
state.currentWeekAudio = null;
localStorage.removeItem('currentWeekAudio');
displayAudioPlayer();

if (!window.location.hash.startsWith('#import=')) {
    state.selectedBpMonth = findMonthWithHomework();
    setTimeout(() => {
        openOverlay('bpModal');
    }, 200); 
} else {
    console.log('Import link detected, staying on practice screen for modal.');
}
    }
    
    initVoices();
    initSpeechSpeed();
    initAudioUpload();
    
    // REMOVED: checkForImport() from here - it will be called in startAppTransition after splash
    
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
    
    const savedGap = localStorage.getItem('gapValue');
    if (savedGap) {
document.getElementById('gapSlider').value = savedGap;
document.getElementById('gapValue').innerText = savedGap;
    } else {
document.getElementById('gapValue').innerText = '1.0';
    }
    
    const savedVolume = localStorage.getItem('musicVolume');
    if (savedVolume) {
state.musicVolume = parseInt(savedVolume);
    }
    
    const savedNotes = localStorage.getItem('homeworkNotes');
    if (savedNotes) {
try {
    state.homeworkNotes = JSON.parse(savedNotes);
} catch(e) {
    state.homeworkNotes = {};
}
    }
    
    setTimeout(() => {
setViewMode(state.viewMode);
displayAudioPlayer();
if (state.currentWeekAudio && state.viewMode !== 'dialogue') {
    setViewMode('dialogue');
}
    }, 100);
};

// --- GLOBAL EVENT LISTENERS ---

// 1. Laptop Keyboard Support
document.addEventListener('keydown', handleKeyPress);

// 2. iOS Speech Unlock
document.addEventListener('touchstart', function wakeSpeech() {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
}, { once: true });

// 3. Capture the PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => { 
    // Prevent the browser's default bar from showing
    e.preventDefault(); 
    // Save the event so it can be triggered later by your "Install" button
    state.deferredPrompt = e; 
    // Show your custom install button in the Parent Drawer
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'block'; 
});

// 4. NEW: Hide button instantly after a successful installation
window.addEventListener('appinstalled', (evt) => {
    console.log('✅ App was successfully installed');
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none'; 
    state.deferredPrompt = null;
});

