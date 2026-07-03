import requests
import json
import time
import sys

API_URL = "http://192.168.1.53:8000/api"

def get_current_ip_info(headers):
    try:
        resp = requests.get(f"{API_URL}/vpn/ip", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return f"IP: {data.get('ip')}, Country: {data.get('country')}, City: {data.get('city')}, Provider: {data.get('provider')}"
        return f"Failed to get IP info (Status {resp.status_code}): {resp.text}"
    except Exception as e:
        return f"Error getting IP info: {e}"

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
    
    # 2. Get IP Info Before Connection
    print("\n--- [Before Connecting] Checking Current Public IP & Location ---")
    info_before = get_current_ip_info(headers)
    print(info_before)
    
    # 3. Get available servers
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
    
    # 4. Connect to server
    connect_url = f"{API_URL}/vpn/connect"
    print(f"\nConnecting to: {connect_url} with server_id: {server_id}...")
    resp = requests.post(connect_url, headers=headers, json={"server_id": server_id}, timeout=20)
    
    if resp.status_code != 200:
        print(f"Failed to connect (Status {resp.status_code}): {resp.text}")
        sys.exit(1)
        
    print("Connection command sent successfully! Waiting 5 seconds for tunnel to initialize...")
    time.sleep(5)
    
    # 5. Get IP Info After Connection
    print("\n--- [After Connecting] Checking Current Public IP & Location ---")
    info_after = get_current_ip_info(headers)
    print(info_after)
    
    # 6. Disconnect to restore original state
    print("\nDisconnecting VPN to restore original state...")
    requests.post(f"{API_URL}/vpn/disconnect", headers=headers, timeout=10)
    print("Disconnected!")

if __name__ == "__main__":
    main()
