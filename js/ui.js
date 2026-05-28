/* ==========================================
   js/ui.js - Core UI, navigation, and utilities
   French Helper
   =========================================== */

function triggerHaptic(duration = 15) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

let longPressTimer = null;
function startLongPress(event, phrase) {
    longPressTimer = setTimeout(() => {
        triggerHaptic(50); // Stronger feedback for long press
        handleLongPressDelete(phrase);
    }, 800);
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function handleLongPressDelete(phrase) {
    openAppModal({
        title: "🗑️ Clear Recording?",
        text: `Would you like to delete your recording for:\n\n"${phrase}"`,
        mode: 'view',
        saveText: "Delete",
        cancelText: "Cancel",
        onAction: async () => {
            const success = await deleteStudentRecord(phrase);
            if (success) {
                showToast("Recording deleted");
                renderList(state.currentScreenList); // Refresh UI
            }
            closeOverlay('appModal');
        }
    });
}

/**
 * Renders a French phrase as interactive words.
 * Each word is wrapped in a clickable span.
 */
function renderInteractivePhrase(phrase, container) {
    if (!container) return;
    container.innerHTML = '';
    
    // Split by spaces but preserve punctuation
    const words = phrase.split(/(\s+)/);
    
    words.forEach(part => {
        if (part.trim().length === 0) {
            container.appendChild(document.createTextNode(part));
            return;
        }
        
        const span = document.createElement('span');
        span.className = 'interactive-word';
        span.textContent = part;
        span.onclick = (e) => {
            e.stopPropagation();
            triggerHaptic(10); // Haptic feedback
            SpeechCache.playCachedAudio(part.replace(/[.,!?;:]/g, ''), 'fr-FR', true);
            
            // Visual feedback
            span.classList.add('word-active');
            setTimeout(() => span.classList.remove('word-active'), 400);
        };
        container.appendChild(span);
    });
}

/**
 * Renders a French phrase broken into syllables.
 */
function renderSyllablesView(phrase, container) {
    if (!container) return;
    container.innerHTML = '';
    
    const words = phrase.split(/(\s+)/);
    let globalSylCount = 0;
    
    words.forEach(part => {
        if (part.trim().length === 0) {
            container.appendChild(document.createTextNode(part));
            return;
        }
        
        // Remove punctuation for syllabification but keep it in display?
        // Let's keep it simple: split the word, then add punctuation back
        const cleanWord = part.replace(/[.,!?;:]/g, '');
        const punct = part.replace(/[A-Za-zÀ-ÿœæ'’]/g, '');
        
        const syllables = getSyllables(cleanWord);
        
        const wordSpan = document.createElement('span');
        wordSpan.className = 'interactive-word'; // Gives it the nice dashed border and padding around the whole word
        
        syllables.forEach((syl) => {
            const span = document.createElement('span');
            // Rainbow coloring based on global index
            const colorClass = `syl-color-${globalSylCount % 5}`;
            globalSylCount++;
            span.className = colorClass; // Only apply color, no padding so they touch seamlessly
            span.style.fontWeight = '900';
            span.style.pointerEvents = 'none'; // Let the click pass to the word wrapper
            span.textContent = syl;
            wordSpan.appendChild(span);
        });
        
        if (punct) {
            wordSpan.appendChild(document.createTextNode(punct));
        }

        wordSpan.onclick = (e) => {
            e.stopPropagation();
            triggerHaptic(10); // Haptic feedback
            SpeechCache.playCachedAudio(cleanWord, 'fr-FR', true); // Speak the whole word naturally
            
            // Visual feedback: Highlight the entire word block as one unit
            wordSpan.classList.add('word-active');
            setTimeout(() => wordSpan.classList.remove('word-active'), 400);
        };
        
        wordSpan.ondblclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            manualFixSyllables(cleanWord, syllables);
        };
        
        let lastTap = 0;
        wordSpan.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                e.preventDefault();
                e.stopPropagation();
                manualFixSyllables(cleanWord, syllables);
            }
            lastTap = now;
        });
        
        container.appendChild(wordSpan);
    });
}

function toggleSyllableMode(btn) {
    state.syllableMode = !state.syllableMode;
    localStorage.setItem('syllableMode', state.syllableMode);
    
    // Refresh the list to apply changes
    renderList(state.currentScreenList);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    // Clear any existing toasts to prevent stacking
    container.innerHTML = '';
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
    }, 3000);
}

function insertChar(char, targetId) {
    const input = document.getElementById(targetId);
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    input.value = text.substring(0, start) + char + text.substring(end);
    
    // --- THE FIX: PREVENT SCROLL ON FOCUS ---
    // This stops the screen from jumping when you click an accent button
    input.focus({ preventScroll: true });
    
    input.selectionStart = input.selectionEnd = start + char.length;
    if (targetId === 'hwInput') {
        autoPopulateName();
    }
}

function navJump(targetId) {
    triggerHaptic(10);

    if (document.body.classList.contains('mode-spelling')) {
        exitSpellingTheater();
        return;
    }
    
    // --- DEACTIVATE ACTIVE HANGMAN GAME AND MUSIC ON NAVJUMP ---
    state.gameActive = false;
    if (state.musicNode) {
        try { state.musicNode.stop(); } catch(e) {}
        state.musicNode = null;
        const mBtn = document.getElementById('musicToggleBtn');
        if (mBtn) mBtn.textContent = "🎵 Music: Off";
    }
    
    // 1. Close all overlays
    const overlays = ['presetsOverlay', 'gameDrawer', 'bpModal', 'parentDrawer', 'hwDrawer', 'iconPickerOverlay', 'printSelectionOverlay', 'folderSelectionOverlay', 'appModal'];
    overlays.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Native Body Scroll: Always restore the container and remove bp-open on nav
    document.body.classList.remove('bp-open');
    const mainContainer = document.querySelector('.container');
    if (mainContainer) mainContainer.style.display = 'block';

    clearVictoryItems();
    document.body.style.overflow = 'auto';
    document.body.classList.remove('keyboard-buffer');
    if (state.isAutoPlaying) stopAutoPlay();
    state.gameActive = false;
    resetAllSpellingCards();

    // 2. THE VISUAL NAV FIX: Manage the active indicator
    // Remove the 'active' class from all buttons
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // 3. Determine which button should be lit up
    let activeId = 'nav-practice'; // Default to practice
    if (targetId === 'presetsOverlay') activeId = 'nav-presets';
    else if (targetId === 'gameDrawer') activeId = 'nav-game';
    else if (targetId === 'bpModal') activeId = 'nav-backpack';
    else if (targetId === 'parentDrawer') activeId = 'nav-parent';

    // Add the 'active' class to the correct button
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');

    // 4. Navigate
    if (!targetId) {
        renderList(state.currentScreenList);
        return;
    }
    openOverlay(targetId);
}

function openOverlay(id) { 
    console.log('Opening overlay:', id);
    
    // 1. Safety: Stop auto-play and pause all audio
    if (state.isAutoPlaying) stopAutoPlay();
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
    });

    // 2. Reset spelling cards
    if (id !== 'gameDrawer') {
        resetAllSpellingCards();
    }

    // 3. THE FIX: We no longer hide other overlays here.
    // Instead, we just manage the stacking order and the scroll lock.
    
    // 4. Lock the main screen scroll
    document.body.style.overflow = 'hidden';
    
    // 5. SHOW THE TARGET OVERLAY
    const overlay = document.getElementById(id);
    if (overlay) {
        overlay.style.display = 'block'; 
        // Ensure the content starts at the top
        const content = overlay.querySelector('.overlay-content');
        if (content) content.scrollTop = 0;
    }
    
    // 6. SPECIFIC LOGIC (Preserved)
    if(id === 'gameDrawer') { 
        state.wins = 0; state.losses = 0; updateScoreUI();
        const globalKb = document.getElementById('keyboard');
        if (globalKb) globalKb.style.display = 'flex'; 
        const drawerContent = document.querySelector('#gameDrawer .overlay-content');
        if (drawerContent) drawerContent.classList.add('keyboard-buffer');
        setTimeout(startHangman, 50); 
    } else if (id === 'bpModal') {
        // Transition to native body scroll for backpack
        const mainContainer = document.querySelector('.container');
        if (mainContainer) mainContainer.style.display = 'none';
        document.body.classList.add('bp-open');
        openBP();
    }
}
        
