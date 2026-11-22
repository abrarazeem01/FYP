import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  ShieldAlert,
  Radio,
  X,
  Plus,
  Eye,
  Sliders,
  Car,
  Radar,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useNexus } from '../context/NexusContext';
import { ScrapedPost } from '../types';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { OdometerCounter } from '../components/OdometerCounter';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';
import { ArchitecturalCard } from '../components/ArchitecturalCard';
import { Interactive3DCenterpiece } from '../components/Interactive3DCenterpiece';

// 60fps Real-Time Pulsing Waveform Monitor Canvas
const RealtimeWaveformMonitor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    let w = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let h = (canvas.height = canvas.parentElement?.clientHeight || 90);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.04;

      ctx.clearRect(0, 0, w, h);

      // Grid hairlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 15; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 1. Primary high-frequency telemetry wave
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x <= w; x += 3) {
        const freq1 = Math.sin(x * 0.04 + t * 2) * 16;
        const freq2 = Math.sin(x * 0.015 - t) * 10;
        const pulseSpike = Math.exp(-Math.pow((x - ((t * 80) % (w + 100))) / 35, 2)) * 25;
        const y = h / 2 + freq1 + freq2 + pulseSpike;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#D4FF00';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#D4FF00';
      ctx.shadowBlur = 8;
      ctx.stroke();

      // 2. Secondary telemetry crimson ghost wave
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x <= w; x += 4) {
        const freq = Math.cos(x * 0.03 - t * 1.5) * 12;
        ctx.lineTo(x, h / 2 + freq);
      }
      ctx.strokeStyle = 'rgba(255, 42, 75, 0.45)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.stroke();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="w-full h-20 relative bg-[#060708] border border-white/10 chamfer-sm overflow-hidden">
      <div className="absolute top-1.5 left-2.5 font-mono text-[9px] text-[#D4FF00] uppercase tracking-wider flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-ping" />
        <span>LIVE INGESTION OSCILLOSCOPE // 60 FPS</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    scrapedVehicles,
    stats,
    refreshStats,
    alerts,
    dismissAlert,
    selectVehicleForForensics,
    setScanModalOpen,
  } = useNexus();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'critical'>('all');

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await refreshStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleInspectVehicle = (vehicle: ScrapedPost) => {
    selectVehicleForForensics(vehicle);
    navigate('/analyzer');
  };

  // Critical Threat alert banner
  const criticalThreat = alerts.find((a) => (a.post?.risk_score || 0) >= 75) || (alerts.length > 0 ? alerts[0] : null);

  const kpis = [
    {
      id: 'kpi-monitored',
      label: 'TOTAL MONITORED',
      value: stats?.total_posts_monitored || scrapedVehicles.length,
      unit: 'UNITS',
      color: '#00f0ff',
      desc: 'Active Classified Feeds',
    },
    {
      id: 'kpi-flagged',
      label: 'FLAGGED SUSPICIOUS',
      value: stats?.flagged_suspicious || scrapedVehicles.filter(v => (v.risk_score || 0) >= 50).length,
      unit: 'LISTINGS',
      color: '#d4ff00',
      desc: 'Slang & Evasion Detected',
    },
    {
      id: 'kpi-verified',
      label: 'NCP UNDER-CUTS',
      value: stats?.verified_ncp_units || scrapedVehicles.filter(v => (v.price_deviation_pct || 0) < -30).length,
      unit: 'VERIFIED',
      color: '#ef4444',
      desc: '>35% Market Undercut',
    },
    {
      id: 'kpi-cases',
      label: 'ACTIVE DOSSIERS',
      value: stats?.active_investigations || 12,
      unit: 'CASES',
      color: '#00f0ff',
      desc: 'Assigned Field Warrants',
    },
    {
      id: 'kpi-critical',
      label: 'CRITICAL THREATS',
      value: stats?.critical_risk_units || scrapedVehicles.filter(v => (v.risk_score || 0) >= 75).length,
      unit: 'HIGH RISK',
      color: '#ef4444',
      desc: 'Risk Score ≥ 75%',
    },
  ];

  // Price Deviation vs. Baseline chart data
  const deviationChartData = scrapedVehicles.slice(0, 8).map((p) => {
    const ext = p.extracted_json || {};
    const label = `${ext.make || ''} ${ext.model || ''}`.trim() || 'Vehicle';
    const askingLac = ext.asking_price ? (ext.asking_price / 100000).toFixed(1) : '0';
    const marketLac = p.predicted_market_price ? (p.predicted_market_price / 100000).toFixed(1) : '0';
    return {
      name: label.length > 11 ? label.slice(0, 10) + '..' : label,
      asking: parseFloat(askingLac),
      market: parseFloat(marketLac),
      deviation: p.price_deviation_pct || 0,
    };
  });

  // Severity Distribution
  const lowCount = scrapedVehicles.filter((v) => (v.risk_score || 0) < 50).length;
  const elevatedCount = scrapedVehicles.filter((v) => (v.risk_score || 0) >= 50 && (v.risk_score || 0) < 75).length;
  const criticalCount = scrapedVehicles.filter((v) => (v.risk_score || 0) >= 75).length;

  const severityPieData = [
    { name: 'Standard / Cleared (<50%)', value: lowCount || (scrapedVehicles.length === 0 ? 1 : 0), color: '#10b981' },
    { name: 'Elevated Risk (50-74%)', value: elevatedCount, color: '#d4ff00' },
    { name: 'Critical NCP (≥75%)', value: criticalCount, color: '#ef4444' },
  ];

  const filteredVehicles = scrapedVehicles.filter((v) => {
    if (activeTab === 'critical') return (v.risk_score || 0) >= 75;
    if (activeTab === 'flagged') return (v.risk_score || 0) >= 50;
    return true;
  });

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Critical Threat Alert Banner */}
      <AnimatePresence>
        {criticalThreat && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-[#14171c] border-l-4 border-[#FF2A4B] border-y border-r border-white/10 chamfer-sm shadow-2xl flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF2A4B]/15 border border-[#FF2A4B]/30 flex items-center justify-center text-[#FF2A4B] chamfer-sm shrink-0">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#FF2A4B] font-bold px-1.5 py-0.5 bg-[#FF2A4B]/10 border border-[#FF2A4B]/30">
                    REAL-TIME THREAT DETECTED
                  </span>
                  <span className="text-xs text-[#8A94A6] font-mono hidden sm:inline">
                    {criticalThreat.timestamp}
                  </span>
                </div>
                <p className="text-xs font-mono font-medium text-[#F4F6F8] mt-1">
                  {criticalThreat.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {criticalThreat.post && (
                <MagneticButton
                  variant="primary"
                  onClick={() => handleInspectVehicle(criticalThreat.post!)}
                  className="text-[11px] px-3.5 py-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>INSPECT THREAT</span>
                </MagneticButton>
              )}
              <button
                onClick={() => dismissAlert(criticalThreat.id)}
                className="p-1.5 text-[#8A94A6] hover:text-[#F4F6F8] hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Page Section Heading with Actions */}
      <SectionHeading
        tag="WORKSPACE_01"
        title="COMMAND CENTER & INGESTION HUB"
        subtitle="Operational telemetry monitoring illicit auto commerce and non-custom-paid undercuts across border corridors."
        action={
          <div className="flex items-center gap-3">
            <MagneticButton
              variant="secondary"
              onClick={handleManualSync}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>SYNC TELEMETRY</span>
            </MagneticButton>

            <MagneticButton
              variant="primary"
              onClick={() => setScanModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>NEW SCAN</span>
            </MagneticButton>
          </div>
        }
      />

      {/* 3. Real-Time Waveform Monitor Strip */}
      <RealtimeWaveformMonitor />

      {/* 4. Architectural KPI Cards (Chamfered, Crisp 1px Hairlines, Corner Brackets, Odometers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-4 bg-[#0d0f12] border border-white/10 chamfer-sm relative bracket-box hover:border-[#D4FF00]/50 transition-colors group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8A94A6]">
              <span className="uppercase font-bold tracking-wider">{kpi.label}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: kpi.color }} />
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold font-display text-[#F4F6F8]">
                <OdometerCounter value={kpi.value} />
              </div>
              <span className="font-mono text-[9px] text-[#D4FF00] uppercase font-bold">
                {kpi.unit}
              </span>
            </div>

            <div className="text-[10px] font-mono text-[#8A94A6] mt-1 truncate">
              {kpi.desc}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Forensic Analytics: Price Undercut Bar Chart & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (8 cols): Asking Price vs. LightGBM Valuation Baseline */}
        <div className="lg:col-span-8 p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#D4FF00] font-bold">
                  // VALUATION_BASELINE_01
                </span>
                <LiveEqualizerBar color="#D4FF00" />
              </div>
              <h3 className="font-sans font-bold text-base text-[#F4F6F8]">
                ASKING PRICE VS. PAKWHEELS BENCHMARK (PKR LACS)
              </h3>
            </div>
            <span className="font-mono text-[10px] text-[#D4FF00] font-bold">
              LIGHTGBM REGRESSION R² = 0.9382
            </span>
          </div>

          {scrapedVehicles.length > 0 && deviationChartData.length > 0 ? (
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="#8A94A6" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#8A94A6" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d0f12',
                      borderColor: 'rgba(212,255,0,0.45)',
                      borderRadius: '0px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} Lacs`,
                      name === 'asking' ? 'Asking Price' : 'Market Baseline',
                    ]}
                  />
                  <Bar dataKey="asking" fill="#D4FF00" name="asking" />
                  <Bar dataKey="market" fill="rgba(255,255,255,0.22)" name="market" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] bg-[#060708] border border-white/10 chamfer-sm flex flex-col items-center justify-center text-center p-6 space-y-2">
              <Car className="w-8 h-8 text-[#8A94A6]" />
              <div className="font-sans font-bold text-sm text-[#F4F6F8]">
                AWAITING LIVE OSINT INGESTION
              </div>
              <p className="font-sans text-xs text-[#8A94A6] max-w-sm">
                No active listings detected. Enter an automotive URL in OSINT Ingestion or trigger a manual scan to plot regression deviations.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between text-xs font-mono text-[#8A94A6] pt-2 border-t border-white/10">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#D4FF00]" /> Asking Price
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-white/25" /> PakWheels Benchmark
              </span>
            </div>
            <button
              onClick={() => navigate('/analyzer')}
              className="text-[#D4FF00] hover:text-white transition-colors flex items-center gap-1 font-bold"
            >
              <span>DEEP FORENSIC LAB</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right (4 cols): Risk Severity Distribution Donut */}
        <div className="lg:col-span-4 p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box flex flex-col justify-between space-y-4">
          <div>
            <span className="font-mono text-[10px] text-[#D4FF00] font-bold">
              // CLASSIFICATION_BREAKDOWN
            </span>
            <h3 className="font-sans font-bold text-base text-[#F4F6F8]">
              RISK SEVERITY DISTRIBUTION
            </h3>
          </div>

          <div className="w-full h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d0f12',
                    borderColor: 'rgba(212,255,0,0.45)',
                    borderRadius: '0px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-xs">
            {severityPieData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-[#8A94A6]">
                <span className="flex items-center gap-2 text-[10px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-[#F4F6F8]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. Interactive 3D Moveable Scene: Geometric Spatial Depth Mesh */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#D4FF00] font-bold">
              // INTERACTIVE_3D_CENTERPIECE
            </span>
            <LiveEqualizerBar color="#D4FF00" />
          </div>
          <span className="font-mono text-[10px] text-[#8A94A6]">
            DRAG TO ORBIT // CURSOR PARALLAX DEPTH
          </span>
        </div>
        <Interactive3DCenterpiece />
      </div>

      {/* 7. Live Ingested Vehicle Grid with Scanning Radar Pulse Indicator */}
      <div className="p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#D4FF00] font-bold">
                // ACTIVE_SURVEILLANCE_FEED
              </span>
              <LiveEqualizerBar color="#D4FF00" />
            </div>
            <h3 className="font-sans font-bold text-lg text-[#F4F6F8]">
              LIVE INGESTED VEHICLE AD DOSSIERS
            </h3>
          </div>

          {/* Filter Pills with layoutId Sliding Background */}
          <div className="flex items-center gap-1.5 p-1 bg-[#060708] border border-white/[0.08] chamfer-sm font-mono text-xs">
            {(['all', 'flagged', 'critical'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-3 py-1 chamfer-badge transition-all uppercase z-10 font-bold ${
                  activeTab === tab ? 'text-black' : 'text-[#8A94A6] hover:text-[#F4F6F8]'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeFeedTab"
                    className="absolute inset-0 bg-[#D4FF00] chamfer-badge -z-10 shadow-[0_0_12px_rgba(212,255,0,0.35)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="py-14 px-4 bg-[#060708] border border-white/10 chamfer-sm text-center space-y-3">
            <Radio className="w-8 h-8 text-[#D4FF00] mx-auto animate-pulse" />
            <h4 className="font-sans font-bold text-sm text-[#F4F6F8]">
              NO VEHICLE DOSSIERS IN ACTIVE FEED
            </h4>
            <p className="font-sans text-xs text-[#8A94A6] max-w-md mx-auto">
              Run an OSINT sweep or launch a manual listing scan to populate the live surveillance feed.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <MagneticButton variant="primary" onClick={() => setScanModalOpen(true)}>
                <span>+ SCAN LISTING MANUALLY</span>
              </MagneticButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => {
              const ext = vehicle.extracted_json || {};
              const title = `${ext.year || ''} ${ext.make || 'Vehicle'} ${ext.model || ''}`.trim() || 'Classified Ad';
              const risk = vehicle.risk_score || 0;
              const isCritical = risk >= 75;
              const isFlagged = risk >= 50;

              return (
                <div
                  key={vehicle.id || vehicle.message_hash}
                  className="p-4 bg-[#14171c] border border-white/10 hover:border-[#D4FF00]/50 chamfer-sm bracket-box transition-all space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[9px] uppercase text-[#8A94A6] tracking-wider block">
                          {vehicle.group_name || 'OSINT FEED'}
                        </span>
                        <h4 className="font-sans font-bold text-sm text-[#F4F6F8] group-hover:text-[#D4FF00] transition-colors">
                          {title}
                        </h4>
                      </div>

                      {/* Live scanning radar pulse on critical items */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCritical
                              ? 'bg-[#FF2A4B] shadow-[0_0_8px_#FF2A4B] animate-ping'
                              : isFlagged
                              ? 'bg-[#D4FF00] animate-pulse'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span
                          className={`px-1.5 py-0.5 font-mono text-[9px] font-bold chamfer-badge ${
                            isCritical
                              ? 'bg-[#FF2A4B]/20 text-[#FF2A4B] border border-[#FF2A4B]/40'
                              : isFlagged
                              ? 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {risk}% RISK
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-[#8A94A6] line-clamp-2 leading-relaxed">
                      {vehicle.raw_text}
                    </p>

                    {/* Slang detection tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {vehicle.slang_flags && vehicle.slang_flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 font-mono text-[9px] bg-[#FF2A4B]/15 text-[#FF2A4B] border border-[#FF2A4B]/30 chamfer-badge"
                        >
                          {flag}
                        </span>
                      ))}
                      {vehicle.price_deviation_pct && vehicle.price_deviation_pct < -30 && (
                        <span className="px-1.5 py-0.5 font-mono text-[9px] bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 chamfer-badge font-bold">
                          {vehicle.price_deviation_pct}% UNDERCUT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="text-[9px] text-[#8A94A6]">ASKING / DEVIATION</div>
                      <div className="font-bold text-[#F4F6F8]">
                        {ext.asking_price ? `PKR ${(ext.asking_price / 100000).toFixed(1)} Lac` : 'Unpriced'}
                      </div>
                    </div>

                    <MagneticButton
                      variant="secondary"
                      onClick={() => handleInspectVehicle(vehicle)}
                      className="text-[10px] px-3 py-1"
                    >
                      <span>INSPECT</span>
                      <ChevronRight className="w-3 h-3" />
                    </MagneticButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
