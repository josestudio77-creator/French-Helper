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
    
    // Use PSM 6 (uniform block of text) — better for worksheet phrases than auto (PSM 3)
    await _ocrWorker.setParameters({ tessedit_pageseg_mode: '6' });
    
    _ocrLoaded = true;
    return _ocrWorker;
}

/* ===== Image preprocessing for handwriting OCR ===== */
function _preprocessForOCR(sourceCanvas) {
    try {
        let w = sourceCanvas.width, h = sourceCanvas.height;

        // Skip preprocessing if image is tiny (icons, etc.)
        if (w < 50 || h < 50) return sourceCanvas;

        // --- Cap size for phone performance (800px is plenty for OCR) ---
        const MAX_DIM = 800;
        let scale = 1;
        if (w > MAX_DIM || h > MAX_DIM) {
            scale = MAX_DIM / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        }

        const out = document.createElement('canvas');
        out.width = w; out.height = h;
        const ctx = out.getContext('2d');
        ctx.drawImage(sourceCanvas, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const px = imageData.data;
        const len = px.length;
        const total = w * h;

        // --- Step 1: Grayscale + histogram (single pass) ---
        const gray = new Uint8Array(total);
        const hist = new Uint32Array(256);
        for (let i = 0; i < len; i += 4) {
            // Fast integer grayscale (avoid float math)
            const g = (px[i] * 77 + px[i + 1] * 150 + px[i + 2] * 29) >> 8;
            gray[i >> 2] = g;
            hist[g]++;
        }

        // --- Step 2: Contrast stretch (clip 2% extremes) ---
        let lo = 0, hi = 255;
        let sum = 0;
        const clip = total * 0.02;
        for (let i = 0; i < 256; i++) { sum += hist[i]; if (sum >= clip) { lo = i; break; } }
        sum = 0;
        for (let i = 255; i >= 0; i--) { sum += hist[i]; if (sum >= clip) { hi = i; break; } }
        const range = hi - lo || 1;

        for (let i = 0; i < total; i++) {
            const v = ((gray[i] - lo) * 255) / range;
            gray[i] = v < 0 ? 0 : v > 255 ? 255 : v;
        }

        // --- Step 3: Otsu binarization ---
        const hh = new Float64Array(256);
        for (let i = 0; i < total; i++) hh[gray[i]]++;
        let totalSum = 0;
        for (let i = 0; i < 256; i++) totalSum += i * hh[i];
        let bgSum = 0, bgWeight = 0, bestThresh = 128, bestBetween = 0;
        for (let t = 0; t < 256; t++) {
            bgWeight += hh[t];
            if (bgWeight === 0 || bgWeight === total) continue;
            bgSum += t * hh[t];
            const fgWeight = total - bgWeight;
            const bgMean = bgSum / bgWeight;
            const fgMean = (totalSum - bgSum) / fgWeight;
            const between = bgWeight * fgWeight * (bgMean - fgMean) * (bgMean - fgMean);
            if (between > bestBetween) { bestBetween = between; bestThresh = t; }
        }

        // --- Step 4: Apply Otsu threshold (pure binarization) ---
        for (let i = 0; i < len; i += 4) {
            const v = gray[i >> 2] > bestThresh ? 255 : 0;
            px[i] = px[i + 1] = px[i + 2] = v;
        }

        ctx.putImageData(imageData, 0, 0);
        return out;
    } catch (e) {
        console.warn('[OCR] Preprocessing failed, using raw image:', e);
        return sourceCanvas;
    }
}

/* ===== Cloud OCR via ocr.space (handwriting-optimised) ===== */
async function _runCloudOCR(canvas) {
    const apiKey = localStorage.getItem('ocrSpaceApiKey') || 'helloworld';
    // Strip data URI prefix to get raw base64
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

    const formData = new FormData();
    formData.append('base64Image', 'data:image/jpeg;base64,' + base64);
    formData.append('language', 'fre');
    formData.append('OCREngine', '2');
    formData.append('isTable', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');

    const resp = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'apikey': apiKey },
        body: formData
    });

    if (!resp.ok) throw new Error('OCR service returned ' + resp.status);

    const data = await resp.json();

    if (data.OCRExitCode !== 1) {
        const msg = data.ErrorMessage || 'Unknown OCR error';
        throw new Error(msg);
    }

    const parsed = (data.ParsedResults && data.ParsedResults.length > 0) ? data.ParsedResults[0] : null;
    if (!parsed || parsed.FileParseExitCode !== 1) {
        throw new Error((parsed && parsed.ErrorMessage) || 'OCR could not read the image');
    }

    const text = parsed.ParsedText || '';
    // Split into lines, clean up
    return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
}

