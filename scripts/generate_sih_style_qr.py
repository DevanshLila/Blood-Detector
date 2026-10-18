import qrcode
from PIL import Image, ImageDraw, ImageFont

url = "https://devanshlila.github.io/Blood-Detector/"

# Generate QR code with box_size=8 so it fits with generous margins
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=8,
    border=3,
)
qr.add_data(url)
qr.make(fit=True)

# Generate high-contrast QR
qr_img = qr.make_image(fill_color="#060B14", back_color="#FFFFFF").convert("RGB")

card_w = 460
card_h = 600
card = Image.new("RGB", (card_w, card_h), (6, 11, 20)) # Deep Cyber Navy
draw = ImageDraw.Draw(card)

# Colors
CYAN = (6, 182, 212)
CYAN_BRIGHT = (34, 211, 238)
WHITE = (255, 255, 255)
MUTED = (148, 163, 184)
SLATE_DARK = (100, 116, 139)
BORDER_COLOR = (6, 182, 212)

# Outer tech border
draw.rectangle([14, 14, card_w - 15, card_h - 15], outline=BORDER_COLOR, width=2)

# Top and bottom corner brackets
corner_len = 16
for (cx, cy, dx, dy) in [
    (14, 14, 1, 1),
    (card_w - 15, 14, -1, 1),
    (14, card_h - 15, 1, -1),
    (card_w - 15, card_h - 15, -1, -1),
]:
    draw.line([cx, cy, cx + dx * corner_len, cy], fill=CYAN_BRIGHT, width=3)
    draw.line([cx, cy, cx, cy + dy * corner_len], fill=CYAN_BRIGHT, width=3)

# Fonts
FONT_TINY = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 10)
FONT_TITLE = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 16)
FONT_SUB = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 10)
FONT_URL = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 10)
FONT_FOOT = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 9)

# Header Section
header_tag = ":: BLOODTRACE // MNIT JAIPUR PS-ENGINEERING ::"
draw.text((card_w // 2, 34), header_tag, fill=CYAN, font=FONT_TINY, anchor="mm")

title_text = "RUN SIMULATION"
title_bbox = draw.textbbox((0, 0), title_text, font=FONT_TITLE)
tw = title_bbox[2] - title_bbox[0]
title_y = 58
draw.text((card_w // 2, title_y), title_text, fill=CYAN_BRIGHT, font=FONT_TITLE, anchor="mm")

# Crisp hollow square brackets
sq_size = 11
sq_pad = 12
sq_y = title_y - sq_size // 2
sq1_x = (card_w - tw) // 2 - sq_pad - sq_size
draw.rectangle([sq1_x, sq_y, sq1_x + sq_size, sq_y + sq_size], outline=CYAN_BRIGHT, width=2)
sq2_x = (card_w + tw) // 2 + sq_pad
draw.rectangle([sq2_x, sq_y, sq2_x + sq_size, sq_y + sq_size], outline=CYAN_BRIGHT, width=2)

draw.text((card_w // 2, 80), "SCAN WITH ANY PHONE CAMERA TO LAUNCH LIVE", fill=MUTED, font=FONT_SUB, anchor="mm")

# QR Image placement (centered with white border)
qr_x = (card_w - qr_img.width) // 2
qr_y = 104
draw.rounded_rectangle([qr_x - 6, qr_y - 6, qr_x + qr_img.width + 5, qr_y + qr_img.height + 5], radius=6, fill=(255, 255, 255))
card.paste(qr_img, (qr_x, qr_y))

# Bottom URL pill
pill_w = card_w - 70
pill_h = 26
pill_x = (card_w - pill_w) // 2
pill_y = qr_y + qr_img.height + 24

draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=5, fill=(12, 24, 45), outline=(30, 58, 95), width=1)

url_bbox = draw.textbbox((0, 0), url, font=FONT_URL)
uw = url_bbox[2] - url_bbox[0]
lock_w = 9
lock_h = 7
total_w = lock_w + 8 + uw
start_x = (card_w - total_w) // 2
cy = pill_y + pill_h // 2

# draw small lock icon
draw.arc([start_x + 1, cy - 6, start_x + lock_w - 2, cy + 1], start=180, end=0, fill=CYAN, width=1)
draw.rounded_rectangle([start_x, cy - 1, start_x + lock_w, cy + lock_h - 1], radius=1, fill=CYAN)

draw.text((start_x + lock_w + 8, cy), url, fill=CYAN, font=FONT_URL, anchor="lm")

# Bottom Footer Lines
draw.text((card_w // 2, pill_y + pill_h + 18), "No Installation Required • Runs on Chrome, Edge, Safari, Firefox", fill=MUTED, font=FONT_FOOT, anchor="mm")
draw.text((card_w // 2, pill_y + pill_h + 34), "Devansh Lila • BloodTrace Dual-Wavelength Contamination Simulator", fill=SLATE_DARK, font=FONT_FOOT, anchor="mm")

# Save outputs
card.save("assets/images/simulation_qr_code.png")
card.save("simulation_qr_code.png")
print(f"Generated QR card ({card_w}x{card_h}) successfully!")
