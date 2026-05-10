/* ==========================================
   js/ocr.js — Worksheet Scanner with Crop + Overlay
   French Helper — OCR + human correction workflow
   =========================================== */

let _ocrWorker = null;
let _ocrLoaded = false;
let _cropperInstance = null;

/* ===== Load Tesseract (lazy, on first use) ===== */
async function _loadOCR() {
    if (_ocrLoaded && _ocrWorker) return _ocrWorker;
    
    if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load Tesseract'));
            document.head.appendChild(s);
        });
    }
    
    _ocrWorker = await Tesseract.createWorker('fra', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                const bar = document.getElementById('ocrProgressBar');
                if (bar) bar.style.width = Math.round(m.progress * 100) + '%';
            }
        }
    });
    
    _ocrLoaded = true;
    return _ocrWorker;
}

/* ===== Run OCR ===== */
async function _runOCR(imageData) {
    try {
        const worker = await _loadOCR();
        const result = await worker.recognize(imageData);
        // Store bounding boxes for overlay mode
        state.scannedWords = result.data.words.filter(w => w.text.trim().length > 0);
        return result.data.lines.map(l => l.text.trim()).filter(t => t.length > 1);
    } catch (e) {
        console.error('[OCR] Failed:', e);
        return [];
    }
}

/* ===== French dictionary corrections ===== */
function _frenchFilter(lines) {
    if (typeof MASTER_DATA === 'undefined') return lines;
    return lines.map(line => {
        const words = line.split(/\s+/);
        const corrected = words.map(word => {
            const clean = word.replace(/[.,!?;:]/g, '');
            const match = _findClosestFrench(clean);
            return match && match !== clean ? word.replace(clean, match) : word;
        });
        return corrected.join(' ');
    });
}

function _findClosestFrench(word) {
    const lower = word.toLowerCase();
    if (MASTER_DATA[word] || MASTER_DATA[lower]) return word;
    if (typeof norm === 'function') {
        const n = norm(word);
        for (let key in MASTER_DATA) { if (norm(key) === n) return key; }
    }
    const fixes = {'0':'o','1':'l','5':'s','4':'a','3':'e','2':'z'};
    let fixed = lower, changed = false;
    for (let [d,l] of Object.entries(fixes)) {
        if (fixed.includes(d)) { fixed = fixed.replace(new RegExp(d,'g'), l); changed = true; }
    }
    if (changed && typeof norm === 'function') {
        for (let key in MASTER_DATA) { if (norm(key) === norm(fixed)) return key; }
    }
    return null;
}

/* ===== STEP 1: Open camera → show cropper ===== */
function openWorksheetScanner() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            _showCropper(evt.target.result);
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

/* ===== STEP 2: Show cropper overlay ===== */
function _showCropper(imageData) {
    const overlay = document.getElementById('scanOverlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    document.getElementById('scanSpinner').style.display = 'none';
    document.getElementById('scanDualView').style.display = 'none';
    document.getElementById('scanCropArea').style.display = 'flex';
    document.getElementById('scanActions').style.display = 'flex';
    document.getElementById('scanHeaderTitle').textContent = 'Crop Text Area';
    
    // Destroy old cropper
    if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }
    
    const img = document.getElementById('scanCropImage');
    img.src = imageData;
    
    img.onload = () => {
        _cropperInstance = new Cropper(img, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
    };
}

/* ===== STEP 3: User taps Scan → crop + OCR ===== */
async function scanCroppedArea() {
    if (!_cropperInstance) return;
    
    document.getElementById('scanCropArea').style.display = 'none';
    document.getElementById('scanActions').style.display = 'none';
    _showScanningUI();
    
    const croppedCanvas = _cropperInstance.getCroppedCanvas({ maxWidth: 1200 });
    if (!croppedCanvas) {
        showToast('Please select an area to scan', 'error');
        return;
    }
    
    const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
    state.scannedPhoto = croppedDataUrl;
    
    if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }
    
    const rawLines = await _runOCR(croppedDataUrl);
    const correctedLines = _frenchFilter(rawLines);
    const text = correctedLines.join('\n');
    
    _showDualView(croppedDataUrl, text, rawLines.length);
}

/* ===== Scanning spinner ===== */
function _showScanningUI() {
    document.getElementById('scanSpinner').style.display = 'flex';
    document.getElementById('scanDualView').style.display = 'none';
    document.getElementById('scanHeaderTitle').textContent = 'Scanning...';
    document.getElementById('ocrProgressBar').style.width = '0%';
}

