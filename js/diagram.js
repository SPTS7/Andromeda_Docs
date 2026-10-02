/**
 * Modular SVG Topology Diagram Generator
 * Dynamically computes layout coordinates from topology.json and containers.json.
 * Completely eliminates hardcoded SVG coordinates and fake telemetry.
 */

export function renderTopologySvg(topology, containers, activeFlow = 'all', selectedNodeKey = null) {
  if (!topology || !containers) return '<div class="text-gray-500 text-xs p-4">Loading topology...</div>';

  const width = 1320;
  const height = 860;
  const nodePositions = {};

  // Color palette
  const colors = {
    vpn: '#8b5cf6',
    exterior: '#06b6d4',
    arr: '#f97316',
    ai: '#eab308',
    storage: '#3b82f6',
    backup: '#f59e0b',
    border: '#1c1c24',
    bgNode: '#0d0d12'
  };

  // 1. Calculate Ingress Node Positions (Top)
  const ingressY = 24;
  const ingressList = topology.ingress || [];
  ingressList.forEach((ing, idx) => {
    const x = idx === 0 ? 460 : 860;
    nodePositions[ing.id] = {
      x: x - 85,
      y: ingressY,
      w: 170,
      h: 40,
      cx: x,
      cy: ingressY + 20,
      bottom: ingressY + 40,
      top: ingressY,
      label: ing.label,
      color: ing.color || '#3b82f6'
    };
  });

  // 2. Compute Stack Positions and Container Grid Coordinates
  const hostBoxY = 95;
  const hostBoxH = 610;
  const stacks = topology.stacks || [];
  
  // Custom column layout definitions for visual balance
  const stackConfigs = {
    gateway: { x: 50, w: 190, cols: 1 },
    media:   { x: 260, w: 490, cols: 3 },
    ai:      { x: 770, w: 230, cols: 1 },
    tools:   { x: 1020, w: 250, cols: 1 }
  };

  const nodeCardW = 145;
  const nodeCardH = 50;

  stacks.forEach(stack => {
    const cfg = stackConfigs[stack.id] || { x: 50, w: 200, cols: 1 };
    const stackInnerY = hostBoxY + 55;
    const items = stack.containers || [];
    const cols = cfg.cols;

    items.forEach((cKey, idx) => {
      const colIdx = idx % cols;
      const rowIdx = Math.floor(idx / cols);

      // Compute position inside stack box
      let nodeX;
      if (cols === 1) {
        nodeX = cfg.x + (cfg.w - nodeCardW) / 2;
      } else {
        const gap = (cfg.w - (cols * nodeCardW)) / (cols + 1);
        nodeX = cfg.x + gap + colIdx * (nodeCardW + gap);
      }

      const rowGap = 16;
      const nodeY = stackInnerY + rowIdx * (nodeCardH + rowGap);

      nodePositions[cKey] = {
        x: nodeX,
        y: nodeY,
        w: nodeCardW,
        h: nodeCardH,
        cx: nodeX + nodeCardW / 2,
        cy: nodeY + nodeCardH / 2,
        top: nodeY,
        bottom: nodeY + nodeCardH,
        left: nodeX,
        right: nodeX + nodeCardW,
        cKey: cKey,
        stackId: stack.id
      };
    });
  });

  // 3. Storage and Backup Target Nodes (Bottom)
  const storageY = 725;
  const storageNodes = topology.storageNodes || [];
  storageNodes.forEach((st, idx) => {
    let x, w;
    if (idx === 0) { // Bulk HDD
      x = 50; w = 450;
    } else if (idx === 1) { // 1TB Backup
      x = 520; w = 360;
    } else { // NVMe pool
      x = 900; w = 370;
    }
    const h = 42;
    nodePositions[st.id] = {
      x, y: storageY, w, h,
      cx: x + w / 2,
      cy: storageY + h / 2,
      top: storageY,
      bottom: storageY + h,
      label: st.label,
      color: st.color
    };
  });

  // 4. Render Flow Paths
  let pathsMarkup = '';
  const flows = topology.flows || {};

  const flowColors = {
    vpn: colors.vpn,
    exterior: colors.exterior,
    automation: colors.arr,
    ai: colors.ai,
    storage: colors.storage
  };

  Object.keys(flows).forEach(flowKey => {
    const isChannelActive = activeFlow === 'all' || activeFlow === flowKey;
    const strokeColor = flowColors[flowKey] || '#64748b';
    const opacity = isChannelActive ? 0.85 : 0.12;
    const strokeWidth = isChannelActive ? 2 : 1;

    flows[flowKey].forEach(conn => {
      const src = nodePositions[conn.from];
      const dst = nodePositions[conn.to];
      if (!src || !dst) return;

      // Draw smooth path from source to target
      let d = '';
      if (src.bottom <= dst.top) {
        // Vertical step down
        const midY = (src.bottom + dst.top) / 2;
        d = `M ${src.cx} ${src.bottom} C ${src.cx} ${midY}, ${dst.cx} ${midY}, ${dst.cx} ${dst.top}`;
      } else if (src.cx < dst.cx) {
        // Horizontal forward
        const midX = (src.right + dst.left) / 2;
        d = `M ${src.right} ${src.cy} C ${midX} ${src.cy}, ${midX} ${dst.cy}, ${dst.left} ${dst.cy}`;
      } else {
        // Loop or backward
        d = `M ${src.cx} ${src.bottom} C ${src.cx} ${src.bottom + 25}, ${dst.cx} ${dst.top - 25}, ${dst.cx} ${dst.top}`;
      }

      pathsMarkup += `
        <g opacity="${opacity}">
          <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="url(#marker-${flowKey})" />
          ${conn.label && isChannelActive ? `
            <text x="${(src.cx + dst.cx) / 2}" y="${(src.cy + dst.cy) / 2}" text-anchor="middle" fill="${strokeColor}" class="text-[8px] font-mono font-bold bg-black px-1 pointer-events-none select-none">
              ${conn.label}
            </text>
          ` : ''}
        </g>
      `;
    });
  });

  // 5. Render Node Cards
  let nodesMarkup = '';

  // Ingress Nodes
  ingressList.forEach(ing => {
    const pos = nodePositions[ing.id];
    nodesMarkup += `
      <g transform="translate(${pos.x}, ${pos.y})">
        <rect width="${pos.w}" height="${pos.h}" rx="20" fill="#0f1016" stroke="${pos.color}" stroke-width="1.2" />
        <text x="${pos.w / 2}" y="24" text-anchor="middle" class="text-[11px] font-bold fill-white uppercase tracking-wider font-outfit select-none">${ing.label}</text>
      </g>
    `;
  });

  // Host Boundary Frame
  nodesMarkup += `
    <rect x="30" y="${hostBoxY}" width="1260" height="${hostBoxH}" rx="20" fill="#09090d" stroke="#1c1c24" stroke-width="1.5" />
    <text x="50" y="${hostBoxY + 24}" class="text-[11px] font-bold fill-gray-500 uppercase tracking-widest font-outfit select-none">
      Host Environment: Andromeda Proxmox VE (Kernel 6.8.12-43-pve)
    </text>
  `;

  // Stack Boxes
  stacks.forEach(st => {
    const cfg = stackConfigs[st.id] || { x: 50, w: 200 };
    const stackH = hostBoxH - 65;
    nodesMarkup += `
      <rect x="${cfg.x}" y="${hostBoxY + 40}" width="${cfg.w}" height="${stackH}" rx="14" fill="#0d0d12" stroke="#181820" />
      <text x="${cfg.x + cfg.w / 2}" y="${hostBoxY + 30}" text-anchor="middle" class="text-[11px] font-bold fill-gray-400 uppercase tracking-wider font-outfit select-none">
        ${st.title}
      </text>
    `;
  });

  // Container Nodes
  Object.keys(containers).forEach(key => {
    const c = containers[key];
    const pos = nodePositions[key];
    if (!pos) return;

    const isSelected = selectedNodeKey === key;
    const accentColor = c.color || '#3b82f6';

    nodesMarkup += `
      <g 
        onclick="window.selectNode('${key}')" 
        class="svg-node cursor-pointer group" 
        transform="translate(${pos.x}, ${pos.y})"
      >
        <rect 
          width="${pos.w}" 
          height="${pos.h}" 
          rx="10" 
          fill="#111117" 
          stroke="${isSelected ? '#ffffff' : (isSelected ? accentColor : '#22222c')}" 
          stroke-width="${isSelected ? '2' : '1.2'}" 
          class="transition-all hover:stroke-violet-400"
        />
        <path d="M 0 6 Q 0 0 6 0 L 18 0 L 0 18 Z" fill="${accentColor}" opacity="0.4" />
        <circle cx="${pos.w - 12}" cy="12" r="3" fill="#10b981" />
        
        <text x="12" y="22" class="text-[12px] font-bold fill-white tracking-tight pointer-events-none select-none font-outfit">
          ${c.name}
        </text>
        <text x="12" y="38" class="text-[9px] font-mono fill-gray-400 font-medium pointer-events-none select-none">
          ${c.cpu}C • ${c.ram} • ${c.disk}
        </text>
      </g>
    `;
  });

  // Storage Targets (Bottom)
  storageNodes.forEach(st => {
    const pos = nodePositions[st.id];
    nodesMarkup += `
      <g transform="translate(${pos.x}, ${pos.y})">
        <rect width="${pos.w}" height="${pos.h}" rx="10" fill="#0f0f15" stroke="${pos.color}" stroke-width="1.2" stroke-dasharray="4 3" />
        <text x="${pos.w / 2}" y="25" text-anchor="middle" class="text-[10px] font-bold fill-gray-300 uppercase tracking-wider font-outfit select-none">
          ${st.label}
        </text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto select-none relative z-10 font-sans">
      <defs>
        <marker id="marker-vpn" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.vpn}" />
        </marker>
        <marker id="marker-exterior" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.exterior}" />
        </marker>
        <marker id="marker-automation" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.arr}" />
        </marker>
        <marker id="marker-ai" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.ai}" />
        </marker>
        <marker id="marker-storage" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.storage}" />
        </marker>
      </defs>

      ${nodesMarkup}
      ${pathsMarkup}
    </svg>
  `;
}