function closeOverlay(id) { 
    const overlay = document.getElementById(id);
    if (overlay) overlay.style.display = 'none'; 

    if (id === 'bpModal' || document.body.classList.contains('bp-open')) {
        document.body.classList.remove('bp-open');
        const mainContainer = document.querySelector('.container');
        if (mainContainer) mainContainer.style.display = 'block';
    }

    // --- DEACTIVATE ACTIVE HANGMAN GAME AND MUSIC ON DRAWER CLOSE ---
    if (id === 'gameDrawer') {
        state.gameActive = false;
        if (state.musicNode) {
            try { state.musicNode.stop(); } catch(e) {}
            state.musicNode = null;
            const mBtn = document.getElementById('musicToggleBtn');
            if (mBtn) mBtn.textContent = "🎵 Music: Off";
        }
    }

    // If closing the printSelectionOverlay, reset back to print settings view
    if (id === 'printSelectionOverlay') {
        const mainUI = document.getElementById('printSelectionMain');
        const prevUI = document.getElementById('printPreviewContainer');
        if (mainUI) mainUI.style.display = 'block';
        if (prevUI) prevUI.style.display = 'none';
        const previewArea = document.getElementById('previewSheetArea');
        if (previewArea) {
            previewArea.style.padding = '';
            previewArea.style.width = '';
            previewArea.style.height = '';
        }
    }

    // If closing the appModal and it was an import modal, clear the hash
    if (id === 'appModal' && window.location.hash.startsWith('#import=')) {
        window.history.replaceState(null, document.title, window.location.pathname);
    }
    
    if (id === 'gameDrawer') {
        const globalKb = document.getElementById('keyboard');
        if (globalKb) globalKb.classList.remove('active');
        document.body.classList.remove('keyboard-buffer');
    }

    // Check if ANY overlays are still open
    const anyOpen = Array.from(document.querySelectorAll('.overlay')).some(ov => ov.style.display === 'block');
    
    if (!anyOpen) {
        document.body.style.overflow = 'auto';
        document.body.style.overflowX = 'hidden';
        
        // If we are closing the last overlay, make sure "Practice" is lit up
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const practiceNav = document.getElementById('nav-practice');
        if (practiceNav) practiceNav.classList.add('active');
    }
}

function setViewMode(mode) {
    state.viewMode = mode;
    localStorage.setItem('viewMode', mode);
    
    // 1. Logic: If we are switching views, hide the global keyboard and buffer
    const globalKb = document.getElementById('keyboard');
    if (globalKb) globalKb.classList.remove('active');
    document.body.classList.remove('keyboard-buffer');

    // 2. Update button visuals
    document.getElementById('btnViewCards').classList.toggle('active', mode === 'cards');
    
    const diagBtn = document.getElementById('btnViewDialogue');
    if (diagBtn) {
        diagBtn.classList.toggle('active', mode === 'dialogue');
        if (state.currentWeekAudio) {
            diagBtn.innerHTML = "🎧 Recording";
        } else {
            diagBtn.innerHTML = state.currentIsDialogue ? "💬 Dialogue" : "📝 List";
        }
    }
    
    if (state.isAutoPlaying) stopAutoPlay();
    
    renderList(state.currentScreenList);
}


// ===== UPDATED getCardData (V10.7) - ALL FEATURES PRESERVED + CACHE PRIORITY =====
function getCardData(p) {
    const normalizedPhrase = norm(p);

    // NEW: Alphabet Bypass for single letters
    if (p.length === 1) {
return {
    en: "", 
    icon: "🔤",
    pronunciation: FRENCH_LETTER_NAMES[p.toUpperCase()] || ""
};
    }

    // 1. FIRST: Find the base data from dictionary (if it exists) 
    // We need this for the pronunciation and gender, but we won't return it yet.
    let baseData = MASTER_DATA[p];
    if (!baseData) {
for (let key in MASTER_DATA) { 
    if (norm(key) === normalizedPhrase) { baseData = MASTER_DATA[key]; break; } 
}
    }

    // 2. SECOND: Determine the English text. 
    // We prioritize the USER CACHE (your manual fix) over the MASTER_DATA.
    const finalEn = state.cache[normalizedPhrase] || (baseData ? baseData.en : "") || "...";
    const finalPronunciation = state.customPronunciations[normalizedPhrase] || (baseData ? baseData.pronunciation : undefined);

    // 3. THIRD: Check for custom photo (Preserving all your specific parameters)
    if (state.customPhotos[normalizedPhrase]) {
const photoData = state.customPhotos[normalizedPhrase];
const isNewFormat = photoData.data !== undefined;

return {
    en: finalEn, // <--- Using the prioritized translation
    icon: '📷',
    isPhoto: true,
    photoData: isNewFormat ? photoData.data : photoData,
    photoOrientation: isNewFormat ? photoData.orientation : 'landscape',
    isFreeCrop: isNewFormat ? photoData.isFreeCrop || false : false,
    customRatio: isNewFormat ? photoData.customRatio : null,
    pronunciation: finalPronunciation,
    g: baseData ? baseData.g : undefined
};
    }
    
    // 4. FOURTH: Check for custom emoji
    if (state.customIcons[normalizedPhrase]) {
return {
    en: finalEn, // <--- Using the prioritized translation
    icon: state.customIcons[normalizedPhrase],
    pronunciation: finalPronunciation,
    g: baseData ? baseData.g : undefined,
    isCustom: true
};
    }
    
    // 5. FIFTH: Fallback to MASTER_DATA (if it exists)
    // We rebuild the object to ensure your CACHED English is used
    if (baseData) {
return {
    en: finalEn,
    icon: baseData.icon,
    pronunciation: finalPronunciation,
    g: baseData.g
};
    }

    // 6. SIXTH: Smart icon logic (Preserving all your regex logic)
    const word = p.toLowerCase();
    let smartIcon = "🖼️";
    
    if (word.match(/chat|chien|lapin|oiseau|poisson|vache|cheval|mouton|cochon|elephant|tigre|lion/)) smartIcon = "🐾";
    else if (word.match(/rouge|bleu|vert|jaune|orange|rose|noir|blanc|violet|marron|gris/)) smartIcon = "🎨";
    else if (word.match(/un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|cent/)) smartIcon = "🔢";
    else if (word.match(/pomme|banane|pain|lait|pizza|gateau|fromage|orange|eau|chocolat|fraise/)) smartIcon = "🍴";
    else if (word.match(/tete|nez|bouche|yeux|main|pied|oreille|bras|doigt|jambe/)) smartIcon = "👤";
    else if (word.match(/livre|crayon|sac|ecole|bureau|professeur|cahier|regle|stylo/)) smartIcon = "📚";
    else if (word.match(/maman|papa|mere|pere|frere|soeur|grand/)) smartIcon = "👨‍👩‍👧";
    else if (word.match(/chaise|table|lit|fenetre|porte|maison/)) smartIcon = "🏠";
    else if (word.match(/cours|saute|chante|danse|dors|mange|joue|lis|ecris/)) smartIcon = "🎭";
    else if (word.match(/bonjour|salut|merci|revoir|bonne|nuit|soir/)) smartIcon = "👋";
    
    return { en: finalEn, icon: smartIcon, pronunciation: finalPronunciation };
}

