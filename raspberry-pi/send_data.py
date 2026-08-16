"""
Raspberry Pi — Tree Data Sender
================================
This script reads data from the TOF sensor and camera, then sends it
to the backend API.

Requirements:
    pip install requests python-dotenv

Usage:
    1. Copy .env.example to .env and fill in your values.
    2. Run:  python send_data.py
"""

import os
import time
import requests
from dotenv import load_dotenv

# Load config from the .env file in the same directory
load_dotenv()

API_URL       = os.getenv("API_URL", "http://localhost:3001")
DEVICE_SECRET = os.getenv("DEVICE_SECRET", "")
TREE_ID       = os.getenv("TREE_ID", "TREE-001")
SEND_INTERVAL = int(os.getenv("SEND_INTERVAL_SECONDS", "10"))
MAX_RETRIES   = int(os.getenv("MAX_RETRIES", "3"))

ENDPOINT = f"{API_URL}/api/tree/data"
HEADERS  = {"X-Secret-Key": DEVICE_SECRET}


def read_tof_sensor() -> float:
    """
    TODO: Replace this stub with your actual TOF sensor library.
    Example for VL53L0X:
        import VL53L0X
        tof = VL53L0X.VL53L0X()
        tof.start_ranging()
        distance = tof.get_distance()
        tof.stop_ranging()
        return distance / 10  # mm → cm
    """
    # ← Replace this with your real sensor reading
    import random
    return round(random.uniform(10.0, 500.0), 2)


def capture_image(save_path: str = "/tmp/tree_capture.jpg") -> str | None:
    """
    TODO: Replace this stub with your actual camera code.
    Example using picamera2:
        from picamera2 import Picamera2
        cam = Picamera2()
        cam.start()
        cam.capture_file(save_path)
        cam.stop()
        return save_path
    """
    # ← Replace this with your real camera capture
    # Return None if no image is available
    return None


def send_data(tree_id: str, tof_cm: float, image_path: str | None) -> bool:
    """
    Send one reading to the backend API.
    Returns True on success, False on failure.
    """
    form_data = {
        "treeId":         tree_id,
        "tofMeasurement": str(tof_cm),
    }

    files = None
    if image_path and os.path.exists(image_path):
        files = {"image": open(image_path, "rb")}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                ENDPOINT,
                headers=HEADERS,
                data=form_data,
                files=files,
                timeout=15,
            )
            if response.status_code == 201:
                print(f"  ✅ Sent — Tree: {tree_id}, TOF: {tof_cm} cm")
                return True
            else:
                print(f"  ⚠️  Attempt {attempt}/{MAX_RETRIES}: Server responded {response.status_code} — {response.text}")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Attempt {attempt}/{MAX_RETRIES}: Cannot reach server at {ENDPOINT}")
        except requests.exceptions.Timeout:
            print(f"  ❌ Attempt {attempt}/{MAX_RETRIES}: Request timed out")
        except Exception as e:
            print(f"  ❌ Attempt {attempt}/{MAX_RETRIES}: Unexpected error — {e}")

        if attempt < MAX_RETRIES:
            time.sleep(2)

    return False


def main():
    print("=" * 50)
    print("🌳 Tree Monitor — Raspberry Pi Client")
    print(f"   Sending to : {ENDPOINT}")
    print(f"   Tree ID    : {TREE_ID}")
    print(f"   Interval   : every {SEND_INTERVAL}s")
    print("=" * 50)

    if not DEVICE_SECRET:
        print("⛔ DEVICE_SECRET is not set in .env — the server will reject requests.")
        return

    while True:
        print(f"\n📡 Reading sensor…")
        tof_cm     = read_tof_sensor()
        image_path = capture_image()

        send_data(TREE_ID, tof_cm, image_path)
        print(f"   Next reading in {SEND_INTERVAL}s…")
        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()
