/* ==========================================
   js/spelling.js - Spelling Bee theater mode
   French Helper
   =========================================== */

function toggleSpellingMode(btn, fullPhrase) {
    const card = btn.closest('.phrase-card');
    const spellingZone = card.querySelector('.spelling-zone');
    const spellBtn = card.querySelector('.spell-btn');
    const recordContainer = card.querySelector('.record-play-container');
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
    iconElement.style.display = ''; // Restore CSS default
    iconElement.style.pointerEvents = 'auto';
    iconElement.style.cursor = 'pointer';
}
const sylToggle = card.querySelector('.syl-toggle');
if (sylToggle) sylToggle.style.display = 'flex';
const enToggle2 = card.querySelector('.en-toggle');
if (enToggle2) enToggle2.style.display = 'flex';
const printBtn2 = card.querySelector('.print-card-btn');
if (printBtn2) printBtn2.style.display = 'flex';

// Restore ALL text elements (french, english, pronunciation)
card.querySelectorAll('.french-text, .english-text, .pronunciation-text').forEach(el => {
    el.style.display = 'block';
});
spellingZone.style.display = 'none';

// Restore Record/Play buttons, hide Spell button
if (spellBtn) spellBtn.style.display = 'none';
if (recordContainer) recordContainer.style.display = 'flex';

// Restore French button to normal function
const frenchText = card.querySelector('.french-text').textContent;
frBtn.onclick = () => SpeechCache.playCachedAudio(frenchText, 'fr-FR', true);

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

    if (state.spellingScrollY !== undefined) window.scrollTo({ top: state.spellingScrollY, behavior: 'instant' });
    
}, 600);

window.speechSynthesis.cancel();

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

// Disable and hide icon and ABC button during spelling mode
const iconElement = card.querySelector('.card-icon, .card-photo, .ai-placeholder-box');
if (iconElement) {
    iconElement.style.display = 'none';
    iconElement.style.pointerEvents = 'none';
    iconElement.style.cursor = 'default';
}
const sylToggle = card.querySelector('.syl-toggle');
if (sylToggle) sylToggle.style.display = 'none';
const enToggle = card.querySelector('.en-toggle');
if (enToggle) enToggle.style.display = 'none';
const printBtn = card.querySelector('.print-card-btn');
if (printBtn) printBtn.style.display = 'none';

// ONLY HIDE TEXT - keep the VISUAL (emoji/photo) visible!
card.querySelectorAll('.french-text, .english-text, .pronunciation-text').forEach(el => {
    el.style.display = 'none';
});

spellingZone.style.display = 'block';

// Update buttons to SPELLING MODE behavior
if (recordContainer) recordContainer.style.display = 'none';
if (spellBtn) {
    spellBtn.style.display = 'block';
    spellBtn.onclick = (e) => {
        e.stopPropagation();
        spellCurrentWord();
    };
}

// French button speaks the word at the new spelling speed
const frenchText = card.querySelector('.french-text').textContent;
frBtn.onclick = () => SpeechCache.playCachedAudio(frenchText, 'fr-FR', true);

if (globalKb) {
    globalKb.style.display = 'flex';
    renderMiniKeyboard();
}
document.body.classList.add('keyboard-buffer');