function renderList(list) {
    if (state.isInSpellingMode) {
        console.log('Skipping renderList: currently in spelling bee mode');
        return;
    }
    console.log('Rendering list. Audio:', !!state.currentWeekAudio, 'Mode:', state.viewMode);
    state.currentScreenList = list; 
    const container = document.getElementById('phrasesList'); 
    if (!container) return;
    container.innerHTML = '';
    
    // --- 1. Manage Autoplay UI visibility FIRST (Fixes the Alphabet bug) ---
    const autoPlayUI = document.getElementById('autoplayControls');
    if (autoPlayUI) {
autoPlayUI.style.display = (state.viewMode === 'dialogue' && !state.currentWeekAudio) ? 'block' : 'none';
    }

    // --- 2. Alphabet Detection ---
    const isAlphabet = (list.length >= 26 && list.length <= 31) && list.includes('A') && list.includes('Z');
    if (isAlphabet && state.viewMode === 'cards') {
renderAlphabetCards(list);
return; 
    }

    const existingBanner = document.querySelector('.teacher-audio-banner');
    if (existingBanner) existingBanner.remove();

    // --- 3. Dialogue button label logic ---
    const diagBtn = document.getElementById('btnViewDialogue');
    if (diagBtn) {
if (state.currentWeekAudio) {
    diagBtn.innerHTML = "🎧 Recording";
} else {
    diagBtn.innerHTML = state.currentIsDialogue ? "💬 Dialogue" : "📝 List";
}
    }
    
    // --- 4. Update Status Bar & Badges ---
    const statusInfo = document.getElementById('stCountText');
    const controlPanel = document.querySelector('.app-control-panel');
    controlPanel.querySelectorAll('.corner-badge').forEach(b => b.remove());

    if (statusInfo) {
if (!list || list.length === 0) {
    statusInfo.textContent = '🇫🇷 Ready to learn!';
} else {
    statusInfo.innerHTML = state.currentSetName ? `📚 ${state.currentSetName}` : `📚 List`;
    if (state.currentSetName && state.history[state.currentSetName]) {
        controlPanel.insertAdjacentHTML('afterbegin', getCornerBadgesHTML(state.currentSetName));
    }
}
    }

    const hasTeacherAudio = !!state.currentWeekAudio && !!state.currentWeekAudio.data;
    
    // --- BRANCH A: TEACHER RECORDING MODE ---
    if (hasTeacherAudio && list.length > 0 && state.viewMode === 'dialogue') {
const banner = document.createElement('div');
banner.className = 'teacher-audio-banner';
banner.style.cssText = 'background: linear-gradient(135deg, #ffc107, #ff9800); color: white; padding: 15px; border-radius: 15px; margin-top: 15px; margin-bottom: 15px; font-weight: 900; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);';
banner.innerHTML = '🔊 Teacher Recording Mode<br><span style="font-size:0.8rem; opacity:0.9;">Using homework with teacher\'s voice</span>';
container.parentElement.insertBefore(banner, container);

const card = document.createElement('div');
card.className = 'phrase-card';
card.style.border = '5px solid #ffc107';
card.innerHTML = `
    <div style="font-size:1.4rem; font-weight:900; color:#2d3748; margin-bottom:15px; text-align:left; padding:15px; background:white; border-radius:12px;">
        ${list.map(w => `• ${w.split('|')[0]}`).join('<br>')}
    </div>
    <audio controls style="width:100%;" src="${state.currentWeekAudio.data}"></audio>
    <p style="font-size:0.8rem; margin-top:10px; color:#856404; font-weight:800;">💡 Switch to 🗂️ Cards mode to see translations</p>
`;
container.appendChild(card);

    } 
    // --- BRANCH B: DIALOGUE / LIST MODE ---
    else if (state.viewMode === 'dialogue' && !hasTeacherAudio) {
const diagCard = document.createElement('div');
diagCard.className = 'condensed-card';

list.forEach((p, index) => {
    const line = document.createElement('div');
    const sideClass = state.currentIsDialogue ? ((index % 2 === 0) ? 'line-left' : 'line-right') : 'line-center';
    line.className = `dialogue-line ${sideClass}`;
    line.id = `line-${index}`;
    const cleanText = p.split('|')[0].trim();
    line.textContent = cleanText;
    line.onclick = () => {
        if (state.isAutoPlaying) {
            clearTimeout(state.autoPlayTimeout);
            state.autoPlaySessionId = (state.autoPlaySessionId || 0) + 1; // Invalidate old loops
            playLine(index, state.autoPlaySessionId); // Jump autoplay to this phrase and continue
        } else {
            SpeechCache.playCachedAudio(cleanText, 'fr-FR', true);
        }
    };
    diagCard.appendChild(line);
});
container.appendChild(diagCard);
    } 
    // --- BRANCH C: STANDARD CARDS MODE ---
    else {
list.forEach(p => {
    const data = getCardData(p); 
    const card = document.createElement('div'); 
    card.className = 'phrase-card';
    
    // --- SMART AI CANVAS LOGIC (REPLACES OLD ICON LOGIC) ---
    let visualHTML;
    if (data.isPhoto) {
        // If it's a photo (Camera or AI), show the photo as normal
        let orientationClass = data.photoOrientation || 'landscape';
        let inlineStyle = '';
        
        if (data.isFreeCrop && data.customRatio) {
            const baseHeight = 7;
            const calculatedWidth = baseHeight * data.customRatio;
            const finalWidth = Math.min(calculatedWidth, 12); 
            inlineStyle = `style="height: ${baseHeight}rem; width: ${finalWidth.toFixed(2)}rem; object-fit: cover;"`;
            orientationClass = '';
        }
        
        visualHTML = `<img src="${data.photoData}" class="card-photo ${orientationClass}" ${inlineStyle} onclick="openIconPicker('${p.replace(/'/g, "\\'")}')">`;
    } else {
        // Check if it's the default placeholder (🖼️)
        const isDefaultPlaceholder = (data.icon === "🖼️");
        
        if (isDefaultPlaceholder) {
            // SMART AI CANVAS: Professional placeholder
            visualHTML = `
                <div class="ai-placeholder-box" onclick="openIconPicker('${p.replace(/'/g, "\\'")}')">
                    <span style="font-size: 2.2rem; line-height: 1;">🤖</span>
                    <span class="ai-badge-label">AI DRAW</span>
                    <span style="position:absolute; top: 8px; right: 10px; font-size: 0.8rem; opacity: 0.6;">✨</span>
                </div>`;
        } else {
            // Standard Emojis (recognized words like 🐶 or 🐱)
            visualHTML = `
                <div style="position:relative; display:inline-block; margin-bottom: 10px;">
                    <span class="card-icon" onclick="openIconPicker('${p.replace(/'/g, "\\'")}')">${data.icon}</span>
                </div>`;
        }
    }
    // --- END SMART AI CANVAS LOGIC ---
    
    const gIcon = data.g ? `<div class="gender-icon">${data.g === 'f' ? '👧' : '👦'}</div>` : '';
    const pGuideVisible = state.syllableMode ? '' : 'display:none;';
    const pGuide = `<span class="pronunciation-text" style="cursor: pointer; ${pGuideVisible}" title="Double-click to edit phonetics">${data.pronunciation ? '[ ' + data.pronunciation.replace(/-/g, ' ') + ' ]' : ''}</span>`;
    
    const spellingHTML = `
        <div class="spelling-zone" style="display:none; padding: 0;">
            <div class="spelling-slots"></div>
        </div>
    `;
    
    const buttonHTML = `
        <div class="card-btns">
            <button class="card-btn spk-fr" style="position: relative;">
                <span class="snail-corner">🐌</span>
                <span>🔊 French</span>
            </button>
            <div class="record-play-container" style="display: flex; gap: 5px; width: 100%;">
                <button class="card-btn record-btn" onclick="triggerHaptic(15); toggleStudentRecording(this, '${p.replace(/'/g, "\\'")}')" style="flex: 1; background: #e2e8f0; color: #1a202c; padding: 15px 5px; font-size: 0.9rem; font-weight: 800; border-radius: 12px; border: none; cursor: pointer;">
                    <span>🎤 <span class="btn-text">Record</span></span>
                </button>
                <button class="card-btn play-record-btn" 
                    onmousedown="startLongPress(event, '${p.replace(/'/g, "\\'")}')" 
                    onmouseup="cancelLongPress()" 
                    onmouseleave="cancelLongPress()"
                    ontouchstart="startLongPress(event, '${p.replace(/'/g, "\\'")}')" 
                    ontouchend="cancelLongPress()"
                    onclick="triggerHaptic(15); playStudentRecording('${p.replace(/'/g, "\\'")}')" 
                    style="display:none; flex: 1; background: #4cd964; color: white; padding: 15px 5px; font-size: 0.9rem; font-weight: 800; border-radius: 12px; border: none; cursor: pointer;">
                    <span>▶️ <span class="btn-text">Play</span></span>
                </button>
            </div>
            <button class="card-btn spell-btn" style="display: none; background: #ecc94b; color: #744210; padding: 15px 5px; font-weight: 800; border-radius: 12px; border: none; cursor: pointer;">
                <span>🐝 Spell</span>
            </button>
            <button class="card-btn puzzle-btn" onclick="triggerHaptic(15); togglePuzzleMode(this, '${p.replace(/'/g, "\\'")}')" style="background: #e2e8f0; color: #1a202c; padding: 15px 5px; font-weight: 800; border-radius: 12px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span>🧩 <span class="btn-text">Puzzle</span></span>
            </button>
        </div>
    `;
    
    // FINAL TEMPLATE - ONE card.innerHTML using visualHTML
    card.innerHTML = `
        ${gIcon}
        <div class="card-main-content">
         <div class="card-tools">
             <div class="tool-btn bee-badge" onclick="toggleSpellingMode(this, '${p.replace(/'/g, "\\'")}')" title="Spelling Bee">🐝</div>
             <div class="tool-btn syl-toggle ${state.syllableMode ? 'active' : ''}" onclick="toggleSyllableMode(this)" title="Show syllables &amp; pronunciation">
                 <svg width="48" height="22" viewBox="0 0 48 22" style="display:block; margin:0 auto;">
                     <text class="abc-a" x="10" y="14" font-size="20" font-weight="900" font-family="Nunito, sans-serif" text-anchor="middle">A</text>
                     <text class="abc-b" x="24" y="14" font-size="20" font-weight="900" font-family="Nunito, sans-serif" text-anchor="middle">B</text>
                     <text class="abc-c" x="38" y="14" font-size="20" font-weight="900" font-family="Nunito, sans-serif" text-anchor="middle">C</text>
                     <path class="abc-arc abc-arc-a" d="M10,16.5 Q17,21 24,16.5" fill="none" stroke-width="1.8" stroke-linecap="round"/>
                     <path class="abc-arc abc-arc-b" d="M24,16.5 Q31,21 38,16.5" fill="none" stroke-width="1.8" stroke-linecap="round"/>
                 </svg>
             </div>
             <div class="tool-btn en-toggle" title="English Translation" style="font-weight: 900; color: #5a67d8;">EN</div>
             <div class="tool-btn print-card-btn" title="Print Worksheet" onclick="openPrintFromCard('${p.replace(/'/g, "\\'")}')" style="color: #64748b;">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
             </div>
         </div>
            ${visualHTML}
            <div class="french-text-container">
                <span class="french-text"></span>
            </div>
            ${pGuide}
            <span class="english-text">${data.en}</span>
        </div>
        ${spellingHTML}
        ${buttonHTML}
    `;

    // Render interactive text
    const frTextEl = card.querySelector('.french-text');
    if (state.syllableMode) {
        renderSyllablesView(p, frTextEl);
    } else {
        renderInteractivePhrase(p, frTextEl);
    }
    
    // Bind interactions
    card.querySelector('.spk-fr').onclick = () => { triggerHaptic(15); SpeechCache.playCachedAudio(p, 'fr-FR', true); };
    card.querySelector('.snail-corner').onclick = (e) => {
        e.stopPropagation();
        spk(p, 'fr-FR', true, 0.3); 
    };
    
    const engTextEl = card.querySelector('.english-text');
    const enToggleBtn = card.querySelector('.en-toggle');
    
    const triggerFix = (e) => {
        e.preventDefault();
        manualFixTranslation(p, data.en);
    };
    
    let enDismissTimer = null;
    enToggleBtn.onclick = async () => {
        if (!engTextEl.classList.contains('visible')) {
            engTextEl.classList.add('visible');
            enToggleBtn.style.background = '#5a67d8';
            enToggleBtn.style.color = 'white';
            // Clear any pending dismiss
            if (enDismissTimer) { clearTimeout(enDismissTimer); enDismissTimer = null; }
            // Speak and wait for audio to finish, then auto-dismiss
            try {
                await SpeechCache.playCachedAudio(data.en, 'en-US', true);
            } catch(e) { /* ignore */ }
            // Only dismiss if still visible (user may have tapped again)
            if (engTextEl.classList.contains('visible')) {
                enDismissTimer = setTimeout(() => {
                    engTextEl.classList.remove('visible');
                    enToggleBtn.style.background = 'white';
                    enToggleBtn.style.color = '#5a67d8';
                }, 600);
            }
        } else {
            engTextEl.classList.remove('visible');
            enToggleBtn.style.background = 'white';
            enToggleBtn.style.color = '#5a67d8';
            if (enDismissTimer) { clearTimeout(enDismissTimer); enDismissTimer = null; }
        }
    };
    
    // Check if there is an existing recording for this phrase to show the play button
    const playBtn = card.querySelector('.play-record-btn');
    const recBtn = card.querySelector('.record-btn');
    if (state.recordings && state.recordings[p]) {
        playBtn.style.display = 'inline-block';
    }
    
    engTextEl.ondblclick = triggerFix;
    let lastTap = 0;
    engTextEl.addEventListener('touchstart', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) triggerFix(e);
        lastTap = now;
    });
    
    const pronTextEl = card.querySelector('.pronunciation-text');
    if (pronTextEl) {
        const triggerPronFix = (e) => {
            e.preventDefault();
            manualFixPronunciation(p, data.pronunciation || '');
        };
        pronTextEl.ondblclick = triggerPronFix;
        let lastPronTap = 0;
        pronTextEl.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastPronTap < 300) triggerPronFix(e);
            lastPronTap = now;
        });
    }
    
    container.appendChild(card);
}); 
    }
}


        
function openPrintFromCard(phrase) {
    const allPhrases = state.currentScreenList || [];
    
    if (allPhrases.length <= 1) {
        // Single phrase - go straight to print settings
        openPrintSelection(phrase, state.currentSetName || 'Français');
        return;
    }
    
    // Construct the entire active phrase list from currentScreenList (works for both built-in sets and custom homework)
    const allWords = allPhrases.join('\n');
    
    // Bypass the modal dialog, go straight to print settings with alternateWords enabled!
    openPrintSelection(phrase, state.currentSetName || 'Français', allWords);
}


