/* ==========================================
   js/spelling.js - Spelling Bee theater mode
   French Helper
   =========================================== */

function toggleSpellingMode(btn, fullPhrase) {
    const card = btn.closest('.phrase-card');
    const spellingZone = card.querySelector('.spelling-zone');
    const enBtn = card.querySelector('.spk-en');
    const frBtn = card.querySelector('.spk-fr');
    const globalKb = document.getElementById('keyboard');
    const stage = document.getElementById('spellingTheaterStage');
    
    const controlPanel = document.querySelector('.app-control-panel');
    const bottomNav = document.querySelector('.bottom-nav');
    const header = document.querySelector('.header');

    if (card.classList.contains('spelling-mode')) {
        // --- EXIT SPELLING MODE ---
        btn.innerHTML = "🐝";
        if (typeof playTheaterExit === 'function') playTheaterExit();

        // RESTORE ORIGINAL SPEECH SPEED
if (state.savedSpeechSpeed !== null) {
    state.speechSpeed = state.savedSpeechSpeed;
    // Update the slider to reflect the restored speed
    const slider = document.getElementById('speedSlider');
    const speedDisplay = document.getElementById('speedValue');
    if (slider) slider.value = state.speechSpeed;
    if (speedDisplay) speedDisplay.textContent = state.speechSpeed.toFixed(2);
    localStorage.setItem('speechSpeed', state.speechSpeed);
    state.savedSpeechSpeed = null;
}

state.isInSpellingMode = false;

card.classList.add('theater-exit');
if (stage) stage.classList.remove('active');
if (globalKb) globalKb.classList.remove('active');

// State clearing is handled by the 600ms layout restorer below.
// Re-enable icon click when exiting spelling mode
const iconElement = card.querySelector('.card-icon, .card-photo, .ai-placeholder-box');
if (iconElement) {
    iconElement.style.pointerEvents = 'auto';
    iconElement.style.cursor = 'pointer';
}

// Restore ALL text elements (french, english, pronunciation)
card.querySelectorAll('.french-text, .english-text, .pronunciation-text').forEach(el => {
    el.style.display = 'block';
});
spellingZone.style.display = 'none';

// Restore English button to normal function
const enText = card.querySelector('.english-text').textContent;
enBtn.innerHTML = '<span>English</span>';
enBtn.onclick = () => spk(enText, 'en-US', true);

// Restore French button to normal function
const frenchText = card.querySelector('.french-text').textContent;
frBtn.onclick = () => spk(frenchText, 'fr-FR', true);

// Wait for the exit animation (600ms) to finish, then smoothly fade the practice screen back in
setTimeout(() => {
    // 1. Instantly reset the active card to normal state
    card.classList.remove('spelling-mode');
    card.classList.remove('theater-exit');
    document.body.classList.remove('mode-spelling');
    document.body.classList.remove('keyboard-buffer');
    state.currentSpellingState = null;
    
    // 2. Restore display for all elements and fade them in together
    const elementsToFade = [];
    
    document.querySelectorAll('.phrase-card').forEach(c => {
        c.style.display = 'block';
        elementsToFade.push(c);
    });
    
    if (controlPanel) {
        controlPanel.style.display = 'block';
        elementsToFade.push(controlPanel);
    }
    if (bottomNav) {
        bottomNav.style.display = 'flex';
        elementsToFade.push(bottomNav);
    }
    if (header) {
        header.style.display = 'flex';
        elementsToFade.push(header);
    }

    // Apply fade-in animation to the entire restored layout
    elementsToFade.forEach(el => {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
    });
    
}, 600);

document.body.classList.remove('keyboard-buffer');
state.currentSpellingState = null;
window.speechSynthesis.cancel();
window.scrollTo({ top: 0, behavior: 'smooth' });

    } else {
// --- ENTER SPELLING MODE ---
playTheaterIntro();
btn.innerHTML = "✖";

// SAVE ORIGINAL SPEECH SPEED AND SET SPELLING SPEED
if (state.savedSpeechSpeed === null) {
    state.savedSpeechSpeed = state.speechSpeed;  // Store original
}
// Set to a clear, moderate speed for spelling practice (0.75 works well)
state.speechSpeed = 0.75;
// Optional: Update the slider display (even though it's hidden, keep it accurate)
const slider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedValue');
if (slider) slider.value = state.speechSpeed;
if (speedDisplay) speedDisplay.textContent = state.speechSpeed.toFixed(2);

state.isInSpellingMode = true;

// Hide UI
if (controlPanel) controlPanel.style.display = 'none';
if (bottomNav) bottomNav.style.display = 'none';
if (header) header.style.display = 'none';

document.querySelectorAll('.phrase-card').forEach(c => {
    if (c !== card) c.style.display = 'none';
});

if (stage) stage.classList.add('active');
document.body.classList.add('mode-spelling');

card.classList.add('spelling-mode');
card.classList.remove('theater-exit');
card.style.display = 'block';

if (globalKb) {
    globalKb.classList.add('active');
}

// Disable icon click during spelling mode
const iconElement = card.querySelector('.card-icon, .card-photo, .ai-placeholder-box');
if (iconElement) {
    iconElement.style.pointerEvents = 'none';
    iconElement.style.cursor = 'default';
}

// ONLY HIDE TEXT - keep the VISUAL (emoji/photo) visible!
card.querySelectorAll('.french-text, .english-text, .pronunciation-text').forEach(el => {
    el.style.display = 'none';
});

spellingZone.style.display = 'block';

// Update buttons to SPELLING MODE behavior
enBtn.innerHTML = '<span>Spell</span>';
enBtn.onclick = (e) => {
    e.stopPropagation();
    spellCurrentWord();
};

// French button speaks the word at the new spelling speed
const frenchText = card.querySelector('.french-text').textContent;
frBtn.onclick = () => spk(frenchText, 'fr-FR', true);

if (globalKb) {
    globalKb.style.display = 'flex';
    renderMiniKeyboard();
}
document.body.classList.add('keyboard-buffer');

startNewSpellingGame(card, fullPhrase);
window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
    
    function startNewSpellingGame(card, phrase) {
const cleanPhrase = phrase.split('|')[0].trim();
const words = cleanPhrase.split(/\s+/);

state.currentSpellingState = {
    card: card,
    phrase: cleanPhrase,
    words: words,
    currentWordIndex: 0,
    currentLetterIndex: 0,
    isWordVictory: false
};

// Render slots immediately (this gives the card height)
renderSpellingSlots();
renderMiniKeyboard();

// Then speak the word
setTimeout(() => {
    spk(words[0], 'fr-FR');
}, 500);
    }
    
function renderSpellingSlots() {
    if (!state.currentSpellingState) return;
    const container = state.currentSpellingState.card.querySelector('.spelling-slots');
    container.innerHTML = '';

    state.currentSpellingState.words.forEach((word, wIdx) => {
const wordDiv = document.createElement('div');
wordDiv.className = 'word-box'; // CSS handles the horizontal row

// --- CASES 1, 2, and 4: Text-based words (Past, Victory, Future) ---
if (wIdx < state.currentSpellingState.currentWordIndex || 
    (wIdx === state.currentSpellingState.currentWordIndex && state.currentSpellingState.isWordVictory) ||
    wIdx > state.currentSpellingState.currentWordIndex) {
    
    const wordSpan = document.createElement('span');
    wordSpan.textContent = word;
    
    // Fixed height and inline-block prevent the card from jumping
    wordSpan.style.fontSize = "1.8rem";
    wordSpan.style.fontWeight = "900";
    wordSpan.style.lineHeight = "38px"; 
    wordSpan.style.display = "inline-block";
    wordSpan.style.transition = "all 0.3s";

    if (wIdx < state.currentSpellingState.currentWordIndex) {
        wordSpan.style.color = "#4cd964"; // Completed words
    } 
    else if (wIdx === state.currentSpellingState.currentWordIndex && state.currentSpellingState.isWordVictory) {
        wordSpan.className = "word-victory-anim"; // The Pop animation
    } 
    else {
        wordSpan.style.opacity = "0.3"; // Future words
        wordSpan.style.color = "#2d3748";
    }
    wordDiv.appendChild(wordSpan);
} 
// --- CASE 3: The Target word currently being spelled (The 3D Boxes) ---
else if (wIdx === state.currentSpellingState.currentWordIndex) {
    wordDiv.className = 'word-box current-word'; // Adds the pulsing effect
    
    const letters = word.split('');
    letters.forEach((char, lIdx) => {
        const slot = document.createElement('div');
        slot.className = 'bee-slot';
        
        const isPunctuation = /[.,!?;:''’\-]/.test(char);

        // Show the character if it's already typed OR if it's punctuation
        if (lIdx < state.currentSpellingState.currentLetterIndex || isPunctuation) {
            slot.textContent = char;
            slot.classList.add('filled');
            
            if (isPunctuation) {
                slot.style.border = 'none';
                slot.style.background = 'transparent';
                // NEW: Force punctuation to be narrow to save horizontal space
                slot.style.width = '12px'; 
                slot.style.boxShadow = 'none';
            }
        } else {
            slot.textContent = ''; // Blank box
        }
        wordDiv.appendChild(slot);
    });
}

container.appendChild(wordDiv);
    });
}

function resetAllSpellingCards() {
    // 1. Find all cards and restore their normal look
    document.querySelectorAll('.phrase-card.spelling-mode').forEach(card => {
card.classList.remove('spelling-mode');
// Show text elements
card.querySelectorAll('.french-text, .english-text, .pronunciation-text').forEach(el => {
    el.style.display = 'block';
});
// Hide spelling area
const zone = card.querySelector('.spelling-zone');
if (zone) zone.style.display = 'none';
// Reset button label
const enBtn = card.querySelector('.spk-en');
if (enBtn) {
    enBtn.innerHTML = '<span>English</span>';
    // Restore English speech logic
    const enText = card.querySelector('.english-text').textContent;
    enBtn.onclick = () => spk(enText, 'en-US', true);
}
    });

    // 2. Hide Global Keyboard and Buffer
    const globalKb = document.getElementById('keyboard');
    if (globalKb) globalKb.style.display = 'none';
    document.body.classList.remove('keyboard-buffer');

    // 3. Clear logic state
    state.currentSpellingState = null;
}

function renderMiniKeyboard() {
    if (!state.currentSpellingState) return;
    
    // FIX: Target the Global Container at the bottom of the page
    const kbContainer = document.getElementById('keyboard');
    if (!kbContainer) return;

    kbContainer.innerHTML = '';
    // Ensure it has the correct classes for your 3D styling
    kbContainer.classList.add("unified-keyboard");
    
    const isABC = state.keyboardLayout === 'ABCDEF';
    const isHint = state.hintModeActive;
    const layoutToRender = isABC ? FRENCH_ABCDEF_LAYOUT : FRENCH_QWERTY_LAYOUT;
    
    let activeLetters = [];
    if (isHint) {
        const targetWord = state.currentSpellingState.words[state.currentSpellingState.currentWordIndex] || "";
        activeLetters = Array.from(new Set(targetWord.toUpperCase().split('').filter(c => /[A-ZÉÈÊËÀÂÎÏÔÛÙÇŒ']/.test(c))));
        
        if (activeLetters.length < 4) {
            const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
            let decoys = [];
            while (decoys.length < (4 - activeLetters.length)) {
                let randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
                if (!activeLetters.includes(randomLetter) && !decoys.includes(randomLetter)) {
                    decoys.push(randomLetter);
                }
            }
            activeLetters = [...activeLetters, ...decoys];
        }
    }
    
    layoutToRender.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        if (index >= layoutToRender.length - 1) rowDiv.classList.add('accents');
        if (index === layoutToRender.length - 1) rowDiv.classList.add('accents-start');

        row.forEach(key => {
            const k = document.createElement('div');
            
            if (key === "") {
                // IT'S THE GEAR!
                k.className = 'k-key settings-gear';
                k.innerHTML = '⚙️';
                k.onclick = (e) => { e.stopPropagation(); showKeyboardSettings(); };
                rowDiv.appendChild(k);
                return; // skip the rest
            }
            
            k.className = 'k-key';
            k.textContent = key;
            k.setAttribute('data-key', key);
            
            if (isHint && !activeLetters.includes(key)) {
                k.classList.add('used'); // Grey it out
            }
            
            // NEW: Accessibility
            k.setAttribute('role', 'button');
            k.setAttribute('aria-label', 'Key ' + key);
            k.onclick = (e) => { 
                e.stopPropagation(); 
                if (state.gameActive) handleHangmanInput(key);
                else handleSpellingInput(key); 
            };
            rowDiv.appendChild(k);
        });
        kbContainer.appendChild(rowDiv);
    });
}
    
function handleSpellingInput(inputLetter) {
    // 1. Guard: Prevent input if no game is active or during the "Word Victory" celebration
    if (!inputLetter) return; // --- ADDED: Safety check for empty spacers ---
    if (!state.currentSpellingState || state.currentSpellingState.isWordVictory) return;

    state.targetWord = state.currentSpellingState.words[state.currentSpellingState.currentWordIndex];
    
    // 2. Initial Skip Logic: If the current position is punctuation, skip it automatically.
    // This handles cases where a word might start with punctuation.
    while (state.currentSpellingState.currentLetterIndex < state.targetWord.length && 
   /[.,!?;:''’\-\(\)«»]/.test(state.targetWord[state.currentSpellingState.currentLetterIndex])) {
state.currentSpellingState.currentLetterIndex++;
    }

    // 3. Identify the letter she is supposed to type
    let targetLetter = state.targetWord[state.currentSpellingState.currentLetterIndex]?.toUpperCase();
    
    // 4. Special Match Check: 
    // - Check for direct match (e.g. A matches A)
    // - Check for Ligature match (If box wants 'Œ', accept 'O' or 'E' from a laptop keyboard)
    let isMatch = (inputLetter === targetLetter);
    if (!isMatch && targetLetter === 'Œ' && (inputLetter === 'O' || inputLetter === 'E')) {
isMatch = true;
    }

    if (isMatch) {
// --- CORRECT LETTER ---
state.currentSpellingState.currentLetterIndex++;
if (typeof playDingSound === "function") playDingSound();

// 5. Look-ahead Skip: If the letter typed is followed by punctuation (like an apostrophe),
// skip those symbols immediately so the next box is ready for her.
while (state.currentSpellingState.currentLetterIndex < state.targetWord.length && 
       /[.,!?;:''’\-\(\)«»]/.test(state.targetWord[state.currentSpellingState.currentLetterIndex])) {
    state.currentSpellingState.currentLetterIndex++;
}

// 6. Check if the current word is finished
if (state.currentSpellingState.currentLetterIndex >= state.targetWord.length) {
            // Trigger the "Word Victory" state
            state.currentSpellingState.isWordVictory = true; 
            renderSpellingSlots(); 
            
            const isLastWord = state.currentSpellingState.currentWordIndex >= state.currentSpellingState.words.length - 1;
            const waitTime = isLastWord ? 1000 : 2500; 

            setTimeout(() => {
                // --- THE CRITICAL SAFETY GUARD ---
                // If the user exited the theater during the wait, stop here!
                if (!state.currentSpellingState) return;

                state.currentSpellingState.isWordVictory = false;
                state.currentSpellingState.currentWordIndex++;
                state.currentSpellingState.currentLetterIndex = 0;
                
                if (state.currentSpellingState.currentWordIndex >= state.currentSpellingState.words.length) {
                    // --- FULL PHRASE SUCCESS ---
                    if (typeof celebrate === "function") celebrate();
                    if (typeof playVictorySound === "function") playVictorySound();
                    
                    // Final pronunciation
                    setTimeout(() => {
                        if (state.currentSpellingState) spk(state.currentSpellingState.phrase, 'fr-FR', true);
                    }, 600);

                    // Auto-close Spelling Bee mode after 4 seconds
                    setTimeout(() => {
                        // Check again before auto-closing
                        if (state.currentSpellingState) {
                            const beeBtn = state.currentSpellingState.card.querySelector('.bee-badge');
                            if (beeBtn) toggleSpellingMode(beeBtn, state.currentSpellingState.phrase);
                        }
                    }, 4000);
                } else {
                    // --- PREPARE NEXT WORD ---
                    renderSpellingSlots();
                    
                    // Re-render the keyboard if hint mode is active
                    if (state.hintModeActive) renderMiniKeyboard();
                    
                    // Say the next word
                    setTimeout(() => {
                        if (state.currentSpellingState) {
                            spk(state.currentSpellingState.words[state.currentSpellingState.currentWordIndex], 'fr-FR', true);
                        }
                    }, 400);
                }
            }, waitTime);
        } else {
            renderSpellingSlots();
        }
    } else {
// --- WRONG LETTER ---
const card = state.currentSpellingState.card;
// Instant Buzz sound
if (typeof playBuzzSound === "function") playBuzzSound(); 

// Visual feedback: Shake the card using Web Animations API
card.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-8px)' },
    { transform: 'translateX(8px)' },
    { transform: 'translateX(0)' }
], { duration: 300, easing: 'ease-in-out' });
    }
}

function exitSpellingTheater() {
    if (typeof playTheaterExit === "function") playTheaterExit();

    window.speechSynthesis.cancel();
    
    const activeCard = document.querySelector('.phrase-card.spelling-mode');
    const stage = document.getElementById('spellingTheaterStage');
    const globalKb = document.getElementById('keyboard');
    
    if (activeCard) {
activeCard.classList.add('theater-exit');
const beeBtn = activeCard.querySelector('.bee-badge');
if (beeBtn) beeBtn.innerHTML = "🐝";
    }
    
    if (stage) stage.classList.remove('active');
    if (globalKb) globalKb.classList.remove('active');
    
    setTimeout(() => {
document.body.classList.remove('mode-spelling');
if (activeCard) {
    activeCard.classList.remove('spelling-mode');
    activeCard.classList.remove('theater-exit');
    
    // Restore text visibility
    activeCard.querySelectorAll('.french-text, .english-text, .pronunciation-text').forEach(el => {
        el.style.display = 'block';
    });
    const spellingZone = activeCard.querySelector('.spelling-zone');
    if (spellingZone) spellingZone.style.display = 'none';
    
    // Restore icon interaction
    const iconElement = activeCard.querySelector('.card-icon, .card-photo, .ai-placeholder-box');
    if (iconElement) {
        iconElement.style.pointerEvents = 'auto';
        iconElement.style.cursor = 'pointer';
    }
}

if (globalKb) {
     // Class handles it
}

document.getElementById('exitSpellingTheaterBtn').classList.remove('visible');

setTimeout(() => {
    const header = document.querySelector('.header');
    if (header) {
        header.style.display = 'flex';
        header.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });
    }
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'flex';
        bottomNav.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });
    }
    
    const controlPanel = document.querySelector('.app-control-panel');
    if (controlPanel) {
        controlPanel.style.display = 'block';
        controlPanel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });
    }

    document.querySelectorAll('.phrase-card').forEach(c => {
        if (c !== activeCard) {
            c.style.display = 'block';
            c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });
        }
    });
}, 500);

