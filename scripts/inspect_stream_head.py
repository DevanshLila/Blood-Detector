import json

with open('stream_data.json', 'r', encoding='utf-8') as f:
    stream = json.load(f)

print('Stream length:', len(stream))
print('First 20 items in stream:')
for i in range(min(20, len(stream))):
    print(f'{i}: {repr(stream[i])}')
