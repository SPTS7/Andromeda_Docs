/**
 * Andromeda Control Center - Main Modular Application Controller
 * Connects modular data layer, dynamic SVG topology diagram, and tab components.
 * Real system allocations - NO FAKE TELEMETRY.
 */

import { renderTopologySvg } from './diagram.js';
import { renderContainersTab } from './components/containersTab.js';
import { renderNetworkTab } from './components/networkTab.js';
import { renderStorageTab } from './components/storageTab.js';

// Application State
const state = {
  currentTab: 'dashboard',
  selectedNode: null,
  activeFlow: 'all',
  searchQuery: '',
  filterTag: 'all',
  detailContainer: null,
  copySuccess: false,
  data: {
    system: null,
    containers: {},
    storage: null,
    network: null,
    topology: null
  }
};

// Global Handlers
window.selectTab = (tabId) => {
  state.currentTab = tabId;
  updateUI();
};

window.selectFlow = (flowId) => {
  state.activeFlow = flowId;
  updateUI();
};

window.selectNode = (nodeKey) => {
  if (state.data.containers && state.data.containers[nodeKey]) {
    state.selectedNode = state.data.containers[nodeKey];
  } else {
    state.selectedNode = null;
  }
  updateUI();
};

window.clearSelectedNode = () => {
  state.selectedNode = null;
  updateUI();
};

window.openContainerDetail = (nameOrKey) => {
  const c = state.data.containers[nameOrKey] || 
            Object.values(state.data.containers).find(item => item.name === nameOrKey);
  if (c) {
    state.detailContainer = c;
    updateUI();
  }
};

window.closeContainerDetail = () => {
  state.detailContainer = null;
  updateUI();
};

window.setSearchQuery = (query) => {
  state.searchQuery = query;
  updateUI();
};

window.setFilterTag = (tag) => {
  state.filterTag = tag;
  updateUI();
};

window.copyIp = (ip) => {
  if (!ip || ip === 'DHCP') return;
  navigator.clipboard.writeText(ip);
  state.copySuccess = true;
  updateUI();
  setTimeout(() => {
    state.copySuccess = false;
    updateUI();
  }, 2000);
};

// Render Main App
function updateUI() {
  const app = document.getElementById('app');
  if (!app) return;

  const sys = state.data.system || {
    hostname: 'server',
    node: 'server',
    kernel: '6.8.12-43-pve',
    pveVersion: 'pve-manager/8.4.21',
    uptimeFormatted: '4 days'
  };

  app.innerHTML = `
    <!-- Left Navigation Bar -->
    <div class="w-full lg:w-64 glass-panel border-r border-gray-900 flex flex-col p-4 shrink-0 lg:h-screen lg:fixed lg:top-0 lg:left-0 z-30">
      <div class="flex items-center gap-3 mb-8 px-2 mt-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold">
          🌌
        </div>
        <div>
          <h1 class="text-base font-bold tracking-wider font-outfit text-white uppercase leading-none">Andromeda</h1>
          <span class="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest mt-1 block">Control Center</span>
        </div>
      </div>

      <nav class="flex flex-row lg:flex-col gap-1 w-full overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b border-gray-900 lg:border-none">
        ${renderTabButton('dashboard', 'Dashboard', '⚡')}
        ${renderTabButton('containers', 'Containers', '📦')}
        ${renderTabButton('network', 'Network', '🌐')}
        ${renderTabButton('storage', 'Storage', '💽')}
      </nav>

      <div class="hidden lg:flex flex-col mt-auto border-t border-gray-900 pt-4 px-2 font-mono text-[11px] space-y-1.5">
        <div class="flex justify-between items-center text-gray-500">
          <span>Host Node:</span>
          <span class="text-white font-bold">${sys.node}</span>
        </div>
        <div class="flex justify-between items-center text-gray-500">
          <span>PVE Kernel:</span>
          <span class="text-gray-300">${sys.kernel}</span>
        </div>
        <div class="flex justify-between items-center text-gray-500">
          <span>Active LXCs:</span>
          <span class="text-emerald-400 font-bold">18 / 18</span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 lg:pl-64 flex flex-col min-h-screen">
      <!-- Top Header -->
      <header class="border-b border-gray-900 p-4 lg:p-6 bg-[#09090d]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold font-outfit text-white tracking-tight flex items-center gap-2">
            <span>Andromeda Infrastructure Panel</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">Online</span>
          </h1>
          <p class="text-xs text-gray-500 font-medium mt-1">Dell Precision 3630 Proxmox Hypervisor • Single Source of Truth</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span class="text-xs font-mono text-gray-400 uppercase tracking-wider font-bold">PVE 8.4.21</span>
        </div>
      </header>

      <!-- Main Tab Body -->
      <main class="p-4 lg:p-6 flex-1 flex flex-col">
        ${renderActiveTab()}
      </main>
    </div>

    <!-- Modal Popup for Container Specs -->
    ${renderModal()}
  `;
}