async function saveHW() {
    let name = document.getElementById('hwNameInput').value.trim();
    const words = document.getElementById('hwInput').value.trim();
    const isDiag = document.getElementById('hwIsDialogue').checked;

    // 1. Validation: Name and Words are required
    if (!name) { 
        openAppModal({ title: 'Notice', text: 'Please give your homework a name!', mode: 'view' }); 
        return; 
    }
    if (!words) { 
        openAppModal({ title: 'Notice', text: 'Please enter some French phrases!', mode: 'view' }); 
        return; 
    }

    // 2. Character Limit: Ensure name isn't too long for the Backpack UI
    if (name.length > 20) {
        name = name.substring(0, 20);
        showToast('⚠️ Name trimmed to 20 characters: "' + name + '"', 'error');
    }

    // 3. Metadata Preservation: Don't lose the "Star" or "Folder" if editing
    let isFav = false;
    let targetMonth = state.selectedBpMonth; // Default to current folder viewed
    
    if (state.editingHomeworkName && state.history[state.editingHomeworkName]) {
        try {
            const oldData = JSON.parse(state.history[state.editingHomeworkName]);
            isFav = oldData.isFavorite || false;
            targetMonth = (oldData.month !== undefined && oldData.month !== null) ? oldData.month : state.selectedBpMonth;
        } catch(e) { 
            console.error("Error recovering meta-data", e); 
        }
    }

    // 4. Overwrite Protection: Check if the new name clashes with another homework
    if (state.history[name] && name !== state.editingHomeworkName) {
        const proceed = await new Promise(resolve => {
            openAppModal({
                title: "⚠️ Overwrite?",
                text: `"${name}" already exists in your backpack. Overwrite it?`,
                mode: 'view',
                saveText: "Yes, Overwrite",
                cancelText: "Cancel",
                onAction: () => resolve(true),
                onSecondaryAction: () => resolve(false)
            });
        });
        if (!proceed) return;
    }

    // 5. Processing UI: Show user that translation is happening
    const msgDiv = document.getElementById('hwMessages');
    msgDiv.innerHTML = '<div class="loading-spinner"></div><p style="font-weight:900; color:#9d4edd;">Auto-translating phrases...</p>';

    // 6. Translation: Runs your auto-translate engine
    await translateIfNeeded(words, true);

    // 7. Construct Data Object: Bundle everything together
    const hwData = {
        words: words,
        audio: state.currentWeekAudio,
        isDialogue: isDiag,
        month: targetMonth,
        isFavorite: isFav,
        date: new Date().toISOString()
    };
    
    // 8. Save Logic: Write to the state.history object
    state.history[name] = JSON.stringify(hwData);
    
    // 9. Renaming Logic: If the name changed, clean up the old name and transfer notes
    if (state.editingHomeworkName && state.editingHomeworkName !== name) {
        // Delete the old homework entry
        delete state.history[state.editingHomeworkName];

        // Transfer personal notes to the new name
        if (state.homeworkNotes && state.homeworkNotes[state.editingHomeworkName]) {
            state.homeworkNotes[name] = state.homeworkNotes[state.editingHomeworkName];
            delete state.homeworkNotes[state.editingHomeworkName];
            localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
        }
    }

    // 10. Update Storage: Sync everything to the browser memory
    localStorage.setItem('frenchHistory', JSON.stringify(state.history));
    localStorage.setItem('homeworkPhrases', words);
    
    // 11. Update App State
    state.currentSetName = name;
    localStorage.setItem('currentSetName', name);
    state.currentIsDialogue = isDiag;

    // 12. Success Message & Exit
    msgDiv.innerHTML = '';
    showToast('✅ Saved Successfully!');
    
    // Auto-backup: deferred to avoid UI lag
    setTimeout(() => { try { StorageDB.autoBackup(); StorageDB.exportBackupToFile(); } catch(e) {} }, 300);
    
    // Clear the inputs so the safety check doesn't trigger for the next one
    document.getElementById('hwNameInput').value = "";
    document.getElementById('hwInput').value = "";

    // 2. Clear teacher audio UI
    removeTeacherAudio(); 
    
    closeOverlay('hwDrawer');
    
    // Reset the edit tracker for next time
    state.editingHomeworkName = null;
    
    // Force the app to use the correct view mode (Dialogue or Cards)
    state.viewMode = isDiag ? 'dialogue' : 'cards';
    localStorage.setItem('viewMode', state.viewMode);
    
    // Update the practice screen immediately
    renderList(words.split('\n').filter(w => w.trim()));
    
    // Refresh Backpack UI if it happens to be open in the background
    if (document.getElementById('bpModal').style.display === 'block') {
        openBP();
    }
}

// Returns true if there is unsaved text in the homework drawer
function hasUnsavedHomework() {
    const drawer = document.getElementById('hwDrawer');
    if (drawer.style.display !== 'block') return false;

    const name = document.getElementById('hwNameInput').value.trim();
    const words = document.getElementById('hwInput').value.trim();

    // If both fields are empty, it's safe to close
    return (name !== "" || words !== "");
}

function cancelEdit() {
    if (hasUnsavedHomework()) {
        openAppModal({
            title: "⚠️ Discard Changes?",
            text: "You have unsaved homework. Are you sure you want to close without saving?",
            mode: 'view',
            saveText: "Discard",
            cancelText: "Keep Editing",
            onAction: () => {
                // User said Discard
                performCloseHwDrawer();
            },
            onSecondaryAction: () => {
                // User said Keep Editing - re-arm the exit guard
                window.history.pushState('app-active', null, "");
            }
        });
    } else {
        performCloseHwDrawer();
    }
}

// Helper to handle the actual closing and cleanup
function performCloseHwDrawer() {
    closeOverlay('hwDrawer');
    openOverlay('bpModal');
    
    // Cleanup
    state.editingHomeworkName = null;
    state.currentWeekAudio = null;
    document.getElementById('teacherAudioFile').value = '';
    document.getElementById('audioPlayerContainer').style.display = 'none';
}

