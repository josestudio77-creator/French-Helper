/* ==========================================
   js/homework.js - Backpack and homework management
   French Helper
   =========================================== */

    function shareWeek(weekName, wordsText, audioData = null) {
console.log('🟢 SHARE FUNCTION STARTED');
console.log('weekName:', weekName);

const phraseList = wordsText.split('\n').filter(p => p.trim() !== "");
let existingData = { month: state.selectedBpMonth, isDialogue: false };
try { existingData = JSON.parse(state.history[weekName]); } catch(e) {}
    
const specificNote = (state.homeworkNotes && state.homeworkNotes[weekName]) ? state.homeworkNotes[weekName] : "";
const hIcons = {}, hPhotos = {};
phraseList.forEach(phrase => {
    const n = norm(phrase);
    if (state.customIcons[n]) hIcons[n] = state.customIcons[n];
    if (state.customPhotos[n]) hPhotos[n] = state.customPhotos[n];
});
    
// ✅ BUILD SUMMARY
let summary = `📝 ${phraseList.length} phrases`;
if (Object.keys(hIcons).length > 0) summary += `\n😊 ${Object.keys(hIcons).length} icons`;
if (Object.keys(hPhotos).length > 0) summary += `\n📷 ${Object.keys(hPhotos).length} photos`;
if (specificNote) summary += `\n💬 Includes personal note`;
if (audioData) summary += `\n🎤 Includes teacher recording`;
    
openAppModal({
    title: `📤 Share: ${weekName}`,
    text: summary,
    mode: 'view', 
    actionText: "📤 Share Now",
    onAction: () => {
        if (audioData || Object.keys(hPhotos).length > 0) {
            const data = {
                history: { [weekName]: JSON.stringify({ words: wordsText, audio: audioData, month: existingData.month, isDialogue: existingData.isDialogue, isFavorite: false, date: new Date().toISOString() })},
                homeworkNotes: { [weekName]: specificNote },
                cache: state.cache, customIcons: hIcons, customPhotos: hPhotos
            };
            attemptFileShare(JSON.stringify(data), `${weekName.replace(/\s+/g, '_')}.json`, `🇫🇷 Homework: ${weekName}`);
        } else {
            const weekData = { name: weekName, words: wordsText, month: existingData.month, isDialogue: existingData.isDialogue, note: specificNote, isFavorite: false, hasAudio: false, customIcons: hIcons };
            const encoded = btoa(encodeURIComponent(JSON.stringify(weekData)));
            const url = `https://josestudio77-creator.github.io/French-Helper/#import=${encoded}`;
            if (navigator.share) navigator.share({ title: weekName, text: `🇫🇷 French Fun - ${weekName}\n\n✨ Import: ${url}` });
            else prompt('Copy link:', url);
        }
    }
});
    }

function shareAllWeeks() {
    if (!state.history || Object.keys(state.history).length === 0) return openAppModal({ title: 'Notice', text: 'No weeks to share!', mode: 'view' });
    
    const hwCount = Object.keys(state.history).length;
    const photoCount = Object.keys(state.customPhotos).length;
    const noteCount = Object.keys(state.homeworkNotes).length;

    // ✅ BUILD SUMMARY
    let summary = `🎒 Full Backpack Backup\n📚 ${hwCount} homework sets\n📷 ${photoCount} custom photos\n📝 ${noteCount} notes`;

    openAppModal({
            title: "📦 Create Full Backup",
            text: summary,
            mode: 'view',
            actionText: "💾 Save Backup",
            onAction: () => {
                const data = { history: state.history, cache: state.cache, customIcons: state.customIcons, customPhotos: state.customPhotos, wins: state.wins, losses: state.losses, speechSpeed: state.speechSpeed, homeworkNotes: state.homeworkNotes, appVersion: "French Phrases Helper" };
                attemptFileShare(JSON.stringify(data), `french-fun-full-backup.json`, '🇫🇷 French Fun Full Backup');
            }
        });
}

