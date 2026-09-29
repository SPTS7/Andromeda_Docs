# Disaster Recovery Runbook

## Scenario A: Single LXC Failure
1. **CLI Restore:**
   pct restore <CTID> /mnt/experiments/ssd-backups/dump/<vzdump-file>.tar.zst --storage local-lvm
2. **GUI Restore:**
   - Go to Storage -> local-experiments-backup.
   - Select the desired backup file -> Restore.

## Scenario B: Total Host Failure (SSD Death)
1. **Base OS Recovery:** Reinstall Proxmox VE base ISO on new SSD.
2. **Import Backup Pool:**
   zpool import -f experiments
3. **Restore Host Config:**
   - Extract the latest archive from /mnt/experiments/ssd-backups/host-config/.
   - Restore /etc/network/interfaces and /etc/pve definitions.
4. **Container Restoration:**
   - Use pct restore to bring back all containers from the dump/ directory.
