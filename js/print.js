/* ==========================================
   js/print.js - Printing and worksheet generation
   French Helper
   =========================================== */

function openPrintSelection(words, homeworkName, alternateWords = null) {
    state.tempWordsToPrintSingle = words || document.getElementById('hwInput').value.trim();
    state.tempWordsToPrintAll = alternateWords;
    
    if (!state.tempWordsToPrintSingle) { openAppModal({ title: 'Notice', text: 'Please enter some phrases first!', mode: 'view' }); return; }
    state.tempPrintName = homeworkName || state.currentSetName || "Français";
    
    // 1. Reset Numeric Stepper
    document.getElementById('repeatCountInput').value = 3;
    
    // 2. Reset Checkboxes
    document.getElementById('includeHeaderToggle').checked = true; 
    document.getElementById('includeTracingToggle').checked = true; // Always start ON
    
    // 3. Reset Scope Toggle
    const scopeContainer = document.getElementById('printScopeContainer');
    const scopeToggle = document.getElementById('includeAllPhrasesToggle');
    if (scopeContainer && scopeToggle) {
        if (alternateWords) {
            scopeContainer.style.display = 'block';
            scopeToggle.checked = false; // Default to off (unchecked) when called from card
        } else {
            scopeContainer.style.display = 'none';
            scopeToggle.checked = false;
        }
    }

    // 4. Reset Radio Buttons to "First Line"
    const firstRadio = document.querySelector('input[name="traceOption"][value="first"]');
    if (firstRadio) firstRadio.checked = true;

    // 5. Refresh visuals (this colors the buttons correctly)
    toggleTracingDetail();
    
    openOverlay('printSelectionOverlay');
    
    // 6. Responsive live rendering initialisation
    if (window.innerWidth >= 1024) {
        state.desktopStyleSelected = state.desktopStyleSelected || 'block';
        document.getElementById('printPreviewContainer').style.display = 'flex';
        setDesktopStyle(state.desktopStyleSelected);
    } else {
        document.getElementById('printPreviewContainer').style.display = 'none';
        const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
        overlayContent.style.width = '92vw';
        overlayContent.style.maxWidth = '400px';
    }
}

function changeReps(change) {
    const input = document.getElementById('repeatCountInput');
    let currentVal = parseInt(input.value) || 3;
    let newVal = currentVal + change;
    
    if (newVal < 1) newVal = 1;
    if (newVal > 13) newVal = 13;
    
    input.value = newVal;
    
    if (window.innerWidth >= 1024) updateLivePreview();
}

function toggleTracingDetail() {
    const isEnabled = document.getElementById('includeTracingToggle').checked;
    const detailBox = document.getElementById('tracingOptionsDetail');
    
    detailBox.style.opacity = isEnabled ? "1" : "0.2";
    detailBox.style.pointerEvents = isEnabled ? "auto" : "none";
    
    // Refresh colors based on current radio selection
    const currentVal = document.querySelector('input[name="traceOption"]:checked').value;
    updateTraceUI(currentVal);
    
    if (window.innerWidth >= 1024) updateLivePreview();
}

// handlePrintChoice removed, now routed directly through openPrintPreview

function updateTraceUI(choice) {
    const isEnabled = document.getElementById('includeTracingToggle').checked;
    const btnFirst = document.getElementById('btnTraceFirst');
    const btnAll = document.getElementById('btnTraceAll');
    const radioFirst = document.querySelector('input[name="traceOption"][value="first"]');
    const radioAll = document.querySelector('input[name="traceOption"][value="all"]');

    // Reset visuals
    btnFirst.classList.remove('active');
    btnAll.classList.remove('active');

    if (choice === 'first') {
        radioFirst.checked = true;
        if (isEnabled) btnFirst.classList.add('active');
    } else {
        radioAll.checked = true;
        if (isEnabled) btnAll.classList.add('active');
    }
    
    if (window.innerWidth >= 1024) updateLivePreview();
}

function runPrintLogic(words, cursive = false, reps = 3, header = false, name = "Français", trace = 'first') {
    if (state.isPrinting) return;
    state.isPrinting = true;

    const html = generateWorksheetHTML(words, cursive, reps, header, name, trace);
    
    let area = document.getElementById('printArea');
    if (!area) {
        area = document.createElement('div');
        area.id = 'printArea';
        document.body.prepend(area);
    }
    
    area.innerHTML = html; 

    setTimeout(() => {
        window.print();
        setTimeout(() => { state.isPrinting = false; }, 2000);
    }, 800);
}

