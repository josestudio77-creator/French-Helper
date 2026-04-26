/* ==========================================
   js/game.js - Hangman game logic
   French Helper
   =========================================== */

// ===== HANGMAN GAME =====
const goodRes = ["Bravo!", "Super!", "Génial!", "Excellent!", "Magnifique!"];
const badRes = ["Oups!", "Presque!", "Non!", "Essaie encore!"];

function startHangman() {
    // NEW: Clear balloons from the previous win before starting a new round
    clearVictoryItems();
    
    // 1. Force the game to be active
    state.gameActive = true; 
    state.isSpelling = false;
    
    // 2. Clear the old game state
    guessed = [];
    mistakes = 0;
    
    const cleanWord = (w) => w.replace(/[!?.,\-;:'"()]/g, '').trim();
    
    // Pool current homework
    const hwWords = document.getElementById('hwInput').value.split('\n')
        .map(w => cleanWord(w.trim()))
        .filter(w => w.length > 1 && !w.includes(' '));
        
    // Pool presets
    const presetWords = Object.keys(MASTER_DATA)
        .map(w => cleanWord(w))
        .filter(w => !w.includes(' ') && w.length > 1);
        
    // Choose pool
    let pool = (hwWords.length > 0) ? hwWords : presetWords;
    
    if (pool.length === 0) {
        openAppModal({ title: 'Notice', text: 'Add some single words to your homework to play!', mode: 'view' });
        closeOverlay('gameDrawer');
        return;
    }
    
    let pick = pool[Math.floor(Math.random() * pool.length)];
    state.lastWord = pick; 
    state.targetWord = pick.toUpperCase();
    
    const originalWord = Object.keys(MASTER_DATA).find(key => cleanWord(key).toLowerCase() === pick.toLowerCase()) || pick;
    document.getElementById('clueEmoji').textContent = getCardData(originalWord).icon || "💡";
    
    guessed = [state.targetWord[0]]; 
    mistakes = 0; 
    document.getElementById('gameMsg').textContent = "Guess a letter!";
    drawHangman(0); 
    renderKeyboard(); 
    updateHangmanUI();
}

function celebrate() { 
    clearVictoryItems(); // Clean old balloons before starting new ones
    
    for (let i = 0; i < 25; i++) { 
        const timeout = setTimeout(() => { 
            const el = document.createElement('div'); 
            el.className = 'victory-item'; 
            el.textContent = ["🎈", "✨", "🎉", "🌟", "🏆", "🐝"][Math.floor(Math.random()*6)]; 
            el.style.left = Math.random() * 100 + "vw"; 
            document.body.appendChild(el); 
            
            const removeT = setTimeout(() => { if (el.parentNode) el.remove(); }, 4500);
            state.victoryTimeouts.push(removeT);
        }, i * 120); 
        state.victoryTimeouts.push(timeout);
    } 
}

function clearVictoryItems() {
    // 1. Stop all pending balloon timers
    if (window.victoryTimeouts) {
        state.victoryTimeouts.forEach(t => clearTimeout(t));
        state.victoryTimeouts = [];
    }
    // 2. Remove any balloons currently on screen
    document.querySelectorAll('.victory-item').forEach(el => el.remove());
}

function updateHangmanUI() {
    const display = document.getElementById('hangmanDisplay');
    if (!display) return;
    
    display.innerHTML = ''; 
    const wordDiv = document.createElement('div');
    wordDiv.className = 'word-box';

    const isGameOverLoss = (mistakes >= 10);
    const currentGuess = guessed[guessed.length - 1]; 

    state.targetWord.split('').forEach(char => {
        const slot = document.createElement('div');
        slot.className = 'bee-slot'; 
        
        if (guessed.includes(char)) {
            // Letter was correctly guessed
            slot.textContent = char;
            slot.classList.add('filled');
            
            if (char === currentGuess && !isGameOverLoss) {
                slot.classList.add('pop-anim');
                if (typeof playDingSound === "function") playDingSound();
            }
        } else if (isGameOverLoss) {
            // Show the missing letter in red because the game is lost
            slot.textContent = char;
            slot.classList.add('missed-letter');
            slot.classList.add('filled');
        } else {
            // Letter is still hidden
            slot.textContent = ''; 
        }
        wordDiv.appendChild(slot);
    });
    
    display.appendChild(wordDiv);

    // --- WIN/LOSS LOGIC ---
    const isWon = state.targetWord.split('').every(char => guessed.includes(char));
    
    if (isWon && state.gameActive) {
        // Stop the game engine
        state.gameActive = false; 
        state.isSpelling = false; // Stop any ongoing spelling audio
        
        state.wins++; 
        updateScoreUI(); 
        
        // --- TRIGGER CELEBRATION ---
        if (typeof celebrate === "function") {
            celebrate(); 
        }
        
        if (typeof playVictorySound === "function") {
            playVictorySound();
        }

        document.getElementById('gameMsg').textContent = "🏆 VICTOIRE!"; 
        
        // Pronounce the word in French after a short delay
        setTimeout(() => spk(state.targetWord, 'fr-FR', true), 800);

    } else if (isGameOverLoss) {
        state.gameActive = false; 
        state.isSpelling = false;
        state.losses++; 
        updateScoreUI();
        document.getElementById('gameMsg').textContent = "Good try! 👍"; 
        
        // Pronounce the word they missed so they learn it
        setTimeout(() => spk(state.targetWord, 'fr-FR', true), 500);
    }
}

function renderKeyboard() { 
    const kb = document.getElementById('keyboard'); 
    kb.innerHTML = ''; 
    kb.classList.add('active');
    kb.classList.add('unified-keyboard');            
    
    const isABC = state.keyboardLayout === 'ABCDEF';
    const isHint = state.hintModeActive;
    const layoutToRender = isABC ? FRENCH_ABCDEF_LAYOUT : FRENCH_QWERTY_LAYOUT;
    
    let activeLetters = [];
    if (isHint) {
        activeLetters = Array.from(new Set(state.targetWord.toUpperCase().split('').filter(c => /[A-ZÉÈÊËÀÂÎÏÔÛÙÇŒ']/.test(c))));
        
        // In Hangman, we always need a few decoy letters so it's not a guaranteed win
        const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        let decoys = [];
        while (decoys.length < 5) {
            let randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
            if (!activeLetters.includes(randomLetter) && !decoys.includes(randomLetter)) {
                decoys.push(randomLetter);
            }
        }
        activeLetters = [...activeLetters, ...decoys];
    }

    layoutToRender.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        if (index >= layoutToRender.length - 1) rowDiv.classList.add('accents');
        if (index === layoutToRender.length - 1) rowDiv.classList.add('accents-start');
        
        row.forEach(l => {
            const k = document.createElement('div'); 
            
            if (l === "") {
                // IT'S THE GEAR!
                k.className = 'k-key settings-gear';
                k.innerHTML = '⚙️';
                k.onclick = (e) => { e.stopPropagation(); showKeyboardSettings(); };
                rowDiv.appendChild(k);
                return; // skip the rest
            }
            
            // PRESERVED: Keeping your .used logic for Hangman
            k.className = 'k-key' + (guessed.includes(l) ? ' used' : ''); 
            k.textContent = l; 
            k.setAttribute('data-key', l);
            
            if (isHint && !activeLetters.includes(l)) {
                k.classList.add('used'); // Grey it out
            }
            
            k.onclick = () => handleHangmanInput(l); 
            rowDiv.appendChild(k);
        });
        kb.appendChild(rowDiv);
    });
}

// UNIFIED KEYBOARD SUPPORT (Laptop/Desktop)
function handleKeyPress(e) {
    let key = e.key.toUpperCase();
    
    // Support standard A-Z, space, and common French accents
    const validKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZÉÀÈÇÙÛŒ' ".split('');
    
    // SURGICAL TWEAK: Ligature support for laptop keyboards
    if (key === 'O' || key === 'E') {
        // We look at the global state.targetWord or the current spelling word
        let activeWord = state.gameActive ? state.targetWord : (state.currentSpellingState ? state.currentSpellingState.words[state.currentSpellingState.currentWordIndex] : "");
        let activeIndex = state.gameActive ? (guessed.length > 0 ? 0 : 0) : (state.currentSpellingState ? state.currentSpellingState.currentLetterIndex : 0);
        
        // If the game specifically needs 'Œ', treat 'O' or 'E' as a match
        if (activeWord[activeIndex]?.toUpperCase() === 'Œ') key = 'Œ';
    }

    if (!validKeys.includes(key)) return;

    if (state.gameActive) {
        // Visual feedback for Hangman keys
        const keyElem = document.querySelector(`#keyboard .k-key[data-key="${key}"]`);
        if (keyElem) {
            keyElem.classList.add('key-pressed');
            setTimeout(() => keyElem.classList.remove('key-pressed'), 150);
        }
        handleHangmanInput(key);
    } else if (state.currentSpellingState && !state.currentSpellingState.isWordVictory) {
        // Visual feedback for Spelling Bee keys
        const keyElem = document.querySelector(`#keyboard .k-key[data-key="${key}"]`);
        if (keyElem) {
            keyElem.classList.add('key-pressed');
            setTimeout(() => keyElem.classList.remove('key-pressed'), 150);
        }
        handleSpellingInput(key);
    }
}

function updateScoreUI() { 
    document.getElementById('winCount').textContent = state.wins; 
    document.getElementById('lossCount').textContent = state.losses; 
    localStorage.setItem('gameWins', state.wins); 
    localStorage.setItem('gameLosses', state.losses); 
}

function exitGame() { 
    state.gameActive = false; 
    
    // Clear any victory animations
    clearVictoryItems();
    
    if (state.musicNode) { 
        state.musicNode.stop(); 
        state.musicNode = null; 
        document.getElementById('musicToggleBtn').textContent = "🎵 Music: Off"; 
    } 
    
    // Hide the Global Keyboard
    const globalKb = document.getElementById('keyboard');
    if (globalKb) globalKb.style.display = 'none';

    // Remove the scroll buffer from the drawer
    const drawerContent = document.querySelector('#gameDrawer .overlay-content');
    if (drawerContent) drawerContent.classList.remove('keyboard-buffer');
    
    closeOverlay('gameDrawer'); 
}

function drawHangman(s) {
    const c = document.getElementById('hangmanCanvas'); 
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 200, 150); 
    ctx.lineWidth = 4; 
    ctx.strokeStyle = "#475569";
    if (s >= 1) { ctx.beginPath(); ctx.moveTo(20, 140); ctx.lineTo(180, 140); ctx.stroke(); }
    if (s >= 2) { ctx.beginPath(); ctx.moveTo(40, 140); ctx.lineTo(40, 10); ctx.stroke(); }
    if (s >= 3) { ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(120, 10); ctx.stroke(); }
    if (s >= 4) { ctx.beginPath(); ctx.moveTo(120, 10); ctx.lineTo(120, 30); ctx.stroke(); }
    if (s >= 5) { ctx.beginPath(); ctx.arc(120, 42, 12, 0, Math.PI * 2); ctx.stroke(); }
    if (s >= 6) { ctx.beginPath(); ctx.moveTo(120, 54); ctx.lineTo(120, 90); ctx.stroke(); }
    if (s >= 7) { ctx.beginPath(); ctx.moveTo(120, 65); ctx.lineTo(100, 80); ctx.stroke(); }
    if (s >= 8) { ctx.beginPath(); ctx.moveTo(120, 65); ctx.lineTo(140, 80); ctx.stroke(); }
    if (s >= 9) { ctx.beginPath(); ctx.moveTo(120, 90); ctx.lineTo(100, 115); ctx.stroke(); }
    if (s >= 10) { ctx.beginPath(); ctx.moveTo(120, 90); ctx.lineTo(140, 115); ctx.stroke(); }
}

function handleHangmanInput(l) {
   if (!l) return; // --- ADDED: Safety check for empty spacers ---
    if (!state.gameActive || guessed.includes(l)) return; 

    // 1. Visual feedback for Global Keyboard
    const keyElem = document.querySelector(`#keyboard .k-key[data-key="${l}"]`);
    if (keyElem) {
        keyElem.classList.add('key-pressed');
        setTimeout(() => keyElem.classList.remove('key-pressed'), 150);
    }

    guessed.push(l); 
    
    if (state.targetWord.includes(l)) { 
        // CORRECT: Instant Chime
        playDingSound(); 
    } else { 
        // INCORRECT: Instant Buzz
        mistakes++; 
        drawHangman(mistakes); 
        playBuzzSound();
    } 
    
    updateHangmanUI();
    renderKeyboard();
}

