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
        
        // Create exit button if it doesn't exist
        if(!exitBtn) {
            exitBtn = document.createElement('button');
            exitBtn.className = 'puzzle-exit-btn';
            exitBtn.innerHTML = '❌ Exit Puzzle';
            exitBtn.onclick = () => togglePuzzleMode(btn, phrase);
            card.insertBefore(exitBtn, card.firstChild);
        }
        
        puzzleZone.style.display = 'block';
        exitBtn.style.display = 'block';
        
        initPuzzle(puzzleZone, phrase);
    }
}

function initPuzzle(container, phrase) {
    container.innerHTML = ''; // clear existing
    window.puzzleState.activeCard = container;
    window.puzzleState.originalPhrase = phrase;
    
    // Split phrase by spaces (Option B: keeping punctuation attached for simplicity)
    const words = phrase.split(' ').filter(w => w.trim().length > 0);
    
    // Create UI layout: top area for slots, bottom area for bank
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'puzzle-slots-container';
    
    const bankContainer = document.createElement('div');
    bankContainer.className = 'puzzle-bank-container';
    
    container.appendChild(slotsContainer);
    container.appendChild(bankContainer);
    
    window.puzzleState.slots = [];
    window.puzzleState.pieces = [];
    
    // Create slots
    words.forEach((word, index) => {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.index = index;
        slot.dataset.word = word;
        slotsContainer.appendChild(slot);
        window.puzzleState.slots.push(slot);
    });
    
    // Shuffle words for bank
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    // Create pieces in the bank
    shuffledWords.forEach((word, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece drop-anim'; // add animation class
        piece.textContent = word;
        piece.dataset.word = word;
        
        // Random slight rotation for messy "scattered" look in the bank
        const rot = (Math.random() - 0.5) * 10;
        piece.style.setProperty('--target-rot', rot + 'deg');
        
        bankContainer.appendChild(piece);
        window.puzzleState.pieces.push(piece);
        
        // Setup dragging
        setupTouchDrag(piece);
    });
    
    // Trigger scattering animation slightly delayed to allow DOM flush
    setTimeout(() => {
        window.puzzleState.pieces.forEach(p => {
            p.classList.add('scattered');
        });
    }, 50);
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
    
    // Convert to absolute positioning relative to document body for unconstrained dragging
    // Only if it's not already absolute
    if (el.style.position !== 'absolute') {
        el.style.position = 'absolute';
        el.style.left = (rect.left + window.scrollX) + 'px';
        el.style.top = (rect.top + window.scrollY) + 'px';
        // Move to body to avoid clipping
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
    
    for (const slot of window.puzzleState.slots) {
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
                snapToSlot(piece, slot);
                snapped = true;
                break;
            } else {
                // Wrong word for this slot - optionally play error sound, just let it bounce back
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
    
    slot.appendChild(piece);
    
    checkVictory();
}

function returnPieceToBank(piece) {
    triggerHaptic(10);
    // Find the original bank
    const bank = window.puzzleState.activeCard.querySelector('.puzzle-bank-container');
    if (bank) {
        piece.style.position = 'static';
        piece.style.left = '';
        piece.style.top = '';
        bank.appendChild(piece);
    }
}

function checkVictory() {
    const allSlotsFilled = window.puzzleState.slots.every(slot => slot.dataset.filled === 'true');
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
        
        // Maybe pop animation on the whole puzzle zone
        const container = window.puzzleState.activeCard.querySelector('.puzzle-slots-container');
        if (container) {
            container.classList.add('victory-pop');
            setTimeout(() => container.classList.remove('victory-pop'), 500);
        }
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
