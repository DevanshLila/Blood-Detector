for name in ['script_0.txt', 'script_3.txt', 'script_8.txt']:
    with open(name, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    print(f'=== {name} (len {len(content)}) ===')
    print('Start:', repr(content[:300]))
    print('End:', repr(content[-300:]))
