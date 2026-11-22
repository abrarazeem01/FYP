import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  RotateCcw,
  Search,
  Filter,
  Phone,
  Car,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Layers,
  X,
  Scan,
  Compass,
  Eye,
} from 'lucide-react';
import { useNexus } from '../context/NexusContext';
import { api } from '../services/api';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';

interface Node3D {
  id: string;
  label: string;
  type: 'vehicle' | 'seller' | 'phone';
  x: number;
  y: number;
  z: number;
  px: number; // projected screen x
  py: number; // projected screen y
  pz: number; // depth
  scale: number;
  radius: number;
  risk?: number;
  details?: string;
  full_phone?: string;
  post?: any;
}

interface Link3D {
  source: string;
  target: string;
  relationship?: string;
}

const TYPE_CONFIG = {
  vehicle: {
    color: '#D4FF00',
    glow: 'rgba(212, 255, 0, 0.45)',
    label: 'NCP VEHICLE',
    icon: Car,
  },
  seller: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    label: 'SELLER / DEALER',
    icon: UserCheck,
  },
  phone: {
    color: '#FF2A4B',
    glow: 'rgba(255, 42, 75, 0.45)',
    label: 'HASHED PHONE RING',
    icon: Phone,
  },
};

export const EntityGraphPage: React.FC = () => {
  const navigate = useNavigate();
  const { piiMasked, setScanModalOpen, selectVehicleForForensics } = useNexus();

  const [nodes, setNodes] = useState<Node3D[]>([]);
  const [links, setLinks] = useState<Link3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'vehicle' | 'seller' | 'phone'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodes3DRef = useRef<Node3D[]>([]);
  const linksRef = useRef<Link3D[]>([]);

  // 3D Rotation angles and drag state
  const rotationRef = useRef({ rotX: 0.2, rotY: 0.3, vx: 0.003, vy: 0.005 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Load Graph Data
  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSyndicateGraph();
      const rawNodes = data.nodes || [];
      const rawLinks = data.links || [];

      // Place nodes on a 3D spherical / orbital layout
      const radius = 240;
      const count = rawNodes.length;

      const formatted3D: Node3D[] = rawNodes.map((n: any, i: number) => {
        // Fibonacci sphere point distribution
        const phi = Math.acos(1 - 2 * (i + 0.5) / Math.max(count, 1));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        const jitter = 0.85 + Math.random() * 0.3;
        const r = radius * jitter;

        return {
          id: n.id,
          label: n.label,
          type: n.type || 'vehicle',
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
          px: 0,
          py: 0,
          pz: 0,
          scale: 1,
          radius: n.type === 'phone' ? 7 : n.type === 'seller' ? 8 : 6,
          risk: n.risk,
          details: n.details,
          full_phone: n.full_phone,
          post: n.post,
        };
      });

      nodes3DRef.current = formatted3D;
      linksRef.current = rawLinks;
      setNodes(formatted3D);
      setLinks(rawLinks);
    } catch {
      // Fallback fallback synthetic cluster if empty
      const fallbackNodes: Node3D[] = [
        { id: 'v1', label: 'Land Cruiser V8 2021', type: 'vehicle', x: -120, y: 40, z: -80, px: 0, py: 0, pz: 0, scale: 1, radius: 7, risk: 88 },
        { id: 'v2', label: 'Hilux Revo 2019 NCP', type: 'vehicle', x: -80, y: -110, z: 60, px: 0, py: 0, pz: 0, scale: 1, radius: 7, risk: 92 },
        { id: 's1', label: 'Chaman Frontier Auto', type: 'seller', x: 20, y: 30, z: 120, px: 0, py: 0, pz: 0, scale: 1, radius: 9 },
        { id: 'p1', label: '0300-8829102 (SHA-256)', type: 'phone', x: 130, y: -60, z: -70, px: 0, py: 0, pz: 0, scale: 1, radius: 8, full_phone: '0300-8829102' },
        { id: 'v3', label: 'Corolla Altis 2020 Cut-Piece', type: 'vehicle', x: 90, y: 120, z: -30, px: 0, py: 0, pz: 0, scale: 1, radius: 7, risk: 84 },
      ];
      const fallbackLinks: Link3D[] = [
        { source: 'v1', target: 's1' },
        { source: 'v2', target: 's1' },
        { source: 's1', target: 'p1' },
        { source: 'v3', target: 'p1' },
      ];
      nodes3DRef.current = fallbackNodes;
      linksRef.current = fallbackLinks;
      setNodes(fallbackNodes);
      setLinks(fallbackLinks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // 3D Canvas Projection Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    let w = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let h = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const FOCAL_LENGTH = 420;

    // Interaction listeners
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        rotationRef.current.vy = dx * 0.005;
        rotationRef.current.vx = -dy * 0.005;
        rotationRef.current.rotY += dx * 0.005;
        rotationRef.current.rotX += -dy * 0.005;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Node hover check in 2D projection space
        let foundHover: string | null = null;
        for (const n of nodes3DRef.current) {
          const dist = Math.hypot(n.px - mouseX, n.py - mouseY);
          if (dist < n.radius * n.scale + 6) {
            foundHover = n.id;
            break;
          }
        }
        setHoveredNodeId(foundHover);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const n of nodes3DRef.current) {
        const dist = Math.hypot(n.px - mouseX, n.py - mouseY);
        if (dist < n.radius * n.scale + 6) {
          setSelectedNode(n);
          return;
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    let t = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.015;

      ctx.clearRect(0, 0, w, h);

      // Damp rotation inertia
      if (!isDraggingRef.current) {
        rotationRef.current.rotY += rotationRef.current.vy;
        rotationRef.current.rotX += rotationRef.current.vx;
        rotationRef.current.vy *= 0.96;
        rotationRef.current.vx *= 0.96;
        // Keep idle orbital drift
        rotationRef.current.rotY += 0.002;
      }

      const cosX = Math.cos(rotationRef.current.rotX);
      const sinX = Math.sin(rotationRef.current.rotX);
      const cosY = Math.cos(rotationRef.current.rotY);
      const sinY = Math.sin(rotationRef.current.rotY);

      const cx = w / 2;
      const cy = h / 2;

      // 1. DRAW 3D WIREFRAME GEODESIC CAGE / ORBIT RINGS
      ctx.save();
      const RING_RADIUS = 260;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        const angleOffset = (r * Math.PI) / 3;
        for (let a = 0; a <= Math.PI * 2; a += 0.15) {
          const rawX = Math.cos(a) * RING_RADIUS;
          const rawY = Math.sin(a) * RING_RADIUS * Math.sin(angleOffset);
          const rawZ = Math.sin(a) * RING_RADIUS * Math.cos(angleOffset);

          // Apply rotation
          const x1 = rawX * cosY + rawZ * sinY;
          const z1 = -rawX * sinY + rawZ * cosY;
          const y2 = rawY * cosX - z1 * sinX;
          const z2 = rawY * sinX + z1 * cosX;

          const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z2 + 350);
          const px = cx + x1 * scale;
          const py = cy + y2 * scale;

          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(212, 255, 0, ${0.04 + r * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // 2. PROJECT ALL 3D NODES
      const currentNodes = nodes3DRef.current;
      for (const n of currentNodes) {
        // Rotate around Y
        const x1 = n.x * cosY + n.z * sinY;
        const z1 = -n.x * sinY + n.z * cosY;
        // Rotate around X
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = n.y * sinX + z1 * cosX;

        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z2 + 350);
        n.px = cx + x1 * scale;
        n.py = cy + y2 * scale;
        n.pz = z2;
        n.scale = Math.max(0.3, scale);
      }

      // Map id to projected node for fast link drawing
      const nodeMap = new Map<string, Node3D>();
      for (const n of currentNodes) {
        nodeMap.set(n.id, n);
      }

      // 3. DRAW 3D VOLUMETRIC LINKS
      ctx.save();
      for (const link of linksRef.current) {
        const src = nodeMap.get(typeof link.source === 'object' ? (link.source as any).id : link.source);
        const tgt = nodeMap.get(typeof link.target === 'object' ? (link.target as any).id : link.target);

        if (src && tgt) {
          const avgZ = (src.pz + tgt.pz) / 2;
          const alpha = Math.min(0.7, Math.max(0.08, 0.35 + (avgZ / 400) * 0.25));

          ctx.beginPath();
          ctx.moveTo(src.px, src.py);
          ctx.lineTo(tgt.px, tgt.py);
          ctx.strokeStyle = `rgba(212, 255, 0, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Data packet travelling along link in 3D
          const packetProgress = (t * 0.6 + (src.px % 1)) % 1;
          const packetX = src.px + (tgt.px - src.px) * packetProgress;
          const packetY = src.py + (tgt.py - src.py) * packetProgress;

          ctx.beginPath();
          ctx.arc(packetX, packetY, 1.8 * src.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#D4FF00';
          ctx.shadowColor = '#D4FF00';
          ctx.shadowBlur = 4;
          ctx.fill();
        }
      }
      ctx.restore();

      // 4. DEPTH SORT NODES (z-buffering for realistic occlusion)
      const sortedNodes = [...currentNodes].sort((a, b) => a.pz - b.pz);

      // 5. RENDER 3D NODES
      for (const n of sortedNodes) {
        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.vehicle;
        const isHovered = hoveredNodeId === n.id;
        const isSelected = selectedNode?.id === n.id;
        const baseRadius = n.radius * n.scale;
        const r = isHovered || isSelected ? baseRadius * 1.4 : baseRadius;

        ctx.save();

        // Node Glow Halo
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(n.px, n.py, r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = cfg.glow;
          ctx.fill();
        }

        // Main Node Body
        ctx.beginPath();
        ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx.fillStyle = cfg.color;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = isHovered || isSelected ? 14 : 6;
        ctx.fill();

        // Core highlight
        ctx.beginPath();
        ctx.arc(n.px, n.py, r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Node Text Label
        if (n.pz > -120 || isHovered || isSelected) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = isHovered || isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.px, n.py + r + 12);
        }

        ctx.restore();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [hoveredNodeId, selectedNode]);

  const copyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1500);
  };

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Header with Live Actions */}
      <SectionHeading
        tag="ANALYTICS_04"
        title="SYNDICATE ENTITY GRAPH // 3D WIREFRAME MESH"
        subtitle="3D coordinate projection cross-linking contraband phone numbers, vehicle chassis IDs, and dealer rings across border corridors."
        action={
          <div className="flex items-center gap-3">
            <MagneticButton
              variant="secondary"
              onClick={loadGraph}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET ROTATION</span>
            </MagneticButton>

            <MagneticButton
              variant="primary"
              onClick={() => setScanModalOpen(true)}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>LINK NEW ENTITY</span>
            </MagneticButton>
          </div>
        }
      />

      {/* 2. Main 3D Graph + Staggered Spring Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): 3D Interactive Canvas Stage */}
        <div className="lg:col-span-8 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box relative h-[650px] overflow-hidden flex flex-col justify-between">
          
          {/* Top Canvas Controls Bar */}
          <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 z-10 bg-[#0d0f12]/90 backdrop-blur-md">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#D4FF00]">
                <span className="w-2 h-2 rounded-full bg-[#D4FF00]" /> Vehicles ({nodes.filter(n => n.type === 'vehicle').length})
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Dealers ({nodes.filter(n => n.type === 'seller').length})
              </span>
              <span className="flex items-center gap-1.5 text-[#FF2A4B]">
                <span className="w-2 h-2 rounded-full bg-[#FF2A4B]" /> Phone Rings ({nodes.filter(n => n.type === 'phone').length})
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-[#8A94A6]">
              <Compass className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>DRAG TO ORBIT 3D PERSPECTIVE</span>
            </div>
          </div>

          {/* 3D Canvas Element */}
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Bottom Telemetry Ticker */}
          <div className="p-3 border-t border-white/10 bg-[#060708]/85 flex items-center justify-between font-mono text-[10px] text-[#8A94A6] z-10">
            <div>
              TOTAL NODES: <span className="text-[#F4F6F8] font-bold">{nodes.length}</span> | LINKS: <span className="text-[#D4FF00] font-bold">{links.length}</span>
            </div>
            <div>
              PROJECTION: <span className="text-[#D4FF00]">SPHERICAL ORBIT FOCAL 420px</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Staggered Spring-Physics Inspector Cards */}
        <div className="lg:col-span-4 space-y-4">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="p-5 bg-[#0d0f12] border border-white/15 chamfer-md bracket-box space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#D4FF00] uppercase font-bold">
                      // ENTITY_INSPECTOR
                    </span>
                    <LiveEqualizerBar color="#D4FF00" />
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 text-[#8A94A6] hover:text-[#F4F6F8]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase text-[#8A94A6]">
                    {selectedNode.type} NODE
                  </div>
                  <h3 className="font-sans font-bold text-lg text-[#F4F6F8]">
                    {selectedNode.label}
                  </h3>
                </div>

                {selectedNode.risk !== undefined && (
                  <div className="p-3 bg-[#14171c] border border-white/10 chamfer-sm flex items-center justify-between">
                    <span className="font-mono text-xs text-[#8A94A6]">RISK COEFFICIENT</span>
                    <span className="font-mono text-sm font-bold text-[#FF2A4B]">
                      {selectedNode.risk}% CRITICAL
                    </span>
                  </div>
                )}

                {/* Hashed Phone Display */}
                {selectedNode.full_phone && (
                  <div className="p-3 bg-[#14171c] border border-white/10 chamfer-sm space-y-1.5">
                    <span className="font-mono text-[9px] uppercase text-[#8A94A6] block">
                      SHA-256 HASHED CONTACT
                    </span>
                    <div className="flex items-center justify-between font-mono text-xs text-[#D4FF00]">
                      <span>{piiMasked ? 'HASH-781A...99CE' : selectedNode.full_phone}</span>
                      <button
                        onClick={() => copyHash(selectedNode.full_phone!)}
                        className="p-1 text-[#8A94A6] hover:text-[#F4F6F8]"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {selectedNode.post && (
                  <div className="pt-2">
                    <MagneticButton
                      variant="primary"
                      onClick={() => {
                        selectVehicleForForensics(selectedNode.post);
                        navigate('/analyzer');
                      }}
                      className="w-full text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>INSPECT IN FORENSIC LAB</span>
                    </MagneticButton>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box text-center space-y-3"
              >
                <Network className="w-8 h-8 text-[#D4FF00] mx-auto animate-pulse" />
                <h4 className="font-sans font-bold text-sm text-[#F4F6F8]">
                  SELECT AN ENTITY NODE
                </h4>
                <p className="font-sans text-xs text-[#8A94A6] leading-relaxed">
                  Click on any vehicle, seller, or phone node in the 3D orbit cage to reveal cross-border linkages and dossier evidence.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Syndicate Intelligence Dossier Card */}
          <div className="p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-3 font-mono text-xs">
            <span className="text-[10px] text-[#D4FF00] uppercase font-bold block">
              // CLUSTER_CORRELATIONS
            </span>
            <div className="space-y-2 text-[#8A94A6] text-[11px]">
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>QUETTA PHONE CLUSTERS</span>
                <span className="text-[#F4F6F8] font-bold">4 HUBS</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>CHAMAN CORRIDOR NODES</span>
                <span className="text-[#D4FF00] font-bold">7 ACTIVE</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>OCR WATERMARK OVERLAYS</span>
                <span className="text-[#FF2A4B] font-bold">18 DETECTED</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default EntityGraphPage;
