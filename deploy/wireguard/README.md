# Surfshark WireGuard Configuration Files

## Setup Instructions

1. **Log in** to your Surfshark account at https://surfshark.com/
2. Navigate to **VPN → Manual setup**
3. Select **Desktop or mobile** → click **WireGuard**
4. Generate a key pair if you don't have one (save the private key immediately!)
5. Download config files for your preferred server locations

## File Naming Convention

Rename downloaded config files to follow this pattern:

```
surfshark-{country_code}-{city_code}.conf
```

### Examples:
```
surfshark-us-nyc.conf     # USA - New York
surfshark-us-lax.conf     # USA - Los Angeles
surfshark-de-fra.conf     # Germany - Frankfurt
surfshark-de-ber.conf     # Germany - Berlin
surfshark-nl-ams.conf     # Netherlands - Amsterdam
surfshark-uk-lon.conf     # UK - London
surfshark-sg-sng.conf     # Singapore
surfshark-jp-tok.conf     # Japan - Tokyo
surfshark-in-mum.conf     # India - Mumbai
surfshark-in-chn.conf     # India - Chennai
surfshark-ca-mon.conf     # Canada - Montreal
surfshark-au-syd.conf     # Australia - Sydney
surfshark-se-sto.conf     # Sweden - Stockholm
surfshark-ch-zur.conf     # Switzerland - Zurich
surfshark-br-sao.conf     # Brazil - São Paulo
```

## Placement

Place the renamed `.conf` files in:
```
/etc/wireguard/configs/
```

The backend will scan this directory and present available servers in the UI.

## Config File Structure

Each file should look like:
```ini
[Interface]
PrivateKey = <your_private_key>
Address = 10.14.0.2/16
DNS = 162.252.172.57, 149.154.159.92

[Peer]
PublicKey = <server_public_key>
AllowedIPs = 0.0.0.0/0
Endpoint = xx-xxx.prod.surfshark.com:51820
PersistentKeepalive = 25
```

## Important Notes

- The **PrivateKey** must be the same across all config files (it's YOUR key)
- The **PublicKey** and **Endpoint** differ per server
- **DNS** servers are Surfshark's own (prevents DNS leaks)
- **AllowedIPs = 0.0.0.0/0** routes ALL traffic through the VPN
- Default port is **51820/UDP**

## Permissions

After placing files:
```bash
sudo chmod 600 /etc/wireguard/configs/*.conf
sudo chown root:root /etc/wireguard/configs/*.conf
```
