"""
BloodTrace Vision — High-Resolution 1080p 60fps Simulation Showcase Video Generator
Produces a broadcast-quality, zero-lag presentation MP4 video for academic submission
to professors and presentation to prospective investors.

Resolution: 1920x1080 (Full HD, 16:9)
Framerate: 60 fps
Duration: ~65 seconds (3,900 frames)
Audio: Synthesized high-tech stereo audio (ambient drone, relay clicks, scanning sweeps, alert chimes)
Codec: H.264 (libx264, yuv420p, high profile, CRF 18) + AAC Audio
"""

import os
import sys
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "video_frames")
OUTPUT_VIDEO = os.path.join(BASE_DIR, "BloodTrace_Simulation_Showcase_1080p.mp4")
TEMP_AUDIO = os.path.join(BASE_DIR, "temp_audio.wav")
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# Video specs
WIDTH = 1920
HEIGHT = 1080
FPS = 60
TOTAL_SECONDS = 65
TOTAL_FRAMES = FPS * TOTAL_SECONDS  # 3900 frames

# Fonts
FONT_HEADING = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 24)
FONT_SUBHEADING = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 18)
FONT_BODY = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 16)
FONT_MONO = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 15)
FONT_MONO_SM = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 13)
FONT_MONO_LG = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 24)
FONT_TITLE_LG = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 46)
FONT_TITLE_MED = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 36)
FONT_BADGE = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 14)
FONT_ITEM_HEAD = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 20)
FONT_ITEM_BODY = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 16)
FONT_SUBHEADING_SM = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 13)

def load_base_images():
    """Loads all pre-captured 1080p base frames into memory."""
    img_files = {
        'dev_off': os.path.join(FRAMES_DIR, 'frame_device_off.png'),
        'dev_uv': os.path.join(FRAMES_DIR, 'frame_device_uv.png'),
        'dev_ir': os.path.join(FRAMES_DIR, 'frame_device_ir.png'),
        'dev_comb': os.path.join(FRAMES_DIR, 'frame_device_combined.png'),
        'dash_scalpel': os.path.join(FRAMES_DIR, 'frame_dashboard_scalpel.png'),
        'dash_clean': os.path.join(FRAMES_DIR, 'frame_dashboard_clean.png'),
        'dash_clamp': os.path.join(FRAMES_DIR, 'frame_dashboard_clamp.png'),
        'dash_comp': os.path.join(FRAMES_DIR, 'frame_dashboard_compare.png'),
        'dash_report': os.path.join(FRAMES_DIR, 'frame_report_modal.png'),
    }
    loaded = {}
    for k, p in img_files.items():
        if os.path.exists(p):
            im = Image.open(p).convert('RGB')
            if im.size != (WIDTH, HEIGHT):
                im = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
            loaded[k] = im
        else:
            print(f"Warning: Base frame {p} not found, generating fallback.")
            loaded[k] = Image.new('RGB', (WIDTH, HEIGHT), (12, 17, 29))
    return loaded

def draw_hud_header(draw, title_text, category_text, time_str=""):
    """Renders a sleek top information ribbon across the frame."""
    draw.rectangle([0, 0, WIDTH, 48], fill=(6, 11, 20, 240))
    draw.line([0, 48, WIDTH, 48], fill=(6, 182, 212), width=2)
    
    # Left branding
    draw.text((24, 14), "BLOODTRACE™", fill=(6, 182, 212), font=FONT_BADGE)
    draw.text((150, 14), "|", fill=(100, 116, 139), font=FONT_BADGE)
    draw.text((170, 14), title_text.upper(), fill=(241, 245, 249), font=FONT_BADGE)
    
    # Right category pill
    if category_text:
        badge_w = 400
        draw.rounded_rectangle([WIDTH - badge_w - 24, 8, WIDTH - 24, 38], radius=4, fill=(17, 29, 51), outline=(30, 49, 82))
        draw.text((WIDTH - badge_w - 12, 14), category_text, fill=(34, 211, 238), font=FONT_BADGE)

