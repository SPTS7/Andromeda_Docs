# 🚨 Andromeda Disaster Recovery Runbook

This document provides step-by-step instructions for recovering the Andromeda server in the event of hardware or OS failure.

## 💽 Hardware Layout Reference

*   **`nvme0n1` (476.9G):** Primary SSD containing the Proxmox OS (`rpool/ROOT`) and LXC container root disks (`rpool/data`).
*   **`sda` (7.3T):** Massive ZFS pool (`media-pool`). Contains bulk storage mounted to media containers.
*   **`sdb` (931.5G):** 1TB Fallback and Backup disk. Contains the ZFS pool `experiments`, which includes the `experiments/ssd-backups` dataset. This acts as your safety net for the primary SSD.

---

## 🛑 Scenario 1: Total Primary SSD (`nvme0n1`) Failure

If the NVMe drive completely dies, the Proxmox OS and all LXC configurations will be lost. However, because you have `experiments/ssd-backups` on the 1TB disk, you can recover everything without data loss.

### Step 1: Base Proxmox Reinstallation
1. Replace the dead NVMe SSD with a new drive.
2. Flash a Proxmox VE ISO to a USB drive and boot from it.
3. Install Proxmox to the new NVMe drive. Make sure to use the **ZFS (RAID0)** filesystem option during setup to recreate the `rpool`.
4. Boot into the fresh Proxmox installation.

### Step 2: Import Your Data Pools
Your media and backups survived because they are on different physical disks (`sda` and `sdb`). You need to tell the new Proxmox OS about them.

Run these commands in the Proxmox shell to force-import the pools:
```bash
zpool import -f media-pool
zpool import -f experiments
```
*Your 1TB backup drive and 8TB media drive are now mounted back at `/mnt/experiments` and `/mnt/media`.*

### Step 3: Restore Host Configuration
Navigate to the backups folder on your 1TB drive:
```bash
cd /mnt/experiments/ssd-backups
```
From here, restore your networking and cluster configs from your backup archives:
1. Copy the network interfaces file: `cp interfaces_backup /etc/network/interfaces`
2. Restart networking: `systemctl restart networking`
3. Copy the `/etc/pve/lxc/` configuration backups back to their original location to register the containers with the GUI.

### Step 4: Restore LXC Container Data
Because the actual container file systems lived on the SSD (`rpool/data`), you must restore them from your Proxmox `.vma.zst` or `.tar.zst` backup files located on the 1TB drive.

For each container backup in `/mnt/experiments/ssd-backups/dump/`, run:
```bash
pct restore <VMID> /mnt/experiments/ssd-backups/dump/vzdump-lxc-<VMID>-*.tar.zst --storage local-zfs
```
*(Example: `pct restore 100 /mnt/experiments/ssd-backups/dump/vzdump-lxc-100-2026.tar.zst --storage local-zfs`)*

Once all are restored, go to the Proxmox GUI and click **Start All**.

---

## ⚠️ Scenario 2: Single LXC Container Corruption

If a specific service (e.g., Jellyfin or Docker) becomes corrupted or gets hacked, you do not need to rebuild the host.

### Step 1: Destroy the corrupted container
```bash
pct destroy 103 # (Replace 103 with the broken container's ID)
```

### Step 2: Restore from the 1TB Backup pool
You can do this directly from the Proxmox GUI:
1. Select your host node on the left panel.
2. Go to **Storage -> local-experiments-backup**.
3. Go to **Backups**.
4. Select the most recent backup for the container you want to recover.
5. Click **Restore**. Choose `local-zfs` as the target storage.
