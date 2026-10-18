import json

with open('share_data.json', 'r', encoding='utf-8') as f:
    share = json.load(f)

server_resp = share.get('serverResponse', {})
print('Server response keys:', list(server_resp.keys()) if isinstance(server_resp, dict) else type(server_resp))

# Check for conversation, data, mapping, etc.
if isinstance(server_resp, dict):
    data = server_resp.get('data', {})
    print('Data keys:', list(data.keys()) if isinstance(data, dict) else type(data))
    if isinstance(data, dict):
        print('Title:', data.get('title'))
        linear = data.get('linear_conversation', [])
        print(f'Linear conversation items: {len(linear)}')
        mapping = data.get('mapping', {})
        print(f'Mapping items: {len(mapping)}')