function generateWorksheetHTML(words, cursive = false, reps = 3, header = false, name = "Français", trace = 'first') {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    let html = "";
    if (header) {
        html += `<div class="print-header-simple">
            <div class="name-label">Nom:<span class="name-underline"></span></div>
            <div class="set-name-center">${name}</div>
            <div class="date-label">Date: ${today}</div>
        </div>`;
    }

    // UPDATED FILTER: allows our [BLANK] keyword to start the loop
    const phrases = words.split('\n').filter(p => p.trim() !== "" || p === "[BLANK]");
    const icons = ["🐰", "🦋", "🌸", "⭐", "🦄", "🌈", "🐱", "🐥", "🐨", "🦊", "🐼", "🐸", "🦁", "🐯"];

    phrases.forEach((phrase, index) => {
        const isBlankSheet = (phrase === "[BLANK]");
        const clean = isBlankSheet ? "" : phrase.split('|')[0].trim();
        
        let fClass = 'block-font'; 
        if (cursive === true) fClass = 'cursive-font';
        if (cursive === 'blank') fClass = 'blank-line';

        let effectiveReps = reps;
        if (!isBlankSheet && index === 0 && header && reps === 13) {
            effectiveReps = 12;
        }
        
        html += `<div class="print-phrase-block">
            <span class="cute-decoration">${isBlankSheet ? "✏️" : icons[index % icons.length]}</span>`;

        // REFERENCE ROW
        html += `<div class="calligraphy-row ${fClass}">
                    ${clean ? `<div class="trace-text ${fClass}" style="color: black !important; opacity: 1 !important; -webkit-text-stroke: 0px !important;">${clean}</div>` : ''}
                 </div>`;

        // PRACTICE ROWS
        for (let i = 0; i < effectiveReps; i++) {
            let shouldTrace = false;
            if (!isBlankSheet) {
                if (trace === 'all') shouldTrace = true;
                else if (trace === 'first' && i === 0) shouldTrace = true;
            }

            let tHTML = shouldTrace ? `<div class="trace-text ${fClass}">${clean}</div>` : '';
            html += `<div class="calligraphy-row ${fClass}">${tHTML}</div>`; 
        }
        html += `</div>`; 
    });

    return html;
}

