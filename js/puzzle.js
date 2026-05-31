/**
 * puzzle.js - Logic for the Word Puzzle feature.
 * Provides touch-based drag-and-drop word reassembly.
 */

window.puzzleState = {
    activeCard: null, // the practice card currently in puzzle mode
    pieces: [], // array of DOM elements for puzzle pieces
    slots: [], // array of DOM elements for puzzle slots
    originalPhrase: "",
    isDragging: false,
    currentDragPiece: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0
};

/**
 * Toggles puzzle mode for a specific practice card.
 */
function togglePuzzleMode(btn, phrase) {
    const card = btn.closest('.phrase-card');
    if (!card) return;

    const isCurrentlyActive = btn.classList.contains('active-puzzle-btn');

    // UI elements to hide/show
    const elementsToHide = card.querySelectorAll('.card-tools, .card-icon, .card-photo, .ai-placeholder-box, .french-text, .english-text, .pronunciation-text');
    let puzzleZone = card.querySelector('.puzzle-zone');
    let exitBtn = card.querySelector('.puzzle-exit-btn');

    if (isCurrentlyActive) {
        // Turn OFF puzzle mode
        card.classList.remove('puzzle-mode');
        btn.classList.remove('active-puzzle-btn');
        btn.style.color = ''; // Restore default
        
        elementsToHide.forEach(el => {
            if (el.classList.contains('card-tools')) {
                el.style.display = 'flex';
            } else {
                el.style.display = '';
            }
        });
        
        if(puzzleZone) puzzleZone.style.display = 'none';
        if(exitBtn) exitBtn.style.display = 'none';
        
        const recordPlay = card.querySelector('.record-play-container');
        if (recordPlay) recordPlay.style.display = 'flex';
        
        const scoreboard = card.querySelector('.puzzle-scoreboard');
        if (scoreboard) scoreboard.style.display = 'none';
        const victoryPopup = card.querySelector('.puzzle-victory-popup');
        if (victoryPopup) victoryPopup.style.display = 'none';
        
        // Clean up puzzle
        if (puzzleZone) puzzleZone.innerHTML = '';
        window.puzzleState.activeCard = null;
    } else {
        // Turn ON puzzle mode
        card.classList.add('puzzle-mode');
        btn.classList.add('active-puzzle-btn');
        
        elementsToHide.forEach(el => el.style.display = 'none');
        
        // Create puzzle zone if it doesn't exist
        if(!puzzleZone) {
            puzzleZone = document.createElement('div');
            puzzleZone.className = 'puzzle-zone';
            card.querySelector('.card-main-content').appendChild(puzzleZone);
        }
        
        const recordPlay = card.querySelector('.record-play-container');
        if (recordPlay) recordPlay.style.display = 'none';
        
        let scoreboard = card.querySelector('.puzzle-scoreboard');
        if (!scoreboard) {
            scoreboard = document.createElement('div');
            scoreboard.className = 'puzzle-scoreboard';
            const cardBtns = card.querySelector('.card-btns');
            if (cardBtns) cardBtns.appendChild(scoreboard);
        }
        scoreboard.style.display = 'flex';

        // Create exit button if it doesn't exist (created AFTER scoreboard so it's on the right)
        if(!exitBtn) {
            exitBtn = document.createElement('button');
            exitBtn.className = 'puzzle-exit-btn card-btn';
            exitBtn.innerHTML = '<span>❌</span>';
            exitBtn.onclick = () => {
                const totalWords = phrase.split(' ').filter(w => w.trim().length > 0).length;
                const filledSlots = card.querySelectorAll('.puzzle-slot[data-filled="true"]').length;
                
                if (filledSlots < totalWords) {
                    showExitConfirmPopup(card, btn, phrase);
                } else {
                    togglePuzzleMode(btn, phrase);
                }
            };
            const cardBtns = card.querySelector('.card-btns');
            if (cardBtns) cardBtns.appendChild(exitBtn);
        }
        
        puzzleZone.style.display = 'block';
        exitBtn.style.display = 'block';
        
        let victoryPopup = card.querySelector('.puzzle-victory-popup');
        if (victoryPopup) victoryPopup.style.display = 'none';
        
        initPuzzle(puzzleZone, phrase);
        
        if (typeof spk === 'function') {
            spk("Let's put all the words in order!", 'en-US', true);
        }
    }
}

