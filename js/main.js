/* ==========================================
   js/main.js - App entry point & event listeners
   French Helper
   =========================================== */

function playWelcomeChime() {
    if (!state.musicContext) state.musicContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.musicContext.state === 'suspended') state.musicContext.resume();
    
    const now = state.musicContext.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    
    notes.forEach((freq, i) => {
        const osc = state.musicContext.createOscillator();
        const gain = state.musicContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.1));
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
        // Postpone heavy asset preloading to run when the browser is idle after transition
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
        checkForImport();
        
        // Highly optimized: Preload spelling/alphabet audio assets in background once screen is idle
        if (!isModalOpen) {
            setTimeout(preloadAlphabetAudio, 1000);
        }
    }, 1500); 
}

async function checkForAutoBackup() {
    try {
        const backup = await StorageDB.getBackup();
        if (backup && backup.data && backup.data.history) {
            const bk = Object.keys(backup.data.history);
            const cur = Object.keys(state.history);
            if (bk.length > 0 && bk.length > cur.length) {
                const dt = backup.data.backupDate || 'unknown date';
                openAppModal({
                    title: 'Found Backup',
                    text: 'A backup from ' + dt + ' has ' + bk.length + ' homework sets (you have ' + cur.length + '). Restore?',
                    mode: 'view',
                    saveText: 'Restore',
                    cancelText: 'Keep Current',
                    onAction: () => {
                        state.history = backup.data.history || {};
                        state.cache = backup.data.cache || {};
                        state.customIcons = backup.data.customIcons || {};
                        state.customPhotos = backup.data.customPhotos || {};
                        state.homeworkNotes = backup.data.homeworkNotes || {};
                        state.wins = backup.data.wins || 0;
                        state.losses = backup.data.losses || 0;
                        if (backup.data.speechSpeed) state.speechSpeed = backup.data.speechSpeed;
                        localStorage.setItem('frenchHistory', JSON.stringify(state.history));
                        localStorage.setItem('phraseTranslations', JSON.stringify(state.cache));
                        localStorage.setItem('customIcons', JSON.stringify(state.customIcons));
                        localStorage.setItem('customPhotos', JSON.stringify(state.customPhotos));
                        localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
                        localStorage.setItem('gameWins', state.wins);
                        localStorage.setItem('gameLosses', state.losses);
                        showToast('Backup restored! ' + bk.length + ' sets loaded.');
                        setTimeout(() => location.reload(), 1500);
                    },
                    onSecondaryAction: () => closeOverlay('appModal')
                });
            }
        }
    } catch(e) {
        console.warn('Backup check failed:', e);
    }
}

function initExitGuard() {
    if (window.history.state !== 'app-active') {
        window.history.replaceState('app-active', null, "");
        window.history.pushState('app-active', null, "");
    }

    window.onpopstate = function(event) {
        if (state.allowExit) return;

        // Sort visible overlays by actual computed z-index in descending order so the visual top is popped first
        const visibleOverlays = Array.from(document.querySelectorAll('.overlay'))
                                     .filter(ov => ov.style.display === 'block' && ov.id !== 'customSplash')
                                     .sort((a, b) => {
                                         const zA = parseInt(window.getComputedStyle(a).zIndex) || 0;
                                         const zB = parseInt(window.getComputedStyle(b).zIndex) || 0;
                                         return zB - zA;
                                     });

        if (visibleOverlays.length > 0) {
            const topOverlayId = visibleOverlays[0].id;

            if (topOverlayId === 'hwDrawer' && hasUnsavedHomework()) {
                cancelEdit();
            } else if (topOverlayId === 'printSelectionOverlay' && document.getElementById('printPreviewContainer') && document.getElementById('printPreviewContainer').style.display === 'block') {
                backToPrintSettings();
                window.history.pushState('app-active', null, "");
            } else {
                closeOverlay(topOverlayId);
                window.history.pushState('app-active', null, "");
            }
        } else {
            const isPracticingSet = state.currentSetName && state.currentSetName !== '';
            
            if (isPracticingSet) {
                navJump(null); 
                window.history.pushState('app-active', null, "");
            } else {
                state.exitAttempts++;
                
                if (state.exitAttempts === 1) {
                    openAppModal({
                        title: "Leaving so soon?",
                        text: "To close the app:\n\nMobile: Swipe up from the bottom of your phone.\nDesktop: Close this browser tab.",
                        mode: 'view',
                        saveText: "Got it",
                        onAction: () => {
                            window.history.pushState('app-active', null, "");
                            state.exitAttempts = 0;
                        }
                    });
                } else {
                    openAppModal({
                        title: "Just a reminder",
                        text: "French Phrases Helper stays ready for you! Use your phone's Home gesture to exit.",
                        mode: 'view',
                        saveText: "OK",
                        onAction: () => {
                            window.history.pushState('app-active', null, "");
                            state.exitAttempts = 0;
                        }
                    });
                }
                window.history.pushState('app-active', null, "");
            }
        }
    };
}
     
window.onload = () => {
    setTimeout(() => {
        const icon = document.getElementById('splashIcon');
        const text = document.getElementById('splashText');
        if(icon) icon.classList.add('splash-pop-in');
        if(text) text.style.opacity = "1";
        if(text) text.style.transform = "translateY(0)";
    }, 100);

    setTimeout(() => {
        startAppTransition();
    }, 1200);
    
    console.log('App loading...');

    initExitGuard();
    updateAiBtnUI();
    
    // Check for stored backup on startup
    setTimeout(() => checkForAutoBackup(), 2000);

    const ghostPrint = document.getElementById('printArea');
    if (ghostPrint) {
        ghostPrint.innerHTML = '';
    }
    state.isPrinting = false;

    const raw = localStorage.getItem('homeworkPhrases');
    document.getElementById('hwInput').value = (raw && raw !== "undefined") ? raw : "";
    state.lastLoadedHomework = raw || '';
    
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
            } catch (e) {}
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
        console.log('No homework found in storage.');
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
        // LOAD RECORDINGS FROM INDEXEDDB
        loadStudentRecordings();

        // Show Install App button for iOS/iPad manual installation if not already standalone
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isIOS && !isStandalone) {
            const btn = document.getElementById('installBtn');
            if (btn) btn.style.display = 'block';
        }
    }, 2000);
};

document.addEventListener('keydown', handleKeyPress);

document.addEventListener('touchstart', function wakeSpeech() {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
}, { once: true });

window.addEventListener('beforeinstallprompt', (e) => { 
    e.preventDefault(); 
    state.deferredPrompt = e; 
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'block'; 
});

window.addEventListener('appinstalled', (evt) => {
    console.log('App was successfully installed');
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none'; 
    state.deferredPrompt = null;
});