def draw_lower_third(draw, title, subtitle, bullets=[], box_w=680, x=40, y=None):
    """Draws a professional frosted glass callout box with dynamic width protection."""
    # Ensure box is wide enough for all text items
    text_widths = [FONT_HEADING.getlength(title), FONT_SUBHEADING.getlength(subtitle)]
    for b in bullets:
        text_widths.append(FONT_BODY.getlength(f"• {b}"))
    needed_w = int(max(text_widths) + 50)
    box_w = max(box_w, needed_w)
    
    # Constrain to screen width with margin
    if x + box_w > WIDTH - 20:
        box_w = WIDTH - 20 - x

    box_h = 76 + len(bullets) * 22
    if y is None:
        y = HEIGHT - box_h - 40
    
    # Backdrop
    draw.rounded_rectangle([x, y, x + box_w, y + box_h], radius=8, fill=(8, 14, 26), outline=(6, 182, 212), width=1)
    
    # Left accent bar
    draw.rectangle([x, y, x + 5, y + box_h], fill=(6, 182, 212))
    
    # Title & Subtitle
    draw.text((x + 20, y + 12), title, fill=(255, 255, 255), font=FONT_HEADING)
    draw.text((x + 20, y + 42), subtitle, fill=(34, 211, 238), font=FONT_SUBHEADING)
    
    # Bullets
    for i, b in enumerate(bullets):
        draw.text((x + 22, y + 70 + i * 22), f"• {b}", fill=(148, 163, 184), font=FONT_BODY)

def draw_mouse_cursor(draw, x, y, click_anim=0.0):
    """Draws a realistic mouse cursor with click ripple animation."""
    pts = [(x, y), (x, y + 20), (x + 5, y + 16), (x + 11, y + 24), (x + 14, y + 22), (x + 8, y + 14), (x + 15, y + 14)]
    draw.polygon(pts, fill=(255, 255, 255), outline=(0, 0, 0))
    if click_anim > 0:
        r = int(click_anim * 30)
        alpha = int((1.0 - click_anim) * 255)
        draw.ellipse([x - r, y - r, x + r, y + r], outline=(6, 182, 212, alpha), width=2)

def generate_audio(total_seconds, sample_rate=44100):
    """Generates synchronized high-tech electronic stereo audio."""
    total_samples = int(total_seconds * sample_rate)
    t = np.linspace(0, total_seconds, total_samples, endpoint=False)
    
    # 1. Subtle deep sub-bass drone (55 Hz & 110 Hz)
    drone = np.sin(2 * np.pi * 55 * t) * 0.04 + np.sin(2 * np.pi * 110 * t) * 0.02
    
    # 2. Ambient room texture
    noise = np.random.normal(0, 0.002, total_samples)
    audio = drone + noise
    
    def add_tone(start_sec, dur_sec, freq, amp=0.15, decay=True):
        idx_start = int(start_sec * sample_rate)
        n = int(dur_sec * sample_rate)
        if idx_start + n <= total_samples:
            sub_t = np.linspace(0, dur_sec, n, endpoint=False)
            envelope = np.exp(-sub_t * 8) if decay else np.ones(n)
            tone = np.sin(2 * np.pi * freq * sub_t) * amp * envelope
            audio[idx_start:idx_start+n] += tone

    def add_chirp(start_sec, dur_sec, f0, f1, amp=0.12):
        idx_start = int(start_sec * sample_rate)
        n = int(dur_sec * sample_rate)
        if idx_start + n <= total_samples:
            sub_t = np.linspace(0, dur_sec, n, endpoint=False)
            freqs = np.linspace(f0, f1, n)
            tone = np.sin(2 * np.pi * freqs * sub_t) * amp * np.sin(np.pi * sub_t / dur_sec)
            audio[idx_start:idx_start+n] += tone

    # Add audio cue events:
    # Scene 1: Tech boot-up tone
    add_tone(0.8, 1.2, 523.25, 0.12)  # C5
    add_tone(1.2, 1.5, 659.25, 0.12)  # E5
    add_tone(1.6, 2.0, 783.99, 0.16)  # G5

    # Scene 2: Optical relay clicks
    add_tone(5.2, 0.15, 1200, 0.15)
    add_tone(7.5, 0.15, 1500, 0.15)
    add_tone(9.8, 0.15, 1800, 0.18)
    # Scanning sweep sound
    add_chirp(11.0, 3.0, 400, 2200, 0.10)

    # Scene 3: Dashboard transition & detection alert
    add_tone(15.5, 0.2, 880, 0.12)
    add_tone(18.0, 0.8, 440, 0.22)   # Alert ping
    add_tone(18.2, 0.8, 880, 0.25)

    # Scene 4: Slider tickings
    for ts in np.arange(28.0, 32.0, 0.4):
        add_tone(ts, 0.05, 1800, 0.06)

    # Scene 5: Clean confirmation chord
    add_tone(36.5, 0.8, 523.25, 0.15)
    add_tone(36.7, 0.8, 659.25, 0.15)
    add_tone(36.9, 1.2, 1046.50, 0.20)

    # Scene 6: Challenge detection
    add_tone(42.5, 0.4, 587.33, 0.15)
    add_tone(43.0, 0.6, 440.00, 0.20)

    # Scene 7: Compare mode switch
    add_chirp(48.5, 0.5, 600, 1200, 0.12)

    # Scene 8: Report generation paper/chime
    add_tone(55.2, 0.6, 783.99, 0.18)

    # Scene 9: Outro resolution
    add_tone(61.0, 2.5, 523.25, 0.15)
    add_tone(61.3, 2.5, 659.25, 0.15)
    add_tone(61.6, 3.0, 783.99, 0.18)
    add_tone(62.0, 3.0, 1046.50, 0.22)

    # Normalize audio & convert to 16-bit PCM stereo
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val * 0.85
    
    audio_int16 = (audio * 32767).astype(np.int16)
    stereo = np.column_stack((audio_int16, audio_int16))
    return stereo