function initPuzzle(container, phrase) {
    container.innerHTML = ''; // clear existing
    const card = container.closest('.phrase-card');
    
    // Initialize scoreboard logic
    card._puzzleScore = { correct: 0, wrong: 0 };
    card._puzzlePhrase = phrase;
    updateScoreBoard(card);
    
    let victoryPopup = card.querySelector('.puzzle-victory-popup');
    if (victoryPopup) victoryPopup.style.display = 'none';
    
    // Split phrase by spaces (Option B: keeping punctuation attached for simplicity)
    const words = phrase.split(' ').filter(w => w.trim().length > 0);
    
    // Create UI layout: top area for slots, bottom area for bank
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'puzzle-slots-container';
    
    const bankContainer = document.createElement('div');
    bankContainer.className = 'puzzle-bank-container';
    
    container.appendChild(slotsContainer);
    container.appendChild(bankContainer);
    
    // Create slots
    words.forEach((word, index) => {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.index = index;
        slot.dataset.word = word;
        slotsContainer.appendChild(slot);
    });
    
    // Shuffle words for bank
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    // Create pieces in the bank
    
    const piecesToAnimate = [];
    shuffledWords.forEach((word, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece drop-anim'; // add animation class
        piece.textContent = word;
        piece.dataset.word = word;
        piece._sourceCard = card; // Link piece to its home card
        piece.style.order = index; // Keep original slot order for returning
        
        // Random slight rotation for messy "scattered" look in the bank
        const rot = (Math.random() - 0.5) * 10;
        piece.style.setProperty('--target-rot', rot + 'deg');
        
        bankContainer.appendChild(piece);
        piecesToAnimate.push(piece);
        
        // Setup dragging
        setupTouchDrag(piece);
    });
    
    // Trigger scattering animation slightly delayed to allow DOM flush
    setTimeout(() => {
        piecesToAnimate.forEach(p => {
            p.classList.add('scattered');
        });
        updateNextSlotHint(card);
    }, 50);
}

function updateNextSlotHint(card) {
    const allSlots = Array.from(card.querySelectorAll('.puzzle-slot'));
    // Remove hint from all
    allSlots.forEach(s => s.classList.remove('next-slot-hint'));
    
    // Find first empty slot
    const firstEmpty = allSlots.find(s => s.dataset.filled === 'false');
    if (firstEmpty) {
        firstEmpty.classList.add('next-slot-hint');
    }
}

function setupTouchDrag(el) {
    el.addEventListener('touchstart', handleDragStart, {passive: false});
    el.addEventListener('mousedown', handleDragStart, {passive: false});
}

function handleDragStart(e) {
    if (e.type === 'touchstart') e.preventDefault(); // prevent scroll
    
    const el = e.currentTarget;
    if (el.classList.contains('locked')) return; // already solved
    
    // Bring to front
    el.style.zIndex = 1000;
    el.classList.add('dragging');
    
    window.puzzleState.isDragging = true;
    window.puzzleState.currentDragPiece = el;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = el.getBoundingClientRect();
    
    // Calculate offset inside the piece so it doesn't snap to top-left
    window.puzzleState.startX = clientX;
    window.puzzleState.startY = clientY;
    
    // Create a ghost placeholder so layout doesn't collapse
    const placeholder = document.createElement('div');
    placeholder.className = 'puzzle-placeholder';
    placeholder.style.width = rect.width + 'px';
    placeholder.style.height = rect.height + 'px';
    placeholder.style.order = el.style.order;
    // Only insert placeholder if not already absolute
    if (el.style.position !== 'absolute') {
        el.parentNode.insertBefore(placeholder, el);
        el._placeholder = placeholder;
        
        el.style.position = 'absolute';
        el.style.left = (rect.left + window.scrollX) + 'px';
        el.style.top = (rect.top + window.scrollY) + 'px';
        document.body.appendChild(el);
    }
    
    window.puzzleState.initialLeft = parseFloat(el.style.left);
    window.puzzleState.initialTop = parseFloat(el.style.top);
    
    document.addEventListener('touchmove', handleDragMove, {passive: false});
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('mousemove', handleDragMove, {passive: false});
    document.addEventListener('mouseup', handleDragEnd);
    
    triggerHaptic(10); // slight buzz on pickup
}

function handleDragMove(e) {
    if (!window.puzzleState.isDragging) return;
    e.preventDefault(); // prevent scroll
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - window.puzzleState.startX;
    const dy = clientY - window.puzzleState.startY;
    
    const el = window.puzzleState.currentDragPiece;
    el.style.left = (window.puzzleState.initialLeft + dx) + 'px';
    el.style.top = (window.puzzleState.initialTop + dy) + 'px';
}