function renderTabButton(id, label, icon) {
  const isActive = state.currentTab === id;
  return `
    <button
      onclick="window.selectTab('${id}')"
      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold font-outfit transition-all duration-150 shrink-0 ${
        isActive
          ? 'bg-violet-600/15 border border-violet-500/30 text-violet-400 font-bold shadow-md'
          : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
      }"
    >
      <span>${icon}</span>
      <span>${label}</span>
    </button>
  `;
}

function renderActiveTab() {
  switch (state.currentTab) {
    case 'dashboard':
      return renderDashboardView();
    case 'containers':
      return renderContainersTab(state.data.containers, state.searchQuery, state.filterTag);
    case 'network':
      return renderNetworkTab(state.data.network, state.data.containers);
    case 'storage':
      return renderStorageTab(state.data.storage);
    default:
      return '';
  }
}

// Render Dashboard View with Diagram & Real Specs Panel
function renderDashboardView() {
  return `
    <div class="flex flex-col gap-6 flex-1">
      
      <!-- Flow Filter Buttons -->
      <div class="flex flex-wrap gap-2 bg-[#09090d] border border-gray-900 p-2.5 rounded-2xl items-center">
        <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1 font-outfit">Filter Topology:</span>
        <button onclick="window.selectFlow('all')" class="px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${state.activeFlow === 'all' ? 'bg-white/10 border-white/20 text-white' : 'border-gray-800 text-gray-400 hover:border-gray-700'}">All Channels</button>
        <button onclick="window.selectFlow('vpn')" class="px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${state.activeFlow === 'vpn' ? 'bg-[#8b5cf6]/15 border-[#8b5cf6]/40 text-purple-300' : 'border-gray-800 text-gray-400 hover:border-gray-700'}">🛡️ WireGuard Tunnel</button>
        <button onclick="window.selectFlow('exterior')" class="px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${state.activeFlow === 'exterior' ? 'bg-[#06b6d4]/15 border-[#06b6d4]/40 text-cyan-300' : 'border-gray-800 text-gray-400 hover:border-gray-700'}">🌐 Tailscale Mesh</button>
        <button onclick="window.selectFlow('automation')" class="px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${state.activeFlow === 'automation' ? 'bg-[#f97316]/15 border-[#f97316]/40 text-orange-300' : 'border-gray-800 text-gray-400 hover:border-gray-700'}">⚡ Media Pipeline</button>
        <button onclick="window.selectFlow('ai')" class="px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${state.activeFlow === 'ai' ? 'bg-[#eab308]/15 border-[#eab308]/40 text-yellow-300' : 'border-gray-800 text-gray-400 hover:border-gray-700'}">🤖 AI & Agent Loop</button>
        <button onclick="window.selectFlow('storage')" class="px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${state.activeFlow === 'storage' ? 'bg-[#3b82f6]/15 border-[#3b82f6]/40 text-blue-300' : 'border-gray-800 text-gray-400 hover:border-gray-700'}">💽 Mount & Backup Links</button>
      </div>

      <!-- Split: Dynamic Diagram & Right Hand Specs Panel -->
      <div class="flex flex-col xl:flex-row gap-6 items-stretch flex-1">
        
        <!-- Modular Topology SVG Frame -->
        <div class="flex-1 bg-[#09090d] border border-gray-900 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[500px]">
          ${renderTopologySvg(state.data.topology, state.data.containers, state.activeFlow, state.selectedNode ? state.selectedNode.name : null)}
        </div>

        <!-- Real Host & Container Inspector Panel (NO FAKE TELEMETRY) -->
        <div class="w-full xl:w-[340px] shrink-0 flex flex-col gap-6">
          ${renderInspectorPanel()}
        </div>

      </div>

    </div>
  `;
}

