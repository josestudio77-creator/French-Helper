/* ==========================================
   js/ai.js - AI image generation and photo picker
   French Helper
   =========================================== */

// ===== CUSTOM ICON/PHOTO FUNCTIONS =====
function openIconPicker(phrase) {
    state.currentPickerPhrase = phrase;
    document.getElementById('pickerPhrase').textContent = phrase;
    document.getElementById('emojiInputSection').style.display = 'none';
    document.getElementById('emojiInput').value = '';
    document.getElementById('photoCropperOverlay').style.display = 'none';
    openOverlay('iconPickerOverlay');
}

function openEmojiPicker() {
    // 1. Detect the user's device (Preserved from your previous logic)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
    
    let msg = "";
    
    if (isIOS || isAndroid) {
        msg = "Tap the smiley face (😊) button on your keyboard to browse and pick an emoji!";
    } else if (isMac) {
        msg = "Press Command (⌘) + Control + Space to open the emoji picker!";
    } else {
        msg = "Press the Windows Key + . (period) to open the emoji picker!";
    }
    
    // 2. THE FIX: Use your professional appModal instead of the system alert
    openAppModal({
        title: "😊 Add an Emoji",
        text: msg,
        mode: 'view',
        saveText: "Got it!",
        onAction: () => {
            // 3. When they click "Got it", show the input and trigger the keyboard
            const inputSection = document.getElementById('emojiInputSection');
            const inputField = document.getElementById('emojiInput');
            
            if (inputSection) inputSection.style.display = 'block';
            if (inputField) {
                inputField.value = ''; // Clear previous
                inputField.focus();    // Pop the keyboard
            }
        }
    });
}

function submitEmoji() {
    const emoji = document.getElementById('emojiInput').value.trim();
    if (!emoji) {
        alert('Please type an emoji first!');
        return;
    }
    
    const selectedEmoji = [...emoji][0];
    const normalizedPhrase = norm(state.currentPickerPhrase);
    
    state.customIcons[normalizedPhrase] = selectedEmoji;
    
    if (state.customPhotos[normalizedPhrase]) {
        delete state.customPhotos[normalizedPhrase];
    }
    
    localStorage.setItem('customIcons', JSON.stringify(state.customIcons));
    localStorage.setItem('customPhotos', JSON.stringify(state.customPhotos));
    
    closeOverlay('iconPickerOverlay');
    renderList(state.currentScreenList);
}

function openPhotoPicker() {
    // Clear the input value so selecting the same file triggers change event
    const photoInput = document.getElementById('photoPickerInput');
    photoInput.value = ''; // ← Add this line
    photoInput.click();
}

function resetToDefaultIcon() { 
    const normalizedPhrase = norm(state.currentPickerPhrase);
    
    if (state.customIcons[normalizedPhrase]) delete state.customIcons[normalizedPhrase];
    if (state.customPhotos[normalizedPhrase]) delete state.customPhotos[normalizedPhrase];
    
    localStorage.setItem('customIcons', JSON.stringify(state.customIcons));
    localStorage.setItem('customPhotos', JSON.stringify(state.customPhotos));
    
    closeOverlay('iconPickerOverlay');
    renderList(state.currentScreenList);
}

