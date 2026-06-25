import json
import os
from datetime import timedelta

DATA_FILE = "proxmox_data.json"
DOCS_DIR = "docs"
CONTAINERS_DIR = os.path.join(DOCS_DIR, "containers")
COMMUNITY_SCRIPTS_URL = "https://helper-scripts.com/"

# Descriptions for known services
SERVICE_DESCRIPTIONS = {
    "jellyfin": {
        "desc": "The Free Software Media System. It allows you to collect, manage, streaming media.",
        "url": "https://jellyfin.org/docs/"
    },
    "jellyseerr": {
        "desc": "A request management system for the Jellyfin media server. It helps you manage requests for new content.",
        "url": "https://docs.seerr.dev/"
    },
    "prowlarr": {
        "desc": "An indexer manager/proxy built on the popular *arr .net/react stack to integrate with your various PVR apps.",
        "url": "https://wiki.servarr.com/prowlarr"
    },
    "bazarr": {
        "desc": "A companion application to Sonarr and Radarr. It manages and downloads subtitles based on your requirements.",
        "url": "https://wiki.bazarr.media/"
    },
    "sonarr": {
        "desc": "Smart TV show PVR for independent newsgroup and torrent users. It monitors for new episodes of your favorite shows.",
        "url": "https://wiki.servarr.com/sonarr"
    },
    "radarr": {
        "desc": "A movie collection manager for Usenet and BitTorrent users. It monitors multiple RSS feeds for new movies.",
        "url": "https://wiki.servarr.com/radarr"
    },
    "wireguard": {
        "desc": "A fast, modern, and secure VPN tunnel.",
        "url": "https://www.wireguard.com/"
    },
    "qbittorrent": {
        "desc": "A free and open-source BitTorrent client.",
        "url": "https://www.qbittorrent.org/"
    },
    "bentopdf": {
        "desc": "A PDF editor and management tool.",
        "url": "https://bentopdf.app/"
    },
    "paperless-ngx": {
        "desc": "A community-supported supercharged version of Paperless: scan, index and archive all your physical documents.",
        "url": "https://docs.paperless-ngx.com/"
    },
    "flaresolverr": {
        "desc": "Proxy server to bypass Cloudflare protection.",
        "url": "https://github.com/FlareSolverr/FlareSolverr"
    },
    "n8n": {
        "desc": "Workflow automation tool. Fair-code licensed alternative to Zapier/Tray.io.",
        "url": "https://docs.n8n.io/"
    },
    "ollama": {
        "desc": "Get up and running with large language models locally.",
        "url": "https://ollama.com/docs"
    },
    "homepage": {
        "desc": "A modern, fully static, fast, secure fully proxied, highly customizable application dashboard.",
        "url": "https://gethomepage.dev/"
    },
    "beszel": {
        "desc": "Lightweight server monitoring hub.",
        "url": "https://beszel.tech/"
    },
    "docker": {
        "desc": "Docker LXC environment for running containerized workloads.",
        "url": "https://helper-scripts.com/"
    },
    "openwebui": {
        "desc": "Web-based UI for interacting with local LLMs via Ollama.",
        "url": "https://docs.openwebui.com/"
    },
    "pulse": {
        "desc": "Real-time Proxmox VE monitoring dashboard with alerting.",
        "url": "https://github.com/community-scripts/ProxmoxVE/"
    },
    "hermesagent": {
        "desc": "AI agent platform for autonomous task execution and automation.",
        "url": "https://hermes-agent.nousresearch.com/docs/"
    },
    "lidarr": {
        "desc": "Music collection manager for Usenet and BitTorrent users.",
        "url": "https://wiki.servarr.com/lidarr"
    }
}

def load_data():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def format_uptime(seconds):
    return str(timedelta(seconds=int(seconds)))

def format_bytes(size):
    power = 2**10
    n = size
    dic_powerN = {0: ' ', 1: 'KiB', 2: 'MiB', 3: 'GiB', 4: 'TiB'}
    for i in range(5):
        if n < power:
            return f"{n:.2f} {dic_powerN[i]}"
        n /= power
    return f"{n:.2f} TiB"

def ensure_dirs():
    os.makedirs(CONTAINERS_DIR, exist_ok=True)
    os.makedirs(os.path.join(DOCS_DIR, "assets"), exist_ok=True)