function openPrintPreview(choice) {
    const reps = parseInt(document.getElementById('repeatCountInput').value);
    const showHeader = document.getElementById('includeHeaderToggle').checked;
    const tracingEnabled = document.getElementById('includeTracingToggle').checked;
    
    let traceMode = 'none'; 
    if (tracingEnabled) {
        const selectedRadio = document.querySelector('input[name="traceOption"]:checked');
        traceMode = selectedRadio ? selectedRadio.value : 'first';
    }

    // Determine target words based on Scope Toggle
    const scopeContainer = document.getElementById('printScopeContainer');
    const scopeToggle = document.getElementById('includeAllPhrasesToggle');
    const printAll = scopeContainer && scopeContainer.style.display !== 'none' && scopeToggle && scopeToggle.checked;
    const wordsPayload = (printAll && state.tempWordsToPrintAll) ? state.tempWordsToPrintAll : state.tempWordsToPrintSingle;

    // FIX REGRESSION: Blank sheet should print full page (12 or 13 lines depending on header presence)
    const effectiveReps = choice === 'blank' ? (showHeader ? 12 : 13) : reps;
    const words = choice === 'blank' ? "[BLANK]" : wordsPayload;
    const isCursive = choice === 'cursive' || choice === 'blank';
    const rawHTML = generateWorksheetHTML(words, isCursive, effectiveReps, showHeader, state.tempPrintName, traceMode);
    
    // --- PAGINATION SIMULATION ---
    // We need to split the blocks into multiple virtual pages so the user sees 
    // exactly what will move to Page 2, Page 3, etc.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHTML;
    const items = Array.from(tempDiv.children);
    
    const pages = [];
    let currentPageItems = [];
    let currentHeight = 0;
    const MAX_H = 1040; // Tuned bound based on actual browser layout capacity

    items.forEach(item => {
        let h = 0;
        if (item.classList.contains('print-header-simple')) {
            h = 75; // Exact CSS height (30px text + 10px pad + 20px margin + borders + buffer)
        } else if (item.classList.contains('print-phrase-block')) {
            const rowCount = item.querySelectorAll('.calligraphy-row').length;
            // Exact CSS math: (rowCount - 1) * 70px + 46px (last row) + 59px (block padding/border/margin)
            h = ((rowCount - 1) * 70) + 105; 
        }

        if (currentHeight + h > MAX_H) {
            pages.push(currentPageItems);
            currentPageItems = [item.outerHTML];
            currentHeight = h;
        } else {
            currentPageItems.push(item.outerHTML);
            currentHeight += h;
        }
    });
    if (currentPageItems.length > 0) pages.push(currentPageItems);

    const paginatedHTML = pages.map((page, i) => `
        <div class="worksheet-page-wrapper" style="width: calc(816px * var(--preview-scale, 0.45)); height: calc(1133px * var(--preview-scale, 0.45)); position: relative; margin-bottom: 20px; flex-shrink: 0; overflow: visible;">
            <div class="worksheet-page-sim" style="position: absolute; top: 0; left: 0; width: 816px !important; height: 1133px !important; min-height: 1133px !important; transform: scale(var(--preview-scale, 0.45)) !important; transform-origin: top left !important; margin: 0 !important; flex-shrink: 0;">
                ${page.join('')}
            </div>
        </div>
    `).join('');

    // Store data for the final print button in the preview
    state.currentPreviewSettings = { words, isCursive, reps: effectiveReps, showHeader, name: state.tempPrintName, traceMode };

    // Hide selection UI, Show Preview UI
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) {
        document.getElementById('printSelectionMain').style.display = 'none';
    }
    const previewContainer = document.getElementById('printPreviewContainer');
    previewContainer.style.display = isDesktop ? 'flex' : 'block';
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.innerHTML = paginatedHTML;

    // DYNAMIC SIZING FOR PREVIEW
    const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
    
    // Allow scrolling on the modal wrapper to absolutely prevent any bottom-cutoffs on short viewports
    overlayContent.style.overflowY = 'auto';
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Safety margin for top/bottom padding, borders, headers, and footer tips
    const safetyMargin = 150;
    const availableHeight = Math.floor(screenHeight * 0.90) - safetyMargin;
    
    let scale;
    let computedHeight;
    let maxModalWidth;
    
    if (isDesktop) {
        overlayContent.style.width = '';
        overlayContent.style.maxWidth = '';
        
        // Dynamic scaling to fit right panel width and safe height limit
        const leftColHeight = document.getElementById('printSelectionMain').offsetHeight;
        const targetHeight = (leftColHeight > 0) ? leftColHeight : 520; // nominal unscaled height is 520
        
        // Calculate the current left column scale to get its exact visual width
        const availableHeight = window.innerHeight - 120;
        const leftScale = Math.max(0.82, Math.min(1.0, availableHeight / targetHeight));
        const leftColWidth = 380 * leftScale;
        
        const maxAvailableWidth = (window.innerWidth * 0.92) - leftColWidth - 170; // gap (30) + modal pad (60) + grey pad (80)
        const draftingWidth = maxAvailableWidth > 200 ? maxAvailableWidth : 200;
        const draftingHeight = targetHeight;
        
        const scaleX = draftingWidth / 816;
        const scaleY = draftingHeight / 1133;
        scale = Math.min(scaleX, scaleY);
        scale = Math.max(0.25, Math.min(scale, 1.0));
        
        computedHeight = Math.round(1133 * scale);
        
        if (previewContainer) {
            const paperWidth = Math.round(816 * scale);
            previewContainer.style.width = (paperWidth + 80) + 'px';
            previewContainer.style.height = (targetHeight * leftScale) + 'px';
            previewContainer.style.flex = 'none';
        }
    } else {
        // MOBILE RULE: Fix width of container to take full width (92vw), and adjust height to fit viewport
        const modalWidth = Math.min(screenWidth * 0.92, 400);
        const greyContainerWidth = modalWidth - 10; // Minus 5px left/right borders
        const availableWidth = greyContainerWidth - 32; // Minus 16px left/right padding
        
        scale = availableWidth / 816;
        scale = Math.max(0.2, Math.min(scale, 1.0));
        
        computedHeight = Math.max(280, Math.min(availableHeight, 440));
        maxModalWidth = '400px';
        overlayContent.style.width = '92vw';
        overlayContent.style.maxWidth = maxModalWidth;
        
        if (previewContainer) {
            previewContainer.style.width = '';
            previewContainer.style.height = '';
            previewContainer.style.flex = '';
        }
    }
    
    // Reset manual overrides, allowing CSS classes to perfectly stretch edge-to-edge
    previewArea.style.padding = '';
    previewArea.style.width = '';
    
    // Apply dynamic safe height with !important priority to override any CSS media query rules
    previewArea.style.removeProperty('height');
    previewArea.style.setProperty('min-height', computedHeight + 'px', 'important');
    previewArea.style.setProperty('--preview-scale', scale);
}

