/* ==========================================
   js/print.js - Printing and worksheet generation
   French Helper
   =========================================== */

function openPrintSelection(words, homeworkName) {
    state.tempWordsToPrint = words || document.getElementById('hwInput').value.trim();
    if (!state.tempWordsToPrint) { openAppModal({ title: 'Notice', text: 'Please enter some phrases first!', mode: 'view' }); return; }
    state.tempPrintName = homeworkName || state.currentSetName || "Français";
    
    // 1. Reset Numeric Stepper
    document.getElementById('repeatCountInput').value = 3;
    
    // 2. Reset Checkboxes
    document.getElementById('includeHeaderToggle').checked = false; 
    document.getElementById('includeTracingToggle').checked = true; // Always start ON
    
    // 3. Reset Radio Buttons to "First Line"
    const firstRadio = document.querySelector('input[name="traceOption"][value="first"]');
    if (firstRadio) firstRadio.checked = true;

    // 4. Refresh visuals (this colors the buttons correctly)
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

function handlePrintChoice(choice) {
    const reps = parseInt(document.getElementById('repeatCountInput').value);
    const showHeader = document.getElementById('includeHeaderToggle').checked;
    const tracingEnabled = document.getElementById('includeTracingToggle').checked;
    
    let traceMode = 'none'; 
    if (tracingEnabled) {
        const selectedRadio = document.querySelector('input[name="traceOption"]:checked');
        traceMode = selectedRadio ? selectedRadio.value : 'first';
    }
    
    closeOverlay('printSelectionOverlay');

    if (choice === 'blank') {
        const effectiveReps = showHeader ? 12 : 13;
        runPrintLogic("[BLANK]", "blank", effectiveReps, showHeader, "Pratique de l'écriture", "none");
    } else {
        runPrintLogic(state.tempWordsToPrint, choice === 'cursive', reps, showHeader, state.tempPrintName, traceMode);
    }
}

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

    const words = choice === 'blank' ? "[BLANK]" : state.tempWordsToPrint;
    const isCursive = choice === 'cursive' || choice === 'blank';
    const worksheetHTML = generateWorksheetHTML(words, isCursive, reps, showHeader, state.tempPrintName, traceMode);
    
    // Store data for the final print button in the preview
    state.currentPreviewSettings = { words, isCursive, reps, showHeader, name: state.tempPrintName, traceMode };

    // Hide selection UI, Show Preview UI
    document.getElementById('printSelectionMain').style.display = 'none';
    const previewContainer = document.getElementById('printPreviewContainer');
    previewContainer.style.display = 'block';
    
    const previewArea = document.getElementById('previewSheetArea');
    previewArea.innerHTML = `<div class="worksheet-page-sim">${worksheetHTML}</div>`;

    // DYNAMIC SCALING: Match the width of the container perfectly
    // 210mm is roughly 794px at 96dpi
    const containerWidth = previewArea.clientWidth - 10; // small buffer
    const paperWidth = 794; 
    const scale = Math.min(containerWidth / paperWidth, 1.0);
    previewArea.style.setProperty('--preview-scale', scale);
}

function backToPrintSettings() {
    document.getElementById('printSelectionMain').style.display = 'block';
    document.getElementById('printPreviewContainer').style.display = 'none';
}

function doPrintFromPreview() {
    const s = state.currentPreviewSettings;
    if (!s) return;
    runPrintLogic(s.words, s.isCursive, s.reps, s.showHeader, s.name, s.traceMode);
}

