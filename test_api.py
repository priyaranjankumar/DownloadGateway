import requests
import json
import sys

API_URL = "http://192.168.1.53:8000/api"

def test_endpoint(name, method, path, headers=None, data=None):
    url = f"{API_URL}{path}"
    print(f"\n--- Testing {name} ({method} {path}) ---")
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data, timeout=5)
        
        print(f"Status Code: {resp.status_code}")
        try:
            print("Response:")
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print(f"Raw Output: {resp.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    # 1. Login to get token
    url = f"{API_URL}/auth/login"
    payload = {"username": "ranjan", "password": "password123"}
    print(f"Attempting to log in to: {url}")
    try:
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code != 200:
            print(f"Login failed (Status {resp.status_code}): {resp.text}")
            print("Please make sure the reset_db.py script was run on the LXC container first!")
            sys.exit(1)
        
        data = resp.json()
        token = data.get("access_token")
        print(f"Login successful! Received token: {token[:15]}...")
    except Exception as e:
        print(f"Failed to connect to API: {e}")
        sys.exit(1)
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test endpoints
    test_endpoint("Get Current User", "GET", "/auth/me", headers)
    test_endpoint("Get VPN Status", "GET", "/vpn", headers)
    test_endpoint("Get VPN Servers", "GET", "/vpn/servers", headers)
    test_endpoint("Get VPN IP Info", "GET", "/vpn/ip", headers)
    test_endpoint("Get Kill Switch Status", "GET", "/vpn/killswitch", headers)
    test_endpoint("Get System Stats", "GET", "/system", headers)
    test_endpoint("Get Downloads Stats", "GET", "/downloads/stats", headers)
    test_endpoint("Get Downloads List", "GET", "/downloads", headers)

if __name__ == "__main__":
    main()