// ===== CROPPER FUNCTIONS =====
function openPhotoCropper(imageData) {
    state.tempPhotoData = imageData;
    
    // Ensure the loader is hidden when we first open the state.cropper
    const loader = document.getElementById('cropperLoading');
    if (loader) loader.style.display = 'none';

    const redrawGroup = document.getElementById('aiRedrawGroup');
    if (redrawGroup) {
        redrawGroup.style.display = state.isAiMode ? 'flex' : 'none';
        // --- ADDED FIX: Ensure buttons are clickable again ---
        redrawGroup.style.pointerEvents = "auto"; 
        redrawGroup.style.opacity = "1";
    }
    
    closeOverlay('iconPickerOverlay');
    document.getElementById('photoCropperOverlay').style.display = 'block';
    
    const image = document.getElementById('cropperImage');
    
    // 1. SECURITY FIX: Required for AI images (Order matters!)
    image.src = ""; 
    image.crossOrigin = "anonymous"; 
    image.src = imageData;
    
    image.onload = function() {
        if (state.cropper) state.cropper.destroy();
        
        // 2. DETECT NATURAL ORIENTATION (Preserved)
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const imageRatio = naturalWidth / naturalHeight;
        
        // 3. Set the target ratio based on detection (Preserved)
        let detectedRatio = 4/3; 
        if (imageRatio > 1.1) {
            detectedRatio = 4/3; 
            console.log("📷 Landscape image detected");
        } else if (imageRatio < 0.9) {
            detectedRatio = 3/4; 
            console.log("📷 Portrait image detected");
        } else {
            detectedRatio = 1; 
            console.log("📷 Square image detected");
        }
        
        state.currentAspectRatio = detectedRatio;
        
        state.cropper = new Cropper(image, {
            aspectRatio: detectedRatio, 
            viewMode: 1,
            checkCrossOrigin: true, 
            autoCropArea: 0.9,      
            movable: true,
            zoomable: true,
            rotatable: true,
            scalable: false,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            guides: true,
            center: true,
            highlight: true,
            background: true,
            minCropBoxWidth: 100,
            minCropBoxHeight: 100,
            ready() {
                setAspectRatio(detectedRatio);
                console.log('Cropper ready with detected ratio:', detectedRatio);
            }
        });
    };
}

function cancelCrop() {
    // 1. KILL THE AI TASK IMMEDIATELY
    // This prevents the image from "popping up" later if you already left the screen
    if (state.aiAbortController) {
        state.aiAbortController.abort();
        state.aiAbortController = null;
    }

    // 2. Standard Cropper Cleanup
    // Frees up device memory
    if (state.cropper) {
        state.cropper.destroy();
        state.cropper = null;
    }
    
    // 3. Reset UI States
    // Ensures AI specific buttons don't show up on normal photos
    state.isAiMode = false;
    
    // Hide the specific state.cropper loader if it was active
    const loader = document.getElementById('cropperLoading');
    if (loader) loader.style.display = 'none';
    
    // Hide the specific redraw buttons container
    const redrawGroup = document.getElementById('aiRedrawGroup');
    if (redrawGroup) redrawGroup.style.display = 'none';
    
    // 4. Close the window and unlock scroll (Preserved)
    // Uses your established navigation logic
    closeOverlay('photoCropperOverlay');
}

function saveCroppedPhoto() {
    if (!state.cropper) return;
    
    let outputWidth, outputHeight;
    let orientation;
    let customRatio = null; 
    const TARGET_HEIGHT = 600; // We anchor everything to this height
    
    const cropData = state.cropper.getData();
    const actualRatio = cropData.width / cropData.height;

    if (state.currentAspectRatio === 0) {
        // FREE CROP: Anchor height at 600, calculate width proportionally
        outputHeight = TARGET_HEIGHT;
        outputWidth = Math.round(TARGET_HEIGHT * actualRatio);
        customRatio = actualRatio;
        console.log(`Free crop saved: Ratio ${customRatio}, Dimensions ${outputWidth}x${outputHeight}`);
    } 
    else if (Math.abs(state.currentAspectRatio - 1) < 0.01) {
        // SQUARE
        outputHeight = TARGET_HEIGHT;
        outputWidth = TARGET_HEIGHT;
        customRatio = 1;
    }
    else if (Math.abs(state.currentAspectRatio - 0.75) < 0.01) {
        // PORTRAIT (3/4)
        outputHeight = TARGET_HEIGHT;
        outputWidth = Math.round(TARGET_HEIGHT * 0.75); // 450
        customRatio = 0.75;
    }
    else {
        // LANDSCAPE (4/3)
        outputHeight = Math.round(TARGET_HEIGHT * 0.75); // 450
        outputWidth = TARGET_HEIGHT; // 600
        customRatio = 1.333;
    }
    
    // Determine CSS orientation class
    if (Math.abs(outputWidth - outputHeight) < 10) orientation = 'square';
    else if (outputWidth > outputHeight) orientation = 'landscape';
    else orientation = 'portrait';
    
    const canvas = state.cropper.getCroppedCanvas({
        width: outputWidth,
        height: outputHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.6);
    const normalizedPhrase = norm(state.currentPickerPhrase);
    
    state.customPhotos[normalizedPhrase] = {
        data: croppedImageData,
        orientation: orientation,
        isFreeCrop: state.currentAspectRatio === 0,
        customRatio: customRatio // Stored for rendering
    };
    
    if (state.customIcons[normalizedPhrase]) delete state.customIcons[normalizedPhrase];
    
    localStorage.setItem('customPhotos', JSON.stringify(state.customPhotos));
    localStorage.setItem('customIcons', JSON.stringify(state.customIcons));
    
    state.cropper.destroy();
    state.cropper = null;
    document.getElementById('photoCropperOverlay').style.display = 'none';
    renderList(state.currentScreenList);
}

// Update photo picker to use state.cropper
document.getElementById('photoPickerInput').addEventListener('change', function(e) {
    state.isAiMode = false; // Disable AI refresh button for local photos
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Photo is too large! Please choose a smaller photo (under 5MB).');
        this.value = ''; // Clear so they can try again
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        openPhotoCropper(event.target.result);
    };
    reader.readAsDataURL(file);
});

