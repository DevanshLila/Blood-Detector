import json
import re

with open('stream_data.json', 'r', encoding='utf-8') as f:
    stream = json.load(f)

# Let's extract all distinct markdown/text responses, documents, python scripts, and external links.
docs = []
python_scripts = []
links = set()
messages = []

# Search for external URLs
url_pattern = re.compile(r'https?://[^\s\"\'\<\>\)]+')

for i, item in enumerate(stream):
    if not isinstance(item, str):
        continue
    
    # Extract URLs
    for u in url_pattern.findall(item):
        if not any(ign in u for ign in ['oaistatic', 'statsig', 'w3.org', 'schema.org', 'apple.com', 'google.com/search']):
            links.add(u)
            
    # Check for Python scripts (like python-docx or matplotlib)
    if 'from docx import Document' in item or 'import cv2' in item or 'import matplotlib' in item or 'from pptx import Presentation' in item:
        python_scripts.append((i, item))
        
    # Check for full documents / writing artifacts
    if item.startswith('# Project: BloodTrace') or item.startswith('# BloodTrace Vision') or item.startswith('## 1. What the three sources tell us') or item.startswith('Review and upgrade my existing') or 'Prompt to give Antigravity' in item:
        docs.append((i, item))

print(f'Found {len(links)} external links')
print(f'Found {len(python_scripts)} python scripts')
print(f'Found {len(docs)} full document artifacts')

with open('extracted_links.txt', 'w', encoding='utf-8') as f:
    for l in sorted(links):
        f.write(l + '\n')

with open('extracted_python_scripts.py', 'w', encoding='utf-8') as f:
    for idx, (pos, code) in enumerate(python_scripts):
        f.write(f'# ==========================================\n')
        f.write(f'# SCRIPT {idx} (stream index {pos})\n')
        f.write(f'# ==========================================\n\n')
        f.write(code + '\n\n')

with open('extracted_docs.md', 'w', encoding='utf-8') as f:
    for idx, (pos, doc) in enumerate(docs):
        f.write(f'# ==========================================\n')
        f.write(f'# DOCUMENT {idx} (stream index {pos})\n')
        f.write(f'# ==========================================\n\n')
        f.write(doc + '\n\n')

print('Wrote extracted_links.txt, extracted_python_scripts.py, extracted_docs.md')
