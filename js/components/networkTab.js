/**
 * Modular Network Tab Component
 * Real host bridge topology, WireGuard VPN Gateway status, and IPv4 allocation table.
 */

export function renderNetworkTab(network, containers) {
  const host = (network && network.host) || {
    interface: "eno1",
    bridge: "vmbr0",
    ip: "192.168.1.100/24",
    gateway: "192.168.1.254"
  };

  const vpn = (network && network.vpnRouting) || {
    container: "wireguard",
    vmid: 109,
    ip: "192.168.1.9",
    routedContainers: []
  };

  const containerList = Object.values(containers || {}).sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const tableRows = containerList.map(c => {
    const isVpnRouted = c.gateway === "192.168.1.9" || (vpn.routedContainers && vpn.routedContainers.some(r => r.vmid === parseInt(c.id)));
    const isVpnServer = c.name === "wireguard";
    const isTailscale = c.name === "jellyfin";

    let routeBadge = '<span class="text-gray-400 font-mono text-[10px]">Standard vmbr0</span>';
    if (isVpnServer) {
      routeBadge = '<span class="text-purple-400 font-bold font-mono text-[10px] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">🛡️ VPN Gateway</span>';
    } else if (isVpnRouted) {
      routeBadge = '<span class="text-emerald-400 font-bold font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">🔒 Routed via WireGuard</span>';
    } else if (isTailscale) {
      routeBadge = '<span class="text-cyan-400 font-bold font-mono text-[10px] bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">🌐 Tailscale Mesh</span>';
    }

    return `
      <tr class="hover:bg-white/2 transition-colors border-b border-gray-900/60 font-mono text-xs">
        <td class="py-2.5 px-3 text-gray-500 font-bold">${c.id}</td>
        <td class="py-2.5 px-3 text-white font-bold font-outfit">${c.name}</td>
        <td class="py-2.5 px-3 text-cyan-400 font-bold">${c.ip}</td>
        <td class="py-2.5 px-3 text-gray-400">${c.gateway || '192.168.1.254'}</td>
        <td class="py-2.5 px-3 text-gray-400">${c.bridge || 'vmbr0'}</td>
        <td class="py-2.5 px-3">${routeBadge}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="flex flex-col gap-6 flex-1 text-xs text-gray-300">
      
      <!-- Top Overview Cards -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        <!-- Host Bridge Info -->
        <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-cyan-400 font-bold text-base">🌐</span>
              <h2 class="text-sm font-bold font-outfit text-white uppercase tracking-wider">Host Interface Bridge</h2>
            </div>
            <p class="text-gray-400 leading-relaxed mb-4 text-xs font-outfit">
              Proxmox bridged virtual switch mapping physical adapter to container virtual Ethernet pairs.
            </p>

            <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3 space-y-2 font-mono text-[11px]">
              <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Bridge Interface:</span><span class="text-white font-bold">${host.bridge}</span></div>
              <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Physical Adapter:</span><span class="text-white font-bold">${host.physicalInterface} (Intel Gigabit)</span></div>
              <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Host IP:</span><span class="text-cyan-400 font-bold">${host.ip}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Default Gateway:</span><span class="text-white font-bold">${host.gateway}</span></div>
            </div>
          </div>
        </div>

        <!-- WireGuard VPN Route Isolation Card -->
        <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-purple-400 font-bold text-base">🛡️</span>
              <h2 class="text-sm font-bold font-outfit text-white uppercase tracking-wider">WireGuard Gateway Isolation</h2>
            </div>
            <p class="text-gray-400 leading-relaxed mb-4 text-xs font-outfit">
              Torrent and indexer containers route their traffic exclusively through CT 109. If the VPN disconnects, traffic halts immediately.
            </p>

            <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3 space-y-2 font-mono text-[11px]">
              <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">VPN Gateway Node:</span><span class="text-purple-400 font-bold">${vpn.container} (CT ${vpn.vmid} - ${vpn.ip})</span></div>
              <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Routed Downloader:</span><span class="text-white font-semibold">qbittorrent (CT 110 - 192.168.1.10)</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Routed Indexer:</span><span class="text-white font-semibold">prowlarr (CT 105 - 192.168.1.5)</span></div>
            </div>
          </div>
        </div>

      </div>

      <!-- IPv4 Allocation Table -->
      <div class="glass-panel p-5 rounded-2xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold font-outfit text-white uppercase tracking-wider">Container IPv4 Network Mapping</h2>
          <span class="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Subnet: 192.168.1.0/24</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr class="border-b border-gray-900 text-gray-500 uppercase tracking-wider font-bold">
                <th class="py-2.5 px-3">CT ID</th>
                <th class="py-2.5 px-3">Service Name</th>
                <th class="py-2.5 px-3">Assigned IP</th>
                <th class="py-2.5 px-3">Gateway</th>
                <th class="py-2.5 px-3">Bridge</th>
                <th class="py-2.5 px-3">Routing Mode</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-900">
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
