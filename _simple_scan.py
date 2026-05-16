path = r'C:\Users\JOSE\French-Helper\index.html'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

start = c.find('<!-- Worksheet Scanner Overlay -->')
end = c.find('</div>\n    \n    <div id="printArea">', start)
if end == -1:
    end = c.find('</div>\n\n    <div id="printArea">', start)
old_scan = c[start:end] + '</div>'

new_scan = '''<!-- Worksheet Scanner Overlay -->
<div id="scanOverlay" class="overlay" style="z-index: 30000; display: none;">
    <div class="overlay-content" style="display: flex; flex-direction: column; height: 100vh; max-height: 100vh; background: transparent; box-shadow: none; border-radius: 0;">
        <!-- Header -->
        <div style="background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); padding: 10px 15px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; border-radius: 16px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <button onclick="closeScanOverlay()" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; padding: 5px; color: #4a5568;">\u2190</button>
            <span id="scanHeaderTitle" style="font-weight: 900; color: #2d3748; font-size: 0.95rem;">Crop Text Area</span>
        </div>
        
        <!-- Cropper Area -->
        <div id="scanCropArea" style="flex: 1; overflow: hidden; background: #f1f5f9; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            <img id="scanCropImage" src="" style="max-width: 100%; display: block;">
        </div>
        
        <!-- Scanning spinner -->
        <div id="scanSpinner" style="flex: 1; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">
            <div class="loading-spinner"></div>
            <p style="color: #4a5568; font-weight: 800;">Scanning worksheet...</p>
            <div style="width: 200px; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div id="ocrProgressBar" style="height: 100%; width: 0%; background: #9d4edd; border-radius: 3px; transition: width 0.3s;"></div>
            </div>
        </div>
        
        <!-- Crop Actions -->
        <div id="scanActions" style="display: flex; gap: 10px; flex-shrink: 0; margin-top: 10px;">
            <button onclick="retakeScanPhoto()" style="flex: 1; background: #e2e8f0; color: #4a5568; border: none; border-radius: 14px; padding: 14px; font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">Retake</button>
            <button onclick="WorksheetScanner.scanCroppedArea()" style="flex: 2; background: #9d4edd; color: white; border: none; border-radius: 14px; padding: 14px; font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 3px 0 #7b3eb3;">\U0001F50D Scan Selection</button>
        </div>
    </div>
</div>'''

c = c.replace(old_scan, new_scan, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('Scan overlay simplified to crop + scan only')