startNewSpellingGame(card, fullPhrase);
state.spellingScrollY = window.scrollY;
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
    SpeechCache.playCachedAudio(words[0], 'fr-FR');
}, 100);
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
// Restore icon visibility
const iconElement = card.querySelector('.card-icon, .card-photo, .ai-placeholder-box');
if (iconElement) iconElement.style.display = '';
const sylToggle = card.querySelector('.syl-toggle');
if (sylToggle) sylToggle.style.display = 'flex';
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
            const waitTime = isLastWord ? 600 : 800; 

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
                        if (state.currentSpellingState) SpeechCache.playCachedAudio(state.currentSpellingState.phrase, 'fr-FR', true);
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
                            SpeechCache.playCachedAudio(state.currentSpellingState.words[state.currentSpellingState.currentWordIndex], 'fr-FR', true);
                        }
                    }, 100);
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

    // Restore original speech speed (force-exit path bypasses toggleSpellingMode)
    if (state.savedSpeechSpeed !== null) {
        state.speechSpeed = state.savedSpeechSpeed;
        const slider = document.getElementById('speedSlider');
        const speedDisplay = document.getElementById('speedValue');
        if (slider) slider.value = state.speechSpeed;
        if (speedDisplay) speedDisplay.textContent = state.speechSpeed.toFixed(2);
        localStorage.setItem('speechSpeed', state.speechSpeed);
        state.savedSpeechSpeed = null;
    }

    window.speechSynthesis.cancel();
    state.currentSpellingState = null;
    state.isInSpellingMode = false;

    const activeCard = document.querySelector('.phrase-card.spelling-mode');
    const stage = document.getElementById('spellingTheaterStage');
    const globalKb = document.getElementById('keyboard');
    const header = document.querySelector('.header');
    const bottomNav = document.querySelector('.bottom-nav');
    const controlPanel = document.querySelector('.app-control-panel');

    // CRITICAL: Lock elements hidden with inline styles BEFORE removing mode-spelling CSS.
    // This prevents a flash where CSS !important rules stop hiding them but JS hasn't animated yet.
    if (header) header.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (controlPanel) controlPanel.style.display = 'none';
    // Hide all non-active cards inline too
    document.querySelectorAll('.phrase-card').forEach(c => {
        if (c !== activeCard) c.style.display = 'none';
    });

    if (activeCard) {
        activeCard.classList.add('theater-exit');
        const beeBtn = activeCard.querySelector('.bee-badge');
        if (beeBtn) beeBtn.innerHTML = "\uD83D\uDC1D";
    }

    if (stage) stage.classList.remove('active');
    if (globalKb) globalKb.classList.remove('active');

    // Now it's safe to remove the CSS class — inline styles keep everything hidden
    document.body.classList.remove('mode-spelling');
    document.body.classList.remove('keyboard-buffer');

    // Single smooth restoration at 600ms — matches toggleSpellingMode exit timing
    setTimeout(() => {
        if (activeCard) {
            activeCard.classList.remove('spelling-mode');
            activeCard.classList.remove('theater-exit');
            activeCard.querySelectorAll('.french-text, .pronunciation-text').forEach(el => {
                el.style.display = 'block';
            });
            const spellingZone = activeCard.querySelector('.spelling-zone');
            if (spellingZone) spellingZone.style.display = 'none';
            const iconElement = activeCard.querySelector('.card-icon, .card-photo, .ai-placeholder-box');
            if (iconElement) {
                iconElement.style.display = '';
                iconElement.style.pointerEvents = 'auto';
                iconElement.style.cursor = 'pointer';
            }
            const sylToggle = activeCard.querySelector('.syl-toggle');
            if (sylToggle) sylToggle.style.display = 'flex';
            const enToggle = activeCard.querySelector('.en-toggle');
            if (enToggle) enToggle.style.display = 'flex';
            const printBtn = activeCard.querySelector('.print-card-btn');
            if (printBtn) printBtn.style.display = 'flex';
            const spellBtn = activeCard.querySelector('.spell-btn');
            if (spellBtn) spellBtn.style.display = 'none';
            const recordContainer = activeCard.querySelector('.record-play-container');
            if (recordContainer) recordContainer.style.display = 'flex';
            const frenchText = activeCard.querySelector('.french-text');
            if (frenchText) {
                const frBtn = activeCard.querySelector('.spk-fr');
                if (frBtn) frBtn.onclick = () => SpeechCache.playCachedAudio(frenchText.textContent, 'fr-FR', true);
            }
        }

        // Restore all cards with fade-in
        document.querySelectorAll('.phrase-card').forEach(c => {
            c.style.display = 'block';
            c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
        });

        // Restore header, nav, control panel with fade-in
        [header, bottomNav, controlPanel].forEach(el => {
            if (!el) return;
            el.style.display = el === bottomNav ? 'flex' : 'block';
            el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
        });

        const exitBtn = document.getElementById('exitSpellingTheaterBtn');
        if (exitBtn) exitBtn.classList.remove('visible');
        if (state.spellingScrollY !== undefined) window.scrollTo({ top: state.spellingScrollY, behavior: 'instant' });
    }, 600);
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

let keyToPlay = letter.toLowerCase();
let lettersConsumed = 1;

// Look ahead for double letters
if (index + 1 < letters.length && letter.toLowerCase() === letters[index + 1].toLowerCase()) {
    const doubleKey = keyToPlay + keyToPlay;
    // Check if we actually have a recording for this double letter (e.g. 'll' -> 'deux_l.wav')
    // AUDIO_FILE_MAP check requires audio.js to be loaded, but state.audioBuffers is safer
    if (state.audioBuffers && state.audioBuffers[doubleKey]) {
        keyToPlay = doubleKey;
        lettersConsumed = 2;
    }
}

// 2. Visual Highlight ON for all consumed slots
for (let i = 0; i < lettersConsumed; i++) {
    if (slots[index + i]) {
        slots[index + i].style.backgroundColor = '#FFD700'; // Gold
        slots[index + i].style.transform = 'scale(1.15)';
        slots[index + i].style.zIndex = '10';
    }
}

// 3. Play the studio audio
playLetterAudio(keyToPlay, () => {
    // Short delay (50ms) to ensure snappy transition
    setTimeout(() => {
        // Visual Highlight OFF for all consumed slots
        for (let i = 0; i < lettersConsumed; i++) {
            if (slots[index + i]) {
                // Restore background: green if already correctly typed, white otherwise
                slots[index + i].style.backgroundColor = slots[index + i].classList.contains('filled') ? '#f0fdf4' : 'white';
                slots[index + i].style.transform = '';
                slots[index + i].style.zIndex = '';
            }
        }
        
        // CRUCIAL: Check again if we are still in the same game state before continuing
        if (state.currentSpellingState) {
            speakNextLetter(index + lettersConsumed);
        }
    }, 50);
});

    }

    speakNextLetter(0);
}

