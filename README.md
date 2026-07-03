# Download Gateway

A self-contained Linux appliance providing a polished web UI for managing downloads via aria2, with Surfshark VPN integration, kill switch, and system monitoring.

> **An appliance that "just works."**

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Download Gateway LXC                  │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │  React   │  │  FastAPI   │  │       aria2          │  │
│  │ Frontend │◄─┤  Backend   ├─►│  Download Engine     │  │
│  │ (Vite)   │  │ (uvicorn)  │  │  (JSON-RPC)          │  │
│  └──────────┘  └─────┬──────┘  └──────────────────────┘  │
│                      │                                    │
│               ┌──────┴──────┐                             │
│               │  WireGuard  │                             │
│               │  (Surfshark)│                             │
│               └─────────────┘                             │
│                                                           │
│  Kill Switch (iptables) ─── DNS Leak Protection           │
└─────────────────────────────────────────────────────────┘
```

## Features

- **Download Management** — HTTP, HTTPS, FTP, SFTP, BitTorrent, Magnet links via aria2
- **VPN Integration** — Surfshark WireGuard with one-click connect/disconnect
- **Kill Switch** — iptables blocks all traffic if VPN drops
- **DNS Leak Protection** — Surfshark DNS servers only
- **IP Monitoring** — Real-time public IP verification every 30 seconds
- **System Monitoring** — CPU, RAM, disk, temperature, network I/O
- **File Browser** — Navigate, rename, delete, move files in download directory
- **Live Logs** — Tail aria2, WireGuard, and system logs in real-time
- **Authentication** — JWT-based with bcrypt password hashing
- **Real-time Updates** — WebSocket for download progress, VPN events, system stats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, TailwindCSS v4, shadcn/ui |
| Backend | FastAPI, Python 3.11+, uvicorn |
| Downloads | aria2 (JSON-RPC) |
| VPN | WireGuard + Surfshark |
| Database | SQLite (aiosqlite) |
| State Management | TanStack Query v5 |
| Charts | Recharts |
| Notifications | Sonner (toasts) |

## Project Structure

```
DownloadGateway/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # App factory + lifespan
│   │   ├── config.py         # Environment configuration
│   │   ├── database.py       # SQLite setup
│   │   ├── dependencies.py   # Dependency injection
│   │   ├── models/           # Data models
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Business logic
│   │   ├── routers/          # API endpoints
│   │   └── utils/            # Helpers (subprocess, logging)
│   ├── requirements.txt
│   └── pyproject.toml
│
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities, API client
│   │   └── types/            # TypeScript types
│   ├── vite.config.ts
│   └── package.json
│
├── deploy/                   # Deployment configs
│   ├── aria2/                # aria2 configuration
│   ├── systemd/              # Systemd service units
│   ├── sudoers/              # Sudo permissions
│   ├── scripts/              # Install & management scripts
│   └── proxmox/              # LXC provisioning
│
└── README.md
```

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- aria2 (for full functionality)
- WireGuard (for VPN features)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Run development server (proxies API to localhost:8000)
npm run dev
```

### Full Stack Development

1. Start aria2 in RPC mode: `aria2c --enable-rpc --rpc-listen-port=6800`
2. Start backend: `cd backend && uvicorn app.main:app --reload --port 8000`
3. Start frontend: `cd frontend && npm run dev`
4. Open http://localhost:5173

## Production Deployment

See [deploy/](deploy/) for systemd services, install scripts, and Proxmox LXC provisioning.

### Quick Install (on Ubuntu Server)

```bash
sudo bash deploy/scripts/install.sh
```

## API Documentation

When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Security

- **No root execution** — Dedicated users with least privilege
- **Command allowlist** — Only whitelisted binaries can be executed
- **Input validation** — All inputs validated via Pydantic schemas
- **Path traversal protection** — File operations sandboxed to download directory
- **JWT authentication** — Short-lived tokens with bcrypt password hashing
- **HTTPS ready** — Works behind Nginx/Caddy/Traefik reverse proxy

## License
MIT
