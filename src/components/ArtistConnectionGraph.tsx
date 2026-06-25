"use client";
/**
 * ArtistConnectionGraph — interactive SVG force-directed graph.
 *
 * Pure React + SVG, no D3 dependency.
 * Physics: spring attraction + charge repulsion + centre gravity + velocity damping.
 * Interactions: drag nodes, pan canvas, zoom with wheel/pinch, click to navigate.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Users, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface Connection {
  artist_a_slug: string;
  artist_b_slug: string;
  connection_type: string;
  strength: number;
  shared_events?: string[];
  shared_venues?: string[];
  notes?: string;
}

interface Props {
  slug: string;
  connections: Connection[];
}

interface Node {
  id: string;
  label: string;
  isCenter: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  strength: number;
  sharedEvents?: string[];
}

const TYPE_COLOURS: Record<string, { stroke: string; label: string }> = {
  b2b:    { stroke: "#f5e642", label: "B2B" },
  collab: { stroke: "#00bfff", label: "Collab" },
  label:  { stroke: "#e040fb", label: "Label" },
  venue:  { stroke: "#ff6600", label: "Venue" },
  crew:   { stroke: "#aaff00", label: "Crew" },
};

const NODE_R = 28;
const CENTER_R = 38;
const W = 700;
const H = 480;

function friendlyName(slug: string) {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Wrap text to fit inside a circle
function wrapText(text: string, maxChars = 10): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 3);
}

export default function ArtistConnectionGraph({ slug, connections }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build graph from connections
  useEffect(() => {
    if (!connections.length) return;

    const partnerSlugs = new Set<string>();
    const edgeList: Edge[] = [];

    for (const c of connections) {
      const partner = c.artist_a_slug === slug ? c.artist_b_slug : c.artist_a_slug;
      partnerSlugs.add(partner);
      edgeList.push({
        source: slug,
        target: partner,
        type: c.connection_type,
        strength: c.strength,
        sharedEvents: c.shared_events,
      });
    }

    // Initial positions: center node in middle, others in a circle
    const partners = Array.from(partnerSlugs);
    const angleStep = (2 * Math.PI) / partners.length;

    const initialNodes: Node[] = [
      { id: slug, label: friendlyName(slug), isCenter: true, x: W / 2, y: H / 2, vx: 0, vy: 0 },
      ...partners.map((p, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = Math.min(W, H) * 0.3;
        return {
          id: p, label: friendlyName(p), isCenter: false,
          x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle),
          vx: 0, vy: 0,
        };
      }),
    ];

    setNodes(initialNodes);
    nodesRef.current = initialNodes;
    setEdges(edgeList);
  }, [slug, connections]);

  // Physics simulation
  useEffect(() => {
    if (nodesRef.current.length === 0) return;

    const tick = () => {
      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));

        // Spring attraction along edges
        for (const e of edges) {
          const a = next.find(n => n.id === e.source);
          const b = next.find(n => n.id === e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 140 + (10 - e.strength) * 8;
          const force = (dist - targetDist) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!a.isCenter) { a.vx += fx; a.vy += fy; }
          if (!b.isCenter) { b.vx -= fx; b.vy -= fy; }
        }

        // Charge repulsion between all nodes
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i], b = next[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist2 = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(dist2);
            const repulsion = 3500 / dist2;
            const fx = (dx / dist) * repulsion;
            const fy = (dy / dist) * repulsion;
            if (!a.isCenter) { a.vx -= fx; a.vy -= fy; }
            if (!b.isCenter) { b.vx += fx; b.vy += fy; }
          }
        }

        // Centre gravity
        for (const n of next) {
          if (n.isCenter) continue;
          n.vx += (W / 2 - n.x) * 0.003;
          n.vy += (H / 2 - n.y) * 0.003;
        }

        // Integrate + dampen
        for (const n of next) {
          if (n.isCenter || dragging === n.id) continue;
          n.vx *= 0.78;
          n.vy *= 0.78;
          n.x += n.vx;
          n.y += n.vy;
          // Boundary
          const r = NODE_R + 4;
          n.x = Math.max(r, Math.min(W - r, n.x));
          n.y = Math.max(r, Math.min(H - r, n.y));
        }

        nodesRef.current = next;
        return next;
      });
    };

    simRef.current = setInterval(tick, 16);
    // Stop sim after 6 seconds (nodes have settled)
    const stop = setTimeout(() => {
      if (simRef.current) clearInterval(simRef.current);
    }, 6000);

    return () => {
      if (simRef.current) clearInterval(simRef.current);
      clearTimeout(stop);
    };
  }, [edges, dragging]);

  // Restart sim on drag
  const restartSim = useCallback(() => {
    if (simRef.current) clearInterval(simRef.current);
    const tick = () => {
      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));
        for (const e of edges) {
          const a = next.find(n => n.id === e.source);
          const b = next.find(n => n.id === e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x; const dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const targetDist = 140 + (10 - e.strength) * 8;
          const force = (dist - targetDist) * 0.015;
          const fx = (dx/dist)*force, fy = (dy/dist)*force;
          if (!a.isCenter) { a.vx += fx; a.vy += fy; }
          if (!b.isCenter) { b.vx -= fx; b.vy -= fy; }
        }
        for (let i = 0; i < next.length; i++) {
          for (let j = i+1; j < next.length; j++) {
            const a = next[i], b = next[j];
            const dx = b.x-a.x, dy = b.y-a.y;
            const dist2 = dx*dx+dy*dy||1, dist = Math.sqrt(dist2);
            const rep = 3500/dist2;
            if (!a.isCenter) { a.vx -= (dx/dist)*rep; a.vy -= (dy/dist)*rep; }
            if (!b.isCenter) { b.vx += (dx/dist)*rep; b.vy += (dy/dist)*rep; }
          }
        }
        for (const n of next) {
          if (n.isCenter || dragging === n.id) continue;
          n.vx *= 0.78; n.vy *= 0.78; n.x += n.vx; n.y += n.vy;
          n.x = Math.max(NODE_R+4, Math.min(W-NODE_R-4, n.x));
          n.y = Math.max(NODE_R+4, Math.min(H-NODE_R-4, n.y));
        }
        nodesRef.current = next;
        return next;
      });
    };
    simRef.current = setInterval(tick, 16);
    setTimeout(() => { if (simRef.current) clearInterval(simRef.current); }, 4000);
  }, [edges, dragging]);

  // SVG coord helper
  const svgCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const { x, y } = svgCoords(e);
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    dragOffset.current = { x: x - node.x, y: y - node.y };
    setDragging(nodeId);
    restartSim();
  };

  const onSvgMouseDown = (e: React.MouseEvent) => {
    if (dragging) return;
    setPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const { x, y } = svgCoords(e);
      setNodes(prev => prev.map(n =>
        n.id === dragging
          ? { ...n, x: x - dragOffset.current.x, y: y - dragOffset.current.y, vx: 0, vy: 0 }
          : n
      ));
    } else if (panning) {
      setPan({
        x: panStart.current.panX + e.clientX - panStart.current.x,
        y: panStart.current.panY + e.clientY - panStart.current.y,
      });
    }
  };

  const onMouseUp = () => {
    setDragging(null);
    setPanning(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom(z => Math.max(0.4, Math.min(3, z * factor)));
  };

  const resetView = () => { setPan({ x: 0, y: 0 }); setZoom(1); };

  if (!connections || connections.length === 0) {
    return (
      <div className="border-4 border-ink bg-acid-yellow/20 p-8 text-center">
        <Users className="w-10 h-10 text-ink/30 mx-auto mb-3" />
        <p className="font-display text-lg text-ink">No connections recorded yet.</p>
        <p className="text-ink/60 text-sm mt-1">Connections are built from shared event appearances and B2B sets.</p>
      </div>
    );
  }

  // Selected node info
  const selConn = selectedNode
    ? connections.find(c =>
        (c.artist_a_slug === slug && c.artist_b_slug === selectedNode) ||
        (c.artist_b_slug === slug && c.artist_a_slug === selectedNode)
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="font-display text-xs text-ink/50 uppercase">
          {connections.length} connection{connections.length !== 1 ? "s" : ""} · drag nodes · scroll to zoom · pan to explore
        </p>
        <div className="flex gap-1">
          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))}
            className="p-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.4, z * 0.8))}
            className="p-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={resetView}
            className="p-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <div className="border-4 border-ink bg-cream overflow-hidden relative" style={{ height: 480, cursor: panning ? "grabbing" : dragging ? "grabbing" : "grab" }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={onSvgMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          style={{ touchAction: "none" }}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Edge lines */}
            {edges.map((e, i) => {
              const src = nodes.find(n => n.id === e.source);
              const tgt = nodes.find(n => n.id === e.target);
              if (!src || !tgt) return null;
              const typeInfo = TYPE_COLOURS[e.type] ?? { stroke: "#1a1a1a", label: e.type };
              const isHovered = hoveredNode === e.target || hoveredNode === e.source;
              const strokeW = 1.5 + (e.strength / 10) * 3;
              return (
                <g key={i}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={typeInfo.stroke}
                    strokeWidth={isHovered ? strokeW + 1 : strokeW}
                    strokeOpacity={isHovered ? 1 : 0.6}
                    strokeDasharray={e.type === "collab" ? "6,3" : undefined}
                  />
                  {/* Mid-point label for hovered edges */}
                  {isHovered && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 6}
                      textAnchor="middle"
                      fontFamily="inherit"
                      fontSize={9}
                      fill="#1a1a1a"
                      fontWeight="bold"
                      className="uppercase"
                    >
                      {typeInfo.label}{e.sharedEvents?.length ? ` · ${e.sharedEvents.length}` : ""}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const r = node.isCenter ? CENTER_R : NODE_R;
              const isHov = hoveredNode === node.id;
              const isSel = selectedNode === node.id;
              const lines = wrapText(node.label, node.isCenter ? 10 : 9);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  onMouseDown={e => onNodeMouseDown(e, node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => !dragging && setSelectedNode(s => s === node.id ? null : node.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Shadow */}
                  <circle cx={3} cy={3} r={r} fill="rgba(0,0,0,0.15)" />
                  {/* Node circle */}
                  <circle
                    r={r}
                    fill={node.isCenter ? "#1a1a1a" : isSel ? "#e040fb" : isHov ? "#f5e642" : "#f5f0e8"}
                    stroke="#1a1a1a"
                    strokeWidth={isSel ? 3 : 2}
                  />
                  {/* Label */}
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      y={(li - (lines.length - 1) / 2) * 11}
                      fontFamily="inherit"
                      fontSize={node.isCenter ? 9 : 8}
                      fontWeight="bold"
                      fill={node.isCenter ? "#f5f0e8" : isSel ? "#f5f0e8" : "#1a1a1a"}
                      className="uppercase select-none pointer-events-none"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected node panel */}
      {selectedNode && selectedNode !== slug && (
        <div className="border-4 border-ink bg-cream chunk-shadow p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-base uppercase text-ink">{friendlyName(selectedNode)}</p>
            {selConn && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`font-display text-xs uppercase px-2 py-0.5 border border-ink ${
                  TYPE_COLOURS[selConn.connection_type]
                    ? "bg-acid-yellow text-ink"
                    : "bg-ink text-cream"
                }`}>{selConn.connection_type}</span>
                <span className="font-display text-xs text-ink/50">Strength {selConn.strength}/10</span>
                {selConn.shared_events && selConn.shared_events.length > 0 && (
                  <span className="text-xs text-ink/50">{selConn.shared_events.length} shared gig{selConn.shared_events.length !== 1 ? "s" : ""}</span>
                )}
              </div>
            )}
            {selConn?.shared_events && selConn.shared_events.length > 0 && (
              <p className="text-xs text-ink/40 mt-1 line-clamp-1">
                {selConn.shared_events.slice(0, 3).join(" · ")}
                {selConn.shared_events.length > 3 && ` +${selConn.shared_events.length - 3}`}
              </p>
            )}
          </div>
          <Link href={`/artists/${selectedNode}`}
            className="shrink-0 font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-ink text-cream hover:bg-magenta transition-colors">
            View Profile →
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(TYPE_COLOURS).map(([type, { stroke, label }]) => (
          <span key={type} className="flex items-center gap-1.5 font-display text-[10px] uppercase text-ink/60">
            <span className="w-6 h-0.5 inline-block border-t-2" style={{ borderColor: stroke }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