function openBP() {
    const list = document.getElementById('bpList'); 
    const headerTitle = document.getElementById('bpFolderName');
    if (!list || !headerTitle) return;
    
    list.innerHTML = ''; 
    
    if (state.showFavsOnly) {
        headerTitle.innerHTML = "⭐ Favorites";
    } else {
        headerTitle.innerHTML = "📅 " + monthNames[state.selectedBpMonth];
    }
    
    const keys = Object.keys(state.history).reverse();
    let visibleCount = 0;

    keys.forEach(name => {
        let hwData;
        try {
            const rawData = state.history[name];
            if (typeof rawData === 'string' && rawData.trim().startsWith('{')) {
                hwData = JSON.parse(rawData);
            } else {
                hwData = { words: rawData, month: state.selectedBpMonth, date: new Date().toISOString(), isFavorite: false };
                state.history[name] = JSON.stringify(hwData);
                localStorage.setItem('frenchHistory', JSON.stringify(state.history));
            }
            
            if (hwData.month === undefined) {
                hwData.month = hwData.date ? new Date(hwData.date).getMonth() : state.selectedBpMonth;
                state.history[name] = JSON.stringify(hwData);
                localStorage.setItem('frenchHistory', JSON.stringify(state.history));
            }
        } catch (e) { return; }
        
        const phraseCount = hwData.words.split('\n').filter(w => w.trim()).length;
        const matchesMonth = hwData.month === state.selectedBpMonth;
        const matchesFav = hwData.isFavorite === true;
        
        if ((state.showFavsOnly && matchesFav) || (!state.showFavsOnly && matchesMonth)) {
            visibleCount++;
            const div = document.createElement('div'); 
            div.className = 'history-item';
            div.style.position = "relative"; 

            const hasAudio = hwData.audio ? '🎤' : '';
            const safeName = name.replace(/'/g, "\\'");

            div.innerHTML = `
                ${getCornerBadgesHTML(name)} 

                <div style="width:100%; margin-bottom:8px; padding: 0 10px;">
                    <div class="hw-clickable-title" 
                         style="font-weight:900; font-size:1.25rem; color:#2d3748; cursor:pointer; text-decoration:underline dotted #9d4edd; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${name} ${hasAudio}
                    </div>
                </div>
                
                <button class="practice-big-btn" style="width:100%; background:#4cd964; color:white; border:none; border-radius:24px; padding:10px 0; font-weight:900; font-size:1.4rem; margin:5px 0 8px 0; cursor:pointer; box-shadow:0 4px 0 #2e8b57; line-height:1.2; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <span style="letter-spacing:1px;">PRACTICE</span>
                    <span style="font-size: 0.8rem; font-weight: 800; opacity: 0.95; text-transform: uppercase; margin-top:2px;">
                        ${phraseCount} ${phraseCount === 1 ? 'phrase' : 'phrases'}
                    </span>
                </button>
               <div class="hw-action-row">
                   <div class="icon-wrapper"><button class="icon-btn edit-icon" style="background: #118AB2; color: white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button><span class="icon-label">Edit</span></div>
                   
                   <div class="icon-wrapper"><button class="icon-btn print-icon" style="background: #64748b; color: white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg></button><span class="icon-label">Print</span></div>
                   
                   <div class="icon-wrapper"><button class="icon-btn share-icon" style="background: #5a67d8; color: white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button><span class="icon-label">Share</span></div>
                   
                   <div class="icon-wrapper"><button class="icon-btn move-icon" style="background: #f59e0b; color: white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg></button><span class="icon-label">Move</span></div>
                   
                   <div class="icon-wrapper"><button class="icon-btn note-icon" style="background: #4cd964; color: white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></button><span class="icon-label">Notes</span></div>
                   
                   <div class="icon-wrapper"><button class="icon-btn delete-icon" style="background: #ef4444; color: white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button><span class="icon-label">Delete</span></div>
               </div>
            `;
            
            // --- UPDATED LOGIC BINDING: Direct Class Targeting ---
            // This is much safer than index counting (icons[0], etc.)
            const titleEl = div.querySelector('.hw-clickable-title');
            if (titleEl) titleEl.onclick = () => renameHomework(name);

            const practiceBtn = div.querySelector('.practice-big-btn');
            if (practiceBtn) practiceBtn.onclick = () => loadHomeworkForPractice(name, hwData.words, hwData.audio);

            // Target specific class names for the 6 utility buttons
            const btnEdit = div.querySelector('.edit-icon');
            if (btnEdit) btnEdit.onclick = () => editHomework(name);

            const btnPrint = div.querySelector('.print-icon');
            if (btnPrint) btnPrint.onclick = () => openPrintSelection(hwData.words, name);

            const btnShare = div.querySelector('.share-icon');
            if (btnShare) btnShare.onclick = () => shareWeek(name, hwData.words, hwData.audio);

            const btnMove = div.querySelector('.move-icon');
            if (btnMove) btnMove.onclick = () => moveHomework(name);

            const btnNote = div.querySelector('.note-icon');
            if (btnNote) btnNote.onclick = () => showNote(name);

            const btnDelete = div.querySelector('.delete-icon');
            if (btnDelete) btnDelete.onclick = () => deleteHomeworkItem(name);
            
            list.appendChild(div);
        }
    });

    if (visibleCount === 0) {
        list.innerHTML = `
            <div style="text-align:center; color:#64748b; padding:40px 20px; background:#f8fafc; border-radius:20px; border:2px dashed #cbd5e0;">
                <p style="font-size:2.5rem; margin-bottom:10px;">∅</p>
                <p style="font-size:1.1rem; font-weight:800; margin-bottom:10px;">Folder is Empty</p>
                <p style="font-size:0.85rem; margin-bottom:15px;">${state.showFavsOnly ? "Star some homework to see it here!" : "No homework saved for " + monthNames[state.selectedBpMonth] + "."}</p>
                <button onclick="openFolderNav()" style="background:#118AB2; color:white; border:none; padding:8px 15px; border-radius:10px; font-weight:900; cursor:pointer;">📂 View All Folders</button>
            </div>`;
    }
}

function deleteHomeworkItem(name) {
    console.log('🔴 DELETE FUNCTION STARTED');
    console.log('name:', name);
    
    openAppModal({
        title: "🗑️ Delete Homework",
        text: `Are you sure you want to delete "${name}"?`,
        mode: 'view',
        saveText: "🗑️ Delete",
        cancelText: "Cancel",
        onAction: () => {
            // Delete logic
            delete state.history[name]; 
            if (state.homeworkNotes && state.homeworkNotes[name]) delete state.homeworkNotes[name];
            
            localStorage.setItem('frenchHistory', JSON.stringify(state.history));
            setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
            
            // If deleting the active set
            if (state.currentSetName === name) {
                state.currentSetName = '';
                localStorage.removeItem('homeworkPhrases');
                renderList([]);
            }
            
            closeOverlay('appModal');
            openBP(); // Refresh the backpack view
        },
        onSecondaryAction: () => closeOverlay('appModal')
    });
}

function renameHomework(oldName) {
    openAppModal({
        title: "🏷️ Rename Homework",
        text: oldName,
        mode: 'edit',
        onSave: (newName) => {
            if (!newName || newName === oldName) return;
            
            // 1. Prevent overwriting another existing homework
            if (state.history[newName]) {
                showToast("A homework with that name already exists!", 'error');
                return false; 
            }
            
            // 2. Move the Homework Data
            state.history[newName] = state.history[oldName];
            delete state.history[oldName];
            
            // 3. Move the Note (Crucial Fix!)
            if (state.homeworkNotes && state.homeworkNotes[oldName]) {
                state.homeworkNotes[newName] = state.homeworkNotes[oldName];
                delete state.homeworkNotes[oldName];
                localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
            }
            
            localStorage.setItem('frenchHistory', JSON.stringify(state.history));
            setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
            
            // 4. Update the current screen if you are currently practicing this set
            if (state.currentSetName === oldName) {
                state.currentSetName = newName;
                localStorage.setItem('currentSetName', newName);
            }
            
            openBP(); // Refresh the backpack UI
            return true;
        }
    });
}

function editHomework(name) {
    let hwData = { words: '', audio: null, isDialogue: false, month: state.selectedBpMonth };
    try {
        const raw = state.history[name];
        hwData = JSON.parse(raw);
    } catch (e) { hwData.words = state.history[name]; }

    state.editingHomeworkName = name;
    
    // 1. Setup the UI
    document.getElementById('hwMessages').innerHTML = ''; 
    document.getElementById('hwNameInput').value = name;
    document.getElementById('hwInput').value = hwData.words;
    document.getElementById('hwIsDialogue').checked = !!hwData.isDialogue;
    
    state.currentWeekAudio = hwData.audio || null;
    displayAudioPlayer();

    refreshHwTitle('edit', name);
    closeOverlay('bpModal');
    openOverlay('hwDrawer');
}

// 3. The Core Sharing Engine (UPDATED to use native share for files)
function attemptFileShare(jsonString, fileName, title) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });
    
    // Check if the device supports file sharing AND we're on a secure context (HTTPS)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Use the native share sheet - this will show WhatsApp, Telegram, etc.
        navigator.share({
            title: title,
            text: 'French Fun homework with custom photos!',
            files: [file]
        }).catch(err => {
            // If user cancels, do nothing
            if(err.name === 'AbortError') {
                console.log('Share cancelled');
                return;
            }
            // For other errors, fallback to download
            console.warn('Share failed, falling back to download:', err);
            saveDataAsFile(jsonString, fileName);
        });
    } else {
        // Fallback for browsers that don't support file sharing
        console.log('File sharing not supported, falling back to download');
        saveDataAsFile(jsonString, fileName);
    }
}

       // 4. The Download Engine (Updated with platform-specific instructions)
