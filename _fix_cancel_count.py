import os

# 1. CSS: Remove sticky from cancel button, update header to hold count
css_path = r'C:\Users\JOSE\French-Helper\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove sticky cancel button
old_cancel = '''/* Folder selector: cancel button stays at bottom */
#folderSelectionOverlay .overlay-content > button:last-child {
    position: sticky; bottom: 0; z-index: 10;
    margin-top: auto;
    background: rgba(255,255,255,0.88) !important;
    backdrop-filter: blur(10px);
    border-radius: 14px;
}'''
new_cancel = '''/* Folder selector: cancel button scrolls naturally */
#folderSelectionOverlay .overlay-content > button:last-child {
    background: rgba(255,255,255,0.88) !important;
    backdrop-filter: blur(10px);
    border-radius: 14px;
}'''
c = c.replace(old_cancel, new_cancel, 1)

# Update totalHwCount to be part of the header subtitle area
old_total = '''#totalHwCount {
    position: sticky; top: 73px; z-index: 8;
}'''
new_total = '''#totalHwCount {
    position: sticky; top: 37px; z-index: 8;
    margin: 0 0 15px 0; padding: 6px 0 8px 0;
    font-size: 0.85rem !important;
    background: linear-gradient(135deg, #ffccd5, #b5e6ff, #e8d5ff, #b5f0ff); background-size: 400% 400%; animation: gradientFlow 30s ease infinite;
}'''
c = c.replace(old_total, new_total, 1)

# Hide the subtitle p in folder selector (replaced by totalHwCount)
old_sub_hide = '''#folderSelectionOverlay .overlay-content h2 + p {
    position: sticky; top: 37px; z-index: 9;
    margin: 0 0 15px 0; padding: 6px 0 8px 0;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(8px);
    font-size: 0.8rem;
}'''
new_sub_hide = '''#folderSelectionOverlay .overlay-content h2 + p {
    display: none;
}'''
c = c.replace(old_sub_hide, new_sub_hide, 1)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(c)
print('CSS updated')

# 2. JS: Update renderFolderGrid to set total count in both openFolderNav context
js_path = r'C:\Users\JOSE\French-Helper\js\homework.js'
with open(js_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Update the openFolderNav function to not show the old subtitle
old_nav = """function openFolderNav() {
    state.homeworkToMove = \"\"; // Clear the variable so the grid knows we are NAVIGATING
    const subtitle = document.querySelector('#folderSelectionOverlay p');
    if (subtitle) subtitle.innerHTML = 'Select a month folder to view:';
    renderFolderGrid();
    openOverlay('folderSelectionOverlay');
}"""

new_nav = """function openFolderNav() {
    state.homeworkToMove = \"\"; // Clear the variable so the grid knows we are NAVIGATING
    renderFolderGrid();
    openOverlay('folderSelectionOverlay');
}"""

c = c.replace(old_nav, new_nav, 1)

# Update renderFolderGrid to update total count with friendly text
old_count = """    const totalDisplay = document.getElementById('totalHwCount');
    if (totalDisplay) totalDisplay.textContent = `\u{1f4ca} Total saved in Backpack: ${totalCount}`;"""

new_count = """    const totalDisplay = document.getElementById('totalHwCount');
    if (totalDisplay) totalDisplay.textContent = 'Total Homeworks saved: ' + totalCount;"""

c = c.replace(old_count, new_count, 1)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(c)
print('JS updated')
