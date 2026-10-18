import json

with open('script_8.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

prefix = 'window.__reactRouterContext.streamController.enqueue('
idx = text.find(prefix)
if idx != -1:
    raw_arg = text[idx + len(prefix):].rstrip()
    if raw_arg.endswith(');'):
        raw_arg = raw_arg[:-2]
    print('Raw arg length:', len(raw_arg))
    print('Raw arg starts with:', repr(raw_arg[:50]))
    print('Raw arg ends with:', repr(raw_arg[-50:]))
    
    # decode JSON string
    try:
        decoded = json.loads(raw_arg)
        print('Decoded level 1 successfully, length:', len(decoded))
        # level 2 JSON decode
        stream_data = json.loads(decoded)
        print('Decoded level 2 successfully! Type:', type(stream_data), 'Length:', len(stream_data))
        
        # Save parsed stream data to json file
        with open('stream_data.json', 'w', encoding='utf-8') as out:
            json.dump(stream_data, out, indent=2)
        print('Saved stream_data.json')
    except Exception as e:
        print('Decode error:', e)