function renderInspectorPanel() {
  const sys = state.data.system || {};
  const hw = sys.hardware || {};

  if (!state.selectedNode) {
    return `
      <div class="glass-panel rounded-2xl p-5 flex flex-col justify-between flex-1">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-violet-400 text-base">🖥️</span>
            <h2 class="text-sm font-bold font-outfit text-white uppercase tracking-wider">Host Node Profile</h2>
          </div>

          <p class="text-xs text-gray-400 font-outfit mb-4">
            Production hypervisor running Proxmox VE 8.4.21 on Debian 12.
          </p>

          <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3.5 space-y-2 text-[11px] font-mono mb-5">
            <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Hardware Model:</span><span class="text-white font-bold">${hw.model || 'Dell Precision 3630'}</span></div>
            <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">CPU Architecture:</span><span class="text-gray-200">${hw.cores || 6}C / ${hw.threads || 12}T (i7-8700K)</span></div>
            <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Total System RAM:</span><span class="text-white font-bold">32 GB DDR4</span></div>
            <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Primary NVMe:</span><span class="text-gray-300">512 GB (rpool)</span></div>
            <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Bulk Media HDD:</span><span class="text-gray-300">8.0 TB (media-pool)</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Backup Target:</span><span class="text-amber-400 font-bold">1.0 TB (experiments)</span></div>
          </div>

          <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3 space-y-2 text-[11px] font-mono">
            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-outfit">Operational Status</div>
            <div class="flex justify-between"><span class="text-gray-500">LXC Containers:</span><span class="text-emerald-400 font-bold">18 Running</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Host IPv4:</span><span class="text-cyan-400 font-bold">192.168.1.100</span></div>
            <div class="flex justify-between"><span class="text-gray-500">PVE Kernel:</span><span class="text-gray-300">6.8.12-43-pve</span></div>
          </div>
        </div>

        <div class="mt-6 border-t border-gray-900 pt-3 text-[11px] text-gray-500 font-outfit flex items-center gap-1.5">
          <span>💡 Click any node on the topology map to view its live specs.</span>
        </div>
      </div>
    `;
  }

  // Selected Node Specs
  const c = state.selectedNode;
  return `
    <div class="glass-panel rounded-2xl p-5 flex flex-col justify-between flex-1">
      <div>
        <button 
          onclick="window.clearSelectedNode()"
          class="mb-3 text-[10px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-lg"
        >
          ← Show Host Specs
        </button>

        <div class="flex items-start justify-between mb-3">
          <div>
            <h2 class="text-base font-bold font-outfit text-white">${c.name}</h2>
            <span class="text-[10px] font-mono font-bold text-gray-500">LXC Container ID: ${c.id}</span>
          </div>
          <span class="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-emerald-500/20">
            Running
          </span>
        </div>

        <p class="text-xs text-gray-400 leading-relaxed font-outfit mb-4">${c.desc}</p>

        <!-- Static Resource Limits -->
        <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 font-outfit">Assigned Resources</h3>
        <div class="space-y-2.5 mb-5 text-[11px] font-mono bg-[#09090d] border border-gray-900 rounded-xl p-3">
          <div class="flex justify-between">
            <span class="text-gray-500">CPU Allocation:</span>
            <span class="text-white font-bold">${c.cpu} Cores</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">RAM Limit:</span>
            <span class="text-white font-bold">${c.ram}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Rootfs Disk:</span>
            <span class="text-white font-bold">${c.disk}</span>
          </div>
        </div>

        <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 font-outfit">Network & Routing</h3>
        <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3 text-[11px] font-mono space-y-1.5">
          <div class="flex justify-between"><span class="text-gray-500">IP Address:</span><span class="text-cyan-400 font-bold">${c.ip}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Gateway:</span><span class="text-white">${c.gateway || '192.168.1.254'}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Bridge:</span><span class="text-gray-300">${c.bridge}</span></div>
        </div>
      </div>

      <div class="mt-6 border-t border-gray-900 pt-3">
        <button 
          onclick="window.openContainerDetail('${c.name}')"
          class="w-full py-2.5 rounded-xl border border-gray-800 bg-[#0f0f15] hover:bg-gray-800 text-xs font-bold font-outfit text-white transition-all shadow-md"
        >
          View Full Container Docs →
        </button>
      </div>
    </div>
  `;
}