function executeImportProcess(finalName, weekData) {
    state.currentWeekAudio = null; 
    localStorage.removeItem('currentWeekAudio');
    displayAudioPlayer();

    const hwData = {
        words: weekData.words,
        audio: null, 
        isDialogue: weekData.isDialogue || false,
        month: (weekData.month !== undefined) ? weekData.month : new Date().getMonth(), 
        isFavorite: false,
        date: new Date().toISOString()
    };
    
    state.history[finalName] = JSON.stringify(hwData);
    localStorage.setItem('frenchHistory', JSON.stringify(state.history));

    if (weekData.note) {
        if (!state.homeworkNotes) state.homeworkNotes = {};
        state.homeworkNotes[finalName] = weekData.note;
        localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
    }
    
    document.getElementById('hwInput').value = weekData.words;
    localStorage.setItem('homeworkPhrases', weekData.words);
    
    if (weekData.customIcons) {
        const phraseList = weekData.words.split('\n').map(w => norm(w.trim()));
        Object.keys(weekData.customIcons).forEach(key => {
            if (phraseList.includes(key) || phraseList.some(p => p === key)) {
                state.customIcons[key] = weekData.customIcons[key];
            }
        });
        localStorage.setItem('customIcons', JSON.stringify(state.customIcons));
    }

    if (weekData.cache) {
        const phraseList = weekData.words.split('\n').map(w => norm(w.trim()));
        Object.keys(weekData.cache).forEach(key => {
            if (phraseList.includes(key)) state.cache[key] = weekData.cache[key];
        });
        localStorage.setItem('phraseTranslations', JSON.stringify(state.cache));
    }
    
    if (weekData.customPhotos) {
        const phraseList = weekData.words.split('\n').map(w => norm(w.trim()));
        Object.keys(weekData.customPhotos).forEach(key => {
            if (phraseList.includes(key) || phraseList.some(p => p === key)) {
                state.customPhotos[key] = weekData.customPhotos[key];
            }
        });
        localStorage.setItem('customPhotos', JSON.stringify(state.customPhotos));
    }
    
    state.currentSetName = finalName;
    localStorage.setItem('currentSetName', finalName);
    
    translateIfNeeded(weekData.words, false).then(() => {
        renderList(weekData.words.split('\n').filter(w => w.trim()));
    });

    // CLEAR THE HASH AFTER IMPORT
    window.history.replaceState(null, document.title, window.location.pathname);
    
    openBP();

    setTimeout(() => {
        openAppModal({
            title: "✅ Import Complete",
            text: `"${finalName}" has been added to your backpack!`,
            mode: 'view',
            simpleSuccess: true
        });
    }, 500);
}

function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.history) throw new Error('Invalid format');

            const incomingKeys = Object.keys(data.history);
            const count = incomingKeys.length;
            
            let modalTitle = "📥 Import File";
            let detailedStats = "";
            let targetMonthIndex = state.selectedBpMonth; 
            const nameList = incomingKeys.map(name => `• ${name}`).join('\n');

            // 1. Detect Duplicates
            let existingCount = 0;
            incomingKeys.forEach(name => {
                if (state.history[name]) existingCount++;
            });

            const incomingNoteCount = data.homeworkNotes ? Object.keys(data.homeworkNotes).length : 0;

            // 2. Build Summary (Scenario Logic preserved)
            if (count === 1) {
                const firstKey = incomingKeys[0];
                modalTitle = `📥 Import Homework: ${firstKey}`;
                let phraseCount = 0;
                try {
                    const item = typeof data.history[firstKey] === 'string' ? JSON.parse(data.history[firstKey]) : data.history[firstKey];
                    phraseCount = item.words.split('\n').filter(p => p.trim()).length;
                    if (item.month !== undefined) targetMonthIndex = item.month;
                } catch(e) { phraseCount = "?"; }
                
                detailedStats = `📝 ${phraseCount} phrases\n`;
                if (data.customIcons && Object.keys(data.customIcons).length > 0) detailedStats += `😊 Custom icons included\n`;
                if (data.customPhotos && Object.keys(data.customPhotos).length > 0) detailedStats += `📷 Custom photos included\n`;
                if (incomingNoteCount > 0) detailedStats += `💬 Includes a personal note\n`;

            } else {
                let monthsFound = new Set();
                let totalPhrases = 0;
                incomingKeys.forEach(k => {
                    try {
                        const item = typeof data.history[k] === 'string' ? JSON.parse(data.history[k]) : data.history[k];
                        if (item.month !== undefined) monthsFound.add(item.month);
                        if (item.words) totalPhrases += item.words.split('\n').filter(p => p.trim()).length;
                    } catch(e) {}
                });
                
                const totalIcons = data.customIcons ? Object.keys(data.customIcons).length : 0;
                const totalPhotos = data.customPhotos ? Object.keys(data.customPhotos).length : 0;

                if (monthsFound.size === 1) {
                    const monthIdx = Array.from(monthsFound)[0];
                    targetMonthIndex = monthIdx;
                    modalTitle = `📥 Import ${monthNames[monthIdx]} Homeworks`;
                    detailedStats = `📁 Folder: ${monthNames[monthIdx]}\n`;
                } else {
                    modalTitle = "📥 Import Full Backup";
                }
                
                detailedStats += `📚 ${count} homework sets\n`;
                detailedStats += `📝 ${totalPhrases} total phrases\n`;
                if (totalIcons > 0) detailedStats += `😊 ${totalIcons} icons included\n`;
                if (totalPhotos > 0) detailedStats += `📷 ${totalPhotos} photos included\n`;
                if (incomingNoteCount > 0) detailedStats += `💬 ${incomingNoteCount} personal notes included\n`;
            }

            detailedStats += `\n📦 Included:\n${nameList}\n\nAdd these to your backpack?`;

            // 3. SHOW INITIAL MODAL
            openAppModal({
                title: modalTitle,
                text: detailedStats,
                mode: 'view',
                saveText: "Continue",
                cancelText: "Cancel",
                onAction: () => {
                    // IF NO DUPLICATES: Import immediately
                    if (existingCount === 0) {
                        performActualImport(data, incomingKeys, true, targetMonthIndex);
                    } 
                    // IF DUPLICATES FOUND: Show the Conflict Resolver
                    else {
                        closeOverlay('appModal');
                        setTimeout(() => {
                            openAppModal({
                                title: "⚠️ Conflicts Found",
                                text: `${existingCount} of these items already exist in your backpack.\n\nWhat would you like to do?`,
                                mode: 'view',
                                saveText: "🔄 Replace All",
                                cancelText: "⏭️ Skip Duplicates",
                                onAction: () => performActualImport(data, incomingKeys, true, targetMonthIndex), // Overwrite = true
                                onSecondaryAction: () => performActualImport(data, incomingKeys, false, targetMonthIndex) // Overwrite = false
                            });
                        }, 300);
                    }
                },
                onSecondaryAction: () => closeOverlay('appModal')
            });

        } catch (error) {
            openAppModal({ title: 'Error', text: '❌ Failed to read file.', mode: 'view' });
        }
    };
    input.click();
}

       // SURGICAL HELPER: The actual engine that saves the data