/* ===== Run OCR (cloud-first, Tesseract fallback) ===== */
async function _runOCR(rawCanvas) {
    // --- Try cloud OCR first with raw image (best for handwriting) ---
    _showScanningUI('Sending to OCR cloud...');
    try {
        const lines = await _runCloudOCR(rawCanvas);
        if (lines.length > 0) {
            console.log('[OCR] Cloud result:', lines);
            return lines;
        }
    } catch (e) {
        console.warn('[OCR] Cloud failed, falling back to Tesseract:', e.message);
    }

    // --- Offline fallback: preprocess + Tesseract.js ---
    _showScanningUI('Using offline OCR...');
    try {
        const processed = _preprocessForOCR(rawCanvas);
        const worker = await _loadOCR();
        const result = await worker.recognize(processed);
        state.scannedWords = result.data.words.filter(w => w.text.trim().length > 0);
        return result.data.lines.map(l => l.text.trim()).filter(t => t.length > 1);
    } catch (e) {
        console.error('[OCR] Tesseract fallback also failed:', e);
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
    document.getElementById('scanActions').style.display = 'grid';
    
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
    
    document.getElementById('scanActions').style.display = 'none';
    _showScanningUI();
    
    const croppedCanvas = _cropperInstance.getCroppedCanvas({ maxWidth: 1200 });
    if (!croppedCanvas) {
        showToast('Please select an area to scan', 'error');
        return;
    }

    // Save original photo for reference
    state.scannedPhoto = croppedCanvas.toDataURL('image/jpeg', 0.9);
    
    if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }
    
    const rawLines = await _runOCR(croppedCanvas);
    const correctedLines = _frenchFilter(rawLines);
    const text = correctedLines.join('\n');
    
    // Populate homework textarea directly
    const hwInput = document.getElementById('hwInput');
    if (hwInput) {
        const current = hwInput.value.trim();
        hwInput.value = current ? current + '\n' + text : text;
    }
    if (typeof autoPopulateName === 'function') autoPopulateName();
    
    closeScanOverlay();
    showToast('Scanned ' + rawLines.length + ' phrase' + (rawLines.length !== 1 ? 's' : '') + '! Edit if needed.');
}

/* ===== Scanning spinner ===== */
function _showScanningUI(msg) {
    document.getElementById('scanSpinner').style.display = 'flex';
    document.getElementById('scanActions').style.display = 'none';
    document.getElementById('ocrProgressBar').style.width = '0%';
    // Update the scanning message if provided
    const spinnerMsg = document.querySelector('#scanSpinner p');
    if (spinnerMsg && msg) spinnerMsg.textContent = msg;
}

// Dual-view editor removed — OCR populates homework textarea directly


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
    const overlay = document.getElementById('scanOverlay');
    if (overlay) overlay.style.display = 'none';
    if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }
    state.scannedPhoto = null;
    state.scannedWords = null;
}

function retakeScanPhoto() {
    closeScanOverlay();
    setTimeout(() => openWorksheetScanner(), 300);
}

// Lens overlay mode removed — simplified to crop+scan flow
window.WorksheetScanner = {
    openWorksheetScanner, closeScanOverlay,
    importScannedText, retakeScanPhoto,
    scanCroppedArea
};