function saveDataAsFile(content, fileName) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    
    // Detect platform
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Small delay to ensure file is saved before showing instructions
    setTimeout(() => {
        let message = `✅ File saved as "${fileName}"!\n\n`;
        
        if (isAndroid) {
            message += `To share the file:\n`;
            message += `1. Open your file manager or Downloads app\n`;
            message += `2. Find "${fileName}"\n`;
            message += `3. Tap and hold the file\n`;
            message += `4. Select "Share" from the menu\n`;
            message += `5. Choose WhatsApp, Telegram, email, etc.\n\n`;
            message += `Would you like to open your Downloads folder now?`;
            
            openAppModal({
                title: 'File Saved',
                text: message,
                mode: 'view',
                saveText: 'Open Downloads',
                cancelText: 'OK',
                onAction: () => {
                    window.location.href = 'file:///storage/emulated/0/Download/';
                }
            });
        } 
        else if (isIOS) {
            message += `To share the file:\n`;
            message += `1. Open the "Files" app on your iPhone/iPad\n`;
            message += `2. Tap "Browse" at the bottom\n`;
            message += `3. Go to "Downloads" or "On My iPhone"\n`;
            message += `4. Find "${fileName}"\n`;
            message += `5. Long press on the file\n`;
            message += `6. Select "Share" from the menu\n`;
            message += `7. Choose WhatsApp, Messages, email, etc.`;
            openAppModal({ title: 'File Saved', text: message, mode: 'view' });
        } 
        else {
            // Desktop browser
            message += `File saved to your Downloads folder.\n`;
            message += `You can now attach it to an email, upload it, or share it manually.`;
            openAppModal({ title: 'File Saved', text: message, mode: 'view' });
        }
    }, 500);
}

function debugStorage() {
    console.log('=== STORAGE DEBUG ===');
    console.log('homeworkPhrases:', localStorage.getItem('homeworkPhrases'));
    console.log('frenchHistory:', JSON.parse(localStorage.getItem('frenchHistory') || '{}'));
    console.log('state.currentWeekAudio:', localStorage.getItem('currentWeekAudio'));
    console.log('phraseTranslations:', JSON.parse(localStorage.getItem('phraseTranslations') || '{}'));
    console.log('gameWins:', localStorage.getItem('gameWins'));
    console.log('gameLosses:', localStorage.getItem('gameLosses'));
    console.log('state.speechSpeed:', localStorage.getItem('speechSpeed'));
    console.log('=====================');
    openAppModal({ title: 'Debug', text: 'Check console for storage debug info (F12)', mode: 'view' });
}

function saveAndExit() {
    // Final backup snapshot + file download
    try { StorageDB.autoBackup(); StorageDB.exportBackupToFile(); } catch(e) {}
    // Close settings drawer and show goodbye
    closeOverlay('parentDrawer');
    // Scroll to top and show splash-like view
    state.allowExit = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        // Re-show the splash screen as a goodbye
        const splash = document.getElementById('customSplash');
        if (splash) {
            splash.style.display = 'flex';
            splash.style.opacity = '1';
            splash.style.pointerEvents = 'auto';
            splash.onclick = null;
            document.getElementById('splashText').textContent = 'À bientôt !';
            document.getElementById('splashIcon').classList.remove('splash-immersive-zoom');
            document.getElementById('splashIcon').classList.add('splash-pop-in');
            document.querySelector('.container').classList.remove('app-visible');
        }
        showToast('✅ All data saved. See you soon!');
    }, 400);
}

function nukeStorage() { 
    openAppModal({
        title: "⚠️ RESET EVERYTHING",
        text: "This will delete ALL homework, recordings, and progress. Are you absolutely sure?",
        mode: 'view',
        saveText: "Yes, Reset All",
        cancelText: "Cancel",
        onAction: () => {
            openAppModal({
                title: "⚠️ LAST CHANCE",
                text: "This cannot be undone!",
                mode: 'view',
                saveText: "I Understand, Reset",
                cancelText: "Go Back",
                onAction: () => {
                    localStorage.clear(); 
                    location.reload(); 
                }
            });
        }
    });
}

function renderAlphabetCards(alphabetList) {
    const container = document.getElementById('phrasesList');
    container.innerHTML = '';
    
    const statusInfo = document.getElementById('stCountText');
    if (statusInfo) {
        statusInfo.innerHTML = '🔤 French Alphabet & Accents';
    }
    
    alphabetList.forEach(letter => {
        const pronunciation = FRENCH_LETTER_NAMES[letter] || "";
        
        const card = document.createElement('div');
        card.className = 'phrase-card';
        card.style.borderColor = '#4cd964';
        card.style.background = 'linear-gradient(145deg, #ffffff, #f0fff4)';
        // Added padding-top since we removed the icon
        card.style.paddingTop = '40px'; 
        
        card.innerHTML = `
            <!-- Icon Removed for cleaner look -->
            <span class="french-text" style="font-size: 6rem; line-height: 1; color: #2d3748; display: block;">${letter}</span>
            <span class="pronunciation-text" style="font-size: 1.6rem; color: #4a5568; margin: 20px 0; display: block;">[ ${pronunciation} ]</span>
            
            <div class="card-btns" style="margin-top: 20px;">
                <button class="card-btn spk-fr" style="background: #4cd964; font-size: 1.3rem; grid-column: span 2; height: 60px;">
                    🔊 Listen to Name
                </button>
            </div>
        `;
        
        card.querySelector('.spk-fr').onclick = () => { triggerHaptic(15); spk(letter, 'fr-FR', true, null, true); };
        container.appendChild(card);
    });
}

function manualFixTranslation(p, currentEn) {
    openAppModal({
        title: `🔧 Fix Translation: ${p}`,
        text: currentEn,
        mode: 'edit',
        onSave: (fix) => {
            if (fix) {
                state.cache[norm(p)] = fix;
                localStorage.setItem('phraseTranslations', JSON.stringify(state.cache));
                renderList(state.currentScreenList);
            }
        }
    });
}

function manualFixSyllables(word, currentSyllables) {
    const currentText = currentSyllables.join('-');
    openAppModal({
        title: `🔧 Fix Syllables: ${word}`,
        text: currentText,
        mode: 'edit',
        onSave: (fix) => {
            if (fix) {
                const cleanLower = word.toLowerCase();
                const newSyllables = fix.split('-').map(s => s.trim()).filter(s => s.length > 0);
                if (!state.syllableOverrides) state.syllableOverrides = {};
                state.syllableOverrides[cleanLower] = newSyllables;
                localStorage.setItem('syllableOverrides', JSON.stringify(state.syllableOverrides));
                renderList(state.currentScreenList);
            }
        }
    });
}

function manualFixPronunciation(p, currentPron) {
    openAppModal({
        title: `🔧 Fix Pronunciation: ${p}`,
        text: currentPron,
        mode: 'edit',
        onSave: (fix) => {
            if (fix) {
                state.customPronunciations[norm(p)] = fix;
                localStorage.setItem('customPronunciations', JSON.stringify(state.customPronunciations));
                renderList(state.currentScreenList);
            }
        }
    });
}

function startAutoPlay() {
    state.isAutoPlaying = true;
    state.autoPlaySessionId = (state.autoPlaySessionId || 0) + 1;
    document.getElementById('playAllBtn').innerHTML = "⏹️ Stop";
    
    if (state.currentScreenList && state.currentScreenList.length > 10) {
        const floatBtn = document.getElementById('floatingStopBtn');
        if (floatBtn) floatBtn.style.display = 'flex';
    }
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(" ")); 
    
    playLine(0, state.autoPlaySessionId);
}