function handleDragEnd(e) {
    if (!window.puzzleState.isDragging) return;
    
    window.puzzleState.isDragging = false;
    const el = window.puzzleState.currentDragPiece;
    el.classList.remove('dragging');
    el.style.zIndex = 10;
    
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Check for drop inside a slot
    checkDropTarget(el);
}

function checkDropTarget(piece) {
    const pieceRect = piece.getBoundingClientRect();
    const pieceCenter = {
        x: pieceRect.left + pieceRect.width / 2,
        y: pieceRect.top + pieceRect.height / 2
    };
    
    let snapped = false;
    
    const card = piece._sourceCard;
    const localSlots = Array.from(card.querySelectorAll('.puzzle-slot'));
    
    for (const slot of localSlots) {
        if (slot.dataset.filled === 'true') continue;
        
        const slotRect = slot.getBoundingClientRect();
        
        // Check if piece center is inside slot bounds (with some margin of error)
        if (
            pieceCenter.x > slotRect.left - 20 &&
            pieceCenter.x < slotRect.right + 20 &&
            pieceCenter.y > slotRect.top - 20 &&
            pieceCenter.y < slotRect.bottom + 20
        ) {
            // Snapped! Check if it's the right word
            if (slot.dataset.word === piece.dataset.word) {
                // Correct
                card._puzzleScore.correct++;
                updateScoreBoard(card);
                
                // Success feedback
                if (typeof playDingSound === 'function') playDingSound();
                triggerHaptic(20);
                
                // Shine the card background
                card.classList.add('puzzle-success-shine');
                setTimeout(() => card.classList.remove('puzzle-success-shine'), 800); 
                
                // Joy pop the piece
                piece.classList.add('word-joy-pop');
                setTimeout(() => piece.classList.remove('word-joy-pop'), 600);
                
                snapToSlot(piece, slot);
                snapped = true;
                break;
            } else {
                // Wrong word for this slot
                card._puzzleScore.wrong++;
                updateScoreBoard(card);
                
                // Error feedback
                if (typeof playBuzzSound === 'function') playBuzzSound();
                triggerHaptic(50); // buzz
                piece.classList.add('error-shake');
                setTimeout(() => piece.classList.remove('error-shake'), 400);
            }
        }
    }
    
    if (!snapped) {
        // Bounce back to bank (we can just reset position statically for now, or animate)
        returnPieceToBank(piece);
    }
}

function snapToSlot(piece, slot) {
    triggerHaptic(15);
    slot.dataset.filled = 'true';
    piece.classList.add('locked');
    
    // Move piece back into the slot container for natural document flow styling
    piece.style.position = 'static';
    piece.style.left = '';
    piece.style.top = '';
    piece.style.transform = 'none'; // reset scatter rotation
    
    // Remove placeholder if it exists
    if (piece._placeholder && piece._placeholder.parentNode) {
        piece._placeholder.parentNode.removeChild(piece._placeholder);
        piece._placeholder = null;
    }
    
    slot.appendChild(piece);
    
    updateNextSlotHint(piece._sourceCard);
    checkVictory(piece._sourceCard);
}

function returnPieceToBank(piece) {
    triggerHaptic(10);
    // Find the original bank
    const bank = piece._sourceCard.querySelector('.puzzle-bank-container');
    if (bank) {
        piece.style.position = 'static';
        piece.style.left = '';
        piece.style.top = '';
        
        if (piece._placeholder && piece._placeholder.parentNode === bank) {
            bank.replaceChild(piece, piece._placeholder);
            piece._placeholder = null;
        } else {
            bank.appendChild(piece);
        }
    }
}

function checkVictory(card) {
    const localSlots = Array.from(card.querySelectorAll('.puzzle-slot'));
    const allSlotsFilled = localSlots.every(slot => slot.dataset.filled === 'true');
    if (allSlotsFilled) {
        console.log("Puzzle Completed!");
        
        // Play victory sound
        if (window.playRewardSound) {
            playRewardSound();
        }
        
        // Trigger confetti
        if (window.triggerConfetti) {
            triggerConfetti();
        }
        
        // Trigger Victory Popup after 1.5 seconds
        setTimeout(() => {
            showVictoryPopup(card);
        }, 1500);
    }
}

