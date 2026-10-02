/**
 * Modular Containers Tab Component
 * Real resource allocations and search/filtering without simulated metrics.
 */

export function renderContainersTab(containers, searchQuery = '', filterTag = 'all') {
  const list = Object.values(containers || {});

  const filtered = list.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) ||
                          c.id.includes(q) ||
                          c.ip.includes(q) ||
                          (c.desc && c.desc.toLowerCase().includes(q));
    const matchesTag = filterTag === 'all' || (c.tags && c.tags.includes(filterTag));
    return matchesSearch && matchesTag;
  });

  // Extract unique tags
  const tagsSet = new Set(['all']);
  list.forEach(c => {
    if (c.tags) c.tags.forEach(t => tagsSet.add(t));
  });
  const allTags = Array.from(tagsSet);

  const tagsMarkup = allTags.map(tag => `
    <button
      onclick="window.setFilterTag('${tag}')"
      class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
        filterTag === tag
          ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
          : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-700'
      }"
    >
      ${tag}
    </button>
  `).join('');

  const cardsMarkup = filtered.map(c => `
    <div 
      onclick="window.openContainerDetail('${c.name}')"
      class="glass-panel glass-card-hover rounded-2xl p-5 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[190px]"
    >
      <div class="absolute top-0 left-0 w-1.5 h-full" style="background-color: ${c.color || '#3b82f6'}"></div>
      
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-baseline gap-2">
            <h3 class="text-base font-bold font-outfit text-white">${c.name}</h3>
            <span class="text-[10px] font-mono text-gray-500 font-bold">CT ${c.id}</span>
          </div>
          <span class="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            RUNNING
          </span>
        </div>

        <p class="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4 font-medium">${c.desc || 'No description provided.'}</p>
      </div>

      <div>
        <!-- Resource Allocation Specs -->
        <div class="grid grid-cols-3 gap-2 bg-[#09090d] border border-gray-900 rounded-xl p-2.5 mb-3 text-[10px] font-mono">
          <div>
            <div class="text-gray-500 uppercase text-[9px] font-bold font-outfit">CPU Limit</div>
            <div class="text-white font-bold mt-0.5">${c.cpu} Cores</div>
          </div>
          <div>
            <div class="text-gray-500 uppercase text-[9px] font-bold font-outfit">RAM Allocated</div>
            <div class="text-white font-bold mt-0.5">${c.ram}</div>
          </div>
          <div>
            <div class="text-gray-500 uppercase text-[9px] font-bold font-outfit">Root Disk</div>
            <div class="text-white font-bold mt-0.5">${c.disk}</div>
          </div>
        </div>

        <!-- Badges & IP -->
        <div class="flex items-center justify-between border-t border-gray-900/80 pt-2.5">
          <span class="text-[11px] font-mono text-cyan-400 font-bold">${c.ip}</span>
          <div class="flex gap-1">
            ${(c.tags || []).slice(0, 3).map(t => `
              <span class="text-[9px] bg-gray-900 border border-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase">#${t}</span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="flex flex-col gap-6 flex-1">
      <!-- Search & Filter Controls -->
      <div class="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <div class="relative flex-1">
          <input 
            type="text" 
            placeholder="Search container by name, ID, IP address, or description..."
            value="${searchQuery}"
            oninput="window.setSearchQuery(this.value)"
            class="w-full bg-[#09090d] border border-gray-800 rounded-xl pl-4 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div class="flex flex-wrap gap-1.5 items-center">
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1 font-outfit">Filter Tags:</span>
          <div class="flex flex-wrap gap-1.5 overflow-x-auto">
            ${tagsMarkup}
          </div>
        </div>
      </div>

      <!-- Container Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        ${cardsMarkup || '<div class="text-xs text-gray-500 col-span-full py-12 text-center font-semibold">No containers found matching search criteria.</div>'}
      </div>
    </div>
  `;
}
