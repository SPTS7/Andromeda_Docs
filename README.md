# 🌌 Andromeda Server Documentation

[![Proxmox VE](https://img.shields.io/badge/Proxmox_VE-8.4.21-E57000?logo=proxmox&logoColor=white)](https://www.proxmox.com/)
[![Kernel](https://img.shields.io/badge/Kernel-6.8.12--43--pve-black?logo=linux&logoColor=white)](https://kernel.org)
[![Containers](https://img.shields.io/badge/LXC_Containers-18_Active-10b981)]()
[![Disaster Recovery](https://img.shields.io/badge/Disaster_Recovery-Runbook-red)](docs/disaster-recovery.md)
[![Agent Guide](https://img.shields.io/badge/Agent_Rules-.agents-8b5cf6)](.agents)

Welcome to the central documentation and operational control center for the **Andromeda Proxmox Home Server** (Dell Precision 3630). This repository serves as the single source of truth for the server's hardware, containers, storage pools, network routing, and disaster recovery runbooks.

---

## 🚀 Quick Access

* 🖥️ [**Control Center Dashboard**](index.html): Interactive modular dashboard with dynamic architecture diagram and container inspector.
* 🚨 [**Disaster Recovery Runbook**](docs/disaster-recovery.md): Step-by-step restoration procedures for drive failures and container recovery.
* 🤖 [**AI Agent Instructions**](.agents): Operational rules and schemas for autonomous agents (Hermes, Ginius, etc.).

---

## 🛠️ System Overview

### Hardware & Hypervisor
* **Host:** Dell Precision 3630 Tower (`server`)
* **CPU:** Intel Core i7-8700K (6 Cores / 12 Threads @ 3.70GHz)
* **RAM:** 32 GB DDR4
* **OS:** Proxmox VE 8.4.21 (Kernel `6.8.12-43-pve`)

### Storage Strategy
| Drive | Model | Pool | Role & Mountpoint |
| :--- | :--- | :--- | :--- |
| **`nvme0n1`** (512GB) | Patriot M.2 P320 NVMe | `rpool` | **Fast Tier:** Host OS root (`/`), 18 LXC rootfs disks (`/rpool/data`), templates |
| **`sda`** (8.0TB) | WDC Bulk Storage HDD | `media-pool` | **Bulk Tier:** Media archive mounted at `/mnt/media` (Jellyfin, Arr stack, qBittorrent) |
| **`sdb`** (1.0TB) | WDC WD10EARS HDD | `experiments` | **Backup Tier:** Backup destination at `/mnt/experiments/ssd-backups` (`local-experiments-backup`) |

### Active LXC Containers (18)
* **Media Stack:** `jellyfin` (103), `seerr` (101), `sonarr` (107), `radarr` (108), `bazarr` (106), `lidarr` (118)
* **Gateway & VPN:** `wireguard` (109) with isolated VPN routing for `qbittorrent` (110) and `prowlarr` (105)
* **AI & Agent Stack:** `ollama` (115, Intel GPU passthrough), `hermesagent` (117), `n8n` (114)
* **Tools & Utilities:** `homepage` (102), `pulse` (116), `paperless-ngx` (112), `bentopdf` (111), `flaresolverr` (113), `docker` (100)

---

## 📂 Repository Structure

```
Andromeda_Docs/
├── .agents                   # Operational instructions for AI agents
├── AGENTS.md                 # Markdown duplicate for GitHub / tool discovery
├── data/                     # Single Source of Truth (Pure Data Layer)
│   ├── system.json           # Host specs, CPU, RAM, Proxmox kernel
│   ├── containers.json       # Specifications & limits for all 18 LXCs
│   ├── storage.json          # Block devices, ZFS pools, datasets, mountpoints
│   ├── network.json          # Bridge interfaces & WireGuard gateway routing
│   └── topology.json         # Diagram stacks, groupings, and traffic flows
├── js/                       # Modular Frontend Engine
│   ├── app.js                # State management and tab router
│   ├── diagram.js            # Data-driven SVG topology generator
│   └── components/           # Containers, Network, and Storage tab views
├── docs/
│   └── disaster-recovery.md  # Complete bare-metal & container recovery runbook
├── scripts/
│   ├── sync_from_pve.py      # Live server sync script for autonomous agents
│   └── generate_docs.py      # Static markdown generator
├── index.html                # Lightweight, clean dashboard entrypoint
└── README.md
```

---

## 🔄 Live Sync & Maintenance

To sync live changes from the Proxmox hypervisor into this repository:
```bash
python3 scripts/sync_from_pve.py
```
This updates `data/containers.json`, `data/storage.json`, and `data/system.json`. The web dashboard and topology diagram update automatically without modifying any HTML.
