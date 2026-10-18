import json

with open('share_data.json', 'r', encoding='utf-8') as f:
    share = json.load(f)

data = share['serverResponse']['data']
linear = data.get('linear_conversation', [])
mapping = data.get('mapping', {})

print(f'Total linear messages: {len(linear)}')

out_lines = []
out_lines.append(f"# Complete Shared ChatGPT Conversation: {data.get('title')}\n")
out_lines.append(f"- **Shared URL**: https://chatgpt.com/share/6ad484e6-c474-83ec-a454-da0db668d517\n")
out_lines.append(f"- **Conversation ID**: {data.get('conversation_id')}\n")
out_lines.append(f"- **Total Nodes**: {len(linear)}\n\n---\n\n")

for i, node in enumerate(linear):
    msg = node.get('message')
    if not msg:
        continue
    
    author = msg.get('author', {})
    role = author.get('role', 'unknown')
    create_time = msg.get('create_time')
    
    content = msg.get('content', {})
    content_type = content.get('content_type', '')
    parts = content.get('parts', [])
    
    # Process text parts
    text_content = ""
    for p in parts:
        if isinstance(p, str):
            text_content += p + "\n"
        elif isinstance(p, dict):
            text_content += json.dumps(p, indent=2) + "\n"
            
    if not text_content.strip():
        # Check if there is tool call, code execution, or metadata
        metadata = msg.get('metadata', {})
        if 'aggregate_result' in metadata:
            text_content = f"*[Tool Result]*\n```\n{json.dumps(metadata['aggregate_result'], indent=2)}\n```"
        elif 'command' in metadata:
            text_content = f"*[Code Command]*: {metadata.get('command')}"
        else:
            continue
            
    out_lines.append(f"## Message {i+1} — **{role.upper()}**\n\n")
    out_lines.append(text_content.strip() + "\n\n---\n\n")

with open('bloodtrace_full_chat_history.md', 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

print(f'Wrote bloodtrace_full_chat_history.md with {len(out_lines)} blocks.')