function setAspectRatio(ratio) {
    state.currentAspectRatio = ratio;
    
    // If ratio is 0, we set it to NaN (Free Crop)
    if (state.cropper) state.cropper.setAspectRatio(ratio === 0 ? NaN : ratio);
    
    // Update button UI visuals
    document.querySelectorAll('.aspect-ratio-btn').forEach(btn => {
btn.classList.remove('active');
    });
    
    if (ratio === 1) {
document.getElementById('ratio-square').classList.add('active');
    } else if (ratio === 0) {
document.getElementById('ratio-free').classList.add('active');
    } else if (ratio > 1) {
// Any ratio greater than 1 (like 4/3 or 16/9) counts as landscape
document.getElementById('ratio-landscape').classList.add('active');
    } else if (ratio < 1) {
// Any ratio less than 1 (like 3/4) counts as portrait
document.getElementById('ratio-portrait').classList.add('active');
    }
}

function toggleAiPreference() {
    // Switch between the two models
    state.preferredAiModel = (state.preferredAiModel === 'imagen-4') ? 'flux' : 'imagen-4';
    
    // Save the choice so it's remembered even if the phone restarts
    localStorage.setItem('preferredAiModel', state.preferredAiModel);
    
    // Update the button text and color so the parent sees the change
    updateAiBtnUI();
    
    // Optional: tiny haptic feedback for mobile users
    if (navigator.vibrate) navigator.vibrate(10);
}

// 2. The function that handles the visual look of the button
function updateAiBtnUI() {
    const btn = document.getElementById('btnToggleAi');
    if (!btn) return;
    
    if (state.preferredAiModel === 'imagen-4') {
btn.innerHTML = '<span>🤖</span> Default AI: Quality (Imagen-4)';
btn.style.background = '#8B5CF6'; // Purple for Quality
    } else {
btn.innerHTML = '<span>⚡</span> Default AI: Speed (Flux)';
btn.style.background = '#06B6D4'; // Cyan for Speed
    }
}

function cancelIconPicker() {
    // This is the "Stop" signal that your generateAIImage is waiting for
    if (state.aiAbortController) {
state.aiAbortController.abort(); // This makes 'signal.aborted' true
state.aiAbortController = null;
console.log("🛑 AI Task killed by user");
    }
    
    // Hide the loading status immediately
    const loader = document.getElementById('aiLoadingStatus');
    if (loader) loader.style.display = 'none';

    // Reset the main Generate button state
    const genBtn = document.getElementById('btnAiGen');
    if (genBtn) {
genBtn.disabled = false;
genBtn.style.opacity = "1";
genBtn.innerHTML = "<span>🤖</span> Generate AI Image";
    }

    // Close the window
    closeOverlay('iconPickerOverlay');
}

