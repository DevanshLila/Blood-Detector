import json
import re

with open('bloodtrace_full_chat_history.md', 'r', encoding='utf-8') as f:
    chat_text = f.read()

# Let's count user messages vs assistant messages
user_msgs = re.findall(r'## Message \d+ — \*\*USER\*\*\n\n(.*?)(?=\n\n---\n\n## Message|\Z)', chat_text, re.DOTALL)
asst_msgs = re.findall(r'## Message \d+ — \*\*ASSISTANT\*\*\n\n(.*?)(?=\n\n---\n\n## Message|\Z)', chat_text, re.DOTALL)
tool_msgs = re.findall(r'## Message \d+ — \*\*TOOL\*\*\n\n(.*?)(?=\n\n---\n\n## Message|\Z)', chat_text, re.DOTALL)

print(f'User messages: {len(user_msgs)}')
print(f'Assistant messages: {len(asst_msgs)}')
print(f'Tool messages: {len(tool_msgs)}')

print('\n=== ALL USER PROMPTS SUMMARY ===')
for i, u in enumerate(user_msgs):
    first_line = u.strip().split('\n')[0][:120]
    print(f'U{i+1}: {first_line}')
