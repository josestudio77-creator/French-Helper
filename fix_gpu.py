import re

with open(r'C:\Users\JOSE\French-Helper\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix 1: Remove GPU promotion from .overlay-content
pattern1 = r'/\* Force GPU layer compositing to completely eliminate partial paint scrolling cutoff glitches \*/\s*-webkit-transform: translate3d\(0, 0, 0\);\s*transform: translate3d\(0, 0, 0\);\s*will-change: transform;'
css = re.sub(pattern1, '/* GPU promotion removed from scroll container */', css)

# Fix 2: Remove GPU promotion from #bpModal .overlay-content
pattern2 = r'/\* Force GPU layer compositing to completely prevent partial paint scrolling cutoff glitches \*/\s*-webkit-transform: translate3d\(0, 0, 0\);\s*transform: translate3d\(0, 0, 0\);\s*will-change: transform;'
css = re.sub(pattern2, '/* GPU promotion removed from scroll container */', css)

with open(r'C:\Users\JOSE\French-Helper\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Done')
