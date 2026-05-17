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
            scopeToggle.checked = true; // Default to printing the entire list
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
}

function changeReps(change) {
    const input = document.getElementById('repeatCountInput');
    let currentVal = parseInt(input.value) || 3;
    let newVal = currentVal + change;
    
    if (newVal < 1) newVal = 1;
    if (newVal > 13) newVal = 13;
    
    input.value = newVal;
}

function toggleTracingDetail() {
    const isEnabled = document.getElementById('includeTracingToggle').checked;
    const detailBox = document.getElementById('tracingOptionsDetail');
    
    detailBox.style.opacity = isEnabled ? "1" : "0.2";
    detailBox.style.pointerEvents = isEnabled ? "auto" : "none";
    
    // Refresh colors based on current radio selection
    const currentVal = document.querySelector('input[name="traceOption"]:checked').value;
    updateTraceUI(currentVal);
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
        <div class="worksheet-page-sim">
            ${page.join('')}
        </div>
    `).join('');

    // Store data for the final print button in the preview
    state.currentPreviewSettings = { words, isCursive, reps: effectiveReps, showHeader, name: state.tempPrintName, traceMode };

    // Hide selection UI, Show Preview UI
    document.getElementById('printSelectionMain').style.display = 'none';
    const previewContainer = document.getElementById('printPreviewContainer');
    previewContainer.style.display = 'block';
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.innerHTML = paginatedHTML;

    // DYNAMIC SIZING FOR PREVIEW
    // Maximize height based on viewport, adjust width to fit full page exactly.
    const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
    
    // Reduce safe bound to 85% of screen height minus 160px for padding to completely avoid outer modal scrolling
    const availableHeight = window.innerHeight * 0.85 - 160; 
    const paperPhysicalHeight = 1133; 
    let scale = availableHeight / paperPhysicalHeight;
    
    // Also cap scale by width so it doesn't overflow horizontally on narrow screens
    const availableWidth = window.innerWidth * 0.92 - 60; 
    scale = Math.min(scale, availableWidth / 816);
    scale = Math.max(0.25, Math.min(scale, 1.0));
    
    // Expand modal to fit the paper beautifully, and lock outer scrolling
    overlayContent.style.maxWidth = '1000px'; 
    overlayContent.style.width = 'fit-content';
    overlayContent.style.overflowY = 'hidden';
    
    // Apply precise dimensions to the scroll area so single page fits perfectly without scrollbar
    const exactWidth = Math.round(816 * scale) + 12; // 12px for padding/border
    const exactHeight = Math.round(paperPhysicalHeight * scale) + 28; // 28px for margin offset + padding/border
    
    previewArea.style.width = exactWidth + 'px';
    previewArea.style.height = exactHeight + 'px';
    previewArea.style.setProperty('--preview-scale', scale);
}

function backToPrintSettings() {
    const overlayContent = document.getElementById('printSelectionOverlay').querySelector('.overlay-content');
    overlayContent.style.maxWidth = '420px';
    overlayContent.style.width = '92%';
    overlayContent.style.overflowY = 'auto'; // Restore standard scrolling
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.style.width = '100%';
    previewArea.style.height = '420px'; // Reset to default

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