function stopAutoPlay() {
    state.isAutoPlaying = false;
    state.autoPlaySessionId = (state.autoPlaySessionId || 0) + 1;
    if (state.autoPlayTimeout) {
        clearTimeout(state.autoPlayTimeout);
        state.autoPlayTimeout = null;
    }
    
    const playBtn = document.getElementById('playAllBtn');
    if (playBtn) playBtn.innerHTML = "▶️ Play All";
    
    // Always attempt to hide the floating button when stopping
    const floatBtn = document.getElementById('floatingStopBtn');
    if (floatBtn) floatBtn.style.display = 'none';
    
    document.querySelectorAll('.dialogue-line').forEach(el => el.classList.remove('playing-now'));
    window.speechSynthesis.cancel();
}

  async function playLine(index, sessionId) {
    if (!state.isAutoPlaying) return;
    if (sessionId !== undefined && sessionId !== state.autoPlaySessionId) return;
    
    if (index >= state.currentScreenList.length) {
        if (state.loopMode) {
            playLine(0, sessionId);
        } else {
            stopAutoPlay();
        }
        return;
    }
    
    const text = state.currentScreenList[index].split('|')[0].trim();
    const userGap = parseFloat(document.getElementById('gapSlider').value) * 1000;
    
    document.querySelectorAll('.dialogue-line').forEach(el => el.classList.remove('playing-now'));
    const currentEl = document.getElementById('line-' + index);
    
    if (currentEl) {
        currentEl.classList.add('playing-now');
        const rect = currentEl.getBoundingClientRect();
        const stickyPanelHeight = 150;
        const bottomNavHeight = 150;
        const isInView = (rect.top >= stickyPanelHeight && 
                         rect.bottom <= (window.innerHeight - bottomNavHeight));
        if (!isInView) {
            currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Use Google TTS with browser TTS fallback
    try {
        await SpeechCache.playCachedAudio(text, 'fr-FR', true);
    } catch(e) {
        // fallback already handled inside playCachedAudio
    }
    
    // Check if loop was cancelled while audio was playing
    if (!state.isAutoPlaying || (sessionId !== undefined && sessionId !== state.autoPlaySessionId)) return;
    
    if (state.isAutoPlaying) {
        state.autoPlayTimeout = setTimeout(() => {
            playLine(index + 1, sessionId);
        }, userGap);
    }
}

function toggleAutoPlay() {
    const btn = document.getElementById('playAllBtn');
    if (state.isAutoPlaying) {
        // STOP logic
        stopAutoPlay();
    } else {
        // START logic
        startAutoPlay();
    }
}

function toggleLoop() {
    state.loopMode = !state.loopMode;
    const loopBtn = document.getElementById('loopBtn');
    
    if (state.loopMode) {
        loopBtn.style.background = '#4cd964';
        loopBtn.style.border = '2px solid #2ea44e';
    } else {
        loopBtn.style.background = '#ff9e6d';
        loopBtn.style.border = '2px solid transparent'; // Keeps height consistent
    }
}
       

function openAppModal(config) {
    resetAllSpellingCards();
    const titleEl = document.getElementById('appModalTitle');
    const statsEl = document.getElementById('appModalStats');
    const input = document.getElementById('appModalInput');
    const display = document.getElementById('appModalTextDisplay');
    const viewSection = document.getElementById('appModalView');
    const editSection = document.getElementById('appModalEdit');
    
    const btnClose = document.getElementById('appModalBtnClose'); 
    const btnAction = document.getElementById('appModalBtnAction'); 
    const btnEdit = document.getElementById('appModalBtnEdit'); 
    const btnDelete = document.getElementById('appModalBtnDelete'); 
    const btnGrid = document.getElementById('appModalViewBtns');

    // Reset listeners
    btnAction.onclick = null;
    btnEdit.onclick = null;
    btnDelete.onclick = null;
    btnClose.onclick = null;

    // Default Styles
    btnAction.style.display = "none";
    btnAction.style.gridColumn = "auto";
    btnEdit.style.display = "none";
    btnEdit.style.gridColumn = "auto";
    btnDelete.style.display = "none";
    btnDelete.style.gridColumn = "auto";
    btnClose.style.display = "block"; 
    btnClose.textContent = "Close";
    btnGrid.style.display = "grid";
    btnGrid.style.gridTemplateColumns = "1fr 1fr"; 
    statsEl.textContent = "";

    titleEl.textContent = config.title || "";
    display.textContent = config.text || "";

    if (config.mode === 'edit') {
        const charBar = document.getElementById('appModalCharBar');
        if (charBar) {
            charBar.style.display = config.hideChars ? 'none' : 'flex';
        }
        viewSection.style.display = "none";
        editSection.style.display = "block";
        btnClose.style.display = "none"; 
        input.value = config.text || "";
        const bSave = document.getElementById('appModalBtnSave');
        const bCan = document.getElementById('appModalBtnCancel');
        bSave.onclick = () => { 
            const val = input.value.trim();
            if(config.onSave && config.onSave(val) !== false) {
                closeOverlay('appModal'); 
                showToast('✅ Saved!');
            }
        };
        bCan.onclick = () => {
            // Clear hash when cancel is clicked during import
            if (window.location.hash.startsWith('#import=')) {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
            closeOverlay('appModal');
        };
    }
    else {
        viewSection.style.display = "block";
        editSection.style.display = "none";
        const primaryText = config.saveText || config.actionText;

        // SCENARIO A: Strict Two-button confirmation (Delete/Reset/Import Confirm)
        if (config.onAction && (config.onSecondaryAction || config.cancelText)) {
            btnClose.style.display = "none"; // Hide bottom Close for Yes/No choices
            btnAction.style.display = "block";
            btnAction.textContent = primaryText || "Confirm";
            btnAction.style.background = (primaryText && primaryText.includes("Delete")) ? "#ef4444" : "#4cd964";
            
            btnAction.onclick = () => { 
                const cb = config.onAction;
                closeOverlay('appModal'); 
                if (cb) cb();
            };

            btnEdit.style.display = "block";
            btnEdit.textContent = config.cancelText || "Cancel";
            btnEdit.style.background = "#ff9e6d"; 
            btnEdit.style.color = "white";
            btnEdit.onclick = () => { 
                const scb = config.onSecondaryAction;
                closeOverlay('appModal'); 
                if (scb) scb();
            };
        } 
        // SCENARIO B: Single action button (Share, Export, Success)
        else if (config.onAction) {
            // RESTORED: Show the Close button so user can abort Share/Export
            btnClose.style.display = "block"; 
            btnClose.textContent = "Cancel"; 
            
            btnAction.style.display = "block";
            btnAction.textContent = primaryText || "OK";
            btnAction.style.background = "#5a67d8"; 
            btnAction.style.gridColumn = "span 2";
            btnAction.onclick = () => { 
                const cb = config.onAction;
                closeOverlay('appModal'); 
                if (cb) cb();
            };
        }
        // SCENARIO C: Note View
        else if (config.onEdit || config.onDelete) {
            if (config.onEdit) {
                btnEdit.style.display = "block";
                btnEdit.textContent = "✏️ Edit";
                btnEdit.style.background = "#118AB2";
                btnEdit.style.color = "white";
                btnEdit.onclick = () => config.onEdit();
            }
            if (config.onDelete) {
                btnDelete.style.display = "block";
                btnDelete.textContent = "🗑️ Delete";
                btnDelete.style.background = "#fee2e2";
                btnDelete.style.color = "#ef4444";
                btnDelete.onclick = () => { config.onDelete(); closeOverlay('appModal'); };
            }
            btnGrid.style.gridTemplateColumns = (config.onEdit && config.onDelete) ? "1fr 1fr" : "1fr";
        }
        else {
            // SCENARIO D: Simple Alert
            btnClose.style.display = "block";
            btnClose.textContent = primaryText || "OK";
            btnGrid.style.display = "none";
        }
    }
    btnClose.onclick = () => closeOverlay('appModal');
    openOverlay('appModal');
}

function refreshAppUI() {
    if (document.getElementById('bpModal').style.display === 'block') openBP();
    else renderList(state.currentScreenList);
}

function shareMonth() {
    const currentMonthName = monthNames[state.selectedBpMonth];
    const monthHistory = {}, monthNotes = {}, monthIcons = {}, monthPhotos = {};
    let hwCount = 0, totalPhrases = 0, noteCount = 0;
    let includedNames = [];
    
    Object.keys(state.history).forEach(name => {
        try {
            const hwData = JSON.parse(state.history[name]);
            if (hwData.month === state.selectedBpMonth) {
                hwCount++;
                includedNames.push(`• ${name}`);
                monthHistory[name] = state.history[name];
                
                // Track Notes
                if (state.homeworkNotes && state.homeworkNotes[name]) {
                    monthNotes[name] = state.homeworkNotes[name];
                    noteCount++;
                }

                const phrases = hwData.words.split('\n').filter(p => p.trim());
                totalPhrases += phrases.length;
                phrases.forEach(p => {
                    const n = norm(p);
                    if (state.customIcons[n]) monthIcons[n] = state.customIcons[n];
                    if (state.customPhotos[n]) monthPhotos[n] = state.customPhotos[n];
                });
            }
        } catch(e) {}
    });

    if (hwCount === 0) return openAppModal({ title: 'Notice', text: `No homework in ${currentMonthName}!`, mode: 'view' });

    // FORMATTED VERTICALLY
    let summary = `📁 Folder: ${currentMonthName}\n`;
    summary += `📚 ${hwCount} homework sets\n`;
    summary += `📝 ${totalPhrases} total phrases\n`;
    if (Object.keys(monthPhotos).length > 0) summary += `📷 ${Object.keys(monthPhotos).length} photos included\n`;
    if (noteCount > 0) summary += `💬 ${noteCount} sets include notes\n`; // ADDED NOTES COUNT
    
    summary += `\n📦 Included:\n${includedNames.join('\n')}`;

    openAppModal({
        title: `📤 Export ${currentMonthName}`,
        text: summary,
        mode: 'view',
        actionText: "💾 Export File", 
        onAction: () => {
            const data = { history: monthHistory, homeworkNotes: monthNotes, customIcons: monthIcons, customPhotos: monthPhotos, appVersion: "French Phrases Helper" };
            attemptFileShare(JSON.stringify(data), `french-fun-${currentMonthName.toLowerCase()}.json`, `🇫🇷 Folder: ${currentMonthName}`);
        }
    });
}

    function findMonthWithHomework() {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // 1. Identify which months actually have content
    const monthsWithContent = new Set();
    Object.values(state.history).forEach(val => {
try {
    const data = JSON.parse(val);
    if (data.month !== undefined) {
        monthsWithContent.add(data.month);
    }
} catch(e) {}
    });

    // 2. If the current month has content, or if the whole backpack is empty, stay here
    if (monthsWithContent.has(currentMonth) || monthsWithContent.size === 0) {
return currentMonth;
    }

    // 3. Search backwards from the current month (e.g., May -> April -> March...)
    for (let i = 1; i < 12; i++) {
let checkMonth = (currentMonth - i + 12) % 12;
if (monthsWithContent.has(checkMonth)) {
    return checkMonth;
}
    }

    return currentMonth; // Fallback
}

   function resetMonth() {
    const currentMonthName = monthNames[state.selectedBpMonth];
    let count = 0;
    Object.values(state.history).forEach(val => {
try { if (JSON.parse(val).month === state.selectedBpMonth) count++; } catch(e) {}
    });

    if (count === 0) return; // Silent exit if already empty

    openAppModal({
title: "⚠️ Clear " + currentMonthName,
text: `Delete all ${count} items in this folder?`,
mode: 'view',
saveText: "🗑️ Delete All",
cancelText: "Cancel",
onAction: () => {
    Object.keys(state.history).forEach(name => {
        try {
            const hw = JSON.parse(state.history[name]);
            if (hw.month === state.selectedBpMonth) {
                delete state.history[name];
                if (state.homeworkNotes[name]) delete state.homeworkNotes[name];
                if (state.currentSetName === name) { state.currentSetName = ''; renderList([]); }
            }
        } catch(e) {}
    });
    localStorage.setItem('frenchHistory', JSON.stringify(state.history));
    localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
    openBP();
},
onSecondaryAction: () => {} // Engine handles closing
    });
}

function shareApp() { 
    if (navigator.share) { 
        navigator.share({ 
            title: 'French Fun V10.0', 
            text: 'Check out this fun French learning app for kids!',
            url: window.location.href 
        }).catch(() => {}); 
    } else {
        openAppModal({ title: 'Share', text: 'Share this link: ' + window.location.href, mode: 'view' }); 
    } 
}

function installApp() {
    if (state.deferredPrompt) { 
        state.deferredPrompt.prompt(); 
        
        // Hide the button immediately after the user sees the popup
        // so they don't click it twice.
        const btn = document.getElementById('installBtn');
        if (btn) btn.style.display = 'none';
        
        state.deferredPrompt = null; 
    } else {
        // Fallback instructions for iOS/Safari or browsers that don't support automated prompt
        openAppModal({
            title: '📱 Install French Helper',
            text: 'To install this app on your iPad/iPhone:\n\n1. Tap the Share button 📤 in Safari (at the top or bottom of the screen).\n2. Scroll down the share menu and select "Add to Home Screen" ➕.\n3. Tap "Add" in the top-right corner to complete installation.',
            mode: 'view',
            saveText: 'Got it'
        });
    }
}

function closeKeyboardSettings() {
    const overlay = document.getElementById('kbSettingsOverlay');
    if (overlay) overlay.remove();
}

function showKeyboardSettings() {
    closeKeyboardSettings();

    const overlay = document.createElement('div');
    overlay.id = 'kbSettingsOverlay';
    overlay.className = 'overlay';
    // Overlay handles centering with flex
    overlay.style.display = 'flex';
    overlay.style.zIndex = '19000';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.6)'; // Simple dim background

    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.style.margin = '0'; // Override the 15vh auto to let flex center it
    modalBox.style.width = '90%';
    modalBox.style.maxWidth = '400px';
    
    // Title
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.innerHTML = '⌨️ Keyboard Settings';
    modalBox.appendChild(title);
    
    // Label: Layout
    const layoutLabel = document.createElement('p');
    layoutLabel.style.fontWeight = '900';
    layoutLabel.style.color = '#64748b';
    layoutLabel.style.fontSize = '0.75rem';
    layoutLabel.style.textTransform = 'uppercase';
    layoutLabel.style.textAlign = 'left';
    layoutLabel.style.marginBottom = '5px';
    layoutLabel.textContent = 'Layout';
    modalBox.appendChild(layoutLabel);
    
    // Row 1: Layout Buttons
    const row1 = document.createElement('div');
    row1.className = 'modal-btn-grid';
    
    const qwertyBtn = document.createElement('button');
    qwertyBtn.className = 'modal-btn';
    qwertyBtn.style.background = state.keyboardLayout === 'QWERTY' ? '#9d4edd' : '#f8fafc';
    qwertyBtn.style.color = state.keyboardLayout === 'QWERTY' ? 'white' : '#4a5568';
    qwertyBtn.style.border = state.keyboardLayout === 'QWERTY' ? 'none' : '2px solid #e2e8f0';
    qwertyBtn.innerHTML = 'QWERTY';
    qwertyBtn.onclick = () => setKeyboardLayout('QWERTY');
    
    const abcBtn = document.createElement('button');
    abcBtn.className = 'modal-btn';
    abcBtn.style.background = state.keyboardLayout === 'ABCDEF' ? '#9d4edd' : '#f8fafc';
    abcBtn.style.color = state.keyboardLayout === 'ABCDEF' ? 'white' : '#4a5568';
    abcBtn.style.border = state.keyboardLayout === 'ABCDEF' ? 'none' : '2px solid #e2e8f0';
    abcBtn.innerHTML = 'ABCDEF';
    abcBtn.onclick = () => setKeyboardLayout('ABCDEF');
    
    row1.appendChild(qwertyBtn);
    row1.appendChild(abcBtn);
    modalBox.appendChild(row1);
    
    // Label: Hint
    const hintLabel = document.createElement('p');
    hintLabel.style.fontWeight = '900';
    hintLabel.style.color = '#64748b';
    hintLabel.style.fontSize = '0.75rem';
    hintLabel.style.textTransform = 'uppercase';
    hintLabel.style.textAlign = 'left';
    hintLabel.style.marginBottom = '5px';
    hintLabel.style.marginTop = '15px';
    hintLabel.textContent = 'Hint Mode';
    modalBox.appendChild(hintLabel);
    
    // Row 2: Hint Toggle
    const hintBtn = document.createElement('button');
    hintBtn.className = 'modal-btn';
    hintBtn.style.width = '100%';
    hintBtn.style.marginBottom = '15px';
    hintBtn.style.background = state.hintModeActive ? '#4cd964' : '#f8fafc';
    hintBtn.style.color = state.hintModeActive ? 'white' : '#4a5568';
    hintBtn.style.border = state.hintModeActive ? 'none' : '2px solid #e2e8f0';
    hintBtn.innerHTML = state.hintModeActive ? '💡 Hint ON — Greyed keys' : '💡 Hint OFF';
    hintBtn.onclick = toggleHintMode;
    modalBox.appendChild(hintBtn);
    
    // Done Button
    const doneBtn = document.createElement('button');
    doneBtn.className = 'modal-btn';
    doneBtn.style.width = '100%';
    doneBtn.style.background = '#ff9e6d';
    doneBtn.style.color = 'white';
    doneBtn.style.border = 'none';
    doneBtn.innerHTML = '✓ Done';
    doneBtn.onclick = closeKeyboardSettings;
    modalBox.appendChild(doneBtn);
    
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
}

function setKeyboardLayout(layout) {
    state.keyboardLayout = layout;
    localStorage.setItem('keyboardLayout', layout);
    
    // Re-render whichever keyboard is currently active
    if (state.gameActive && typeof renderKeyboard === "function") {
        renderKeyboard();
    } else if (state.currentSpellingState && typeof renderMiniKeyboard === "function") {
        renderMiniKeyboard();
    }
    showKeyboardSettings(); // Rebuild the popup to update visually
}

function toggleHintMode() {
    state.hintModeActive = !state.hintModeActive;
    localStorage.setItem('hintModeActive', state.hintModeActive);
    
    // Re-render whichever keyboard is currently active
    if (state.gameActive && typeof renderKeyboard === "function") {
        renderKeyboard();
    } else if (state.currentSpellingState && typeof renderMiniKeyboard === "function") {
        renderMiniKeyboard();
    }
    showKeyboardSettings(); // Rebuild the popup to update visually
}

function toggleControlPanelCollapse() {
    const panel = document.querySelector('.app-control-panel');
    const arrow = document.getElementById('controlPanelCollapseArrow');
    if (!panel) return;
    
    const isCollapsed = panel.classList.toggle('collapsed');
    if (arrow) {
        arrow.textContent = isCollapsed ? '▼' : '▲';
    }
    localStorage.setItem('controlPanelCollapsed', isCollapsed ? 'true' : 'false');
}

function initControlPanelCollapse() {
    const panel = document.querySelector('.app-control-panel');
    const arrow = document.getElementById('controlPanelCollapseArrow');
    if (!panel) return;
    
    const shouldCollapse = localStorage.getItem('controlPanelCollapsed') === 'true';
    if (shouldCollapse) {
        panel.classList.add('collapsed');
        if (arrow) arrow.textContent = '▼';
    } else {
        panel.classList.remove('collapsed');
        if (arrow) arrow.textContent = '▲';
    }
}
    



