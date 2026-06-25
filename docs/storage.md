# Storage

## Physical Disks

| Device | Model | Size | Type | Role |
|--------|-------|------|------|------|
| `nvme0n1` | Patriot M.2 P320 512GB | 476.9 GB | NVMe SSD | System pool — container rootfs, configs, caches |
| `sda` | WDC WD10EARS-00MVWB0 | 931.5 GB | HDD | Bulk media storage — movies, shows, music, downloads |

## Tiering

!!! success "Storage Strategy"
    - **SSD (NVMe)**: Hosts all container root filesystems, databases, and application configs. Fast IOPS for responsive services.
    - **HDD**: Dedicated bulk storage for media files, linked to the download/playback stack (qBittorrent, Jellyfin, Sonarr, Radarr, Lidarr).