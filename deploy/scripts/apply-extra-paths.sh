#!/bin/bash
# Download Gateway - Apply Extra ReadWritePaths
# Reads DG_EXTRA_DIRS from config.env and creates systemd overrides
# so aria2 and the backend can write to extra mount points.
# Called by both install.sh and update.sh.

set -euo pipefail

CONFIG_FILE="/etc/download-gateway/config.env"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "[SKIP] No config file found — skipping extra paths"
    exit 0
fi

EXTRA_DIRS_RAW=$(grep '^DG_EXTRA_DIRS=' "$CONFIG_FILE" | cut -d= -f2- || true)

if [[ -z "$EXTRA_DIRS_RAW" || "$EXTRA_DIRS_RAW" == "[]" ]]; then
    # No extra dirs — remove overrides if they exist
    rm -f /etc/systemd/system/aria2.service.d/extra-paths.conf
    rm -f /etc/systemd/system/download-gateway-backend.service.d/extra-paths.conf
    echo "[OK] No extra dirs configured"
    exit 0
fi

# Parse JSON array: extract quoted strings
PATHS=$(echo "$EXTRA_DIRS_RAW" | python3 -c "
import sys, json
dirs = json.load(sys.stdin)
for d in dirs:
    print(d)
" 2>/dev/null || true)

if [[ -z "$PATHS" ]]; then
    echo "[SKIP] Could not parse DG_EXTRA_DIRS — skipping"
    exit 0
fi

# Build ReadWritePaths line
RWP=""
while IFS= read -r p; do
    RWP="$RWP $p"
done <<< "$PATHS"
RWP=$(echo "$RWP" | xargs)

echo "[INFO] Extra ReadWritePaths: $RWP"

# aria2 override
mkdir -p /etc/systemd/system/aria2.service.d
cat > /etc/systemd/system/aria2.service.d/extra-paths.conf << EOF
[Service]
ReadWritePaths=$RWP
EOF

# backend override
mkdir -p /etc/systemd/system/download-gateway-backend.service.d
cat > /etc/systemd/system/download-gateway-backend.service.d/extra-paths.conf << EOF
[Service]
ReadWritePaths=$RWP
EOF

echo "[OK] Systemd overrides created for extra mount paths"
