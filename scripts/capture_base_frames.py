import os
import subprocess
import time

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
out_dir = os.path.abspath("assets/video_frames")
os.makedirs(out_dir, exist_ok=True)

frames = [
    ("frame_device_off.png", "http://localhost:8000/index.html?view=device&mode=off"),
    ("frame_device_uv.png", "http://localhost:8000/index.html?view=device&mode=uv"),
    ("frame_device_ir.png", "http://localhost:8000/index.html?view=device&mode=ir"),
    ("frame_device_combined.png", "http://localhost:8000/index.html?view=device&mode=combined"),
    ("frame_dashboard_scalpel.png", "http://localhost:8000/index.html?view=dashboard&sample=scalpel_blade"),
    ("frame_dashboard_clean.png", "http://localhost:8000/index.html?view=dashboard&sample=clean_surface"),
    ("frame_dashboard_clamp.png", "http://localhost:8000/index.html?view=dashboard&sample=contaminated_surface"),
    ("frame_dashboard_compare.png", "http://localhost:8000/index.html?view=dashboard&sample=compare_both"),
    ("frame_report_modal.png", "http://localhost:8000/index.html?view=dashboard&sample=scalpel_blade&report=1"),
]

for filename, url in frames:
    out_path = os.path.join(out_dir, filename)
    cmd = [
        edge_path,
        "--headless=new",
        "--disable-gpu",
        "--virtual-time-budget=3500",
        "--window-size=1920,1080",
        "--force-device-scale-factor=1",
        "--hide-scrollbars",
        f"--screenshot={out_path}",
        url
    ]
    subprocess.run(cmd, capture_output=True)
    if os.path.exists(out_path):
        print(f"Captured {filename}: {os.path.getsize(out_path)} bytes")
    else:
        print(f"FAILED to capture {filename}")
