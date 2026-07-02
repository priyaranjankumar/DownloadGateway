#!/bin/bash
# VPN Kill Switch - Disable
# Restores normal network access

set -euo pipefail

echo "[Kill Switch] Disabling..."

# Flush all rules
iptables -F
iptables -X

# Reset default policies to ACCEPT
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT

echo "[Kill Switch] Disabled. Normal network access restored."
