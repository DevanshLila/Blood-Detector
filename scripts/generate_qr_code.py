import qrcode
from PIL import Image, ImageDraw, ImageFont

url = "https://devanshlila.github.io/Blood-Detector/"

# Generate QR code with high error correction
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=12,
    border=4,
)
qr.add_data(url)
qr.make(fit=True)

# Create QR image (classic high-contrast for 100% reliable camera scanning)
qr_img = qr.make_image(fill_color="#070F1E", back_color="#FFFFFF").convert("RGB")

# Now wrap it in a sleek branded card for presentation & README
card_w = qr_img.width + 80
card_h = qr_img.height + 150
card = Image.new("RGB", (card_w, card_h), (7, 15, 30)) # Deep Navy
draw = ImageDraw.Draw(card)

# Card border
draw.rounded_rectangle([2, 2, card_w - 3, card_h - 3], radius=16, outline=(6, 182, 212), width=3)

# Title
FONT_TITLE = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 20)
FONT_URL = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 13)
FONT_SUB = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 14)

title_text = "BLOODTRACE™ ONLINE SIMULATION"
draw.text((card_w // 2, 35), title_text, fill=(34, 211, 238), font=FONT_TITLE, anchor="mm")
draw.text((card_w // 2, 60), "Scan to launch on smartphone / tablet / laptop", fill=(148, 163, 184), font=FONT_SUB, anchor="mm")

# Paste QR image with rounded white frame
qr_x = (card_w - qr_img.width) // 2
qr_y = 80
draw.rounded_rectangle([qr_x - 6, qr_y - 6, qr_x + qr_img.width + 5, qr_y + qr_img.height + 5], radius=8, fill=(255, 255, 255))
card.paste(qr_img, (qr_x, qr_y))

# Bottom URL text
url_text = "https://devanshlila.github.io/Blood-Detector/"
draw.text((card_w // 2, card_h - 35), url_text, fill=(6, 182, 212), font=FONT_URL, anchor="mm")
draw.text((card_w // 2, card_h - 18), "Branch: sim1 • Zero Hardware Required", fill=(100, 116, 139), font=FONT_URL, anchor="mm")

# Save outputs
card.save("assets/images/simulation_qr_code.png")
card.save("simulation_qr_code.png")

# Also save plain high-res QR for clean embedding
qr_img.save("assets/images/qr_matrix.png")
qr_img.save("qr_matrix.png")

print("Saved simulation_qr_code.png and assets/images/simulation_qr_code.png successfully!")
print(f"Target URL: {url}")