/* ===== STEP 4: Dual-View Editor ===== */
function _showDualView(photoData, ocrText, lineCount) {
    document.getElementById('scanSpinner').style.display = 'none';
    document.getElementById('scanDualView').style.display = 'flex';
    document.getElementById('scanHeaderTitle').textContent = 'Scan Results';
    
    document.getElementById('scanPreview').style.display = 'block';
    document.getElementById('scanPreview').querySelector('img').src = photoData;
    
    document.getElementById('scanTextOverlay').style.display = 'none';
    document.getElementById('scanEditor').style.display = 'flex';
    document.getElementById('scanTextarea').value = ocrText;
    document.getElementById('scanLineCount').textContent = lineCount + ' line' + (lineCount !== 1 ? 's' : '') + ' detected';
}

/* ===== Import ===== */
function importScannedText() {
    const text = document.getElementById('scanTextarea').value.trim();
    if (!text) return;
    
    const hwInput = document.getElementById('hwInput');
    const current = hwInput.value.trim();
    hwInput.value = current ? current + '\n' + text : text;
    
    if (typeof autoPopulateName === 'function') autoPopulateName();
    
    const count = text.split('\n').filter(l => l.trim()).length;
    showToast('Imported ' + count + ' phrase' + (count !== 1 ? 's' : ''));
    closeScanOverlay();
}

function closeScanOverlay() {
    document.getElementById('scanOverlay').style.display = 'none';
    if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }
    state.scannedPhoto = null;
    state.scannedWords = null;
}

function retakeScanPhoto() {
    closeScanOverlay();
    setTimeout(() => openWorksheetScanner(), 300);
}

/* ===== OVERLAY MODE ===== */
function toggleOverlayMode() {
    const preview = document.getElementById('scanPreview');
    const overlay = document.getElementById('scanTextOverlay');
    const editor = document.getElementById('scanEditor');
    
    if (!state.scannedWords || state.scannedWords.length === 0) {
        showToast('No word positions available for overlay', 'error');
        return;
    }
    
    if (overlay.style.display === 'none' || !overlay.style.display) {
        editor.style.display = 'none';
        overlay.style.display = 'block';
        _renderTextOverlay();
    } else {
        overlay.style.display = 'none';
        editor.style.display = 'flex';
    }
}

function _renderTextOverlay() {
    const overlay = document.getElementById('scanTextOverlay');
    const img = document.getElementById('scanPreview').querySelector('img');
    if (!overlay || !img || !state.scannedWords) return;
    
    overlay.innerHTML = '';
    const displayWidth = img.clientWidth;
    const naturalWidth = img.naturalWidth;
    const scale = displayWidth / (naturalWidth || displayWidth);
    
    state.scannedWords.forEach(word => {
        const bbox = word.bbox;
        if (!bbox) return;
        
        const span = document.createElement('span');
        span.className = 'ocr-word-overlay';
        span.textContent = word.text;
        const h = Math.max(16, (bbox.y1 - bbox.y0) * scale);
        span.style.cssText = 
            'position:absolute;' +
            'left:' + (bbox.x0 * scale) + 'px;' +
            'top:' + (bbox.y0 * scale) + 'px;' +
            'width:' + ((bbox.x1 - bbox.x0) * scale) + 'px;' +
            'height:' + h + 'px;' +
            'font-size:' + (h * 0.65) + 'px;' +
            'line-height:' + h + 'px;';
        
        span.onclick = () => {
            const newText = prompt('Correct this word:', word.text);
            if (newText !== null) {
                span.textContent = newText;
                _updateScanText(word.text, newText);
            }
        };
        
        overlay.appendChild(span);
    });
    
    overlay.style.height = (img.naturalHeight * scale) + 'px';
}

function _updateScanText(oldWord, newWord) {
    const textarea = document.getElementById('scanTextarea');
    if (textarea) textarea.value = textarea.value.replace(oldWord, newWord);
    if (state.scannedWords) {
        const w = state.scannedWords.find(w => w.text === oldWord);
        if (w) w.text = newWord;
    }
}

window.WorksheetScanner = {
    openWorksheetScanner, closeScanOverlay,
    importScannedText, retakeScanPhoto,
    toggleOverlayMode, scanCroppedArea
};