function triggerConfetti() {
    const colors = ['#f56565', '#48bb78', '#4299e1', '#ecc94b', '#9f7aea'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        document.body.appendChild(confetti);
        
        const duration = Math.random() * 2 + 1; // 1-3 seconds
        const delay = Math.random() * 0.5;
        
        confetti.animate([
            { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
            { transform: `translate3d(${Math.random() * 100 - 50}px, 100vh, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            delay: delay * 1000,
            easing: 'cubic-bezier(.37,0,.63,1)',
            fill: 'forwards'
        });
        
        // Clean up
        setTimeout(() => {
            if (confetti.parentNode) confetti.parentNode.removeChild(confetti);
        }, (duration + delay) * 1000);
    }
}
function updateScoreBoard(card) {
    if (!card._puzzleScore) return;
    const scoreboard = card.querySelector('.puzzle-scoreboard');
    if (scoreboard) {
        // Find existing badges or create them
        let correctBadge = scoreboard.querySelector('.score-correct');
        let wrongBadge = scoreboard.querySelector('.score-wrong');
        
        let oldCorrect = correctBadge ? parseInt(correctBadge.querySelector('span').textContent) : -1;
        let oldWrong = wrongBadge ? parseInt(wrongBadge.querySelector('span').textContent) : -1;
        
        scoreboard.innerHTML = `
            <div class="score-badge score-correct">✅ <span>${card._puzzleScore.correct}</span></div>
            <div class="score-badge score-wrong">❌ <span>${card._puzzleScore.wrong}</span></div>
        `;
        
        // Add pop animation if score changed
        if (oldCorrect !== -1 && card._puzzleScore.correct > oldCorrect) {
            scoreboard.querySelector('.score-correct').classList.add('score-pop');
        }
        if (oldWrong !== -1 && card._puzzleScore.wrong > oldWrong) {
            scoreboard.querySelector('.score-wrong').classList.add('score-pop');
        }
    }
}

function showVictoryPopup(card) {
    let popup = card.querySelector('.puzzle-victory-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'puzzle-victory-popup';
        popup.innerHTML = `
            <div class="victory-popup-content">
                <h2>Great Job! 🎉</h2>
                <p>Would you like to try again?</p>
                <div class="victory-popup-btns">
                    <button class="vp-btn yes-btn">✅ Yes</button>
                    <button class="vp-btn no-btn">❌ No</button>
                </div>
            </div>
        `;
        
        // Find puzzle zone and append it
        const puzzleZone = card.querySelector('.puzzle-zone');
        if (puzzleZone) {
            puzzleZone.appendChild(popup);
        }
    }
    
    // Attach event listeners dynamically to ensure they use current phrase
    const yesBtn = popup.querySelector('.yes-btn');
    const noBtn = popup.querySelector('.no-btn');
    const activeBtn = card.querySelector('.active-puzzle-btn');
    
    yesBtn.onclick = () => {
        if (card._puzzlePhrase) {
            initPuzzle(card.querySelector('.puzzle-zone'), card._puzzlePhrase);
        }
    };
    
    noBtn.onclick = () => {
        if (activeBtn && card._puzzlePhrase) {
            togglePuzzleMode(activeBtn, card._puzzlePhrase);
        }
    };
    
    popup.style.display = 'flex';
}

function showExitConfirmPopup(card, btn, phrase) {
    let popup = card.querySelector('.puzzle-exit-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'puzzle-victory-popup puzzle-exit-popup puzzle-exit-overlay';
        popup.innerHTML = `
            <div class="victory-popup-content" style="border-color: #fc8181;">
                <h2>Leave Puzzle? 😢</h2>
                <p>Are you sure you want to exit before finishing?</p>
                <div class="victory-popup-btns">
                    <button class="vp-btn exit-yes-btn" style="background: #fed7d7; color: #c53030; border-color: #fc8181;">❌ Yes, Exit</button>
                    <button class="vp-btn exit-no-btn" style="background: #c6f6d5; color: #22543d; border-color: #68d391;">✅ No, Stay</button>
                </div>
            </div>
        `;
        const puzzleZone = card.querySelector('.puzzle-zone');
        if (puzzleZone) puzzleZone.appendChild(popup);
        popup = card.querySelector('.puzzle-exit-popup');
    }
    
    const yesBtn = popup.querySelector('.exit-yes-btn');
    const noBtn = popup.querySelector('.exit-no-btn');
    
    yesBtn.onclick = () => {
        popup.style.display = 'none';
        togglePuzzleMode(btn, phrase);
    };
    
    noBtn.onclick = () => {
        popup.style.display = 'none';
    };
    
    popup.style.display = 'flex';
}
