#!/bin/bash
# Download Gateway - Update Script
# Pulls latest code, rebuilds, and restarts services.
# Config and secrets are never touched.
# Usage: type 'update' in the LXC terminal (calls this via /usr/bin/update)

set -euo pipefail

INSTALL_DIR="/opt/download-gateway"
CONFIG_FILE="/etc/download-gateway/config.env"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\e[1;32m'
CYAN='\e[1;36m'
YELLOW='\e[1;33m'
RED='\e[1;31m'
RESET='\e[0m'

header() { echo -e "\n${CYAN}▸ $1${RESET}"; }
ok()     { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()   { echo -e "  ${YELLOW}⚠${RESET} $1"; }
fail()   { echo -e "  ${RED}✗${RESET} $1"; }

echo ""
echo -e "${CYAN}============================================${RESET}"
echo -e "${CYAN}  Download Gateway — Update${RESET}"
echo -e "${CYAN}============================================${RESET}"

# Check root
if [[ $EUID -ne 0 ]]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

# Verify config exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    fail "Config file not found at $CONFIG_FILE"
    echo "  Run install.sh first to set up the system."
    exit 1
fi

# --- Step 1: Pull latest code ---
header "Pulling latest changes"
cd "$SOURCE_DIR"
BEFORE=$(git rev-parse --short HEAD)
git pull
AFTER=$(git rev-parse --short HEAD)
if [[ "$BEFORE" == "$AFTER" ]]; then
    ok "Already up to date ($AFTER)"
else
    ok "Updated $BEFORE → $AFTER"
fi

# --- Step 2: Stop backend ---
header "Stopping backend service"
systemctl stop download-gateway-backend.service
ok "Backend stopped"

# --- Step 3: Update backend code ---
header "Updating backend"
mkdir -p "$INSTALL_DIR/backend"
rm -rf "$INSTALL_DIR/backend/backend"

# Preserve .venv — only copy source code
rsync -a --delete --exclude='.venv' --exclude='data' --exclude='__pycache__' --exclude='.env' \
    "$SOURCE_DIR/backend/" "$INSTALL_DIR/backend/"

cd "$INSTALL_DIR/backend"
source .venv/bin/activate
pip install -q -r requirements.txt
deactivate

chown -R gateway:gateway "$INSTALL_DIR/backend"
chmod -R 750 "$INSTALL_DIR/backend"
ok "Backend updated"

# --- Step 4: Build frontend ---
header "Building frontend"
cd "$SOURCE_DIR/frontend"
npm install --silent
npm run build --silent 2>&1

rm -rf "$INSTALL_DIR/frontend"
mkdir -p "$INSTALL_DIR/frontend"
cp -r dist/* "$INSTALL_DIR/frontend/"
chown -R gateway:gateway "$INSTALL_DIR/frontend"
ok "Frontend built and deployed"

# --- Step 5: Update systemd service files ---
header "Updating systemd services"
cp "$SOURCE_DIR/deploy/systemd/download-gateway-backend.service" /etc/systemd/system/
cp "$SOURCE_DIR/deploy/systemd/aria2.service" /etc/systemd/system/

# Copy kill switch scripts
if [[ -f "$SOURCE_DIR/deploy/systemd/vpn-killswitch.service" ]]; then
    cp "$SOURCE_DIR/deploy/systemd/vpn-killswitch.service" /etc/systemd/system/
    sed -i "s|/opt/download-gateway/deploy/scripts|$INSTALL_DIR|g" \
        /etc/systemd/system/vpn-killswitch.service
fi

for script in killswitch-enable.sh killswitch-disable.sh; do
    if [[ -f "$SOURCE_DIR/deploy/scripts/$script" ]]; then
        chmod +x "$SOURCE_DIR/deploy/scripts/$script"
        cp "$SOURCE_DIR/deploy/scripts/$script" "$INSTALL_DIR/"
    fi
done

# Apply extra ReadWritePaths from config
bash "$SCRIPT_DIR/apply-extra-paths.sh"

# Update sudoers if changed
if [[ -f "$SOURCE_DIR/deploy/sudoers/gateway" ]]; then
    cp "$SOURCE_DIR/deploy/sudoers/gateway" /etc/sudoers.d/gateway
    chmod 440 /etc/sudoers.d/gateway
    visudo -c -f /etc/sudoers.d/gateway >/dev/null 2>&1
fi

systemctl daemon-reload
ok "Systemd services updated"

# --- Step 6: Migrate config (add new keys only) ---
header "Checking config for new keys"
TEMPLATE="$SOURCE_DIR/deploy/config/config.env.template"
if [[ -f "$TEMPLATE" ]]; then
    ADDED=0
    while IFS= read -r line; do
        # Skip comments and blank lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue

        KEY=$(echo "$line" | cut -d= -f1)
        if ! grep -q "^${KEY}=" "$CONFIG_FILE"; then
            echo "$line" >> "$CONFIG_FILE"
            ok "Added new config key: $KEY"
            ADDED=$((ADDED + 1))
        fi
    done < "$TEMPLATE"
    if [[ $ADDED -eq 0 ]]; then
        ok "Config is up to date"
    fi
else
    warn "Template not found — skipping config migration"
fi

# --- Step 7: Update /usr/bin/update itself ---
header "Updating update command"
cat > /usr/bin/update << 'UPDATEEOF'
#!/bin/bash
set -euo pipefail
SOURCE_DIR="/opt/download-gateway-src"
if [[ ! -d "$SOURCE_DIR" ]]; then
    echo "ERROR: Source directory not found at $SOURCE_DIR"
    echo "Clone the repo there first: git clone <repo-url> $SOURCE_DIR"
    exit 1
fi
cd "$SOURCE_DIR"
exec bash deploy/scripts/update.sh "$@"
UPDATEEOF
chmod +x /usr/bin/update
ok "Update command refreshed"

# --- Step 8: Restart services ---
header "Restarting services"
systemctl restart aria2.service
systemctl restart download-gateway-backend.service
ok "Services restarted"

# --- Summary ---
echo ""
echo -e "${GREEN}============================================${RESET}"
echo -e "${GREEN}  Update complete!${RESET}"
echo -e "${GREEN}============================================${RESET}"
echo ""
echo "  aria2:    $(systemctl is-active aria2.service)"
echo "  backend:  $(systemctl is-active download-gateway-backend.service)"
echo ""
echo "  Web UI: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
