import os
import subprocess
import time

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

views = [
    ("view_scalpel.png", "http://localhost:8000/index.html?view=dashboard&sample=scalpel_blade"),
    ("view_clamp.png", "http://localhost:8000/index.html?view=dashboard&sample=contaminated_surface"),
    ("view_compare.png", "http://localhost:8000/index.html?view=dashboard&sample=compare_both"),
    ("view_clean.png", "http://localhost:8000/index.html?view=dashboard&sample=clean_surface")
]

for out_name, url in views:
    out_path = os.path.abspath(out_name)
    cmd = [
        edge_path,
        "--headless=new",
        "--disable-gpu",
        "--virtual-time-budget=3500",
        f"--screenshot={out_path}",
        "--window-size=1366,950",
        url
    ]
    subprocess.run(cmd, capture_output=True)
    if os.path.exists(out_path):
        print(f"Captured {out_name} ({os.path.getsize(out_path)} bytes)")
    else:
        print(f"Failed to capture {out_name}")
