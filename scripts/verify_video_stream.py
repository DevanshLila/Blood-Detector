import os
import subprocess
import json
import imageio_ffmpeg

video_path = os.path.abspath("BloodTrace_Simulation_Showcase_1080p.mp4")
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

print(f"Checking video file: {video_path}")
if not os.path.exists(video_path):
    print("ERROR: File does not exist!")
    exit(1)

size_bytes = os.path.getsize(video_path)
size_mb = size_bytes / (1024 * 1024)
print(f"File size: {size_bytes:,} bytes ({size_mb:.2f} MB)")

# Probe using ffmpeg
cmd = [ffmpeg_exe, "-i", video_path]
proc = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
print("FFmpeg probe output:")
for line in proc.stderr.splitlines():
    if any(k in line for k in ["Duration:", "Stream #", "Video:", "Audio:"]):
        print(" ", line.strip())

# Extract a few frames from the video to check visual appearance
out_dir = os.path.abspath("test_extracted_frames")
os.makedirs(out_dir, exist_ok=True)

test_times = [2.0, 7.0, 12.0, 20.0, 30.0, 38.0, 45.0, 52.0, 58.0, 63.0]
for t in test_times:
    out_frame = os.path.join(out_dir, f"frame_{int(t):02d}s.png")
    cmd_extract = [
        ffmpeg_exe, "-y",
        "-ss", str(t),
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        out_frame
    ]
    subprocess.run(cmd_extract, capture_output=True)
    if os.path.exists(out_frame):
        print(f"Extracted frame at {t}s -> {out_frame} ({os.path.getsize(out_frame):,} bytes)")

print("\nVerification check finished.")
