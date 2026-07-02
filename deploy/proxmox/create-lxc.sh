#!/bin/bash
# Download Gateway - Proxmox LXC Provisioning Script
# Creates an unprivileged LXC container for the Download Gateway
#
# Run this on the Proxmox host:
#   bash create-lxc.sh [VMID] [STORAGE]
#
# Prerequisites:
#   - Ubuntu LTS template downloaded
#   - Host directory /srv/data/downloads exists

set -euo pipefail

# Configuration
VMID="${1:-200}"
STORAGE="${2:-local-lvm}"
TEMPLATE="local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst"
HOSTNAME="download-gateway"
MEMORY=2048
SWAP=512
CORES=2
DISK_SIZE=4
BRIDGE="vmbr0"
NAMESERVER="1.1.1.1"

echo "============================================"
echo "  Creating Download Gateway LXC (VMID: $VMID)"
echo "============================================"
echo ""

# Check if template exists
if ! pveam list local | grep -q "ubuntu-24.04"; then
    echo "Downloading Ubuntu 24.04 LTS template..."
    pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst
fi

# Create container
echo "Creating LXC container..."
pct create "$VMID" "$TEMPLATE" \
    --hostname "$HOSTNAME" \
    --memory "$MEMORY" \
    --swap "$SWAP" \
    --cores "$CORES" \
    --rootfs "${STORAGE}:${DISK_SIZE}" \
    --net0 "name=eth0,bridge=${BRIDGE},ip=dhcp" \
    --nameserver "$NAMESERVER" \
    --unprivileged 1 \
    --features nesting=1 \
    --onboot 1 \
    --start 0

echo "[OK] Container created"

# Add bind mount for downloads
echo "Adding bind mount for /downloads..."

# Create host directory if it doesn't exist
mkdir -p /srv/data/downloads

# Add mount point to container config
cat >> "/etc/pve/lxc/${VMID}.conf" << EOF

# Download Gateway bind mount
mp0: /srv/data/downloads,mp=/downloads
EOF

echo "[OK] Bind mount added: /srv/data/downloads -> /downloads"

# Start container
echo "Starting container..."
pct start "$VMID"
sleep 5

# Wait for network
echo "Waiting for network..."
for i in {1..30}; do
    if pct exec "$VMID" -- ping -c 1 -W 1 8.8.8.8 &>/dev/null; then
        break
    fi
    sleep 1
done

# Run initial setup inside container
echo "Running initial setup inside container..."
pct exec "$VMID" -- bash -c '
    apt update && apt upgrade -y
    apt install -y curl git
    echo "Initial setup complete"
'

echo ""
echo "============================================"
echo "  LXC Container Ready!"
echo "============================================"
echo ""
echo "  VMID:      $VMID"
echo "  Hostname:  $HOSTNAME"
echo "  Memory:    ${MEMORY}MB"
echo "  CPUs:      $CORES"
echo "  Disk:      ${DISK_SIZE}GB"
echo "  Network:   DHCP on $BRIDGE"
echo ""
echo "  IP Address: $(pct exec $VMID -- hostname -I 2>/dev/null | awk '{print $1}' || echo 'pending...')"
echo ""
echo "Next steps:"
echo "  1. Enter the container: pct enter $VMID"
echo "  2. Clone the project:"
echo "     git clone <your-repo-url> /opt/download-gateway-src"
echo "  3. Run the installer:"
echo "     cd /opt/download-gateway-src"
echo "     sudo bash deploy/scripts/install.sh"
echo ""
echo "============================================"