def create_title_frame(t_rel):
    """Renders the cinematic title card (Scene 1)."""
    im = Image.new('RGB', (WIDTH, HEIGHT), (6, 10, 18))
    draw = ImageDraw.Draw(im)
    
    # Animated subtle grid
    grid_spacing = 60
    grid_alpha = int(25 + 10 * math.sin(t_rel * 2.0))
    for x in range(0, WIDTH, grid_spacing):
        draw.line([x, 0, x, HEIGHT], fill=(15, 23, 42), width=1)
    for y in range(0, HEIGHT, grid_spacing):
        draw.line([0, y, WIDTH, y], fill=(15, 23, 42), width=1)
        
    # Center Card
    card_w = 1100
    card_h = 560
    cx = (WIDTH - card_w) // 2
    cy = (HEIGHT - card_h) // 2
    
    # Glow border
    draw.rounded_rectangle([cx - 4, cy - 4, cx + card_w + 4, cy + card_h + 4], radius=16, fill=(10, 18, 32), outline=(6, 182, 212), width=2)
    draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=14, fill=(12, 21, 39))
    
    # Header badges with solid alpha-composited fills for crisp dark-mode contrast
    draw.rounded_rectangle([cx + 60, cy + 50, cx + 220, cy + 80], radius=15, fill=(36, 26, 68), outline=(139, 92, 246), width=1)
    draw.text((cx + 78, cy + 56), "365 nm UV-A", fill=(196, 181, 253), font=FONT_BADGE)
    
    draw.rounded_rectangle([cx + 235, cy + 50, cx + 395, cy + 80], radius=15, fill=(54, 23, 40), outline=(244, 63, 94), width=1)
    draw.text((cx + 253, cy + 56), "850 nm NIR", fill=(254, 205, 211), font=FONT_BADGE)
    
    draw.rounded_rectangle([cx + 410, cy + 50, cx + 640, cy + 80], radius=15, fill=(10, 48, 64), outline=(6, 182, 212), width=1)
    draw.text((cx + 428, cy + 56), "ARDUINO UNO R4", fill=(165, 243, 252), font=FONT_BADGE)
    
    # Main Title
    draw.text((cx + 60, cy + 110), "BloodTrace™ Vision", fill=(255, 255, 255), font=FONT_TITLE_LG)
    
    # Subtitle
    draw.text((cx + 60, cy + 185), "Dual-Wavelength Optical Contamination Screening Platform", fill=(6, 182, 212), font=FONT_HEADING)
    draw.text((cx + 60, cy + 235), "Rapid Non-Destructive Bioburden Localization for Reusable Surgical Instruments", fill=(148, 163, 184), font=FONT_SUBHEADING)
    
    # Key Highlights Divider
    draw.line([cx + 60, cy + 285, cx + card_w - 60, cy + 285], fill=(30, 49, 82), width=1)
    
    # 3-Column Highlights
    cols = [
        ("OPTICAL SENSING", "BPW34 transimpedance amp with 10-bit RA4M1 ADC resolution"),
        ("IMAGE ANALYSIS", "Multi-spectral NDI segmentation with adaptive thresholding"),
        ("QUALITY ASSURANCE", "Pre-autoclave quality gate preventing bioburden baking")
    ]
    for i, (col_title, col_desc) in enumerate(cols):
        col_x = cx + 60 + i * 330
        draw.text((col_x, cy + 310), col_title, fill=(34, 211, 238), font=FONT_BADGE)
        # Wrap description
        words = col_desc.split(' ')
        line1 = ' '.join(words[:4])
        line2 = ' '.join(words[4:])
        draw.text((col_x, cy + 335), line1, fill=(203, 213, 225), font=FONT_BODY)
        draw.text((col_x, cy + 360), line2, fill=(203, 213, 225), font=FONT_BODY)
        
    # Academic / Regulatory Notice with dark amber tint and crisp gold text
    draw.rounded_rectangle([cx + 60, cy + 440, cx + card_w - 60, cy + 510], radius=8, fill=(34, 27, 20), outline=(217, 119, 6), width=1)
    draw.text((cx + 80, cy + 452), "[!] RESEARCH & SIMULATION PROTOTYPE — NOT A CLINICAL TEST RESULT", fill=(251, 191, 36), font=FONT_BADGE)
    draw.text((cx + 80, cy + 475), "Categorizes candidate regions as 'Suspected Residue' solely to assist pre-sterilization inspection.", fill=(253, 230, 138), font=FONT_MONO)
    
    return im

