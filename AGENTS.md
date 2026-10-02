# 🤖 AI Agent Guidelines: Andromeda Documentation Repository

> **Target Audience:** Autonomous personal agents (Hermes, Ginius, Antigravity, Claude, Copilot, etc.) maintaining the Andromeda Server documentation.

---

## 🎯 Repository Purpose & Mission
This repository is the **single source of truth** and **Control Center Dashboard** for the **Andromeda Proxmox VE Server** (Dell Precision 3630). 

It is structured as a **data-driven system**:
* The dashboard (`index.html`) is a static presentation layer.
* The SVG topology diagram (`js/diagram.js`) is dynamically generated from JSON.
* **All state lives in `data/*.json`**.

---

## 🚨 Golden Rules for Agents

1. **NEVER modify `index.html` or JavaScript files to update infrastructure data.**
   * If a container is added, removed, or changed, edit `data/containers.json` and `data/topology.json`.
   * If storage or network changes, edit `data/storage.json` or `data/network.json`.
   * The UI and topology diagram automatically adapt to changes in the data layer.

2. **NEVER re-introduce fake or simulated telemetry.**
   * Do not add random number generators (`Math.random()`), polling intervals for fake CPU loads, or mock telemetry toggles.
   * Display only verified host limits, real container allocations, or real sensor readings.

3. **Maintain Disaster Recovery Integrity:**
   * Any change to ZFS pools, disk layouts, or backup destinations must be reflected in `docs/disaster-recovery.md`.

---

## 📂 Data Layer File Directory

| File | Purpose | When to Update |
| :--- | :--- | :--- |
| **`data/containers.json`** | Specifications for all LXC containers (CPU, RAM, Disk, IP, tags, descriptions) | When a container is created, resized, re-IP'd, or removed |
| **`data/topology.json`** | Visual groupings (stacks: gateway, media, ai, tools) and connection flows | When adding a service to the diagram or changing traffic routes |
| **`data/storage.json`** | Disks (`nvme0n1`, `sda`, `sdb`), ZFS pools (`rpool`, `media-pool`, `experiments`), datasets | When adding drives, datasets, or reallocating storage |
| **`data/network.json`** | Bridge settings (`vmbr0`), host IP, and WireGuard VPN routing policies | When network gateways or VPN routing rules change |
| **`data/system.json`** | Proxmox VE version, kernel release, uptime, and CPU/RAM specs | When upgrading PVE, kernel, or server hardware |

---

## ⚡ How to Add or Update a Service (Agent Recipe)

To add a new container (e.g. `ct-name` with ID `119`):

### Step 1: Add to `data/containers.json`
```json
"ct-name": {
  "id": "119",
  "name": "ct-name",
  "status": "running",
  "ip": "192.168.1.19",
  "bridge": "vmbr0",
  "gateway": "192.168.1.254",
  "cpu": 2,
  "ram": "2.00 GiB",
  "ramVal": 2,
  "disk": "8.00 GiB",
  "diskVal": 8,
  "desc": "Short description of the service and its purpose.",
  "tags": ["category", "tool"],
  "color": "#3b82f6",
  "docLink": "https://service-url.org",
  "scriptLink": "https://community-scripts.org/"
}
```

### Step 2: Add to `data/topology.json`
Add the key `"ct-name"` to the appropriate stack (`gateway`, `media`, `ai`, or `tools`):
```json
{
  "id": "tools",
  "title": "General Tools",
  "color": "#64748b",
  "containers": ["homepage", "pulse", "paperless-ngx", "bentopdf", "docker", "ct-name"]
}
```
*(Optional)* If the service participates in a traffic flow (e.g. `automation` or `vpn`), add a connection object under `flows.<channel>`:
```json
{ "from": "source-key", "to": "ct-name", "label": "Flow Label" }
```

---

## 🔄 Automated Live Server Sync

When running directly on the Proxmox host or executing remote agent commands:
```bash
python3 scripts/sync_from_pve.py
```
This script automatically queries:
* `pct list` and `/etc/pve/lxc/*.conf` -> updates `data/containers.json`
* `zfs list` and `zpool status` -> updates `data/storage.json`
* `pveversion` and `uname -r` -> updates `data/system.json`

Always validate JSON syntax after edits:
```bash
python3 -m json.tool data/containers.json > /dev/null
```
