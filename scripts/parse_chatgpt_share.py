import json
import re

path = r'C:\Users\LENOVO\.gemini\antigravity\brain\3e3ec47e-2bb5-4fa4-8515-01e269e993d0\.system_generated\steps\781\content.md'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

print('Length of file:', len(text))

# Find all script tags
scripts = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)
print(f'Total script tags: {len(scripts)}')

# Look for text content or JSON
for i, s in enumerate(scripts):
    if 'Develop Contamination' in s or 'BloodTrace' in s or 'linear_conversation' in s or 'mapping' in s or 'message' in s:
        print(f'Script {i} matched! Length: {len(s)}')
        # write out to a file to inspect
        with open(f'script_{i}.txt', 'w', encoding='utf-8') as out:
            out.write(s)

# Also search directly in text for common conversation strings
print('Searching for keywords in raw text:')
for kw in ['BloodTrace', 'Arduino', 'Develop Contamination', '365', 'photodiode', 'fluorescence', 'NIR']:
    occurrences = [m.start() for m in re.finditer(re.escape(kw), text, re.IGNORECASE)]
    print(f'Keyword "{kw}": {len(occurrences)} occurrences')
    if occurrences:
        idx = occurrences[0]
        start = max(0, idx - 100)
        end = min(len(text), idx + 200)
        print(f'  Snippet: {text[start:end]!r}')