function performActualImport(data, incomingKeys, overwrite, targetMonthIndex) {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    incomingKeys.forEach(name => {
        if (state.history[name]) {
            if (overwrite) {
                updatedCount++;
                state.history[name] = data.history[name];
                if (data.homeworkNotes && data.homeworkNotes[name]) {
                    state.homeworkNotes[name] = data.homeworkNotes[name];
                }
            } else {
                skippedCount++;
            }
        } else {
            importedCount++;
            state.history[name] = data.history[name];
            if (data.homeworkNotes && data.homeworkNotes[name]) {
                state.homeworkNotes[name] = data.homeworkNotes[name];
            }
        }
    });

    // Merge Assets (icons/photos/state.cache)
    if (data.cache) Object.assign(state.cache, data.cache);
    if (data.customIcons) Object.assign(state.customIcons, data.customIcons);
    if (data.customPhotos) Object.assign(state.customPhotos, data.customPhotos);

    // Save to local storage
    localStorage.setItem('frenchHistory', JSON.stringify(state.history));
    localStorage.setItem('phraseTranslations', JSON.stringify(state.cache));
    localStorage.setItem('customIcons', JSON.stringify(state.customIcons));
    localStorage.setItem('customPhotos', JSON.stringify(state.customPhotos));
    localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
    setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
    
    // Set the backpack's month tracker to the new month
    state.selectedBpMonth = targetMonthIndex;
    
    let resultMsg = `Import Complete!\n✅ ${importedCount} new items added.`;
    if (updatedCount > 0) resultMsg += `\n🔄 ${updatedCount} items replaced.`;
    if (skippedCount > 0) resultMsg += `\n⏭️ ${skippedCount} items skipped.`;

    openAppModal({
        title: "✅ Success",
        text: resultMsg,
        mode: 'view',
        saveText: "Go to Backpack",
        onAction: () => {
            console.log('🔍 Go to Backpack callback executing');
            
            // 1. Close the parent drawer that was underneath
            closeOverlay('parentDrawer');
            
            // 2. Delay slightly to allow Parent Drawer to slide away
            setTimeout(() => {
                // 3. Open the Backpack (openOverlay automatically calls openBP())
                openOverlay('bpModal');
            }, 150);
        }
    });
}

