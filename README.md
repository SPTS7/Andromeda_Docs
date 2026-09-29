# Andromeda Server Documentation

## Storage Architecture
- **Primary Media Pool:** 8TB Seagate Exos (media-pool) mounted at /mnt/media.
- **Backup Pool:** 1TB WD Green (experiments) mounted at /mnt/experiments.
  - Dedicated Dataset: experiments/ssd-backups (compression=lz4).
  - Mount point: /mnt/experiments/ssd-backups.

## Backup Strategy
- **LXC Containers:** Automated weekly backups via VZDump.
  - Schedule: Sundays @ 02:00 AM.
  - Storage: local-experiments-backup (/mnt/experiments/ssd-backups/dump).
  - Retention: Last 4 backups.
- **Host Configuration:** Automated weekly archives.
  - Schedule: Sundays @ 03:00 AM.
  - Storage: /mnt/experiments/ssd-backups/host-config/.
  - Retention: Last 4 archives.
