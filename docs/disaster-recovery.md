# 🚨 Andromeda Disaster Recovery & Bare-Metal Restoration Runbook

This runbook provides complete, tested procedures for restoring the **Andromeda Proxmox Server** in the event of hardware failure, OS corruption, or container destruction.

---

## 💽 Hardware & Storage Architecture Reference

| Device | Model / Specs | Capacity | Filesystem / Pool | Role & Mountpoint |
| :--- | :--- | :--- | :--- | :--- |
| **`nvme0n1`** | Patriot M.2 P320 NVMe | 512 GB | ZFS (`rpool`) | **System Root & Cache:** PVE OS (`/`), LXC rootfs disks (`/rpool/data`), Templates (`/var/lib/vz`) |
| **`sda`** | WDC Bulk Storage HDD | 7.3 TB | ZFS (`media-pool`) | **Media Bulk Pool:** Mounted at `/mnt/media`. Bind-mounted into Jellyfin, Arr stack, and qBittorrent |
| **`sdb`** | WDC WD10EARS HDD | 1.0 TB | ZFS (`experiments`) | **Backup Target & Fallback:** Dataset `experiments/ssd-backups` mounted at `/mnt/experiments/ssd-backups` (`local-experiments-backup`) |

---

## 🛡️ Step 0: Ensure Backups Are Active on the 1TB Disk

Before a disaster happens, automated weekly container backups must be written to the 1TB backup target (`local-experiments-backup`).

### 1. Verify Storage Registration in Proxmox
Run in the Proxmox shell:
```bash
cat /etc/pve/storage.cfg
```
Ensure the entry for `local-experiments-backup` exists:
```ini
dir: local-experiments-backup
	path /mnt/experiments/ssd-backups
	content backup
	prune-backups keep-weekly=4
	shared 0
```

### 2. Configure Weekly Automated Snapshot Job
In the Proxmox Web GUI:
1. Navigate to **Datacenter -> Backup -> Add**.
2. **Node:** `server`
3. **Storage:** `local-experiments-backup`
4. **Selection Mode:** `All containers`
5. **Schedule:** `Weekly (e.g. Sunday 02:00)`
6. **Mode:** `Snapshot` (zero downtime)
7. **Compression:** `Zstandard (zstd)`

*Or via CLI in `/etc/pve/vzdump.cron`:*
```cron
0 2 * * 0           root vzdump 100 101 102 103 105 106 107 108 109 110 111 112 113 114 115 116 117 118 --storage local-experiments-backup --mode snapshot --compress zstd --prune-backups keep-weekly=4
```

---

## 🛑 Scenario 1: Total NVMe SSD (`nvme0n1`) Failure

If the primary NVMe SSD dies completely, the Proxmox host OS and LXC container root disks are lost. Because the 8TB media drive (`sda`) and 1TB backup drive (`sdb`) are physically separate disks, all media and backup archives are completely safe.

### Phase 1: Fresh Proxmox Base Installation
1. Physically replace the defective NVMe drive with a new 512GB+ SSD.
2. Boot from a Proxmox VE 8.x USB installer.
3. During the installation target disk prompt:
   - Select the new NVMe drive.
   - Filesystem: **ZFS (RAID0)**.
   - Hostname: `server`
   - IP: `192.168.1.100/24` | Gateway: `192.168.1.254` | DNS: `192.168.1.254`
4. Complete installation and reboot into the new PVE host.

### Phase 2: Re-import Existing ZFS Pools
Both `sda` and `sdb` remain intact. Tell the fresh Proxmox OS to mount them:
```bash
# Force-import surviving pools
zpool import -f media-pool
zpool import -f experiments

# Verify pools and mountpoints are active
zfs list
```
*Verification:*
* `/mnt/media` is active and contains the media library.
* `/mnt/experiments/ssd-backups` is active and contains container backup dumps.

### Phase 3: Register Storage in Proxmox
Register the backup directory in `/etc/pve/storage.cfg`:
```bash
cat << 'EOF' >> /etc/pve/storage.cfg

dir: local-experiments-backup
	path /mnt/experiments/ssd-backups
	content backup
	prune-backups keep-weekly=4
	shared 0
EOF
```

### Phase 4: Batch-Restore All Containers
Restore all 18 LXC containers directly to the fresh NVMe `local-zfs` pool using `pct restore`:

```bash
BACKUP_DIR="/mnt/experiments/ssd-backups/dump"

# Restore containers in sequence
for archive in "$BACKUP_DIR"/vzdump-lxc-*.tar.zst; do
    [ -f "$archive" ] || continue
    VMID=$(echo "$archive" | grep -o -E '[0-9]{3}' | head -n 1)
    echo ">>> Restoring CT $VMID from $archive..."
    pct restore "$VMID" "$archive" --storage local-zfs
done
```

### Phase 5: Re-link Device Passthrough for Ollama & Jellyfin
If Jellyfin (CT 103) or Ollama (CT 115) require Intel GPU transcoding, re-verify their `/etc/pve/lxc/<ID>.conf` lines:
```ini
# CT 103 (Jellyfin)
lxc.cgroup2.devices.allow: c 226:* rwm
lxc.mount.entry: /dev/dri renderD128 none bind,optional,create=file

# CT 115 (Ollama)
dev0: /dev/dri/renderD128,gid=993
dev1: /dev/dri/card0,gid=44
```

### Phase 6: Start All Services
```bash
pct start 109 # WireGuard VPN Gateway must start first!
sleep 5
pct start 100 101 102 103 105 106 107 108 110 111 112 113 114 115 116 117 118
```

---

## ⚠️ Scenario 2: Single Container Corruption or Hack

If a container breaks or becomes corrupted, restore it without affecting other containers or the host:

```bash
# 1. Stop and destroy the corrupted container (example: CT 108 Radarr)
pct stop 108
pct destroy 108

# 2. Restore the latest backup from the 1TB drive
LATEST_BACKUP=$(ls -t /mnt/experiments/ssd-backups/dump/vzdump-lxc-108-*.tar.zst | head -n 1)
pct restore 108 "$LATEST_BACKUP" --storage local-zfs

# 3. Start the restored container
pct start 108
```

---

## ⚡ Option B: Setting Up a True Real-Time Mirror Partition on `sdb`

If you want the 1TB disk (`sdb`) to maintain an active, bootable hardware mirror of the NVMe SSD:

### 1. Partition Layout Strategy
1. The NVMe SSD (`nvme0n1`) is 512 GB (476.9 GiB).
2. Repartition `sdb` (1 TB) into two partitions:
   - `sdb1` (476.9 GiB): Mirror partition matching `nvme0n1p3`.
   - `sdb2` (~450 GiB): ZFS pool for bulk experiments and testing.
3. Attach `sdb1` as a mirror vdev to `rpool`:
   ```bash
   zpool attach rpool nvme-nvme...-part3 /dev/sdb1
   ```
4. Copy the EFI boot partition (`nvme0n1p2`) to `sdb` and register it with `proxmox-boot-tool`:
   ```bash
   proxmox-boot-tool format /dev/sdb1 --force
   proxmox-boot-tool init /dev/sdb1
   ```
*Result:* If the NVMe SSD fails, you can select the 1TB disk in BIOS/UEFI boot options and boot immediately into Proxmox with zero data loss.
