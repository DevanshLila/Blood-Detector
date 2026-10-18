import json
import re

with open('bloodtrace_full_chat_history.md', 'r', encoding='utf-8') as f:
    chat = f.read()

# Let's inspect the three research sources and their analysis
print('=== 1. THREE RESEARCH SOURCES ===')
idx_sources = chat.find('## 1. What the three sources tell us')
if idx_sources != -1:
    print(chat[idx_sources:idx_sources+4000])

# Let's inspect the critique of the video
print('\n=== 2. VIDEO CRITIQUE (Message after U15) ===')
idx_video = chat.find('I reviewed your BloodTrace Vision showcase video')
if idx_video != -1:
    print(chat[idx_video:idx_video+4000])

# Let's inspect the PowerPoint slides and python code
print('\n=== 3. POWERPOINT SLIDES SPECIFICATION ===')
idx_ppt = chat.find('Yes! I can create a professional PowerPoint presentation')
if idx_ppt != -1:
    print(chat[idx_ppt:idx_ppt+4000])
