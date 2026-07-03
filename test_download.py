import requests
import json
import time
import sys

API_URL = "http://192.168.1.53:8000/api"
# A reliable public 1MB test download file
TEST_URL = "https://proof.ovh.net/files/1Mb.dat"

def main():
    # 1. Login
    url = f"{API_URL}/auth/login"
    payload = {"username": "ranjan", "password": "password123"}
    print(f"Logging in to: {url}")
    resp = requests.post(url, json=payload, timeout=5)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        sys.exit(1)
        
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Add Download
    download_url = f"{API_URL}/downloads"
    payload = {"uris": [TEST_URL], "torrent": None, "options": None}
    print(f"\nAdding test download: {TEST_URL}")
    resp = requests.post(download_url, headers=headers, json=payload, timeout=5)
    if resp.status_code not in [200, 201]:
        print(f"Failed to add download (Status {resp.status_code}): {resp.text}")
        sys.exit(1)
        
    download_res = resp.json()
    gid = download_res.get("gid")
    print(f"Download successfully added! GID: {gid}")
    
    # 3. Track progress
    print("\nTracking progress (polling every 1 second):")
    for _ in range(15):
        time.sleep(1)
        status_resp = requests.get(f"{API_URL}/downloads", headers=headers, timeout=5)
        if status_resp.status_code != 200:
            print(f"Error fetching status: {status_resp.text}")
            continue
            
        downloads = status_resp.json()
        target = next((d for d in downloads if d["gid"] == gid), None)
        
        if not target:
            print(f"Download GID {gid} not found in the list.")
            continue
            
        status = target.get("status")
        total = target.get("total_length", 0)
        completed = target.get("completed_length", 0)
        speed = target.get("download_speed", 0)
        name = target.get("name", "Unknown")
        
        pct = (completed / total * 100) if total > 0 else 0
        speed_kb = speed / 1024
        
        print(f"[{status.upper()}] File: {name} | {pct:.1f}% ({completed}/{total} bytes) | Speed: {speed_kb:.1f} KB/s")
        
        if status in ["complete", "error"]:
            print(f"\nDownload finished with status: {status.upper()}")
            break
    else:
        print("\nTimeout: Download did not complete in 15 seconds.")

if __name__ == "__main__":
    main()
