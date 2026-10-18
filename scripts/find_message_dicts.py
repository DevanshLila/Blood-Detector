import json

with open('stream_data.json', 'r', encoding='utf-8') as f:
    stream = json.load(f)

# The stream array contains nodes.
# Let's inspect dicts in stream to see how messages and conversation tree are structured.
message_nodes = []
for i, item in enumerate(stream):
    if isinstance(item, dict):
        # check if it has keys like "role", "content", "author", "id", "parts"
        keys = list(item.keys())
        if 'role' in keys or 'author' in keys or 'content' in keys:
            message_nodes.append((i, item))

print(f'Found {len(message_nodes)} message-like dicts')
for pos, d in message_nodes[:15]:
    print(f'Dict at {pos}: keys={list(d.keys())}')
