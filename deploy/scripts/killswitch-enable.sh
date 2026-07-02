#!/bin/bash
# VPN Kill Switch - Enable
# Blocks all internet traffic except through the VPN tunnel
# Allows LAN access for the web UI

set -euo pipefail

WG_IFACE="${WG_IFACE:-wg0}"
WG_PORT="${WG_PORT:-51820}"
LAN_SUBNET="${LAN_SUBNET:-192.168.1.0/24}"

echo "[Kill Switch] Enabling..."

# Flush existing rules
iptables -F
iptables -X

# Default policy: DROP everything
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow loopback (required for local services)
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow LAN access (web UI, SSH, etc.)
iptables -A INPUT -s "$LAN_SUBNET" -j ACCEPT
iptables -A OUTPUT -d "$LAN_SUBNET" -j ACCEPT

# Allow WireGuard UDP handshake to VPN server
iptables -A OUTPUT -p udp --dport "$WG_PORT" -j ACCEPT
iptables -A INPUT -p udp --sport "$WG_PORT" -j ACCEPT

# Allow all traffic through VPN tunnel interface
iptables -A INPUT -i "$WG_IFACE" -j ACCEPT
iptables -A OUTPUT -o "$WG_IFACE" -j ACCEPT

# Allow DNS only through VPN tunnel
iptables -A OUTPUT -o "$WG_IFACE" -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -o "$WG_IFACE" -p tcp --dport 53 -j ACCEPT

# Allow established/related connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

echo "[Kill Switch] Enabled. All non-VPN traffic is blocked."
echo "[Kill Switch] LAN subnet: $LAN_SUBNET"
echo "[Kill Switch] VPN interface: $WG_IFACE"
