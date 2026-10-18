"""
BloodTrace™ Project Presentation Generator
Generates a broadcast-quality, 9-slide engineering presentation for judges and faculty.
Conforms to the 9-slide structure specified in the project documentation:
1. Title Slide
2. Problem Statement
3. Existing Reprocessing Process & Where BloodTrace Fits
4. Proposed Solution (Dual-Wavelength Optical Physics)
5. System Architecture & Circuit Schematic
6. Working Principle & Computer Vision Pipeline
7. Experimental Plan & Quantitative Evaluation Metrics
8. Future Scope & Commercialization Roadmap
9. References & Regulatory Compliance Disclosures
"""

import os
import sys
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.dml.color import RGBColor

# Output path
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PPTX = BASE_DIR / "BloodTrace_Project_Presentation.pptx"
FRAMES_DIR = BASE_DIR / "assets" / "video_frames"

# 16:9 Widescreen dimensions
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

# Color Palette (High-contrast medical technology dark theme)
DARK_BG = RGBColor(7, 15, 30)         # Deepest navy #070F1E
CARD_BG = RGBColor(15, 27, 48)        # Slate card navy #0F1B30
CARD_BORDER = RGBColor(30, 58, 95)    # Subtle card stroke
CARD_BG_ALT = RGBColor(12, 22, 40)    # Secondary dark
CYAN = RGBColor(6, 182, 212)          # Primary cyan highlight #06B6D4
CYAN_BRIGHT = RGBColor(34, 211, 238)  # Bright cyan #22D3EE
TEAL = RGBColor(20, 184, 166)         # Medical teal #14B8A6
WHITE = RGBColor(248, 250, 252)       # Crisp white #F8FAFC
SLATE = RGBColor(148, 163, 184)       # Muted body slate #94A3B8
SLATE_LIGHT = RGBColor(203, 213, 225) # Legible light slate #CBD5E1
AMBER = RGBColor(245, 158, 11)        # Warning gold #F59E0B
AMBER_BG = RGBColor(40, 30, 15)       # Amber dark pill
RED = RGBColor(244, 63, 94)           # Danger / Bioburden #F43F5E
GREEN = RGBColor(16, 185, 129)        # Pass / Clean #10B981
PURPLE = RGBColor(168, 85, 247)       # 365nm UV accent #A855F7

