import os
import re
import sys

js_files = [
    'js/app.js',
    'js/components/device-view.js',
    'js/components/dashboard-view.js',
    'js/components/charts.js',
    'js/components/demo-mode.js',
    'js/components/report-modal.js',
    'js/models/instruments.js',
    'js/models/sensor-sim.js',
    'js/models/cv-pipeline.js'
]

# Collect all IDs defined anywhere in index.html and all JS files (via id="...")
all_defined_ids = set()

with open('index.html', 'r', encoding='utf-8') as f:
    all_defined_ids.update(re.findall(r'id=["\']([^"\']+)["\']', f.read()))

for path in js_files:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            all_defined_ids.update(re.findall(r'id=["\']([^"\']+)["\']', content))

# Now collect all getElementById('...') in JS files
all_referenced_ids = set()
for path in js_files:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            matches = re.findall(r'getElementById\([\'"]([^\'"]+)[\'"]\)', content)
            all_referenced_ids.update(matches)

missing = []
for ref_id in all_referenced_ids:
    # Some IDs may be dynamic or parameterized; check if defined
    if ref_id not in all_defined_ids and not ref_id.startswith('view-'):
        missing.append(ref_id)

if missing:
    print('POTENTIALLY UNMATCHED getElementById IDs:', missing)
    sys.exit(1)
else:
    print(f'All {len(all_referenced_ids)} getElementById references match defined IDs!')
    sys.exit(0)
