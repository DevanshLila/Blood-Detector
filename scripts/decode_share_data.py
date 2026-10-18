import json
import sys

sys.setrecursionlimit(20000)

with open('stream_data.json', 'r', encoding='utf-8') as f:
    stream = json.load(f)

memo = {}

def decode_node(val, seen=None):
    if seen is None:
        seen = set()
        
    if isinstance(val, int):
        if val in (-5, -1, -2):
            return None
        if val == -3:
            return False
        if val == -4:
            return True
        if 0 <= val < len(stream):
            return decode_index(val, seen)
        return val
    elif isinstance(val, dict):
        res = {}
        for k, v in val.items():
            if k.startswith('_'):
                key_idx = int(k[1:])
                actual_key = stream[key_idx] if 0 <= key_idx < len(stream) else k
            else:
                actual_key = k
            res[actual_key] = decode_node(v, seen)
        return res
    elif isinstance(val, list):
        return [decode_node(x, seen) for x in val]
    else:
        return val

def decode_index(idx, seen):
    if idx in memo:
        return memo[idx]
    if idx in seen:
        return f'<circular reference to {idx}>'
    
    raw = stream[idx]
    if isinstance(raw, (int, float, str, bool)) or raw is None:
        memo[idx] = raw
        return raw
    
    seen.add(idx)
    if isinstance(raw, dict):
        res = {}
        memo[idx] = res
        for k, v in raw.items():
            if k.startswith('_'):
                key_idx = int(k[1:])
                actual_key = stream[key_idx] if 0 <= key_idx < len(stream) else k
            else:
                actual_key = k
            res[actual_key] = decode_node(v, seen)
        seen.remove(idx)
        return res
    elif isinstance(raw, list):
        res = []
        memo[idx] = res
        for item in raw:
            res.append(decode_node(item, seen))
        seen.remove(idx)
        return res
    seen.remove(idx)
    return raw

# Index 8 is the share route data!
print('Decoding share route from index 8...')
share_data = decode_index(8, set())
print('Share data keys:', list(share_data.keys()))

with open('share_data.json', 'w', encoding='utf-8') as out:
    json.dump(share_data, out, indent=2, default=str)

print('Saved share_data.json successfully!')