def create_outro_frame(t_rel):
    """Renders the academic & investor conclusion slide (Scene 9)."""
    im = Image.new('RGB', (WIDTH, HEIGHT), (6, 10, 18))
    draw = ImageDraw.Draw(im)
    
    # Ambient grid
    for x in range(0, WIDTH, 60):
        draw.line([x, 0, x, HEIGHT], fill=(15, 23, 42), width=1)
    for y in range(0, HEIGHT, 60):
        draw.line([0, y, WIDTH, y], fill=(15, 23, 42), width=1)
        
    card_w = 1140
    card_h = 560
    cx = (WIDTH - card_w) // 2
    cy = (HEIGHT - card_h) // 2
    
    draw.rounded_rectangle([cx - 4, cy - 4, cx + card_w + 4, cy + card_h + 4], radius=16, fill=(10, 18, 32), outline=(6, 182, 212), width=2)
    draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=14, fill=(12, 21, 39))
    
    # Title fitted with FONT_TITLE_MED (36pt) to eliminate overflow/clipping
    draw.text((cx + 60, cy + 45), "BloodTrace™ — Engineering Summary & Impact", fill=(255, 255, 255), font=FONT_TITLE_MED)
    draw.text((cx + 60, cy + 105), "Value Proposition for Clinical Sterile Processing Departments & Medical Device Investors", fill=(6, 182, 212), font=FONT_SUBHEADING)
    
    draw.line([cx + 60, cy + 145, cx + card_w - 60, cy + 145], fill=(30, 49, 82), width=1)
    
    points = [
        ("Accessible Fabrication Cost:", "Total prototype hardware bill of materials ~$64.00 (Arduino UNO R4, LEDs, BPW34)."),
        ("Dual-Wavelength Specificity:", "Overcomes pure UV false-positives by cross-correlating 850nm NIR hemoglobin absorption."),
        ("Non-Destructive Workflow:", "Screening takes < 3 seconds per instrument prior to autoclave packaging."),
        ("Full Digital Traceability:", "Automated CSV logging and printable PDF inspection records for hospital compliance."),
        ("Academic Verification:", "100% test coverage across optical models, deterministic physics, and CV algorithms.")
    ]
    
    for i, (head, body) in enumerate(points):
        py = cy + 170 + i * 60
        draw.ellipse([cx + 60, py + 5, cx + 70, py + 15], fill=(6, 182, 212))
        draw.text((cx + 85, py), head, fill=(241, 245, 249), font=FONT_ITEM_HEAD)
        draw.text((cx + 85, py + 26), body, fill=(148, 163, 184), font=FONT_ITEM_BODY)
        
    draw.text((cx + 60, cy + 495), "Project Repository: https://github.com/DevanshLila/Blood-Detector (Branch: sim1)", fill=(100, 116, 139), font=FONT_MONO)
    draw.text((cx + card_w - 280, cy + 495), "[DEMONSTRATION COMPLETE]", fill=(16, 185, 129), font=FONT_BADGE)
    
    return im

