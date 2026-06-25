# Network Configuration

## Host Network

!!! info "Primary Interface"
    - **Bridge**: `vmbr0` (eno1)
    - **Address**: `192.168.1.100/24`
    - **Gateway**: `192.168.1.254`

## Special Routing

### VPN Routing

The following containers route traffic through **WireGuard** (CT 109):

!!! success "VPN-Routed Services"
    - **qBittorrent** (CT 110) — All torrent traffic via VPN tunnel
    - **Prowlarr** (CT 105) — Indexer queries routed through VPN

### Tailscale

The **Jellyfin** container (CT 103) has a direct connection to **Tailscale** for private mesh access without exposing ports publicly.

### Container IP Map

| CT ID | Name | IP |
|-------|------|----|
| 100 | docker | 192.168.1.0 |
| 101 | openwebui | 192.168.1.1 |
| 102 | homepage | 192.168.1.2 |
| 103 | jellyfin | 192.168.1.3 |
| 104 | jellyseerr | 192.168.1.4 |
| 105 | prowlarr | 192.168.1.5 |
| 106 | bazarr | 192.168.1.6 |
| 107 | sonarr | 192.168.1.7 |
| 108 | radarr | 192.168.1.8 |
| 109 | wireguard | 192.168.1.9 |
| 110 | qbittorrent | 192.168.1.10 |
| 111 | bentopdf | 192.168.1.11 |
| 112 | paperless-ngx | 192.168.1.12 |
| 113 | flaresolverr | 192.168.1.13 |
| 114 | n8n | 192.168.1.14 |
| 115 | ollama | 192.168.1.15 |
| 116 | pulse | 192.168.1.16 |
| 117 | hermesagent | DHCP |
| 118 | lidarr | 192.168.1.18 |