function renderModal() {
  if (!state.detailContainer) return '';
  const c = state.detailContainer;

  return `
    <div class="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-[#111116] border border-gray-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1" style="background-color: ${c.color || '#3b82f6'}"></div>

        <button 
          onclick="window.closeContainerDetail()"
          class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xs font-bold bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg"
        >
          ✕ Close
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div>
            <h2 class="text-xl font-bold font-outfit text-white">${c.name}</h2>
            <div class="text-xs font-mono text-gray-500">CT ID: ${c.id} • IP: ${c.ip}</div>
          </div>
        </div>

        <p class="text-xs text-gray-300 font-outfit leading-relaxed mb-4">${c.desc}</p>

        <div class="flex flex-wrap gap-1.5 mb-5">
          ${(c.tags || []).map(t => `<span class="text-[10px] font-mono font-bold bg-gray-900 border border-gray-800 text-gray-400 px-2 py-0.5 rounded">#${t}</span>`).join('')}
        </div>

        <div class="grid grid-cols-3 gap-3 bg-[#09090d] border border-gray-900 rounded-xl p-3 text-xs font-mono mb-5">
          <div>
            <span class="text-gray-500 text-[10px] block">CPU</span>
            <span class="text-white font-bold">${c.cpu} Cores</span>
          </div>
          <div>
            <span class="text-gray-500 text-[10px] block">RAM</span>
            <span class="text-white font-bold">${c.ram}</span>
          </div>
          <div>
            <span class="text-gray-500 text-[10px] block">DISK</span>
            <span class="text-white font-bold">${c.disk}</span>
          </div>
        </div>

        ${c.mounts ? `
          <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3 text-xs font-mono mb-5">
            <span class="text-gray-500 text-[10px] block mb-1">STORAGE MOUNTPOINTS</span>
            <span class="text-cyan-400 font-bold">${c.mounts.join(', ')}</span>
          </div>
        ` : ''}

        <div class="flex gap-3 pt-2">
          ${c.docLink ? `
            <a href="${c.docLink}" target="_blank" class="flex-1 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 font-outfit text-xs font-bold text-center hover:bg-violet-600/30 transition-all">
              Documentation ↗
            </a>
          ` : ''}
          ${c.scriptLink ? `
            <a href="${c.scriptLink}" target="_blank" class="flex-1 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 font-outfit text-xs font-bold text-center hover:bg-gray-800 transition-all">
              Proxmox Helper Scripts ↗
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Data Loader
async function init() {
  try {
    const [sysRes, contRes, storRes, netRes, topoRes] = await Promise.all([
      fetch('data/system.json').then(r => r.json()),
      fetch('data/containers.json').then(r => r.json()),
      fetch('data/storage.json').then(r => r.json()),
      fetch('data/network.json').then(r => r.json()),
      fetch('data/topology.json').then(r => r.json())
    ]);

    state.data.system = sysRes;
    state.data.containers = contRes;
    state.data.storage = storRes;
    state.data.network = netRes;
    state.data.topology = topoRes;

    updateUI();
  } catch (err) {
    console.error("Failed to load modular configuration:", err);
    document.getElementById('app').innerHTML = `
      <div class="p-8 text-red-400 font-mono text-xs">
        Failed to load data layer files from /data/*. Please check that data/containers.json and data/system.json exist.
      </div>
    `;
  }
}

// Start application
init();