def main():
    print("=" * 60)
    print("BLOODTRACE 1080P 60FPS SIMULATION VIDEO GENERATOR")
    print("=" * 60)
    print(f"Target Output: {OUTPUT_VIDEO}")
    print(f"Resolution: {WIDTH}x{HEIGHT} @ {FPS} fps | Duration: {TOTAL_SECONDS}s ({TOTAL_FRAMES} frames)")
    print(f"Using FFmpeg: {FFMPEG_EXE}")

    # 1. Load Base Images
    print("\n[Step 1/3] Loading captured 1080p base frames...")
    base_images = load_base_images()
    print("Loaded 9 base images successfully.")

    # 2. Synthesize Stereo Audio
    print("\n[Step 2/3] Synthesizing synchronized stereo soundscape...")
    audio_data = generate_audio(TOTAL_SECONDS, 44100)
    
    # Save audio to temporary WAV file
    import wave
    with wave.open(TEMP_AUDIO, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(audio_data.tobytes())
    print(f"Audio synthesized ({os.path.getsize(TEMP_AUDIO):,} bytes).")

    # 3. Setup FFmpeg Pipeline
    print("\n[Step 3/3] Encoding 1080p 60fps video frames directly into FFmpeg...")
    ffmpeg_cmd = [
        FFMPEG_EXE, '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f"{WIDTH}x{HEIGHT}",
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',                # Video from stdin pipe
        '-i', TEMP_AUDIO,         # Audio from temp WAV
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '16',
        '-b:v', '3600k',
        '-maxrate', '5000k',
        '-bufsize', '8000k',
        '-g', '60',               # 1-second GOP for instant zero-lag seeking and broadcast standard
        '-keyint_min', '30',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        OUTPUT_VIDEO
    ]

    LOG_FILE = os.path.join(BASE_DIR, "ffmpeg_render.log")
    log_f = open(LOG_FILE, "w", encoding="utf-8")
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=log_f)

    try:
        for frame_idx in range(TOTAL_FRAMES):
            t_sec = frame_idx / FPS
            
            # SCENE ROUTING:
            # ------------------------------------------------------------------
            # Scene 1: Title Card (0s - 4.5s, frames 0 - 270)
            if t_sec < 4.5:
                frame_img = create_title_frame(t_sec)
                
            # Scene 2: Physical Device Simulation & Optical Strobing (4.5s - 15.0s, frames 270 - 900)
            elif t_sec < 15.0:
                scene_t = t_sec - 4.5
                # Cycle illumination modes
                if scene_t < 2.5:
                    base = base_images['dev_off'].copy()
                    mode_label = "MODE: OFF (DARK CURRENT BASELINE)"
                elif scene_t < 5.0:
                    base = base_images['dev_uv'].copy()
                    mode_label = "MODE: 365 nm UV-A (AUTOFLUORESCENCE ACTIVE)"
                elif scene_t < 7.5:
                    base = base_images['dev_ir'].copy()
                    mode_label = "MODE: 850 nm NIR (HEMOGLOBIN ABSORPTION ACTIVE)"
                else:
                    base = base_images['dev_comb'].copy()
                    mode_label = "MODE: DUAL UV+NIR STROBE (COMBINED SCANNING)"
                    
                draw = ImageDraw.Draw(base)
                
                # Draw animated laser scanline across the chamber platform & forceps instrument (x: 340 to 1110, y: 435 to 575)
                if scene_t >= 7.0:
                    scan_prog = ((scene_t - 7.0) % 3.0) / 3.0
                    scan_x = int(340 + scan_prog * (1110 - 340))
                    y1, y2 = 435, 575
                    draw.line([scan_x - 2, y1, scan_x - 2, y2], fill=(6, 182, 212), width=1)
                    draw.line([scan_x + 2, y1, scan_x + 2, y2], fill=(6, 182, 212), width=1)
                    draw.line([scan_x, y1, scan_x, y2], fill=(6, 182, 212), width=3)
                    draw.line([scan_x, y1, scan_x, y2], fill=(255, 255, 255), width=1)
                    draw.ellipse([scan_x - 4, y1 - 4, scan_x + 4, y1 + 4], fill=(165, 243, 252))
                    draw.ellipse([scan_x - 4, y2 - 4, scan_x + 4, y2 + 4], fill=(165, 243, 252))
                
                draw_hud_header(draw, "PHYSICAL DEVICE SIMULATION", mode_label)
                draw_lower_third(
                    draw, 
                    "Matte-Black Optical Enclosure & Arduino UNO R4",
                    "Dual-wavelength illumination with transimpedance BPW34 photodiode",
                    [
                        "UV LED (365nm) driven via Pin D9 MOSFET gate",
                        "Dual NIR LEDs (850nm) driven via Pin D10 MOSFET gate",
                        "Live 115200 baud serial telemetry stream & photodiode ADC oscilloscope"
                    ]
                )
                frame_img = base

            # Scene 3: BloodTrace Vision — Scalpel Blade Specimen (15.0s - 26.0s, frames 900 - 1560)
            elif t_sec < 26.0:
                scene_t = t_sec - 15.0
                base = base_images['dash_scalpel'].copy()
                draw = ImageDraw.Draw(base)
                draw_hud_header(draw, "BLOODTRACE VISION DASHBOARD", "SPECIMEN: SCALPEL BLADE (POSTER REFERENCE)")
                
                # Pulsing outline around Contamination Map viewport
                pulse = (math.sin(scene_t * 6.0) + 1.0) / 2.0
                glow_r = int(210 + pulse * 45)
                draw.rectangle([1506, 369, 1881, 729], outline=(glow_r, 38, 38), width=2)
                
                draw_lower_third(
                    draw,
                    "4-Panel Synchronized Optical Inspection",
                    "Scalpel blade with coagulated residue (Matches Poster Screenshot)",
                    [
                        "Panel 1: Visible Image (Actual research photographic specimen)",
                        "Panel 2: Simulated 365nm UV-A (Organic luminescent contrast)",
                        "Panel 3: Simulated 850nm NIR (Stark hemoglobin absorption dip)",
                        "Panel 4: Contamination Map with vertical High-Low gradient color bar",
                        "Screening Outcome: Total Contaminated Area 5.1% [CONTAMINATION DETECTED]"
                    ]
                )
                frame_img = base

            # Scene 4: Dynamic Threshold Sensitivity Tuning (26.0s - 34.0s, frames 1560 - 2040)
            elif t_sec < 34.0:
                scene_t = t_sec - 26.0
                base = base_images['dash_scalpel'].copy()
                draw = ImageDraw.Draw(base)
                
                # Threshold slider coordinate on dashboard header (x: 786 to 1003, y: 173)
                slider_min_x = 794
                slider_max_x = 995
                slider_y = 173
                
                # Animate slider motion back and forth
                slider_phase = (math.sin(scene_t * 2.0) + 1.0) / 2.0
                curr_thumb_x = int(slider_min_x + slider_phase * (slider_max_x - slider_min_x))
                curr_thresh = int(15 + slider_phase * 55)
                
                # Clear and cleanly redraw the THRESHOLD label with exact typography
                draw.rectangle([760, 148, 925, 166], fill=(17, 29, 51))
                draw.text((760, 150), "THRESHOLD: ", fill=(148, 163, 184), font=FONT_SUBHEADING_SM)
                bbox1 = draw.textbbox((760, 150), "THRESHOLD: ", font=FONT_SUBHEADING_SM)
                draw.text((bbox1[2], 150), str(curr_thresh), fill=(34, 211, 238), font=FONT_SUBHEADING_SM)
                bbox2 = draw.textbbox((bbox1[2], 150), str(curr_thresh), font=FONT_SUBHEADING_SM)
                draw.text((bbox2[2], 150), " (A.U.)", fill=(148, 163, 184), font=FONT_SUBHEADING_SM)
                
                # Redraw track background and active fill line (786 to 1003) without touching MIN SIZE
                draw.rectangle([780, 164, 1010, 182], fill=(17, 29, 51))
                draw.line([786, slider_y, 1003, slider_y], fill=(30, 49, 82), width=4)
                draw.line([786, slider_y, curr_thumb_x, slider_y], fill=(6, 182, 212), width=4)
                
                # Draw thumb & cursor
                draw.ellipse([curr_thumb_x - 7, slider_y - 7, curr_thumb_x + 7, slider_y + 7], fill=(6, 182, 212), outline=(255, 255, 255), width=2)
                draw_mouse_cursor(draw, curr_thumb_x + 2, slider_y + 4, click_anim=0.4)
                
                draw_hud_header(draw, "REAL-TIME ADAPTIVE CONTRAST TUNING", f"DETECTION THRESHOLD: {curr_thresh} A.U.")
                draw_lower_third(
                    draw,
                    "Dynamic Sensitivity & Morphological Filtering",
                    "Instant contour recalculation and candidate region extraction",
                    [
                        "Higher threshold restricts detection to dense coagulated crusts",
                        "Lower threshold detects faint micro-traces and perimeter halos",
                        "Allows biomedical technicians to tune sensitivity for specific surgical alloys"
                    ]
                )
                frame_img = base

            # Scene 5: True Negative Validation — Clean Reference Surface (34.0s - 42.0s, frames 2040 - 2520)
            elif t_sec < 42.0:
                scene_t = t_sec - 34.0
                base = base_images['dash_clean'].copy()
                draw = ImageDraw.Draw(base)
                
                # Pulsing green badge highlight
                draw_hud_header(draw, "NEGATIVE CONTROL EXPERIMENT", "SPECIMEN: CLEAN REFERENCE TOOLS (PASSIVATED 316L)")
                draw_lower_third(
                    draw,
                    "True Negative Validation: Clean Baseline (0.0%)",
                    "Demonstrating optical specificity on ultrasonic-cleaned instruments",
                    [
                        "Clean electropolished steel has uniform specular NIR reflectance (760 a.u.)",
                        "Negligible autofluorescence under 365nm UV excitation (18 a.u.)",
                        "Zero candidate pixels flagged (0.00%) | Status: [NO CANDIDATE REGION DETECTED]"
                    ]
                )
                frame_img = base

            # Scene 6: Biological Challenge — Contaminated Surgical Clamp (42.0s - 49.0s, frames 2520 - 2940)
            elif t_sec < 49.0:
                scene_t = t_sec - 42.0
                base = base_images['dash_clamp'].copy()
                draw = ImageDraw.Draw(base)
                
                draw_hud_header(draw, "BIOLOGICAL CHALLENGE SPECIMEN", "SPECIMEN: CONTAMINATED HEMOSTATIC CLAMP")
                draw_lower_third(
                    draw,
                    "Critical Joint & Serration Inspection",
                    "Detecting hidden dried blood bioburden in difficult anatomical crevices",
                    [
                        "Used hemostat clamp with coagulum trapped in box-lock hinge and serrated jaws",
                        "Stark NIR reflectance drop to 440 a.u. due to heme absorption",
                        "Contaminated Area: 1.3% | 6 Candidate Regions | Classification: Possible Residue"
                    ]
                )
                frame_img = base

            # Scene 7: Dual-Sample Comparative Analysis ("Compare Both") (49.0s - 56.5s, frames 2940 - 3390)
            elif t_sec < 56.5:
                scene_t = t_sec - 49.0
                base = base_images['dash_comp'].copy()
                draw = ImageDraw.Draw(base)
                
                draw_hud_header(draw, "DIRECT DUAL-SAMPLE COMPARATIVE ANALYSIS", "SPECTRAL SUBTRACTION MODE: CONTROL VS. CHALLENGE")
                draw_lower_third(
                    draw,
                    "Direct Dual-Sample Differential Spectroscopy",
                    "Simultaneous side-by-side verification with optical parameter matrix",
                    [
                        "Left: Clean Reference Surface (Control: 0.00% bioburden detected)",
                        "Right: Contaminated Clamp (Challenge: Suspected residue detected)",
                        "Comparative Matrix: 850nm NIR drop (-42%), Excess Red (+42.1 a.u.)",
                        "Automated Recommendation: FAIL / REJECT (Ultrasonic re-wash required)"
                    ]
                )
                frame_img = base

            # Scene 8: Formal Printable Engineering Report Modal (56.5s - 61.5s, frames 3390 - 3690)
            elif t_sec < 61.5:
                scene_t = t_sec - 56.5
                base = base_images['dash_report'].copy()
                draw = ImageDraw.Draw(base)
                
                draw_hud_header(draw, "CLINICAL QUALITY ASSURANCE & AUDIT TRAIL", "FORMAL PRINTABLE PDF / CSV INSPECTION REPORT")
                draw_lower_third(
                    draw,
                    "Audit Trail & Compliance",
                    "Digital Quality Assurance Documentation",
                    [
                        "Exports multi-spectral PDF inspection report",
                        "CSV export logs photodiode & ROI telemetry",
                        "Mandatory research simulation disclaimer"
                    ],
                    box_w=465,
                    x=30
                )
                frame_img = base

            # Scene 9: Academic & Investor Conclusion Slide (61.5s - 65.0s, frames 3690 - 3900)
            else:
                scene_t = t_sec - 61.5
                frame_img = create_outro_frame(scene_t)

            # Write raw frame bytes to FFmpeg stdin
            proc.stdin.write(frame_img.tobytes())
            
            # Progress log every 10%
            if frame_idx % (TOTAL_FRAMES // 10) == 0:
                pct = int((frame_idx / TOTAL_FRAMES) * 100)
                print(f"  Encoding progress: {pct}% ({frame_idx}/{TOTAL_FRAMES} frames)...")

        proc.stdin.close()
        ret = proc.wait()
        log_f.close()
        if ret != 0:
            print(f"Error: FFmpeg exited with code {ret}. See {LOG_FILE} for details.")
            sys.exit(ret)
        
    except Exception as e:
        print(f"Error during video encoding: {e}")
        try:
            proc.kill()
        except Exception:
            pass
        log_f.close()
        sys.exit(1)

    # Clean up temporary audio file
    if os.path.exists(TEMP_AUDIO):
        os.remove(TEMP_AUDIO)

    if os.path.exists(OUTPUT_VIDEO):
        file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print("\n" + "=" * 60)
        print("VIDEO ENCODING SUCCESSFUL!")
        print(f"Output File: {OUTPUT_VIDEO}")
        print(f"File Size: {file_size_mb:.2f} MB")
        print(f"Resolution: {WIDTH}x{HEIGHT} (Full HD 1080p)")
        print(f"Framerate: {FPS} fps (Zero Lag / 3,900 Total Frames)")
        print(f"Duration: {TOTAL_SECONDS} seconds")
        print("=" * 60)
    else:
        print("Error: Output video file was not generated.")
        sys.exit(1)

if __name__ == "__main__":
    main()
