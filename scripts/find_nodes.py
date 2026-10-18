import json
import re

with open('stream_data.json', 'r', encoding='utf-8') as f:
    stream = json.load(f)

# The Remix stream format is a reference-based array structure:
# e.g., references like {"_1": 2} or numbers pointing to indices in the stream array.
# Let's inspect where "conversation" or "mapping" or "title" or "messages" appear in the stream.

for i, x in enumerate(stream):
    if isinstance(x, str) and any(k in x for k in ['Develop Contamination Detector', 'BloodTrace', 'user', 'assistant', 'system']):
        if len(x) < 100:
            print(f'Index {i}: {x}')
        else:
            print(f'Index {i}: {x[:60]}... (len {len(x)})')
