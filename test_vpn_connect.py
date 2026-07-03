import requests
import json
import sys

API_URL = "http://192.168.1.53:8000/api"

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
    
    # 2. Get available servers first
    print("\nFetching servers...")
    resp = requests.get(f"{API_URL}/vpn/servers", headers=headers, timeout=5)
    if resp.status_code != 200:
        print(f"Failed to get servers: {resp.text}")
        sys.exit(1)
    
    servers = resp.json()
    if not servers:
        print("No VPN servers found!")
        sys.exit(1)
        
    server_id = servers[0]["id"]
    print(f"Found server ID to connect: {server_id}")
    
    # 3. Connect to server
    connect_url = f"{API_URL}/vpn/connect"
    print(f"\nConnecting to: {connect_url} with server_id: {server_id}")
    resp = requests.post(connect_url, headers=headers, json={"server_id": server_id}, timeout=15)
    
    print(f"Status Code: {resp.status_code}")
    try:
        print("Response:")
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(f"Raw Output: {resp.text}")

if __name__ == "__main__":
    main()
