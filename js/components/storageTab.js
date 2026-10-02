/**
 * Modular Storage Tab Component
 * Real physical disk layouts, ZFS pools, datasets, and backup status.
 */

export function renderStorageTab(storage) {
  const pools = (storage && storage.pools) || [];

  const poolCards = pools.map(p => `
    <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10" style="background-color: ${p.color}"></div>
      
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-base">💽</span>
            <h3 class="text-sm font-bold font-outfit text-white uppercase tracking-wider">${p.name}</h3>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase" style="color: ${p.color}; background-color: ${p.color}15; border: 1px solid ${p.color}30">
            ${p.type}
          </span>
        </div>

        <p class="text-gray-400 text-xs font-outfit leading-relaxed mb-4">${p.role}</p>

        <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3 space-y-2 font-mono text-[11px] mb-4">
          <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Block Device:</span><span class="text-white font-bold">${p.device}</span></div>
          <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Drive Model:</span><span class="text-gray-300">${p.deviceModel}</span></div>
          <div class="flex justify-between border-b border-gray-900/80 pb-1.5"><span class="text-gray-500">Used Capacity:</span><span class="text-white font-bold">${p.used}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Available Space:</span><span class="text-emerald-400 font-bold">${p.available}</span></div>
        </div>

        <!-- Datasets Listing -->
        <div class="mb-4">
          <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-outfit">Mounted Datasets</div>
          <div class="space-y-1.5">
            ${(p.datasets || []).map(ds => `
              <div class="bg-[#0f0f15] border border-gray-900/80 rounded-lg p-2 text-[10px] flex items-center justify-between font-mono">
                <div>
                  <span class="text-cyan-400 font-bold">${ds.mountpoint}</span>
                  <span class="text-gray-500 ml-1">(${ds.name})</span>
                </div>
                <span class="text-gray-400 font-bold">${ds.used}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div>
        <div class="flex justify-between text-[10px] text-gray-500 mb-1 font-bold uppercase font-outfit">
          <span>Allocation</span>
          <span class="text-white font-mono">${p.usagePercent}% Used</span>
        </div>
        <div class="w-full h-1.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
          <div class="h-full" style="width: ${p.usagePercent}%; background-color: ${p.color}"></div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="flex flex-col gap-6 flex-1 text-xs text-gray-300">
      
      <!-- Physical Pools Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        ${poolCards}
      </div>

      <!-- Backup Strategy & Disaster Target Notice -->
      <div class="glass-panel p-5 rounded-2xl">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-amber-400 font-bold text-base">🛡️</span>
          <h2 class="text-sm font-bold font-outfit text-white uppercase tracking-wider">Disaster Recovery & Backup Target (1TB Disk)</h2>
        </div>
        <p class="text-gray-400 leading-relaxed mb-4 text-xs font-outfit">
          The 1TB HDD (<code class="text-amber-400">sdb</code>) hosts the ZFS pool <code class="text-amber-400">experiments</code>. Its dedicated dataset <code class="text-amber-400">experiments/ssd-backups</code> is mounted at <code class="text-amber-400">/mnt/experiments/ssd-backups</code> and registered in Proxmox as storage target <code class="text-amber-400">local-experiments-backup</code>.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-outfit text-[11px]">
          <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3">
            <div class="text-gray-500 font-bold uppercase text-[9px] mb-1">Target Storage</div>
            <div class="text-white font-bold font-mono">local-experiments-backup</div>
            <div class="text-gray-400 mt-1">Directory target on 1TB fallback drive</div>
          </div>
          <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3">
            <div class="text-gray-500 font-bold uppercase text-[9px] mb-1">Backup Mode</div>
            <div class="text-white font-bold font-mono">Proxmox vzdump (Zstandard)</div>
            <div class="text-gray-400 mt-1">Full container snapshots (.tar.zst)</div>
          </div>
          <div class="bg-[#09090d] border border-gray-900 rounded-xl p-3">
            <div class="text-gray-500 font-bold uppercase text-[9px] mb-1">Recovery Command</div>
            <div class="text-emerald-400 font-bold font-mono">pct restore &lt;ID&gt; /mnt/...</div>
            <div class="text-gray-400 mt-1">Rapid bare-metal or single-CT restore</div>
          </div>
        </div>
      </div>

    </div>
  `;
}
