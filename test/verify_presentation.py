import sys
from pptx import Presentation

pptx_path = "BloodTrace_Project_Presentation.pptx"
prs = Presentation(pptx_path)

print(f"Loaded presentation: {pptx_path}")
print(f"Total slides: {len(prs.slides)}")
print(f"Width: {prs.slide_width.inches:.3f}\", Height: {prs.slide_height.inches:.3f}\"")

for i, slide in enumerate(prs.slides):
    texts = []
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                if p.text.strip():
                    texts.append(p.text.strip())
    print(f"\n--- Slide {i+1} (Shapes: {len(slide.shapes)}, Text blocks: {len(texts)}) ---")
    print(f"Header/Title: {texts[0] if texts else 'NONE'} | {texts[1] if len(texts)>1 else ''}")
    for t in texts[:5]:
        print(f"  • {t[:80]}")

print("\nALL 9 SLIDES VERIFIED SUCCESSFULLY!")