function checkForImport() {
    const hash = window.location.hash;
    if (hash.startsWith('#import=')) {
try {
    const encodedData = hash.substring(8);
    const decodedData = decodeURIComponent(atob(encodedData));
    const weekData = JSON.parse(decodedData);
    
    const iconCount = weekData.customIcons ? Object.keys(weekData.customIcons).length : 0;
    const photoCount = weekData.customPhotos ? Object.keys(weekData.customPhotos).length : 0;

    let importInfo = `📝 ${weekData.words.split('\n').length} phrases`;
    if (iconCount > 0) importInfo += ` | 😊 ${iconCount} icons`;
    if (photoCount > 0) importInfo += ` | 📷 ${photoCount} photos`;

    openAppModal({
        title: "📥 Import Homework",
        text: weekData.name,
        mode: 'edit',
        hideChars: true,
        placeholder: "Name this homework",
        onSave: (nameChoice) => {
            if (!nameChoice) {
                // Clear hash on cancel
                window.history.replaceState(null, document.title, window.location.pathname);
                return true;
            }

            if (state.history[nameChoice]) {
                const existingData = JSON.parse(state.history[nameChoice]);
                const existingMonth = monthNames[existingData.month || 0];
                closeOverlay('appModal');

                setTimeout(() => {
                    openAppModal({
                        title: "⚠️ Name Already Exists",
                        text: `"${nameChoice}" is already in your ${existingMonth} folder.`,
                        mode: 'view',
                        saveText: "🔄 Replace",
                        cancelText: "✏️ Edit Name",
                        onAction: () => {
                            executeImportProcess(nameChoice, weekData);
                            // CLEAR HASH AFTER SUCCESSFUL IMPORT
                            window.history.replaceState(null, document.title, window.location.pathname);
                        },
                        onSecondaryAction: () => { 
                            closeOverlay('appModal');
                            setTimeout(() => checkForImportManual(weekData), 300);
                        }
                    });
                }, 300); 
                return false; 
            }

            executeImportProcess(nameChoice, weekData);
            // CLEAR HASH AFTER SUCCESSFUL IMPORT
            window.history.replaceState(null, document.title, window.location.pathname);
            return true;
        }
    });

    // Handle Cancel/Close manually to strip the hash
    const btnClose = document.getElementById('appModalBtnClose');
    if (btnClose) {
        const originalAction = btnClose.onclick;
        btnClose.onclick = () => {
            window.history.replaceState(null, document.title, window.location.pathname);
            if (originalAction) originalAction();
            closeOverlay('appModal');
        };
    }

    document.getElementById('appModalStats').innerText = importInfo;

} catch (e) {
    console.error('Import error:', e);
    window.history.replaceState(null, document.title, window.location.pathname);
}
    }
}

// Helper to handle the "Edit Name" flow after the URL hash has been stripped
function checkForImportManual(weekData) {
    const iconCount = weekData.customIcons ? Object.keys(weekData.customIcons).length : 0;
    const photoCount = weekData.customPhotos ? Object.keys(weekData.customPhotos).length : 0;

    openAppModal({
title: "📥 Import Homework",
text: weekData.name,
mode: 'edit',
hideChars: true,
placeholder: "Name this homework",
onSave: (nameChoice) => {
    if (!nameChoice) return true;
    if (state.history[nameChoice]) {
        // Recursive safety check if they pick another existing name
        checkForImportManual(weekData); 
        return false;
    }
    executeImportProcess(nameChoice, weekData);
    return true;
}
    });
    document.getElementById('appModalStats').innerText = `📝 ${weekData.words.split('\n').length} phrases | Assets included`;
}

function addNewHomework() {
    state.editingHomeworkName = null; 
    state.isNameManuallyEdited = false;
    state.currentWeekAudio = null;
    
    // 1. CLEAR everything so it's fresh
    document.getElementById('hwMessages').innerHTML = ''; // Fixes the "Already saved" bug
    document.getElementById('hwNameInput').value = '';
    document.getElementById('hwInput').value = '';
    document.getElementById('hwIsDialogue').checked = false;
    document.getElementById('teacherAudioFile').value = '';
    document.getElementById('audioPlayerContainer').style.display = 'none';
    document.getElementById('teacherAudioNameDisplay').textContent = '';
    
    refreshHwTitle('add');
    closeOverlay('bpModal');
    openOverlay('hwDrawer'); 
}

function handleNameManualEdit() {
    state.isNameManuallyEdited = true; // User touched the name field, stop auto-filling
}