state.isInSpellingMode = false;
state.currentSpellingState = null;
window.speechSynthesis.cancel();
window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
}

function spellCurrentWord() {
    // 1. Guard: Don't spell if we are in a victory transition
    if (!state.currentSpellingState || state.currentSpellingState.isWordVictory) return;

    const word = state.currentSpellingState.words[state.currentSpellingState.currentWordIndex];
    const letters = word.split('');
    
    // 2. Full Stop for existing speech
    window.speechSynthesis.cancel();

    const currentWordBox = state.currentSpellingState.card.querySelector('.word-box.current-word');
    const slots = currentWordBox ? currentWordBox.querySelectorAll('.bee-slot') : [];

    function speakNextLetter(index) {
// Exit check
if (index >= letters.length || !state.currentSpellingState) return;

const letter = letters[index];
const upper = letter.toUpperCase();

// Punctuation/Symbols: Show instantly and move to next index immediately
const isAutoFill = /[.,!?;:''’\-\(\)«»]/.test(letter);
if (isAutoFill) {
    if (slots[index]) {
        slots[index].textContent = letter;
        slots[index].style.border = 'none';
        slots[index].style.background = 'transparent';
    }
    speakNextLetter(index + 1);
    return;
}

        // 2. Prepare the Voice
        const nameToSpeak = FRENCH_LETTER_NAMES[upper] || letter;
        const u = new SpeechSynthesisUtterance(nameToSpeak);
        u.lang = 'fr-FR';
        // IMPROVED: Increased rate from 0.8 to 0.9 to avoid "fan vibration" distortion at very low speeds
        u.rate = state.speechSpeed * 0.9; 
        u.voice = state.selectedFrVoice;

// 3. Visual Highlight ON
if (slots[index]) {
    slots[index].style.backgroundColor = '#FFD700'; // Gold
    slots[index].style.transform = 'scale(1.15)';
    slots[index].style.zIndex = '10';
}

// 4. THE FIX: Explicitly handle the transition to the next letter
u.onend = () => {
    // Short delay (300ms) to ensure the engine is ready for the next letter
    setTimeout(() => {
        // Visual Highlight OFF
        if (slots[index]) {
            // Restore background: green if already correctly typed, white otherwise
            slots[index].style.backgroundColor = slots[index].classList.contains('filled') ? '#f0fdf4' : 'white';
            slots[index].style.transform = '';
            slots[index].style.zIndex = '';
        }
        
        // CRUCIAL: Check again if we are still in the same game state before continuing
        if (state.currentSpellingState) {
            speakNextLetter(index + 1);
        }
    }, 300); // Increased from 200ms to 300ms for better "œ" to "u" transition
};

// Safety: If for some reason onend fails (browser bug), move on after 3 seconds
const backupTimer = setTimeout(() => {
    u.onend();
}, 3000);

u.onstart = () => clearTimeout(backupTimer);

        // 5. THE SYNC FIX: Explicitly handle the transition to the next letter
        // Added 50ms buffer and blank space pre-roll to "wake up" the engine (Matches Alphabet Practice logic)
        setTimeout(() => {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(" ")); 
            window.speechSynthesis.speak(u);
        }, 50);
    }

    speakNextLetter(0);
}