def generate_index(data):
    nodes = [d for d in data if d.get('type') == 'node']
    
    content = "# Andromeda Server Overview\n\n"
    content += "## Nodes\n\n"
    
    for node in nodes:
        cpu_usage = f"{node.get('cpu', 0) * 100:.1f}%"
        mem_usage = f"{format_bytes(node.get('mem', 0))} / {format_bytes(node.get('maxmem', 0))}"
        uptime = format_uptime(node.get('uptime', 0))
        
        content += "!!! info \"Node Status: " + node.get('node') + "\"\n"
        content += f"    - **Status**: {node.get('status')}\n"
        content += f"    - **CPU Utilization**: {cpu_usage}\n"
        content += f"    - **Memory**: {mem_usage}\n"
        content += f"    - **Uptime**: {uptime}\n\n"

    content += "## Dashboard\n\n"
    # User wanted to "include" the diagram html. An Iframe is the best way to render a full HTML document inside another page.
    content += "<iframe src=\"assets/diagram.html\" style=\"min-height: 400px; width: 100%; border: none;\"></iframe>\n"
    
    with open(os.path.join(DOCS_DIR, "index.md"), 'w') as f:
        f.write(content)

def generate_containers(data):
    containers = [d for d in data if d.get('type') == 'lxc']
    
    # Index for containers folder
    index_content = "# Containers\n\n"
    index_content += "List of all active LXC containers on the server.\n\n"
    index_content += "| ID | Name | Status | IP | Description |\n"
    index_content += "|----|------|--------|----|-------------|\n"
    
    for c in containers:
        name = c.get('name', 'unknown')
        vmid = c.get('vmid')
        status = c.get('status')
        tags = c.get('tags', '')
        
        service_info = SERVICE_DESCRIPTIONS.get(name, {"desc": "No description available.", "url": "#"})
        desc = service_info["desc"]
        url = service_info["url"]
        
        # Link to individual page
        index_content += f"| {vmid} | [{name}]({name}.md) | {status} | - | {desc} |\n"
        
        # Generate individual page
        page_content = f"# {name}\n\n"
        
        # Description block with links
        page_content += "!!! quote \"Description\"\n"
        page_content += f"    {desc}\n\n"
        page_content += f"    [Official Documentation]({url}){{ .md-button }}\n"
        if "community-script" in tags:
             page_content += f"    [Proxmox Community Scripts]({COMMUNITY_SCRIPTS_URL}){{ .md-button }}\n"
        
        page_content += f"\n**ID**: `{vmid}` &nbsp; **Status**: `{status}` &nbsp; **Tags**: `{tags}`\n\n"
        
        # Resources Block - LIMITS ONLY as requested
        page_content += "## Assigned Resources\n\n"
        page_content += "!!! note \"Limits\"\n"
        page_content += f"    - **CPU Cores**: {c.get('maxcpu')}\n"
        page_content += f"    - **Memory Allocation**: {format_bytes(c.get('maxmem', 0))}\n"
        page_content += f"    - **Disk Size**: {format_bytes(c.get('maxdisk', 0))}\n"
        # Network Block
        page_content += "\n## Network\n\n"
        page_content += "!!! abstract \"Traffic\"\n"
        page_content += f"    - **Net In**: {format_bytes(c.get('netin', 0))}\n"
        page_content += f"    - **Net Out**: {format_bytes(c.get('netout', 0))}\n"
        
        with open(os.path.join(CONTAINERS_DIR, f"{name}.md"), 'w') as f:
            f.write(page_content)
            
    with open(os.path.join(CONTAINERS_DIR, "index.md"), 'w') as f:
        f.write(index_content)

def generate_storage(data):
    storage = [d for d in data if d.get('type') == 'storage']
    
    content = "# Storage\n\n"
    content += "| ID | Type | Content | Usage | Status |\n"
    content += "|----|------|---------|-------|--------|\n"
    
    for s in storage:
        usage = f"{format_bytes(s.get('disk', 0))} / {format_bytes(s.get('maxdisk', 0))}"
        content += f"| {s.get('id')} | {s.get('plugintype')} | {s.get('content')} | {usage} | {s.get('status')} |\n"
        
    with open(os.path.join(DOCS_DIR, "storage.md"), 'w') as f:
        f.write(content)

def generate_network(data):
    # This is partially hardcoded based on user request as the JSON lacks full network map
    content = "# Network Configuration\n\n"
    
    content += "## Special Routing\n\n"
    content += "### VPN Routing\n"
    content += "The following containers route traffic through **WireGuard**:\n\n"
    content += "- !!! success \"qbittorrent\"\n"
    content += "- !!! success \"prowlarr\"\n\n"
    
    content += "### Tailscale\n"
    content += "The **jellyfin** container has a connection to **Tailscale**.\n"
    
    with open(os.path.join(DOCS_DIR, "network.md"), 'w') as f:
        f.write(content)

def main():
    ensure_dirs()
    data = load_data()
    
    generate_index(data)
    generate_containers(data)
    generate_storage(data)
    generate_network(data)
    
    # Create empty assets file if not exists or overwrite empty
    # User said "Leave an empty html file"
    if not os.path.exists(os.path.join(DOCS_DIR, "assets", "diagram.html")):
        with open(os.path.join(DOCS_DIR, "assets", "diagram.html"), 'w') as f:
            f.write("")

if __name__ == "__main__":
    main()