function autoPopulateName() {
    // 1. Only auto-fill if we are ADDING new homework (not editing old ones)
    // 2. Only auto-fill if the user hasn't typed a custom name yet
    if (state.editingHomeworkName || state.isNameManuallyEdited) return;

    const nameInput = document.getElementById('hwNameInput');
    const wordsInput = document.getElementById('hwInput');
    
    // Get just the first line
    const lines = wordsInput.value.split('\n');
    const firstLine = lines[0].trim();

    // Limit to 20 characters for the title
    if (firstLine.length > 0) {
nameInput.value = firstLine.substring(0, 20);
    } else {
nameInput.value = "";
    }
}

function openSettingsFromBP() {
    // 1. Close the backpack
    closeOverlay('bpModal');
    // 2. Open the parent settings immediately
    openOverlay('parentDrawer');
}

function changeBpMonth(direction) {
    state.showFavsOnly = false; // Turn off fav filter when browsing months
    document.getElementById('btnFavFilter').style.background = "white";
    
    state.selectedBpMonth += direction;
    if (state.selectedBpMonth > monthNames.length - 1) state.selectedBpMonth = 0;
    if (state.selectedBpMonth < 0) state.selectedBpMonth = monthNames.length - 1;
    openBP();
}

function toggleFavFilter() {
    state.showFavsOnly = !state.showFavsOnly;
    const btn = document.getElementById('btnFavFilter');
    btn.style.background = state.showFavsOnly ? "#ffb703" : "white";
    btn.style.color = state.showFavsOnly ? "white" : "#fb8500";
    openBP();
}

