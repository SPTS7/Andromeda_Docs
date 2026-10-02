#!/usr/bin/env python3
"""
Andromeda Proxmox VE Sync Script
Designed for autonomous execution by personal agents (Hermes / Ginius) or cron.
Extracts live container, storage, network, and system specs from Proxmox VE CLI/API
and updates the modular JSON data layer in data/*.
"""

import json
import os
import re
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(REPO_ROOT, "data")

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"[WARN] Command failed: {cmd} -> {e.stderr}", file=sys.stderr)
        return ""

def sync_system():
    print("[+] Syncing System Specs...")
    pve_ver = run_cmd("pveversion -v | head -n 1") or "pve-manager/8.4"
    kernel = run_cmd("uname -r") or "6.8.12-43-pve"
    hostname = run_cmd("hostname") or "server"
    uptime_raw = run_cmd("uptime -p") or "up 4 days"
    
    sys_file = os.path.join(DATA_DIR, "system.json")
    data = {}
    if os.path.exists(sys_file):
        with open(sys_file, "r") as f:
            data = json.load(f)
            
    data["hostname"] = hostname
    data["node"] = hostname
    data["pveVersion"] = pve_ver
    data["kernel"] = kernel
    data["uptimeFormatted"] = uptime_raw.replace("up ", "")
    data["status"] = "online"

    with open(sys_file, "w") as f:
        json.dump(data, f, indent=2)
    print("    -> system.json updated.")

def sync_containers():
    print("[+] Syncing LXC Containers from /etc/pve/lxc/*.conf...")
    cont_file = os.path.join(DATA_DIR, "containers.json")
    existing = {}
    if os.path.exists(cont_file):
        with open(cont_file, "r") as f:
            existing = json.load(f)

    conf_dir = "/etc/pve/lxc"
    if not os.path.exists(conf_dir):
        print(f"[!] {conf_dir} not accessible (are you running directly on PVE root?). Skipping container sync.")
        return

    for conf_name in os.listdir(conf_dir):
        if not conf_name.endswith(".conf"):
            continue
        vmid = conf_name.replace(".conf", "")
        conf_path = os.path.join(conf_dir, conf_name)
        
        with open(conf_path, "r") as f:
            lines = f.readlines()

        hostname = ""
        cores = 2
        memory = 1024
        rootfs_size = "4G"
        ip = "DHCP"
        gw = "192.168.1.254"
        bridge = "vmbr0"
        tags = []
        mounts = []

        for line in lines:
            line = line.strip()
            if line.startswith("hostname:"):
                hostname = line.split(":", 1)[1].strip()
            elif line.startswith("cores:"):
                cores = int(line.split(":", 1)[1].strip())
            elif line.startswith("memory:"):
                memory = int(line.split(":", 1)[1].strip())
            elif line.startswith("rootfs:"):
                m = re.search(r"size=([0-9]+[A-Za-z]+)", line)
                if m:
                    rootfs_size = m.group(1)
            elif line.startswith("net0:"):
                m_ip = re.search(r"ip=([0-9\.]+)", line)
                if m_ip:
                    ip = m_ip.group(1)
                m_gw = re.search(r"gw=([0-9\.]+)", line)
                if m_gw:
                    gw = m_gw.group(1)
                m_br = re.search(r"bridge=([A-Za-z0-9]+)", line)
                if m_br:
                    bridge = m_br.group(1)
            elif line.startswith("tags:"):
                tags_str = line.split(":", 1)[1].strip()
                tags = [t.strip() for t in tags_str.replace(";", ",").split(",") if t.strip()]
            elif re.match(r"^mp[0-9]+:", line):
                mp_part = line.split(":", 1)[1].strip()
                mounts.append(mp_part.replace(",mp=", " -> "))

        key = hostname or f"ct-{vmid}"
        prev = existing.get(key, {})

        ram_gib = round(memory / 1024, 2)
        disk_val = int(re.sub(r"[^0-9]", "", rootfs_size) or 4)

        existing[key] = {
            "id": vmid,
            "name": hostname,
            "status": "running",
            "ip": ip,
            "bridge": bridge,
            "gateway": gw,
            "cpu": cores,
            "ram": f"{ram_gib:.2f} GiB" if ram_gib >= 1 else f"{memory} MiB",
            "ramVal": ram_gib,
            "disk": f"{disk_val:.2f} GiB",
            "diskVal": disk_val,
            "desc": prev.get("desc", f"{hostname} LXC service container."),
            "tags": tags or prev.get("tags", ["lxc"]),
            "color": prev.get("color", "#3b82f6"),
            "docLink": prev.get("docLink", ""),
            "scriptLink": prev.get("scriptLink", "https://community-scripts.org/")
        }
        if mounts:
            existing[key]["mounts"] = mounts

    with open(cont_file, "w") as f:
        json.dump(existing, f, indent=2)
    print("    -> containers.json updated with live LXC configurations.")

def sync_storage():
    print("[+] Syncing ZFS Storage Pools & Mounts...")
    stor_file = os.path.join(DATA_DIR, "storage.json")
    if not os.path.exists(stor_file):
        return

    zfs_out = run_cmd("zfs list -H -o name,used,avail,refer,mountpoint")
    if not zfs_out:
        print("    -> zfs command not found or empty output. Keeping existing storage.json.")
        return

    with open(stor_file, "r") as f:
        data = json.load(f)

    # Update datasets usage dynamically
    usage_map = {}
    for row in zfs_out.splitlines():
        parts = row.split("\t")
        if len(parts) >= 5:
            name, used, avail, refer, mp = parts[:5]
            usage_map[name] = {"used": used, "avail": avail, "mountpoint": mp}

    for pool in data.get("pools", []):
        p_name = pool.get("name")
        if p_name in usage_map:
            pool["used"] = usage_map[p_name]["used"]
            pool["available"] = usage_map[p_name]["avail"]
        for ds in pool.get("datasets", []):
            d_name = ds.get("name")
            if d_name in usage_map:
                ds["used"] = usage_map[d_name]["used"]

    with open(stor_file, "w") as f:
        json.dump(data, f, indent=2)
    print("    -> storage.json updated with live ZFS usage.")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    sync_system()
    sync_containers()
    sync_storage()
    print("[✓] Proxmox VE Sync Complete!")

if __name__ == "__main__":
    main()
