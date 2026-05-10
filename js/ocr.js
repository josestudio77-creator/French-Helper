/* ==========================================
   js/ocr.js — Worksheet Scanner with Dual-View Editor
   French Helper — OCR + human correction workflow
   =========================================== */

let _ocrWorker = null;
let _ocrLoaded = false;

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

/* ===== Run OCR on an image ===== */
async function _runOCR(imageData) {
    try {
        const worker = await _loadOCR();
        const result = await worker.recognize(imageData);
        return result.data.lines
            .map(l => l.text.trim())
            .filter(t => t.length > 1);
    } catch (e) {
        console.error('[OCR] Failed:', e);
        return [];
    }
}

/* ===== Apply French dictionary corrections ===== */
function _frenchFilter(lines) {
    if (typeof MASTER_DATA === 'undefined') return lines;
    
    return lines.map(line => {
        const words = line.split(/\s+/);
        const corrected = words.map(word => {
            const clean = word.replace(/[.,!?;:]/g, '');
            const match = _findClosestFrench(clean);
            if (match && match !== clean) {
                return word.replace(clean, match);
            }
            return word;
        });
        return corrected.join(' ');
    });
}

function _findClosestFrench(word) {
    const lower = word.toLowerCase();
    if (MASTER_DATA[word] || MASTER_DATA[lower]) return word;
    
    if (typeof norm === 'function') {
        const n = norm(word);
        for (let key in MASTER_DATA) {
            if (norm(key) === n) return key;
        }
    }
    
    // Common OCR fixes: digit/letter confusion
    const fixes = { '0': 'o', '1': 'l', '5': 's', '4': 'a', '3': 'e', '2': 'z' };
    let fixed = lower;
    let changed = false;
    for (let [digit, letter] of Object.entries(fixes)) {
        if (fixed.includes(digit)) { fixed = fixed.replace(new RegExp(digit, 'g'), letter); changed = true; }
    }
    
    if (changed) {
        for (let key in MASTER_DATA) {
            if (norm(key) === norm(fixed)) return key;
        }
    }
    
    return null;
}

/* ===== Open camera and scan ===== */
function openWorksheetScanner() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        _showScanningUI();
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const imageData = evt.target.result;
            state.scannedPhoto = imageData;
            
            const rawLines = await _runOCR(imageData);
            const correctedLines = _frenchFilter(rawLines);
            const text = correctedLines.join('\n');
            
            _showDualView(imageData, text, rawLines.length);
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

/* ===== Scanning UI ===== */
function _showScanningUI() {
    const overlay = document.getElementById('scanOverlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    document.getElementById('ocrProgressBar').style.width = '0%';
    document.getElementById('scanSpinner').style.display = 'flex';
    document.getElementById('scanPreview').style.display = 'none';
    document.getElementById('scanEditor').style.display = 'none';
}

/* ===== Dual-View Editor ===== */
function _showDualView(photoData, ocrText, lineCount) {
    const overlay = document.getElementById('scanOverlay');
    if (!overlay) return;
    
    document.getElementById('scanSpinner').style.display = 'none';
    
    document.getElementById('scanPreview').style.display = 'block';
    document.getElementById('scanPreview').querySelector('img').src = photoData;
    
    document.getElementById('scanEditor').style.display = 'flex';
    document.getElementById('scanTextarea').value = ocrText;
    document.getElementById('scanLineCount').textContent = lineCount + ' line' + (lineCount !== 1 ? 's' : '') + ' detected';
}

/* ===== Import scanned text ===== */
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
    state.scannedPhoto = null;
}

function retakeScanPhoto() {
    closeScanOverlay();
    setTimeout(() => openWorksheetScanner(), 300);
}

/* ===== Expose ===== */
window.WorksheetScanner = {
    openWorksheetScanner,
    closeScanOverlay,
    importScannedText,
    retakeScanPhoto
};