function getCornerBadgesHTML(name) {
    if (!name || !state.history[name]) return "";
    let hwData;
    try {
hwData = JSON.parse(state.history[name]);
    } catch(e) { return ""; }
    
    const safeName = name.replace(/'/g, "\\'");
    
    // THE FIX: We use a larger font-size (2rem) and a slight scale to match the yellow star's size.
    // We keep the light color (#ccc) and normal weight (400).
    const favIcon = hwData.isFavorite ? "⭐" : '<span style="color: #ccc !important; font-weight: 400 !important; font-size: 2rem; line-height: 1; display: inline-block; transform: translateY(-1px);">☆</span>';
    
    const noteExists = state.homeworkNotes && state.homeworkNotes[name] && state.homeworkNotes[name].trim() !== '';

    let html = `
<div class="corner-badge badge-left" onclick="toggleFavorite('${safeName}')">
    <span style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">${favIcon}</span>
</div>`;

    if (noteExists) {
html += `
    <div class="corner-badge badge-right" onclick="showNote('${safeName}')">
        <span style="font-size: 1.2rem;">💬</span>
    </div>`;
    }
    return html;
}

function toggleFavorite(name) {
    let d = JSON.parse(state.history[name]);
    d.isFavorite = !d.isFavorite;
    state.history[name] = JSON.stringify(d);
    localStorage.setItem('frenchHistory', JSON.stringify(state.history));
    setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
    
    // UI Refresh Logic
    if (document.getElementById('bpModal').style.display === 'block') {
openBP();
    } else {
renderList(state.currentScreenList);
    }
}

// 1. Triggered when clicking the 📁 icon (to move an item)
function moveHomework(name) {
    console.log('🟠 MOVE FUNCTION STARTED');
    console.log('name:', name);
    
    state.homeworkToMove = name; // Set the variable so the grid knows we are MOVING
    const subtitle = document.querySelector('#folderSelectionOverlay p');
    if (subtitle) subtitle.innerHTML = `Move "<span id="movingHwName">${name}</span>" to:`;
    renderFolderGrid();
    openOverlay('folderSelectionOverlay');
}

// 2. Triggered when clicking the "📅 Month Name" (to navigate)
function openFolderNav() {
    state.homeworkToMove = ""; // Clear the variable so the grid knows we are NAVIGATING
    renderFolderGrid();
    openOverlay('folderSelectionOverlay');
}

// 3. The "Engine" that builds the visual grid
function renderFolderGrid() {
    const grid = document.getElementById('folderGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    let totalCount = 0;
    const counts = new Array(monthNames.length).fill(0);

    // Calculate counts for badges and grand total
    Object.values(state.history).forEach(val => {
try {
    const data = JSON.parse(val);
    if (data.month !== undefined) {
        counts[data.month]++;
        totalCount++;
    }
} catch(e) {}
    });

    // Update the Total Display at the bottom
    const totalDisplay = document.getElementById('totalHwCount');
    if (totalDisplay) totalDisplay.textContent = 'Total Homeworks saved: ' + totalCount;

    // Update Popup Title based on mode
    const title = document.querySelector('#folderSelectionOverlay h2');
    if (title) title.textContent = state.homeworkToMove ? "📂 Move to Folder" : "📂 Select Month";

    // Create the 12 Folder buttons
    monthNames.forEach((month, index) => {
        const folder = document.createElement('div');
        const extraClass = month === "Home" ? " folder-home" : "";
        folder.className = 'folder-card' + extraClass;
        
        // Highlight current folder if we are just navigating
        if (index === state.selectedBpMonth && !state.homeworkToMove) {
            folder.style.borderColor = "#118AB2";
            folder.style.background = "#e0f2fe";
        }

folder.onclick = () => performFolderAction(index);

const badge = counts[index] > 0 ? `<div class="folder-badge">${counts[index]}</div>` : '';

const label = month === "Home" ? "Home Practice" : month.substring(0, 3);

folder.innerHTML = `
    ${badge}
    <span class="folder-icon">📁</span>
    <span class="folder-label">${label}</span>
`;
grid.appendChild(folder);
    });
}

// 4. The "Final Step" - actually does the move or the navigation
function performFolderAction(newMonthIndex) {
    if (state.homeworkToMove) {
// --- ACTION: MOVE ---
let hwData = JSON.parse(state.history[state.homeworkToMove]);
hwData.month = newMonthIndex;
state.history[state.homeworkToMove] = JSON.stringify(hwData);
localStorage.setItem('frenchHistory', JSON.stringify(state.history));
    setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
    } else {
// --- ACTION: NAVIGATE ---
state.selectedBpMonth = newMonthIndex;
state.showFavsOnly = false; // Turn off favorites filter when picking a month folder
const favBtn = document.getElementById('btnFavFilter');
if(favBtn) {
    favBtn.style.background = "white";
    favBtn.style.color = "#fb8500";
}
    }

    closeOverlay('folderSelectionOverlay');
    state.homeworkToMove = ""; // Reset for next time
    openBP(); // Refresh the backpack view
}

function changeHwFolder(direction) {
    // 1. Update the global month tracker
    state.selectedBpMonth += direction;
    if (state.selectedBpMonth > monthNames.length - 1) state.selectedBpMonth = 0;
    if (state.selectedBpMonth < 0) state.selectedBpMonth = monthNames.length - 1;

    // 2. Refresh the title based on whether we are adding or editing
    const type = state.editingHomeworkName ? 'edit' : 'add';
    refreshHwTitle(type, state.editingHomeworkName);
}

function refreshHwTitle(type, name = "") {
    const targetMonth = monthNames[state.selectedBpMonth];
    
    // Truncate long names in the function too
    let displayName = name;
    if (displayName && displayName.length > 15) {
displayName = displayName.substring(0, 12) + "...";
    }
    
    const displayTitle = (type === 'edit') ? 
`<span class="hw-title-text">Edit: ${displayName}</span>` : 
`<span class="hw-title-text">Add Homework</span>`;
    
    document.getElementById('hwDrawerTitle').innerHTML = `
<span class="hw-title-emoji">✏️</span>
${displayTitle}
<div class="hw-month-nav">
    <button class="hw-nav-btn" onclick="changeHwFolder(-1)">◀️</button>
    <span class="hw-month-subtitle">Folder: ${targetMonth}</span>
    <button class="hw-nav-btn" onclick="changeHwFolder(1)">▶️</button>
</div>
    `;
}

async function loadHomeworkForPractice(name, words, audio) {
    // STOP AUTO-PLAY when loading homework
    if (state.isAutoPlaying) {
stopAutoPlay();
    }
    
    await translateIfNeeded(words, false);
    
    state.currentSetName = name;
    localStorage.setItem('currentSetName', name);
    
    let hwData = { isDialogue: false, audio: null };
    try {
const parsed = JSON.parse(state.history[name]);
if (parsed.words !== undefined) {
    hwData = parsed;
}
    } catch (e) {}
    
    state.currentIsDialogue = !!hwData.isDialogue;
    state.currentWeekAudio = hwData.audio || null;
    
    document.getElementById('hwInput').value = words;
    localStorage.setItem('homeworkPhrases', words);
    state.lastLoadedHomework = words;
    
    if (state.currentWeekAudio) {
localStorage.setItem('currentWeekAudio', JSON.stringify(state.currentWeekAudio));
    } else {
localStorage.removeItem('currentWeekAudio');
    }
    
    displayAudioPlayer();
    
    if (state.currentWeekAudio) {
state.viewMode = 'dialogue'; 
    } else {
state.viewMode = hwData.isDialogue ? 'dialogue' : 'cards'; 
    }
    localStorage.setItem('viewMode', state.viewMode);
    
    document.getElementById('btnViewCards').classList.toggle('active', state.viewMode === 'cards');
    document.getElementById('btnViewDialogue').classList.toggle('active', state.viewMode === 'dialogue');
    
    const diagBtn = document.getElementById('btnViewDialogue');
    if (diagBtn) {
if (state.currentWeekAudio) {
    diagBtn.innerHTML = "🎧 Recording";
} else {
    diagBtn.innerHTML = state.currentIsDialogue ? "💬 Dialogue" : "📝 List";
}
    }
    
    closeOverlay('bpModal');
    renderList(words.split('\n').filter(w => w.trim()));
    
    // Background: preload TTS audio if not cached
    SpeechCache.fetchTTSForHomework(words, null).catch(() => {});
}

function showNote(name) {
    console.log('🟣 NOTE FUNCTION STARTED');
    console.log('name:', name);
    
    const note = state.homeworkNotes[name] || '';
    
    // If no note, go straight to editing
    if (note.trim() === '') {
openAppModal({
    title: `📝 Add Note: ${name}`,
    text: '',
    mode: 'edit',
    onSave: (val) => {
        if (val.trim()) state.homeworkNotes[name] = val.trim();
        localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
        setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
        refreshAppUI();
    }
});
return;
    }

    // Viewing existing note
    openAppModal({
title: `📝 Note: ${name}`,
text: note,
mode: 'view',
onEdit: () => {
    closeOverlay('appModal');
    setTimeout(() => {
        openAppModal({
            title: `✏️ Edit Note: ${name}`,
            text: note,
            mode: 'edit',
            onSave: (val) => {
                if (val.trim()) state.homeworkNotes[name] = val.trim();
                else delete state.homeworkNotes[name];
                localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
                setTimeout(() => { try { StorageDB.autoBackup(); } catch(e) {} }, 300);
                refreshAppUI();
            }
        });
    }, 200);
},
onDelete: () => {
    delete state.homeworkNotes[name];
    localStorage.setItem('homeworkNotes', JSON.stringify(state.homeworkNotes));
    refreshAppUI();
}
    });
}

function needsTranslation(words) {
    const list = words.split('\n').filter(l => l.trim().length > 0);
    for (let p of list) {
const n = norm(p);
if (!MASTER_DATA[p] && !(state.cache[n] && state.cache[n] !== "...")) {
    return true; // Found a phrase that needs translation
}
    }
    return false; // All phrases translated
}

async function translateIfNeeded(words, showProgress = true) {
    // NEW: Filter the list to ignore single letters (the alphabet)
    // We only want to auto-translate phrases with 2 or more characters
    const list = words.split('\n').filter(l => l.trim().length > 1);
    
    // If the list is empty (it's just the alphabet), we return immediately
    if (list.length === 0) return words;

    if (!needsTranslation(words)) return words; // Nothing to translate
    
    let successCount = 0;
    
    if (showProgress) {
const msgDiv = document.getElementById('hwMessages');
// Ensure this div exists before trying to update it
if (msgDiv) {
    msgDiv.innerHTML = '<div class="loading-spinner"></div><div style="font-size:0.8rem; margin-top:5px;">📝 Auto-translating... Please wait</div>';
}
    }
    
    // Translate each untranslated phrase
    for (let i = 0; i < list.length; i++) {
const phrase = list[i];
const n = norm(phrase);

if (!MASTER_DATA[phrase] && !(state.cache[n] && state.cache[n] !== "...")) {
    const result = await translateOne(phrase);
    if (result) successCount++;
    
    if (showProgress) {
        const msgDiv = document.getElementById('hwMessages');
        msgDiv.innerHTML = `<div class="loading-spinner"></div><div style="font-size:0.8rem; margin-top:5px;">Translated ${i + 1}/${list.length}...</div>`;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
}
    }
    
    if (showProgress) {
const msgDiv = document.getElementById('hwMessages');
msgDiv.innerHTML = `<div class="success-message">✅ Auto-translated ${successCount} phrase${successCount > 1 ? 's' : ''}!</div>`;
setTimeout(() => msgDiv.innerHTML = '', 2000);
    }
    
    return words;
}


function loadCurrentHomework() {
    const words = document.getElementById('hwInput').value.trim();
    if (!words) {
        return;
    }
    
    const savedAudio = localStorage.getItem('currentWeekAudio');
    if (savedAudio) {
        try {
            state.currentWeekAudio = JSON.parse(savedAudio);
        } catch (e) {
            state.currentWeekAudio = null;
        }
    }
    
    // Don't override state.currentSetName here - we already set it in onload
    renderList(words.split('\n').filter(w => w.trim()));

    // Call setViewMode to ensure UI matches
    setViewMode(state.viewMode);
}

function initAudioUpload() {
    const fileInput = document.getElementById('teacherAudioFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleAudioUpload);
    }
}

function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
        openAppModal({ title: 'Notice', text: 'Please select an audio file (.oga, .ogg, .mp3, .wav, .m4a)', mode: 'view' });
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        state.currentWeekAudio = {
            data: e.target.result,
            type: file.type,
            name: file.name
        };
        displayAudioPlayer();
    };
    reader.readAsDataURL(file);
}

function displayAudioPlayer() {
    // Safety check: if no audio or no data, hide and exit
    if (!state.currentWeekAudio || !state.currentWeekAudio.data) {
        document.getElementById('audioPlayerContainer').style.display = 'none';
        return;
    }
    
    const player = document.getElementById('teacherAudioPlayer');
    const nameDisplay = document.getElementById('teacherAudioNameDisplay');
    
    // 1. Setup the player
    player.pause();
    player.currentTime = 0;
    player.src = state.currentWeekAudio.data;
    
    // 2. RESTORED: Update the filename display
    if (nameDisplay) {
        nameDisplay.textContent = state.currentWeekAudio.name || "Saved Recording";
    }
    
    // 3. Show the container
    document.getElementById('audioPlayerContainer').style.display = 'block';
    
    // 4. Audio Exclusivity
    player.onplay = () => {
        document.querySelectorAll('audio').forEach(audio => {
            if (audio !== player && !audio.paused) {
                audio.pause();
            }
        });
    };
}

function removeTeacherAudio() {
    // 1. Clear the data (Step 2 in your version)
    state.currentWeekAudio = null;
    document.getElementById('teacherAudioNameDisplay').textContent = '';
    
    // 2. Reset the file input (Step 3 in your version)
    const fileInput = document.getElementById('teacherAudioFile');
    if (fileInput) fileInput.value = '';
    
    // 3. Hide the player container (Step 4 in your version)
    document.getElementById('audioPlayerContainer').style.display = 'none';
    
    // 4. Stop and reset the player (Step 5 in your version)
    const player = document.getElementById('teacherAudioPlayer');
    if (player) {
        player.pause();
        player.src = '';
        player.load(); // Forces reset
    }
}

/* audio.js: initSpeechSpeed, spk, norm, playVictorySound, toggleMusic, etc. - moved to js/audio.js */
 function loadPresetAndClose(k) {
    // STOP AUTO-PLAY when loading a new preset
    if (state.isAutoPlaying) {
stopAutoPlay();
    }
    
    if (!presets[k]) return;
    state.currentSetName = k.charAt(0).toUpperCase() + k.slice(1);
    localStorage.setItem('currentSetName', state.currentSetName);
    state.currentIsDialogue = false; 
    state.currentWeekAudio = null;
    localStorage.removeItem('currentWeekAudio');
    renderList(presets[k]);
    closeOverlay('presetsOverlay');
}

async function translateOne(p) {
    const n = norm(p); 
    for (let key in MASTER_DATA) { 
        if (norm(key) === n) return MASTER_DATA[key].en; 
    }
    try { 
        const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=en&dt=t&q=${encodeURIComponent(p)}`);
        if (!r.ok) throw new Error('Translation failed');
        const d = await r.json(); 
        let tr = d[0][0][0]; 
        if (/^a\s[aeiou]/i.test(tr)) { tr = tr.replace(/^a\s/i, "An "); }
        else if (/^an\s[^aeiou]/i.test(tr)) { tr = tr.replace(/^an\s/i, "A "); }
        state.cache[n] = tr; 
        localStorage.setItem('phraseTranslations', JSON.stringify(state.cache)); 
        return tr;
    } catch (e) { 
        console.error('Translation error:', e);
        return null; 
    }
}

