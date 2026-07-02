#!/bin/bash
# Download Gateway - System User Setup
# Creates dedicated users for each service component

set -euo pipefail

echo "=== Creating Download Gateway system users ==="

# Create aria2 user (for download engine)
if ! id -u aria2 &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin --comment "aria2 download daemon" aria2
    echo "[OK] Created user: aria2"
else
    echo "[SKIP] User aria2 already exists"
fi

# Create gateway user (for backend application)
if ! id -u gateway &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin --comment "Download Gateway backend" gateway
    echo "[OK] Created user: gateway"
else
    echo "[SKIP] User gateway already exists"
fi

# Create directories with proper ownership
echo "=== Creating directories ==="

# aria2 directories
mkdir -p /var/lib/aria2 /var/log/aria2 /etc/aria2
chown aria2:aria2 /var/lib/aria2 /var/log/aria2
chown root:aria2 /etc/aria2
chmod 750 /var/lib/aria2 /var/log/aria2 /etc/aria2

# Create empty session file
touch /var/lib/aria2/aria2.session
chown aria2:aria2 /var/lib/aria2/aria2.session

# Download directories
mkdir -p /downloads/{complete,incomplete,torrents,watch,metadata}
chown -R aria2:aria2 /downloads/{complete,incomplete,torrents,watch,metadata}
chmod -R 775 /downloads/{complete,incomplete,torrents,watch,metadata}

# Add gateway user to aria2 group (so it can read download files)
usermod -aG aria2 gateway

# Application data directory
mkdir -p /opt/download-gateway/data
chown -R gateway:gateway /opt/download-gateway/data
chmod 750 /opt/download-gateway/data

# WireGuard config directory (readable by gateway for server listing)
mkdir -p /etc/wireguard/configs
chmod 750 /etc/wireguard /etc/wireguard/configs

echo "=== Done ==="
echo ""
echo "Users created:"
echo "  aria2   - Download engine daemon"
echo "  gateway - Backend application"
echo ""
echo "Directories created:"
echo "  /var/lib/aria2        - aria2 session data"
echo "  /var/log/aria2        - aria2 logs"
echo "  /etc/aria2            - aria2 configuration"
echo "  /downloads            - Download storage"
echo "  /opt/download-gateway - Application data"
echo "  /etc/wireguard        - VPN configurations"