def create_presentation():
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT

    def set_slide_background(slide, color=DARK_BG):
        bg = slide.background.fill
        bg.solid()
        bg.fore_color.rgb = color

    def add_textbox(slide, x, y, w, h, text, font_size=14, color=WHITE, bold=False, 
                    font_name="Segoe UI", align=None, valign=MSO_ANCHOR.TOP, margin=0.05):
        box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
        tf = box.text_frame
        tf.clear()
        tf.word_wrap = True
        tf.margin_left = Inches(margin)
        tf.margin_right = Inches(margin)
        tf.margin_top = Inches(margin)
        tf.margin_bottom = Inches(margin)
        tf.vertical_anchor = valign
        for i, line in enumerate(text.split("\n")):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = line
            p.font.name = font_name
            p.font.size = Pt(font_size)
            p.font.bold = bold
            p.font.color.rgb = color
            if align is not None:
                p.alignment = align
        return box

    def add_header(slide, category, title, slide_num=None):
        # Top category pill / breadcrumb
        add_textbox(slide, 0.75, 0.35, 11.8, 0.3, category.upper(), font_size=11, color=CYAN, bold=True)
        # Main Slide Title
        add_textbox(slide, 0.72, 0.65, 11.8, 0.55, title, font_size=24, color=WHITE, bold=True)
        # Accent Cyan Underline
        accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.75), Inches(1.22), Inches(0.85), Inches(0.04))
        accent.fill.solid()
        accent.fill.fore_color.rgb = CYAN
        accent.line.fill.background()
        # Slide number bottom-right
        if slide_num is not None:
            add_textbox(slide, 12.2, 7.05, 0.6, 0.3, f"{slide_num:02d} / 09", font_size=10, color=SLATE, align=PP_ALIGN.RIGHT)
        # Bottom discreet watermark
        add_textbox(slide, 0.75, 7.05, 8.0, 0.3, "BLOODTRACE™ — MNIT JAIPUR • DEVANSH LILA • CONFIDENTIAL & PROPRIETARY", font_size=9, color=SLATE)

    def add_card(slide, x, y, w, h, title="", body="", accent_color=CYAN, body_size=13, bg_color=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.2)
        
        # Left colored accent line inside card
        if accent_color:
            accent_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.08), Inches(y + 0.12), Inches(0.06), Inches(h - 0.24))
            accent_bar.fill.solid()
            accent_bar.fill.fore_color.rgb = accent_color
            accent_bar.line.fill.background()

        text_x = x + 0.24
        text_w = w - 0.36
        if title:
            add_textbox(slide, text_x, y + 0.12, text_w, 0.35, title, font_size=15, color=accent_color if accent_color else WHITE, bold=True)
        if body:
            body_y = y + (0.50 if title else 0.15)
            body_h = h - (0.60 if title else 0.30)
            add_textbox(slide, text_x, body_y, text_w, body_h, body, font_size=body_size, color=SLATE_LIGHT)
        return card

    def add_bullet_list(slide, x, y, w, h, items, font_size=13, text_color=WHITE, bullet_color=CYAN):
        box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
        tf = box.text_frame
        tf.clear()
        tf.word_wrap = True
        tf.margin_left = Inches(0.04)
        tf.margin_right = Inches(0.04)
        tf.margin_top = Inches(0.02)
        tf.margin_bottom = Inches(0.02)
        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = "•  " + item
            p.font.name = "Segoe UI"
            p.font.size = Pt(font_size)
            p.font.color.rgb = text_color
            p.space_after = Pt(8)
        return box

    def add_arrow(slide, x1, y1, x2, y2, color=CYAN, width=2.0):
        line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
        line.line.color.rgb = color
        line.line.width = Pt(width)
        line.line.end_arrowhead = True
        return line

    # =========================================================================
    # SLIDE 1: Title Slide (Hero Executive Card)
    # =========================================================================
    s1 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s1, DARK_BG)
    
    # Background subtle geometry grid
    for x in [1.5, 4.0, 6.5, 9.0, 11.5]:
        line = s1.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x), Inches(0), Inches(x), Inches(7.5))
        line.line.color.rgb = RGBColor(15, 27, 45)
        line.line.width = Pt(0.75)
    
    # Central Hero Card
    card_w, card_h = 11.8, 6.4
    cx, cy = (13.333 - card_w) / 2, (7.5 - card_h) / 2
    hero_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx), Inches(cy), Inches(card_w), Inches(card_h))
    hero_card.fill.solid()
    hero_card.fill.fore_color.rgb = CARD_BG
    hero_card.line.color.rgb = CYAN
    hero_card.line.width = Pt(1.5)

    # Top Technology Badges
    badges = [
        ("365 nm UV-A AUTOFLUORESCENCE", PURPLE, cx + 0.6),
        ("850 nm NIR ABSORPTION", RED, cx + 3.8),
        ("ARDUINO UNO R4 EMBEDDED", CYAN, cx + 6.6),
        ("OPENCV COMPUTER VISION", TEAL, cx + 9.3)
    ]
    for text, col, bx in badges:
        badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bx), Inches(cy + 0.5), Inches(2.5), Inches(0.35))
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(18, 30, 52)
        badge.line.color.rgb = col
        badge.line.width = Pt(1.0)
        add_textbox(s1, bx, cy + 0.52, 2.5, 0.3, text, font_size=9, color=col, bold=True, align=PP_ALIGN.CENTER)

    # Title
    add_textbox(s1, cx + 0.6, cy + 1.15, 10.6, 0.85, "BloodTrace™", font_size=46, color=WHITE, bold=True)
    add_textbox(s1, cx + 0.6, cy + 2.05, 10.6, 0.5, "Dual-Wavelength Optical Contamination Screening Platform", font_size=22, color=CYAN_BRIGHT, bold=True)
    add_textbox(s1, cx + 0.6, cy + 2.65, 10.6, 0.6, 
                "Rapid, Non-Destructive Bioburden Localization for Reusable Surgical Instruments Prior to Autoclave Sterilization", 
                font_size=15, color=SLATE_LIGHT)

    # Divider
    div = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(cx + 0.6), Inches(cy + 3.4), Inches(10.6), Inches(0.02))
    div.fill.solid()
    div.fill.fore_color.rgb = CARD_BORDER
    div.line.fill.background()

    # Author & Institution block
    add_textbox(s1, cx + 0.6, cy + 3.65, 4.8, 0.35, "PRESENTER & PROJECT LEAD", font_size=11, color=CYAN, bold=True)
    add_textbox(s1, cx + 0.6, cy + 4.00, 4.8, 0.35, "Devansh Lila", font_size=18, color=WHITE, bold=True)
    add_textbox(s1, cx + 0.6, cy + 4.40, 5.2, 0.65, "Department of Mechanical / Biomedical Engineering\nMalaviya National Institute of Technology (MNIT) Jaipur", font_size=13, color=SLATE_LIGHT)

    # Right block: Engineering value proposition
    add_textbox(s1, cx + 6.2, cy + 3.65, 5.0, 0.35, "KEY INNOVATION METRICS", font_size=11, color=CYAN, bold=True)
    metrics_bullets = [
        "Hardware Bill-of-Materials: ~$64.00 (Low-resource healthcare accessibility)",
        "Screening Duration: < 3 seconds per instrument (Pre-autoclave quality gate)",
        "Multi-Spectral Physics: 365nm fluorophore emission + 850nm heme absorption"
    ]
    add_bullet_list(s1, cx + 6.2, cy + 4.00, 5.0, 1.2, metrics_bullets, font_size=12, text_color=SLATE_LIGHT, bullet_color=CYAN)

    # Mandatory Academic / Regulatory Disclaimer Banner
    disc = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx + 0.6), Inches(cy + 5.25), Inches(10.6), Inches(0.75))
    disc.fill.solid()
    disc.fill.fore_color.rgb = AMBER_BG
    disc.line.color.rgb = AMBER
    disc.line.width = Pt(1.0)
    add_textbox(s1, cx + 0.8, cy + 5.30, 10.2, 0.28, "⚠ REGULATORY SAFETY NOTICE & PROTOTYPE DEMARCATION", font_size=10, color=AMBER, bold=True)
    add_textbox(s1, cx + 0.8, cy + 5.58, 10.2, 0.40, 
                "BloodTrace is an experimental college-level engineering proof-of-concept screening prototype. It is NOT an FDA-cleared in-vitro diagnostic device. Categorizes candidate regions as 'Suspected Residue' to assist human inspection; cannot establish sterility or release tools for surgery.", 
                font_size=9, color=RGBColor(253, 230, 138))

    # =========================================================================
    # SLIDE 2: Problem Statement
    # =========================================================================
    s2 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s2, DARK_BG)
    add_header(s2, "Clinical Problem & Motivation", "Why Residual Soil on Reusable Instruments Demands Objective Screening", 2)

    # 3 High-Impact Cards across the top
    cards_data = [
        ("Bioburden In Crevices", 
         "Blood, cellular debris, and proteins become mechanically trapped in serrated jaws, box locks, and hinged joints of surgical forceps and clamps during invasive surgery. Incomplete manual washing leaves microscopic residues in these recesses.",
         RED, 0.75),
        ("The 'Baking' Hazard", 
         "Autoclave sterilization relies on direct pressurized saturated steam contact. If organic bioburden survives into the autoclave, steam cannot penetrate the dried coagulum; heat bakes proteins onto steel, shielding viable bacterial spores beneath.",
         AMBER, 4.80),
        ("Human Visual Inspection Gap", 
         "Under standard hospital overhead lighting, human visual inspection fails to detect up to 40% of residual micro-bioburden. Hospital-acquired surgical site infections (SSIs) cost healthcare systems over $3.3 Billion annually in avoidable morbidity.",
         CYAN, 8.85)
    ]
    for title, body, col, x in cards_data:
        add_card(s2, x, 1.50, 3.75, 2.85, title, body, accent_color=col, body_size=12)

    # Central Engineering Question Banner
    quest_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(4.60), Inches(11.85), Inches(1.85))
    quest_card.fill.solid()
    quest_card.fill.fore_color.rgb = CARD_BG
    quest_card.line.color.rgb = CYAN
    quest_card.line.width = Pt(1.5)

    add_textbox(s2, 1.05, 4.75, 11.25, 0.35, "CENTRAL ENGINEERING QUESTION", font_size=12, color=CYAN, bold=True)
    add_textbox(s2, 1.05, 5.10, 11.25, 0.70, 
                "“Can a compact, low-cost optoelectronic system combining 365 nm UV-A excitation and 850 nm NIR reflectance highlight candidate bioburden regions for human verification before instruments enter the autoclave?”",
                font_size=16, color=WHITE, bold=True)
    
    # Footnote
    add_textbox(s2, 1.05, 5.95, 11.25, 0.35, 
                "Scope: Experimental pre-sterilization inspection aid. Does not replace validated washer-disinfector protocols.", 
                font_size=11, color=SLATE)

    # =========================================================================
    # SLIDE 3: Where BloodTrace Fits
    # =========================================================================
    s3 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s3, DARK_BG)
    add_header(s3, "Sterile Processing Workflow", "Where BloodTrace Fits in Hospital Reusable Medical Device Reprocessing", 3)

    # 4-stage horizontal process pipeline based on FDA & CDC guidelines
    stages = [
        ("01", "Point-of-Use Care", 
         "Surgical Suite / Bedside", 
         "Immediate wiping at point of use; application of enzymatic foam/gel to prevent coagulum from drying before transport.", 
         TEAL, 0.75),
        ("02", "Cleaning & Decontamination", 
         "Central Sterile Dept (CSSD)", 
         "Ultrasonic immersion, enzymatic washing, and thermal disinfection in washer-disinfector units. Must precede sterilization.", 
         CYAN, 3.80),
        ("03", "BloodTrace Optical Screening", 
         "Pre-Packaging Quality Gate", 
         "3-second non-destructive screening. Flags hidden residue in hinges and serrations before instruments are wrapped in peel packs.", 
         GREEN, 6.85),
        ("04", "Terminal Sterilization", 
         "Autoclave Chamber", 
         "Pressurized steam sterilization (134°C, 30 psi). Validated only for physically clean instruments free of organic soil.", 
         WHITE, 9.90)
    ]
    for num, title, loc, desc, col, x in stages:
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.50), Inches(2.70), Inches(3.20))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = col if num == "03" else CARD_BORDER
        card.line.width = Pt(2.0 if num == "03" else 1.0)
        
        # Step number pill
        pill = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.15), Inches(1.65), Inches(0.55), Inches(0.35))
        pill.fill.solid()
        pill.fill.fore_color.rgb = col
        pill.line.fill.background()
        add_textbox(s3, x + 0.15, 1.68, 0.55, 0.3, num, font_size=12, color=DARK_BG, bold=True, align=PP_ALIGN.CENTER)
        
        add_textbox(s3, x + 0.80, 1.65, 1.75, 0.40, title, font_size=13, color=col, bold=True)
        add_textbox(s3, x + 0.15, 2.15, 2.40, 0.30, loc.upper(), font_size=9, color=SLATE, bold=True)
        
        div = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.15), Inches(2.50), Inches(2.40), Inches(0.01))
        div.fill.solid()
        div.fill.fore_color.rgb = CARD_BORDER
        div.line.fill.background()
        
        add_textbox(s3, x + 0.15, 2.65, 2.40, 1.85, desc, font_size=11, color=SLATE_LIGHT)

    # Arrows between cards
    add_arrow(s3, 3.48, 3.00, 3.75, 3.00, CYAN, 2.0)
    add_arrow(s3, 6.53, 3.00, 6.80, 3.00, GREEN, 2.5)
    add_arrow(s3, 9.58, 3.00, 9.85, 3.00, CYAN, 2.0)

    # Bottom comparison summary card: Optical Screening vs Existing Swabs
    comp_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(4.90), Inches(11.85), Inches(1.85))
    comp_card.fill.solid()
    comp_card.fill.fore_color.rgb = CARD_BG
    comp_card.line.color.rgb = CARD_BORDER
    comp_card.line.width = Pt(1.0)

    add_textbox(s3, 1.00, 5.05, 11.35, 0.35, "KEY COMPETITIVE ADVANTAGES OVER EXISTING HOSPITAL CLEANING TESTS", font_size=11, color=CYAN, bold=True)
    bullets_comp = [
        "Non-Destructive & Zero Consumables: Protein swab assays (ninhydrin, biuret) and ATP bioluminescence consume costly chemical reagents ($3–$8/test) and destroy sample traces. BloodTrace uses zero chemical consumables.",
        "Spatial Defect Localization: Chemical swabs only yield an aggregate pass/fail number without pinpointing location. BloodTrace maps the exact crevice, hinge, or serration requiring mechanical brush re-cleaning.",
        "Rapid Throughput: Operates in < 3 seconds per instrument vs. 5–10 minute incubation for swab-based enzymatic reactions."
    ]
    add_bullet_list(s3, 1.00, 5.40, 11.35, 1.25, bullets_comp, font_size=11, text_color=SLATE_LIGHT, bullet_color=CYAN)

    # =========================================================================
    # SLIDE 4: Proposed Solution (Dual-Wavelength Optical Physics)
    # =========================================================================
    s4 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s4, DARK_BG)
    add_header(s4, "Optical Physics & Methodology", "Dual-Wavelength Differential Spectroscopy: Overcoming Single-Band Pitfalls", 4)

    # 3 Spectroscopy Mechanism Cards
    optics_cards = [
        ("365 nm UV-A Autofluorescence", 
         "Excitation of Native Fluorophores",
         "Excites cellular proteins, tryptophan, NADH, and porphyrins in organic bioburden, inducing secondary fluorescence emission in the 420–480 nm band. Clean passivated surgical stainless steel exhibits virtually zero autofluorescence.",
         PURPLE, 0.75),
        ("850 nm NIR Absorption", 
         "Hemoglobin Spectral Signature",
         "Blood exhibits intense absorption peaks in the near-infrared band (700–900 nm) due to oxyhemoglobin and methemoglobin electronic transitions. Clean electropolished steel specularly reflects ~85% of 850 nm light, creating sharp contrast.",
         RED, 4.80),
        ("Normalized Difference Index (NDI)", 
         "Differential Pixel Subtraction",
         "Single-band UV suffers false positives from lint, detergent residues, and rust. Cross-correlating UV emission with NIR absorption ratio isolates true biological coagulum and cancels ambient glare and surface finish variations.",
         CYAN, 8.85)
    ]
    for title, sub, desc, col, x in optics_cards:
        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.50), Inches(3.75), Inches(3.10))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = col
        card.line.width = Pt(1.5)
        
        add_textbox(s4, x + 0.20, 1.65, 3.35, 0.35, title, font_size=15, color=col, bold=True)
        add_textbox(s4, x + 0.20, 2.00, 3.35, 0.25, sub.upper(), font_size=9, color=SLATE, bold=True)
        
        div = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.20), Inches(2.35), Inches(3.35), Inches(0.01))
        div.fill.solid()
        div.fill.fore_color.rgb = CARD_BORDER
        div.line.fill.background()
        
        add_textbox(s4, x + 0.20, 2.50, 3.35, 1.95, desc, font_size=12, color=SLATE_LIGHT)

    # Bottom Formula & Pipeline Flow
    flow_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(4.80), Inches(11.85), Inches(1.95))
    flow_box.fill.solid()
    flow_box.fill.fore_color.rgb = CARD_BG
    flow_box.line.color.rgb = CARD_BORDER
    flow_box.line.width = Pt(1.0)

    add_textbox(s4, 1.00, 4.95, 11.35, 0.35, "NORMALIZED DIFFERENTIAL MULTI-SPECTRAL EQUATION & OPTICAL PIPELINE", font_size=11, color=CYAN, bold=True)
    
    # 4 Horizontal steps inside bottom card
    steps_bot = [
        ("Step 1: Strobe", "Arduino switches 365nm UV then 850nm NIR LEDs via low-side MOSFETs."),
        ("Step 2: Capture", "CMOS USB camera acquires aligned frames; BPW34 photodiode logs total flux."),
        ("Step 3: Compute NDI", "NDI = (I_UV - I_NIR) / (I_UV + I_NIR + ε) computed per pixel."),
        ("Step 4: Segment", "Adaptive Otsu threshold + morphological opening yields candidate contours.")
    ]
    for i, (st, sd) in enumerate(steps_bot):
        sx = 1.00 + i * 2.85
        add_textbox(s4, sx, 5.35, 2.70, 0.30, st, font_size=13, color=CYAN_BRIGHT, bold=True)
        add_textbox(s4, sx, 5.70, 2.70, 0.90, sd, font_size=11, color=SLATE_LIGHT)
        if i < 3:
            add_arrow(s4, sx + 2.55, 5.80, sx + 2.75, 5.80, CYAN, 1.5)

    # =========================================================================
    # SLIDE 5: System Architecture & Hardware Implementation
    # =========================================================================
    s5 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s5, DARK_BG)
    add_header(s5, "Hardware & Electrical Engineering", "Embedded Architecture, Circuit Interconnects & Bill of Materials", 5)

    # Left Column: Circuit & Subsystem Breakdown (x: 0.75 to 6.80)
    left_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.50), Inches(6.00), Inches(5.25))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = CARD_BG
    left_card.line.color.rgb = CARD_BORDER
    left_card.line.width = Pt(1.0)

    add_textbox(s5, 0.95, 1.65, 5.60, 0.35, "EMBEDDED HARDWARE SUBSYSTEMS", font_size=13, color=CYAN, bold=True)

    hardware_items = [
        ("Arduino UNO R4 Minima", "Renesas RA4M1 32-bit ARM Cortex-M4 @ 48 MHz with 14-bit ADC resolution; coordinates LED microsecond strobing and telemetric USB serial streaming."),
        ("UV Illumination Channel", "High-power 365 nm UV-A LED driven via Pin D9 using AO3400 logic-level N-MOSFET (1 kΩ gate resistor, 10 kΩ pulldown to prevent floating gate during boot)."),
        ("NIR Illumination Channel", "Dual 850 nm NIR LEDs driven via Pin D10 using AO3400 N-MOSFET with precision current-limiting ballast resistors (V_drop = 1.6V @ 100mA)."),
        ("Single-Point Optical Sensor", "BPW34 silicon PIN photodiode coupled to high-speed transimpedance amplifier module on Analog Pin A0 (Measures aggregate reflected light flux)."),
        ("Spatial Image Acquisition", "USB CMOS camera with IR-cut filter removed; sends uncompressed video frames directly to host laptop (never loaded onto microcontroller memory).")
    ]
    for i, (ht, hd) in enumerate(hardware_items):
        hy = 2.05 + i * 0.90
        add_textbox(s5, 0.95, hy, 5.60, 0.28, f"•  {ht}", font_size=12, color=CYAN_BRIGHT, bold=True)
        add_textbox(s5, 1.15, hy + 0.28, 5.40, 0.55, hd, font_size=11, color=SLATE_LIGHT)

    # Right Column: Wiring Pinout Table & BOM Cost (x: 6.95 to 12.60)
    right_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.95), Inches(1.50), Inches(5.65), Inches(5.25))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = CARD_BG
    right_card.line.color.rgb = CARD_BORDER
    right_card.line.width = Pt(1.0)

    add_textbox(s5, 7.15, 1.65, 5.25, 0.35, "PINOUT INTERCONNECT MATRIX", font_size=13, color=CYAN, bold=True)

    # Pin table
    table_shape = s5.shapes.add_table(6, 3, Inches(7.15), Inches(2.10), Inches(5.25), Inches(2.20))
    table = table_shape.table
    table.columns[0].width = Inches(1.20)
    table.columns[1].width = Inches(2.40)
    table.columns[2].width = Inches(1.65)

    headers = ["Pin", "Connected Hardware", "Signal / Protection"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(25, 45, 75)
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = CYAN

    rows = [
        ("D9 (PWM)", "UV MOSFET Gate (AO3400)", "1 kΩ series + 10 kΩ pull"),
        ("D10 (PWM)", "NIR MOSFET Gate (AO3400)", "1 kΩ series + 10 kΩ pull"),
        ("A0 (ADC)", "BPW34 Transimpedance Out", "0–3.3V Analog Voltage"),
        ("D2 (GPIO)", "Tactile Trigger Pushbutton", "INPUT_PULLUP to GND"),
        ("5V / GND", "Sensor Module / Common GND", "Isolated clean ground rail")
    ]
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(15, 27, 48)
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Segoe UI"
            p.font.size = Pt(9.5)
            p.font.color.rgb = WHITE if j == 0 else SLATE_LIGHT

    # Bottom Cost & BOM Box
    bom_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.15), Inches(4.55), Inches(5.25), Inches(2.00))
    bom_box.fill.solid()
    bom_box.fill.fore_color.rgb = RGBColor(20, 35, 60)
    bom_box.line.color.rgb = GREEN
    bom_box.line.width = Pt(1.2)

    add_textbox(s5, 7.30, 4.65, 4.95, 0.30, "BILL OF MATERIALS (PROTOTYPE COST ESTIMATE)", font_size=11, color=GREEN, bold=True)
    bom_bullets = [
        "Arduino UNO R4 Minima Board: ~$20.00",
        "Optical LEDs (365nm UV + 850nm NIR): ~$12.00",
        "BPW34 Photodiode + Transimpedance Amp: ~$8.00",
        "USB CMOS Camera Module (IR wide-band): ~$18.00",
        "Enclosure, Baffles, MOSFETs, Passives: ~$6.00",
        "TOTAL PROTOTYPE FABRICATION COST: ~$64.00"
    ]
    add_bullet_list(s5, 7.30, 4.95, 4.95, 1.50, bom_bullets, font_size=10, text_color=SLATE_LIGHT, bullet_color=GREEN)

    # =========================================================================
    # SLIDE 6: Working Principle & Computer Vision Pipeline
    # =========================================================================
    s6 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s6, DARK_BG)
    add_header(s6, "Computer Vision Pipeline", "5-Stage Algorithmic Pipeline: From Optical Frames to Registered Heatmap", 6)

    # 5 Horizontal Pipeline Step Cards
    pipeline_steps = [
        ("01. Acquisition", 
         "Synchronized multi-spectral capture. Takes visible baseline, 365 nm UV, and 850 nm NIR frames with locked exposure, white balance, and fixed camera distance.",
         CYAN, 0.75),
        ("02. Registration", 
         "Pixel-aligned spatial homography and dark-frame background subtraction. Normalizes ambient stray light and compensates for curved metallic reflections.",
         TEAL, 3.15),
        ("03. Difference", 
         "Calculates Normalized Difference Index (NDI) between UV emission and NIR absorption. Cancels specular glare and metallic machining marks.",
         CYAN_BRIGHT, 5.55),
        ("04. Filtering", 
         "Morphological opening and Gaussian blurring remove high-frequency camera noise. Adaptive dynamic Otsu threshold isolates coagulated bioburden crusts.",
         AMBER, 7.95),
        ("05. Heatmap & ROI", 
         "Contour extraction generates spatial bounding boxes. Computes % contaminated area and assigns simulation confidence score per region.",
         GREEN, 10.35)
    ]
    for title, desc, col, x in pipeline_steps:
        card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.50), Inches(2.25), Inches(3.20))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = col
        card.line.width = Pt(1.5)
        
        add_textbox(s6, x + 0.12, 1.65, 2.00, 0.35, title, font_size=13, color=col, bold=True)
        div = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.12), Inches(2.05), Inches(2.00), Inches(0.01))
        div.fill.solid(); div.fill.fore_color.rgb = CARD_BORDER; div.line.fill.background()
        add_textbox(s6, x + 0.12, 2.20, 2.00, 2.30, desc, font_size=11, color=SLATE_LIGHT)

    # Arrows between cards
    for i in range(4):
        ax = 0.75 + (i * 2.40) + 2.25
        add_arrow(s6, ax + 0.02, 3.00, ax + 0.14, 3.00, CYAN, 1.5)

    # Bottom Classification Output & Interpretation Box
    out_box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(4.90), Inches(11.85), Inches(1.85))
    out_box.fill.solid()
    out_box.fill.fore_color.rgb = CARD_BG
    out_box.line.color.rgb = CARD_BORDER
    out_box.line.width = Pt(1.0)

    add_textbox(s6, 1.00, 5.05, 11.35, 0.35, "TRIPARTITE SCREENING OUTCOME TAXONOMY", font_size=11, color=CYAN, bold=True)
    
    outcomes = [
        ("PASS / UNFLAGGED (Green)", "No candidate region detected. Steel surface reflects uniform NIR (~760 a.u.) with baseline UV (<20 a.u.). Cleared for packaging."),
        ("FAIL / RESIDUE (Red)", "Candidate contamination detected. Significant NIR absorption drop (>40%) and elevated UV fluorescence. Routed to ultrasonic re-wash."),
        ("AMBIGUOUS / REVIEW (Amber)", "Optical variance detected (e.g. dried detergent film or water scale) without distinct hemoglobin signature. Routed to manual microscopy.")
    ]
    for i, (ot, od) in enumerate(outcomes):
        ox = 1.00 + i * 3.80
        col = GREEN if i == 0 else (RED if i == 1 else AMBER)
        add_textbox(s6, ox, 5.40, 3.65, 0.30, ot, font_size=12, color=col, bold=True)
        add_textbox(s6, ox, 5.75, 3.65, 0.90, od, font_size=11, color=SLATE_LIGHT)

    # =========================================================================
    # SLIDE 7: Experimental Plan & Evaluation Metrics
    # =========================================================================
    s7 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s7, DARK_BG)
    add_header(s7, "Experimental Validation & Testing", "Controlled Testing Protocol, Confounder Controls & Quantitative Metrics", 7)

    # Left: 4 Controlled Sample Groups (x: 0.75 to 6.80)
    left_card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.50), Inches(5.80), Inches(5.25))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = CARD_BG
    left_card.line.color.rgb = CARD_BORDER
    left_card.line.width = Pt(1.0)

    add_textbox(s7, 0.95, 1.65, 5.40, 0.35, "FOUR CONTROLLED EXPERIMENTAL TEST GROUPS", font_size=13, color=CYAN, bold=True)

    test_groups = [
        ("1. Clean Reference Surface (Negative Control)", "Electropolished AISI 316L stainless steel coupons; ultrasonic cleaned and autoclaved. Demonstrates zero false-positive rate under baseline settings."),
        ("2. Surrogate Blood Challenge (Positive Challenge)", "Safely prepared, non-hazardous protein/hemoglobin surrogate spots (1 μL – 50 μL) dried under controlled ambient temperature. Tests spatial recovery and detection limit."),
        ("3. Detergent Residue Controls (Interference)", "Surfaces dried with residual enzymatic hospital cleaning detergent. Tests whether algorithm distinguishes detergent fluorescence from true blood bioburden."),
        ("4. Water Marks & Mineral Scale (Confounders)", "Distilled vs. tap water evaporated scale. Tests rejection of specular drying rings and inorganic salt deposits.")
    ]
    for i, (gt, gd) in enumerate(test_groups):
        gy = 2.05 + i * 1.15
        add_textbox(s7, 0.95, gy, 5.40, 0.30, gt, font_size=12, color=CYAN_BRIGHT, bold=True)
        add_textbox(s7, 0.95, gy + 0.32, 5.40, 0.75, gd, font_size=11, color=SLATE_LIGHT)

    # Right: Quantitative Performance Metrics (x: 6.80 to 12.60)
    right_card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.80), Inches(1.50), Inches(5.80), Inches(5.25))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = CARD_BG
    right_card.line.color.rgb = CARD_BORDER
    right_card.line.width = Pt(1.0)

    add_textbox(s7, 7.00, 1.65, 5.40, 0.35, "STATISTICAL EVALUATION METRICS & TARGET CRITERIA", font_size=13, color=CYAN, bold=True)

    metrics_list = [
        ("Sensitivity (True Positive Rate)", "TP / (TP + FN) × 100%", "Target: ≥ 92%", "Measures fraction of true contaminated bioburden regions correctly flagged by the system."),
        ("Specificity (True Negative Rate)", "TN / (TN + FP) × 100%", "Target: ≥ 95%", "Measures fraction of clean steel surfaces correctly left unflagged without nuisance alarms."),
        ("False Positive Rate (FPR)", "FP / (FP + TN) × 100%", "Target: ≤ 5%", "Guarantees hospital technicians are not overwhelmed by false alarms on sterile instruments."),
        ("Intra-Sample Repeatability", "CV = (σ / μ) × 100%", "Target: CV ≤ 4.5%", "Calculates consistency across 5 consecutive scans of the identical specimen.")
    ]
    for i, (mt, mf, tg, md) in enumerate(metrics_list):
        my = 2.05 + i * 1.15
        add_textbox(s7, 7.00, my, 3.60, 0.28, mt, font_size=12, color=WHITE, bold=True)
        add_textbox(s7, 10.60, my, 1.80, 0.28, tg, font_size=11, color=GREEN, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(s7, 7.00, my + 0.28, 5.40, 0.25, f"Formula:  {mf}", font_size=10, color=CYAN)
        add_textbox(s7, 7.00, my + 0.52, 5.40, 0.55, md, font_size=10.5, color=SLATE_LIGHT)

    # =========================================================================
    # SLIDE 8: Future Scope & Engineering Roadmap
    # =========================================================================
    s8 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s8, DARK_BG)
    add_header(s8, "Future Scope & Commercialization", "Development Roadmap: From College Proof-of-Concept to Clinical Deployment", 8)

    # 3 Roadmap Horizons
    horizons = [
        ("Phase 1: Optical Hardware Refinement", 
         "Next 6 Months (Laboratory Prototype)",
         "• 3D-Printed Inspection Cassette: Enclosed light-tight matte chamber with integrated mechanical instrument positioning jig.\n• Narrowband Optical Filters: 850nm bandpass optical filter mounted to camera lens to eliminate ambient fluorescent lamp spillover.\n• Custom PCB Fabrication: Replace breadboard with integrated STM32/ESP32-S3 PCB, onboard MOSFET gate drivers, and low-noise LDOs.",
         TEAL, 0.75),
        ("Phase 2: Algorithmic Machine Learning", 
         "Months 6 – 12 (Algorithm & Edge AI)",
         "• Lightweight Edge Neural Network: Train MobileNetV4 / YOLOv8-nano on multi-hospital surgical tool imagery for joint localization.\n• Multi-Alloy Spectral Library: Extend optical compensation models to matte satin, bead-blasted, and titanium nitride (TiN) gold finishes.\n• Automated Box-Lock Tracking: Automatically segment high-risk anatomical crevices (box-locks, serrations, ratchets).",
         CYAN, 4.80),
        ("Phase 3: IP & Hospital Clinical Validation", 
         "Months 12 – 18 (Translation & Diligence)",
         "• Institutional IP Filing: File provisional patent via MNIT Jaipur IPR cell covering dual-wavelength optical geometry & NDI algorithm.\n• Hospital Trial Partnership: Pilot non-clinical bench testing with SMS Hospital / Medical College Central Sterile Processing Department (CSSD).\n• Regulatory Pathway: Target FDA 510(k) Class II clearance as an accessory to medical device washer-disinfectors.",
         AMBER, 8.85)
    ]
    for title, sub, desc, col, x in horizons:
        card = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.50), Inches(3.75), Inches(5.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = col
        card.line.width = Pt(1.5)
        
        add_textbox(s8, x + 0.20, 1.70, 3.35, 0.50, title, font_size=15, color=col, bold=True)
        add_textbox(s8, x + 0.20, 2.25, 3.35, 0.28, sub.upper(), font_size=9, color=SLATE, bold=True)
        
        div = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.20), Inches(2.60), Inches(3.35), Inches(0.01))
        div.fill.solid(); div.fill.fore_color.rgb = CARD_BORDER; div.line.fill.background()
        
        add_textbox(s8, x + 0.20, 2.75, 3.35, 3.85, desc, font_size=11.5, color=SLATE_LIGHT)

    # =========================================================================
    # SLIDE 9: References & Regulatory Compliance Disclosures
    # =========================================================================
    s9 = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(s9, DARK_BG)
    add_header(s9, "References & Regulatory Compliance", "Academic Literature, Infection Control Guidelines & Responsible Disclaimers", 9)

    # Top Citations Card (x: 0.75, y: 1.50, w: 11.85, h: 3.40)
    ref_card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.50), Inches(11.85), Inches(3.40))
    ref_card.fill.solid()
    ref_card.fill.fore_color.rgb = CARD_BG
    ref_card.line.color.rgb = CARD_BORDER
    ref_card.line.width = Pt(1.0)

    add_textbox(s9, 1.00, 1.65, 11.35, 0.35, "AUTHORITATIVE REGULATORY & SCIENTIFIC CITATIONS", font_size=11, color=CYAN, bold=True)

    citations = [
        ("1. U.S. Food and Drug Administration (FDA)", 
         "Reprocessing Medical Devices in Health Care Settings: Validation Methods and Labeling. Guidance for Industry and FDA Staff.",
         "https://www.fda.gov/medical-devices/reprocessing-reusable-medical-devices/how-are-reusable-medical-devices-reprocessed"),
        ("2. Centers for Disease Control and Prevention (CDC / HICPAC)", 
         "Rutala, W. A., & Weber, D. J. (2016). Disinfection and Sterilization in Healthcare Facilities: An Overview and Current Issues. Infectious Disease Clinics of North America, 30(3), 609–637.",
         "https://www.cdc.gov/infection-control/hcp/disinfection-sterilization/healthcare-equipment.html"),
        ("3. PubMed Central (PMC) Bioburden Standards", 
         "Residual protein and bioburden evaluation on reusable surgical instruments: Limits of naked-eye visual inspection. PMCID: PMC8909895 / PMC7134755.",
         "https://pmc.ncbi.nlm.nih.gov/articles/PMC8909895/"),
        ("4. Association for the Advancement of Medical Instrumentation (AAMI)", 
         "ANSI/AAMI ST79 & TIR30: Comprehensive guide to steam sterilization and sterility assurance in health care facilities. Establishing < 6.4 μg/cm² residual protein benchmarks.",
         "https://www.aami.org/")
    ]
    for i, (lead, title, url) in enumerate(citations):
        cy = 2.05 + i * 0.70
        add_textbox(s9, 1.00, cy, 11.35, 0.25, lead, font_size=11, color=CYAN_BRIGHT, bold=True)
        add_textbox(s9, 1.00, cy + 0.22, 11.35, 0.25, f"{title} — {url}", font_size=9.5, color=SLATE_LIGHT)

    # Bottom Prominent Mandatory Disclaimer Banner (y: 5.05, h: 1.70)
    warn_card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(5.05), Inches(11.85), Inches(1.70))
    warn_card.fill.solid()
    warn_card.fill.fore_color.rgb = AMBER_BG
    warn_card.line.color.rgb = AMBER
    warn_card.line.width = Pt(1.5)

    add_textbox(s9, 1.00, 5.15, 11.35, 0.30, "⚠ MANDATORY CLINICAL & SAFETY DISCLAIMER FOR JUDGES AND FACULTY", font_size=11, color=AMBER, bold=True)
    disclaimer_text = (
        "• BloodTrace™ is an engineering research proof-of-concept simulation and prototype. It is NOT an FDA-cleared in-vitro diagnostic device.\n"
        "• The system provides exploratory optical screening to identify candidate areas that warrant human inspection and re-cleaning. It does not replace validated chemical/thermal cleaning, disinfection, or terminal autoclaving.\n"
        "• Results are reported strictly as 'Candidate Residue' or 'Suspected Contamination'. An absence of optical contrast does not prove chemical cleanliness, biological sterility, or instrument safety for patient surgical use."
    )
    add_textbox(s9, 1.00, 5.50, 11.35, 1.15, disclaimer_text, font_size=10, color=RGBColor(253, 230, 138))

    # Core Presentation Metadata
    prs.core_properties.title = "BloodTrace™ — Dual-Wavelength Optical Contamination Screening Presentation"
    prs.core_properties.subject = "College Engineering Project Presentation for Faculty & Investors"
    prs.core_properties.author = "Devansh Lila, MNIT Jaipur"
    prs.core_properties.keywords = "BloodTrace, surgical instruments, bioburden, optical screening, Arduino, computer vision"

    # Save
    prs.save(str(OUTPUT_PPTX))
    print(f"\nPresentation successfully generated at:\n{OUTPUT_PPTX}")
    print(f"File size: {os.path.getsize(OUTPUT_PPTX):,} bytes")
    print("Total slides: 9 (Widescreen 16:9)")

if __name__ == "__main__":
    create_presentation()
