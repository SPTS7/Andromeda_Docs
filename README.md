# 🌌 Andromeda Server Documentation

Welcome to the central knowledge base for the **Andromeda Proxmox Home Server**. This repository serves as the technical "source of truth" for the hypervisor's architecture, container inventory, and operational runbooks.

## 🚀 Quick Start
The primary entry point for this documentation is the [**Control Center Dashboard**](index.html). This portal provides a high-level, visual overview of the system and direct links to specific technical domains.

---

## 🛠️ System Architecture

Andromeda is built on a Proxmox VE hypervisor, designed for high availability of home services, AI experimentation, and massive media archival.

### 🗄️ Storage Strategy
We utilize a tiered storage approach to balance performance (IOPS) and capacity:
- **Tier 1 (System/Fast):** NVMe SSD for LXC root disks, databases, and configuration caches.
- **Tier 2 (Bulk/Media):** 8TB ZFS Pool (`media-pool`) for high-density storage of movies, music, and personal archives.
- **Tier 3 (Backup/Experimental):** 1TB ZFS Pool (`experiments`) dedicated to system snapshots and temporary test environments.

### 📦 Container Ecosystem
The server hosts 19 LXC containers (IDs 100-118), categorized into several functional stacks:
- **AI Stack:** Ollama & Open WebUI for local LLM inference.
- **Media Stack:** Jellyfin, Sonarr, Radarr, Prowlarr, and Lidarr (the "Arr" stack).
- **Ops Stack:** Pulse for monitoring, Homepage for the external dashboard, and Hermes Agent for autonomous management.
- **Utility Stack:** Paperless-ngx, BentoPDF, and WireGuard.

### 🛡️ Data Integrity & Recovery
Reliability is ensured through a multi-layered backup strategy:
- **Automated Backups:** Weekly snapshots of all LXCs and host configurations.
- **Retention:** 4-week rolling window of backup archives.
- **Disaster Recovery:** Detailed runbooks are maintained in the `docs/` directory to ensure rapid restoration of services in the event of hardware failure.

---

## 📂 Repository Structure

| Directory | Purpose | Key Files |
| :--- | :--- | :--- |
| `/data` | Structured data for the dashboard | `containers.json` |
| `/storage` | Disk layouts and ZFS configurations | `disk-layout.md` |
| `/containers` | Inventory and resource specs | `inventory.md` |
| `/backup` | Backup schedules and logic | `strategy.md` |
| `/docs` | Critical runbooks and recovery | `disaster-recovery.md` |
| `/media` | Media library organization | `library-structure.md` |
| `/scripts` | Automation and doc-generation scripts | `generate_docs.py` |

---

## 📝 Maintenance
This documentation is managed by **Ginius**, an AI assistant. Updates are pushed automatically to `main` to reflect real-time changes in the server's state.
