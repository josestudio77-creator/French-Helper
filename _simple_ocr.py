path = r'C:\Users\JOSE\French-Helper\js\ocr.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace scanCroppedArea to populate hwInput directly
old_scan_crop = '''    const rawLines = await _runOCR(croppedDataUrl);
    const correctedLines = _frenchFilter(rawLines);
    const text = correctedLines.join('\\n');
    
    _showDualView(croppedDataUrl, text, rawLines.length);'''

new_scan_crop = '''    const rawLines = await _runOCR(croppedDataUrl);
    const correctedLines = _frenchFilter(rawLines);
    const text = correctedLines.join('\\n');
    
    // Populate homework textarea directly
    const hwInput = document.getElementById('hwInput');
    if (hwInput) {
        const current = hwInput.value.trim();
        hwInput.value = current ? current + '\\n' + text : text;
    }
    if (typeof autoPopulateName === 'function') autoPopulateName();
    
    closeScanOverlay();
    showToast('Scanned ' + rawLines.length + ' phrase' + (rawLines.length !== 1 ? 's' : '') + '! Edit if needed.');'''

c = c.replace(old_scan_crop, new_scan_crop, 1)

# Remove the dual-view and overlay toggle functions (no longer used)
old_dual = '''
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
}'''

c = c.replace(old_dual, '\n// Dual-view editor removed — OCR populates homework textarea directly\n', 1)

# Remove overlay mode functions
old_overlay = '''
/* ===== OVERLAY MODE ===== */
function toggleOverlayMode() {'''

end_overlay = c.find('window.WorksheetScanner = {', 0)

# Find the start of toggleOverlayMode and replace everything up to the export
idx = c.find(old_overlay)
if idx > 0:
    c = c[:idx] + '\n// Lens overlay mode removed — simplified to crop+scan flow\n' + c[end_overlay:]

# Update expose
old_exp = '''window.WorksheetScanner = {
    openWorksheetScanner, closeScanOverlay,
    importScannedText, retakeScanPhoto,
    toggleOverlayMode, scanCroppedArea
};'''

new_exp = '''window.WorksheetScanner = {
    openWorksheetScanner, closeScanOverlay,
    importScannedText, retakeScanPhoto,
    scanCroppedArea
};'''

c = c.replace(old_exp, new_exp, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('ocr.js: simplified to crop → scan → populate hwInput')