async function generateAIImage(isRefresh = false, modelOverride = null) {
    // 1. DYNAMIC UI TARGETING (Full Logic Preserved)
    const btn = isRefresh ? document.getElementById('aiRedrawGroup') : document.getElementById('btnAiGen');
    const loader = isRefresh ? document.getElementById('cropperLoading') : document.getElementById('aiLoadingStatus');
    const phrase = state.currentPickerPhrase;
    
    if (!phrase) return;
    state.isAiMode = true; 

    // INITIALIZE KILL-SWITCH (Preserved)
    if (state.aiAbortController) state.aiAbortController.abort(); 
    state.aiAbortController = new AbortController();
    const signal = state.aiAbortController.signal;

    // 2. Setup UI State (Preserved & Fixed for clickability)
    if (isRefresh) {
// Disable the whole group container during redraw
btn.style.pointerEvents = "none";
btn.style.opacity = "0.5";
    } else {
btn.disabled = true;
btn.style.opacity = "0.5";
    }

    if (loader) loader.style.display = isRefresh ? "flex" : "block";
    
    if (!isRefresh) {
btn.innerHTML = "<span>🎨</span> Drawing...";
    }
    
    const loaderText = loader?.querySelector('p') || loader;
    if (loaderText) {
loaderText.innerHTML = 'AI is drawing... <span style="font-size:0.7rem; opacity:0.8;">(preparing)</span>';
    }

    const data = getCardData(phrase);
    let englishWord = (data.en && data.en !== "...") ? data.en : phrase;
    englishWord = englishWord.replace(/^(a|an|the|le|la|un|une|l'|le |la |des |du |de la )\s+/i, "").trim();

    // 3. --- FULL EXPANDED VISUAL MAPPING (Preserved 100%) ---
    let visualDescription = englishWord;
    const lowerWord = englishWord.toLowerCase();
    
    const visualMap = {
'thank': 'person with grateful expression, hands on heart',
'thanks': 'person with grateful expression, hands on heart',
'merci': 'person with grateful expression, hands on heart',
'hello': 'person waving hand with friendly smile',
'bonjour': 'person waving hand with friendly smile',
'hi': 'person waving hand',
'goodbye': 'person waving goodbye',
'au revoir': 'person waving goodbye',
'bye': 'person waving hand',
'please': 'hands pressed together in a polite gesture',
'sorry': 'person looking apologetic, hand on chest',
'pardon': 'person looking apologetic, hand on chest',
'welcome': 'person opening arms in a welcoming gesture',
'friend': 'two children playing together happily',
'ami': 'two children playing together happily',
'family': 'parent and child holding hands',
'famille': 'parent and child holding hands',
'school': 'children sitting at desks learning',
'école': 'children sitting at desks learning',
'teacher': 'adult standing by a chalkboard teaching',
'professeur': 'adult standing by a chalkboard teaching',
'student': 'child holding a book and smiling',
'élève': 'child holding a book and smiling',
'sleep': 'person peacefully sleeping, eyes closed',
'dormir': 'person peacefully sleeping, eyes closed',
'eat': 'person enjoying a meal',
'manger': 'person enjoying a meal',
'run': 'child running fast in a park',
'courir': 'child running fast in a park',
'jump': 'child jumping high with joy',
'sauter': 'child jumping high with joy',
'read': 'child sitting and reading a colorful book',
'lire': 'child sitting and reading a colorful book',
'write': 'hand holding a pencil writing on paper',
'écrire': 'hand holding a pencil writing on paper',
'listen': 'person pointing to ear with a listening expression',
'écouter': 'person pointing to ear with a listening expression',
'love': 'two red hearts intertwined',
'amour': 'two red hearts intertwined',
'happy': 'very happy smiling face with bright eyes',
'heureux': 'very happy smiling face with bright eyes',
'sad': 'person looking sad with a frown',
'triste': 'person looking sad with a frown',
'work': 'person busy writing at a desk',
'travail': 'person busy writing at a desk'
    };
    
    for (const [key, value] of Object.entries(visualMap)) {
if (lowerWord.includes(key)) {
    visualDescription = value;
    break;
}
    }

    const seed = Math.floor(Math.random() * 10000000);
    const API_KEY = 'pk_SrGFJfhef0swTvS2';
    
    // 4. MODEL SELECTION (Quality vs Speed)
    const selectedModel = modelOverride || state.preferredAiModel;
    const fallbackModel = (selectedModel === 'imagen-4') ? 'flux' : 'imagen-4';

    // 5. THE PROMPT FACTORY: This is what stops Flux from writing "NO LETTERS"
    function getModelPrompt(modelName, subject) {
if (modelName === 'flux') {
    // FLUX FIX: Use purely artistic descriptions. Never mention "Text" or "Letters".
    return `A high quality 3D cute clay ${subject} illustration, centered, vibrant colors, clean white background, minimalist educational style, professional illustration, masterpiece`;
} else {
    // IMAGEN-4: Is smart enough to follow negative instructions.
    return `Create an image with ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS. Show a clear, realistic ${subject} on white background, educational style, detailed, accurate colors. CRITICAL: NO WRITTEN TEXT.`;
}
    }

    const negativePrompt = 'text, words, letters, typography, caption, label, watermark, signature, written content, handwriting, font, characters, alphabet';
    const encodedNegative = encodeURIComponent(negativePrompt);

    // 6. ATTEMPT 1: PRIMARY MODEL
    try {
if (loaderText) loaderText.innerHTML = `AI is drawing... <span style="font-size:0.7rem; opacity:0.8;">(${selectedModel})</span>`;

const activePrompt = getModelPrompt(selectedModel, visualDescription);
const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(activePrompt)}?width=512&height=512&model=${selectedModel}&nologo=true&seed=${seed}&negative_prompt=${encodedNegative}`;

const response = await fetch(imageUrl, { 
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    signal: signal 
});

if (!response.ok) throw new Error(`${selectedModel} failed`);

const blob = await response.blob();
if (signal.aborted) return;

const reader = new FileReader();
const base64data = await new Promise((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

if (!signal.aborted) {
    openPhotoCropper(base64data);
    resetUI();
}
return;

    } catch (error) {
if (error.name === 'AbortError') return;
console.warn(`${selectedModel} failed, trying fallback model ${fallbackModel}`);

// 7. ATTEMPT 2: FALLBACK MODEL
try {
    if (loaderText) loaderText.innerHTML = `AI is drawing... <span style="font-size:0.7rem; opacity:0.8;">(${fallbackModel})</span>`;
    
    // Generate prompt specific to the fallback model
    const fallbackPrompt = getModelPrompt(fallbackModel, visualDescription);
    const fallbackUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(fallbackPrompt)}?width=512&height=512&model=${fallbackModel}&nologo=true&seed=${seed}&negative_prompt=${encodedNegative}`;
    
    const fbResponse = await fetch(fallbackUrl, { 
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        signal: signal 
    });
    
    if (!fbResponse.ok) throw new Error(`${fallbackModel} failed`);
    
    const fbBlob = await fbResponse.blob();
    if (signal.aborted) return;

    const reader = new FileReader();
    const fbBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fbBlob);
    });
    
    if (!signal.aborted) {
        openPhotoCropper(fbBase64);
        resetUI();
    }
    
} catch (fbError) {
    if (fbError.name === 'AbortError') return;
    resetUI("The AI server is very busy. Please wait 3 seconds and try again!");
}
    }

    // 8. UI Reset Helper (FIXED: Added pointer-events restoration)
    function resetUI(msg) {
if (msg) alert(msg);
const redrawGroup = document.getElementById('aiRedrawGroup');
if (isRefresh) {
    redrawGroup.style.pointerEvents = "auto";
    redrawGroup.style.opacity = "1";
} else {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerHTML = "<span>🤖</span> Generate AI Image";
}
if (loader) loader.style.display = "none";
    }
}

