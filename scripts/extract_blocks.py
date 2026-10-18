import json

with open('stream_data.json', 'r', encoding='utf-8') as f:
    data = f.read()

# Let's load the JSON data
obj = json.loads(data)

# Let's inspect string items in the list
strings = [x for x in obj if isinstance(x, str)]
print(f'Total strings: {len(strings)}')

# Also search for dicts
dicts = [x for x in obj if isinstance(x, dict)]
print(f'Total dicts: {len(dicts)}')

# Look for message parts, text, or conversation structure
conversation_blocks = []
for i, item in enumerate(strings):
    # If the string contains substantive text
    if len(item) > 80:
        conversation_blocks.append((i, item))

print(f'Found {len(conversation_blocks)} long strings')

# Write out all long strings in order
with open('extracted_blocks.md', 'w', encoding='utf-8') as f:
    for idx, (pos, text) in enumerate(conversation_blocks):
        f.write(f'## Block {idx} (stream index {pos}, len {len(text)})\n\n')
        f.write(text)
        f.write('\n\n---\n\n')

print('Saved to extracted_blocks.md')
