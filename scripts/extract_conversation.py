import json
import re

with open('script_8.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

print('Length of script_8:', len(text))

# Script 8 usually contains the Remix / Next / React stream or JSON with the conversation
# Let's search for conversation title, messages, turns
# Look for pattern: {"role": ...} or "author": {"role": ...} or similar

# Try to find all parts of text with "parts": [ ... ]
parts_pattern = re.compile(r'\"parts\":\s*(\[.*?\])', re.DOTALL)
parts = parts_pattern.findall(text)
print(f'Found {len(parts)} parts')

# Let's try parsing JSON blocks if any
# In modern ChatGPT share pages, there's a JSON structure or hydration state
# Let's find all occurrences of "message"
# Or search for "author":{"role":
author_matches = [m.start() for m in re.finditer(r'\"author\":\s*\{[^}]*\"role\":\s*\"([^\"]+)\"', text)]
print(f'Found {len(author_matches)} author role matches')

# Let's inspect the first few author matches
for idx in author_matches[:10]:
    start = max(0, idx - 50)
    end = min(len(text), idx + 400)
    print('--- MATCH ---')
    print(text[start:end])
