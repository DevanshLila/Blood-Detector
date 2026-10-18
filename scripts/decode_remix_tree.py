import json
import sys

# Increase recursion depth just in case
sys.setrecursionlimit(20000)

with open('stream_data.json', 'r', encoding='utf-8') as f:
    stream = json.load(f)

memo = {}

def decode_node(val):
    if isinstance(val, int):
        if val == -5:
            return None # undefined
        if val == -1:
            return None # null
        if val == -2:
            return None
        if val == -3:
            return False
        if val == -4:
            return True
        if 0 <= val < len(stream):
            return decode_index(val)
        return val
    elif isinstance(val, dict):
        res = {}
        for k, v in val.items():
            if k.startswith('_'):
                key_idx = int(k[1:])
                actual_key = stream[key_idx] if 0 <= key_idx < len(stream) else k
            else:
                actual_key = k
            res[actual_key] = decode_node(v)
        return res
    elif isinstance(val, list):
        return [decode_node(x) for x in val]
    else:
        return val

def decode_index(idx):
    if idx in memo:
        return memo[idx]
    
    # Placeholder to break cyclic references
    raw = stream[idx]
    if isinstance(raw, (int, float, str, bool)) or raw is None:
        memo[idx] = raw
        return raw
    
    if isinstance(raw, dict):
        res = {}
        memo[idx] = res
        for k, v in raw.items():
            if k.startswith('_'):
                key_idx = int(k[1:])
                actual_key = stream[key_idx] if 0 <= key_idx < len(stream) else k
            else:
                actual_key = k
            res[actual_key] = decode_node(v)
        return res
    elif isinstance(raw, list):
        res = []
        memo[idx] = res
        for item in raw:
            res.append(decode_node(item))
        return res
    return raw

# Start decoding from root
print('Decoding root from index 0...')
root = decode_index(0)
print('Decoded root successfully!')

with open('decoded_conversation_tree.json', 'w', encoding='utf-8') as out:
    json.dump(root, out, indent=2, default=str)

print('Saved decoded_conversation_tree.json')