function backToPrintSettings() {
    const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
    overlayContent.style.width = '92vw';
    overlayContent.style.maxWidth = '400px';
    overlayContent.style.overflowY = 'auto'; // Restore standard scrolling
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.style.padding = '';
    previewArea.style.width = '';
    previewArea.style.height = '';

    document.getElementById('printSelectionMain').style.display = 'block';
    document.getElementById('printPreviewContainer').style.display = 'none';
}

function doPrintFromPreview() {
    if (!state.isPremiumUser) {
        openAppModal({
            title: '⭐ Premium Feature',
            text: "Printing customized worksheets is a Premium feature. Upgrade your account to instantly print unlimited worksheets for your child's French immersion practice!",
            mode: 'view',
            saveText: 'Upgrade Now',
            cancelText: 'Go Back',
            onAction: () => {
                showToast('🚀 Thank you for your support! Payment gateway integration is coming soon.');
            }
        });
        return;
    }

    const s = state.currentPreviewSettings;
    if (!s) return;
    runPrintLogic(s.words, s.isCursive, s.reps, s.showHeader, s.name, s.traceMode);
}

function setDesktopStyle(choice) {
    state.desktopStyleSelected = choice;
    
    // Toggle active state in segmented controls UI
    const btns = {
        block: document.getElementById('btnStyleBlock'),
        cursive: document.getElementById('btnStyleCursive'),
        blank: document.getElementById('btnStyleBlank')
    };
    
    Object.keys(btns).forEach(key => {
        const btn = btns[key];
        if (btn) {
            if (key === choice) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    const scopeContainer = document.getElementById('printScopeContainer');
    const scopeToggle = document.getElementById('includeAllPhrasesToggle');
    const printAll = scopeContainer && scopeContainer.style.display !== 'none' && scopeToggle && scopeToggle.checked;
    const wordsPayload = (printAll && state.tempWordsToPrintAll) ? state.tempWordsToPrintAll : state.tempWordsToPrintSingle;

    // FIX REGRESSION: Blank sheet should print full page (12 or 13 lines depending on header presence)
    const effectiveReps = choice === 'blank' ? (showHeader ? 12 : 13) : reps;
    const words = choice === 'blank' ? "[BLANK]" : wordsPayload;
    const isCursive = choice === 'cursive' || choice === 'blank';
    const rawHTML = generateWorksheetHTML(words, isCursive, effectiveReps, showHeader, state.tempPrintName, traceMode);
    
    // --- PAGINATION SIMULATION ---
    // We need to split the blocks into multiple virtual pages so the user sees 
    // exactly what will move to Page 2, Page 3, etc.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHTML;
    const items = Array.from(tempDiv.children);
    
    const pages = [];
    let currentPageItems = [];
    let currentHeight = 0;
    const MAX_H = 1040; // Tuned bound based on actual browser layout capacity

    items.forEach(item => {
        let h = 0;
        if (item.classList.contains('print-header-simple')) {
            h = 75; // Exact CSS height (30px text + 10px pad + 20px margin + borders + buffer)
        } else if (item.classList.contains('print-phrase-block')) {
            const rowCount = item.querySelectorAll('.calligraphy-row').length;
            // Exact CSS math: (rowCount - 1) * 70px + 46px (last row) + 59px (block padding/border/margin)
            h = ((rowCount - 1) * 70) + 105; 
        }

        if (currentHeight + h > MAX_H) {
            pages.push(currentPageItems);
            currentPageItems = [item.outerHTML];
            currentHeight = h;
        } else {
            currentPageItems.push(item.outerHTML);
            currentHeight += h;
        }
    });
    if (currentPageItems.length > 0) pages.push(currentPageItems);

    const paginatedHTML = pages.map((page, i) => `
        <div class="worksheet-page-wrapper" style="width: calc(816px * var(--preview-scale, 0.45)); height: calc(1133px * var(--preview-scale, 0.45)); position: relative; margin-bottom: 20px; flex-shrink: 0; overflow: visible;">
            <div class="worksheet-page-sim" style="position: absolute; top: 0; left: 0; width: 816px !important; height: 1133px !important; min-height: 1133px !important; transform: scale(var(--preview-scale, 0.45)) !important; transform-origin: top left !important; margin: 0 !important; flex-shrink: 0;">
                ${page.join('')}
            </div>
        </div>
    `).join('');

    // Store data for the final print button in the preview
    state.currentPreviewSettings = { words, isCursive, reps: effectiveReps, showHeader, name: state.tempPrintName, traceMode };

    // Hide selection UI, Show Preview UI
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) {
        document.getElementById('printSelectionMain').style.display = 'none';
    }
    const previewContainer = document.getElementById('printPreviewContainer');
    previewContainer.style.display = isDesktop ? 'flex' : 'block';
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.innerHTML = paginatedHTML;

    // DYNAMIC SIZING FOR PREVIEW
    const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
    
    // Allow scrolling on the modal wrapper to absolutely prevent any bottom-cutoffs on short viewports
    overlayContent.style.overflowY = 'auto';
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Safety margin for top/bottom padding, borders, headers, and footer tips
    const safetyMargin = 150;
    const availableHeight = Math.floor(screenHeight * 0.90) - safetyMargin;
    
    let scale;
    let computedHeight;
    let maxModalWidth;
    
    if (isDesktop) {
        overlayContent.style.width = '';
        overlayContent.style.maxWidth = '';
        
        // Dynamic scaling to fit right panel width and safe height limit
        const leftColHeight = document.getElementById('printSelectionMain').offsetHeight;
        const targetHeight = (leftColHeight > 0) ? leftColHeight : 520; // nominal unscaled height is 520
        
        // Calculate the current left column scale to get its exact visual width
        const availableHeight = window.innerHeight - 120;
        const leftScale = Math.max(0.82, Math.min(1.0, availableHeight / targetHeight));
        const leftColWidth = 380 * leftScale;
        
        const maxAvailableWidth = (window.innerWidth * 0.92) - leftColWidth - 170; // gap (30) + modal pad (60) + grey pad (80)
        const draftingWidth = maxAvailableWidth > 200 ? maxAvailableWidth : 200;
        const draftingHeight = targetHeight;
        
        const scaleX = draftingWidth / 816;
        const scaleY = draftingHeight / 1133;
        scale = Math.min(scaleX, scaleY);
        scale = Math.max(0.25, Math.min(scale, 1.0));
        
        computedHeight = Math.round(1133 * scale);
        
        if (previewContainer) {
            const paperWidth = Math.round(816 * scale);
            previewContainer.style.width = (paperWidth + 80) + 'px';
            previewContainer.style.height = (targetHeight * leftScale) + 'px';
            previewContainer.style.flex = 'none';
        }
    } else {
        // MOBILE RULE: Fix width of container to take full width (92vw), and adjust height to fit viewport
        const modalWidth = Math.min(screenWidth * 0.92, 400);
        const greyContainerWidth = modalWidth - 10; // Minus 5px left/right borders
        const availableWidth = greyContainerWidth - 32; // Minus 16px left/right padding
        
        scale = availableWidth / 816;
        scale = Math.max(0.2, Math.min(scale, 1.0));
        
        computedHeight = Math.max(280, Math.min(availableHeight, 440));
        maxModalWidth = '400px';
        overlayContent.style.width = '92vw';
        overlayContent.style.maxWidth = maxModalWidth;
        
        if (previewContainer) {
            previewContainer.style.width = '';
            previewContainer.style.height = '';
            previewContainer.style.flex = '';
        }
    }
    
    // Reset manual overrides, allowing CSS classes to perfectly stretch edge-to-edge
    previewArea.style.padding = '';
    previewArea.style.width = '';
    
    // Apply dynamic safe height with !important priority to override any CSS media query rules
    previewArea.style.removeProperty('height');
    previewArea.style.setProperty('min-height', computedHeight + 'px', 'important');
    previewArea.style.setProperty('--preview-scale', scale);
}

function backToPrintSettings() {
    const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
    overlayContent.style.width = '92vw';
    overlayContent.style.maxWidth = '400px';
    overlayContent.style.overflowY = 'auto'; // Restore standard scrolling
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.style.padding = '';
    previewArea.style.width = '';
    previewArea.style.height = '';

    document.getElementById('printSelectionMain').style.display = 'block';
    document.getElementById('printPreviewContainer').style.display = 'none';
}

function doPrintFromPreview() {
    if (!state.isPremiumUser) {
        openAppModal({
            title: '⭐ Premium Feature',
            text: "Printing customized worksheets is a Premium feature. Upgrade your account to instantly print unlimited worksheets for your child's French immersion practice!",
            mode: 'view',
            saveText: 'Upgrade Now',
            cancelText: 'Go Back',
            onAction: () => {
                showToast('🚀 Thank you for your support! Payment gateway integration is coming soon.');
            }
        });
        return;
    }

    const s = state.currentPreviewSettings;
    if (!s) return;
    runPrintLogic(s.words, s.isCursive, s.reps, s.showHeader, s.name, s.traceMode);
}

function setDesktopStyle(choice) {
    state.desktopStyleSelected = choice;
    
    // Toggle active state in segmented controls UI
    const btns = {
        block: document.getElementById('btnStyleBlock'),
        cursive: document.getElementById('btnStyleCursive'),
        blank: document.getElementById('btnStyleBlank')
    };
    
    Object.keys(btns).forEach(key => {
        const btn = btns[key];
        if (btn) {
            if (key === choice) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    // Live update the preview!
    updateLivePreview();
}

function updateLivePreview() {
    if (window.innerWidth >= 1024) {
        openPrintPreview(state.desktopStyleSelected || 'block');
    }
    updatePrintSettingsScale();
}

function updatePrintSettingsScale() {
    const isDesktop = window.innerWidth >= 1024;
    const selectionMain = document.getElementById('printSelectionMain');
    
    if (!isDesktop || !selectionMain) {
        if (selectionMain) {
            selectionMain.style.transform = '';
            selectionMain.style.marginBottom = '';
            selectionMain.style.marginRight = '';
            selectionMain.style.transformOrigin = '';
        }
        return;
    }
    
    // Account for 120px safe space (modal padding, header spacing)
    const availableHeight = window.innerHeight - 120;
    // The nominal height of the left column when unscaled
    const targetHeight = 520; 
    const targetWidth = 380; // Fixed unscaled width in CSS desktop query
    
    let scale = availableHeight / targetHeight;
    scale = Math.max(0.82, Math.min(1.0, scale)); // Scale down to 82% minimum for perfect fit
    
    selectionMain.style.transformOrigin = 'top left';
    selectionMain.style.transform = `scale(${scale})`;
    
    // Crucial: reduce layout footprint so the container itself shrinks horizontally & vertically
    const pixelDiffHeight = targetHeight * (1 - scale);
    const pixelDiffWidth = targetWidth * (1 - scale);
    
    selectionMain.style.marginBottom = `-${pixelDiffHeight}px`;
    selectionMain.style.marginRight = `-${pixelDiffWidth}px`;
}

let printResizeTimer;
window.addEventListener('resize', () => {
    const overlay = document.getElementById('printSelectionOverlay');
    if (overlay && overlay.style.display === 'block') {
        clearTimeout(printResizeTimer);
        printResizeTimer = setTimeout(() => {
            const isDesktop = window.innerWidth >= 1024;
            const previewContainer = document.getElementById('printPreviewContainer');
            const selectionMain = document.getElementById('printSelectionMain');
            
            if (isDesktop) {
                selectionMain.style.display = 'block';
                previewContainer.style.display = 'flex';
                openPrintPreview(state.desktopStyleSelected || 'block');
            } else {
                selectionMain.style.display = 'block';
                previewContainer.style.display = 'none';
                
                const overlayContent = overlay.querySelector('.overlay-content');
                overlayContent.style.width = '92vw';
                overlayContent.style.maxWidth = '400px';
                
                previewContainer.style.width = '';
                previewContainer.style.height = '';
                previewContainer.style.flex = '';
            }
            updatePrintSettingsScale();
        }, 150);
    }
});
