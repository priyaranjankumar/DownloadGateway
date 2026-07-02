#!/bin/bash
# Download Gateway - Full Installation Script
# Run on a fresh Ubuntu Server LTS installation
# Usage: sudo bash install.sh

set -euo pipefail

INSTALL_DIR="/opt/download-gateway"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"

echo "============================================"
echo "  Download Gateway - Installation"
echo "============================================"
echo ""

# Check root
if [[ $EUID -ne 0 ]]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

# --- Step 1: System packages ---
echo "=== [1/8] Installing system packages ==="
apt update
apt install -y curl jq
# Configure NodeSource repository for Node.js v20 (Tailwind v4 requires Node >= 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt update
apt install -y \
    python3 python3-venv python3-pip \
    aria2 \
    wireguard wireguard-tools \
    iptables \
    nodejs \
    resolvconf

echo "[OK] System packages installed"

# --- Step 2: Create users and directories ---
echo ""
echo "=== [2/8] Setting up users and directories ==="
bash "$SCRIPT_DIR/setup-users.sh"

# --- Step 3: Install aria2 config ---
echo ""
echo "=== [3/8] Configuring aria2 ==="

# Generate RPC secret
ARIA2_SECRET=$(openssl rand -hex 16)
sed "s/CHANGE_ME_TO_SECURE_TOKEN/$ARIA2_SECRET/" \
    "$DEPLOY_DIR/aria2/aria2.conf" > /etc/aria2/aria2.conf
chown root:aria2 /etc/aria2/aria2.conf
chmod 640 /etc/aria2/aria2.conf

echo "[OK] aria2 configured (RPC secret generated)"

# --- Step 4: Install backend ---
echo ""
echo "=== [4/8] Installing backend ==="

mkdir -p "$INSTALL_DIR/backend"
# Clean up any nested backend folder from previous installation runs
rm -rf "$INSTALL_DIR/backend/backend"
cp -r "$PROJECT_DIR/backend/." "$INSTALL_DIR/backend/"

cd "$INSTALL_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# Generate app secret key
APP_SECRET=$(openssl rand -hex 32)

chown -R gateway:gateway "$INSTALL_DIR/backend"
chmod -R 750 "$INSTALL_DIR/backend"

echo "[OK] Backend installed"

# --- Step 5: Build frontend ---
echo ""
echo "=== [5/8] Building frontend ==="

cd "$PROJECT_DIR/frontend"
rm -rf node_modules package-lock.json
npm install
npm run build

# Copy built frontend to serve directory
rm -rf "$INSTALL_DIR/frontend"
mkdir -p "$INSTALL_DIR/frontend"
cp -r dist/* "$INSTALL_DIR/frontend/"
chown -R gateway:gateway "$INSTALL_DIR/frontend"

echo "[OK] Frontend built"

# --- Step 6: Install systemd services ---
echo ""
echo "=== [6/8] Installing systemd services ==="

# Update backend service with generated secrets
sed -e "s/GENERATED_ON_INSTALL/$APP_SECRET/" \
    -e "s/CHANGE_ME/$ARIA2_SECRET/" \
    "$DEPLOY_DIR/systemd/download-gateway-backend.service" \
    > /etc/systemd/system/download-gateway-backend.service

cp "$DEPLOY_DIR/systemd/aria2.service" /etc/systemd/system/
cp "$DEPLOY_DIR/systemd/vpn-killswitch.service" /etc/systemd/system/

# Make kill switch scripts executable
chmod +x "$DEPLOY_DIR/scripts/killswitch-enable.sh"
chmod +x "$DEPLOY_DIR/scripts/killswitch-disable.sh"

# Copy scripts to install dir
cp "$DEPLOY_DIR/scripts/killswitch-enable.sh" "$INSTALL_DIR/"
cp "$DEPLOY_DIR/scripts/killswitch-disable.sh" "$INSTALL_DIR/"

# Update kill switch service paths
sed -i "s|/opt/download-gateway/deploy/scripts|$INSTALL_DIR|g" \
    /etc/systemd/system/vpn-killswitch.service

systemctl daemon-reload

echo "[OK] Systemd services installed"

# --- Step 7: Install sudoers ---
echo ""
echo "=== [7/8] Configuring sudo permissions ==="

cp "$DEPLOY_DIR/sudoers/gateway" /etc/sudoers.d/gateway
chmod 440 /etc/sudoers.d/gateway

# Validate sudoers
visudo -c -f /etc/sudoers.d/gateway
echo "[OK] Sudo permissions configured"

# --- Step 8: Enable and start services ---
echo ""
echo "=== [8/8] Starting services ==="

systemctl enable aria2.service
systemctl enable download-gateway-backend.service
systemctl restart aria2.service
systemctl restart download-gateway-backend.service

echo "[OK] Services started"

# --- Summary ---
echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "Services:"
echo "  aria2:    $(systemctl is-active aria2.service)"
echo "  backend:  $(systemctl is-active download-gateway-backend.service)"
echo ""
echo "Access the web UI at:"
echo "  http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "First-time setup:"
echo "  Visit the URL above to create your admin account."
echo ""
echo "VPN Setup:"
echo "  1. Download Surfshark WireGuard configs from your Surfshark dashboard"
echo "  2. Place .conf files in /etc/wireguard/configs/"
echo "  3. Name them: surfshark-{country}-{city}.conf"
echo "     Example: surfshark-us-nyc.conf, surfshark-de-fra.conf"
echo ""
echo "Secrets saved:"
echo "  aria2 RPC secret: $ARIA2_SECRET"
echo "  App secret key:   $APP_SECRET"
echo ""
echo "IMPORTANT: Save these secrets securely!"
echo "============================================"
