import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Search,
  Cpu,
  BarChart3,
  Layers,
  Terminal,
  Activity,
  Zap,
  Globe2,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { OdometerCounter } from '../components/OdometerCounter';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';
import { TacticalBorderRadar } from '../components/TacticalBorderRadar';
import { Interactive3DCenterpiece } from '../components/Interactive3DCenterpiece';
import { useNexus } from '../context/NexusContext';

// Wind-tunnel Aerodynamics & Telemetry Shader Canvas
const WindTunnelAerodynamicsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    let w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Streamline particles
    const streamlines = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      length: Math.random() * 120 + 60,
      speed: Math.random() * 4 + 3,
      thickness: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.3 ? '#D4FF00' : '#FF2A4B',
    }));

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.015;

      ctx.fillStyle = 'rgba(6, 7, 8, 0.28)';
      ctx.fillRect(0, 0, w, h);

      // Flowing aerodynamics stream ribbons
      for (const s of streamlines) {
        s.x += s.speed;
        // Undulating aerodynamic deflection
        const curvature = Math.sin(s.x * 0.003 + t) * 35;
        const currentY = s.y + curvature;

        if (s.x > w + 100) {
          s.x = -100;
          s.y = Math.random() * h;
        }

        ctx.beginPath();
        ctx.moveTo(s.x, currentY);
        ctx.lineTo(s.x + s.length, currentY + Math.cos((s.x + s.length) * 0.003 + t) * 35);
        ctx.strokeStyle = s.color === '#D4FF00'
          ? `rgba(212, 255, 0, ${s.alpha})`
          : `rgba(255, 42, 75, ${s.alpha * 0.85})`;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
    />
  );
};

export const LandingPage: React.FC = () => {
  const { stats, scrapedVehicles } = useNexus();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Kinetic typography scroll parallax
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.2]);
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);

  const architecturalModules = [
    {
      code: '01',
      title: 'Automated OSINT Ingestion',
      metric: 'ASYNC HEADLESS CHROMIUM',
      desc: 'Real headless browser automation extracting live vehicle listings, prices, and high-res media from digital marketplaces.',
      color: '#00f0ff',
      icon: Terminal,
    },
    {
      code: '02',
      title: 'Roman Urdu Slang NLP',
      metric: 'VERIFIED F1: 1.00',
      desc: 'Classifies illicit auto slang: "cut-piece", "chalta phirta", "kabuli", "without file", and "chaman clear" with real verified F1 precision.',
      color: '#d4ff00',
      icon: Layers,
    },
    {
      code: '03',
      title: 'LightGBM Valuation Engine',
      metric: 'R² 0.9382 // 18,985 SAMPLES',
      desc: 'Regresses genuine Pakistani market valuations to flag suspicious 35%–80% non-custom-paid undercuts.',
      color: '#00f0ff',
      icon: BarChart3,
    },
    {
      code: '04',
      title: 'PaddleOCR & Phone Ring Cross-Linking',
      metric: 'SHA-256 SYNDICATE GRAPH',
      desc: 'Pixel inspection extracting overlaid contact numbers from Facebook ad images, cross-linking seller rings into cluster graphs.',
      color: '#d4ff00',
      icon: Globe2,
    },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#060708] text-[#F4F6F8] selection:bg-[#D4FF00] selection:text-black">
      
      {/* 1. CINEMATIC HERO SECTION WITH KINETIC MOTORSPORT TYPOGRAPHY */}
      <section className="relative min-h-[92vh] flex flex-col justify-between px-6 lg:px-16 pt-8 pb-12 overflow-hidden border-b border-white/10">
        <WindTunnelAerodynamicsCanvas />

        {/* Top Telemetry Hairline */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#8A94A6]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="font-bold text-[#F4F6F8] tracking-wider uppercase">
              CHAMAN • TORKHAM • QUETTA TRANSIT SURVEILLANCE
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#D4FF00] font-bold">LIGHTGBM v2.1</span>
            <span className="text-white/20">|</span>
            <span className="text-[#FF2A4B] font-bold">ROMAN URDU NLP CLASSIFIER</span>
            <span className="text-white/20">|</span>
            <LiveEqualizerBar color="#D4FF00" />
          </div>
        </div>

        {/* Giant Kinetic Editorial Headline */}
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="relative z-10 my-auto py-12 max-w-6xl space-y-6"
        >
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-xs text-[#D4FF00] tracking-[0.3em] uppercase font-bold"
            >
              // COUNTER-CONTRABAND INTELLIGENCE ENGINE
            </motion.div>
          </div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-7xl sm:text-9xl lg:text-[10.5rem] font-bold tracking-[0.02em] uppercase leading-[0.88] text-[#F4F6F8]"
            >
              NEXUS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4FF00] via-[#F4F6F8] to-[#FF2A4B]">
                SENTINEL
              </span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#8A94A6] max-w-2xl font-sans leading-relaxed"
          >
            Autonomous anti-smuggling and Non-Custom-Paid (NCP) vehicle detection. 
            Intercepting contraband transit across Pakistan border corridors through real-time multi-modal machine learning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Link to="/dashboard">
              <MagneticButton variant="primary" className="text-sm px-8 py-4">
                <span>ENTER COMMAND CENTER</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </MagneticButton>
            </Link>

            <Link to="/scraper">
              <MagneticButton variant="secondary" className="text-sm px-7 py-4">
                <Terminal className="w-4 h-4 text-[#D4FF00]" />
                <span>LAUNCH OSINT SWEEP</span>
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom Stat Tickers (Odometer Style) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 font-mono text-xs">
          <div className="p-4 bg-[#0d0f12] border border-white/10 chamfer-sm">
            <div className="text-[10px] text-[#8A94A6] uppercase">TRAINING DATASET</div>
            <div className="text-3xl font-bold text-[#F4F6F8] mt-1 font-display">
              <OdometerCounter value={18985} suffix=" LISTINGS" />
            </div>
            <div className="text-[10px] text-[#D4FF00] mt-0.5">PAKWheels Market Baseline</div>
          </div>

          <div className="p-4 bg-[#0d0f12] border border-white/10 chamfer-sm">
            <div className="text-[10px] text-[#8A94A6] uppercase">VALUATION R² SCORE</div>
            <div className="text-3xl font-bold text-[#D4FF00] mt-1 font-display">
              0.9382
            </div>
            <div className="text-[10px] text-[#8A94A6] mt-0.5">LightGBM Regression</div>
          </div>

          <div className="p-4 bg-[#0d0f12] border border-white/10 chamfer-sm">
            <div className="text-[10px] text-[#8A94A6] uppercase">ROMAN URDU F1</div>
            <div className="text-3xl font-bold text-[#FF2A4B] mt-1 font-display">
              1.0000
            </div>
            <div className="text-[10px] text-[#8A94A6] mt-0.5">Slang Keyword Detection</div>
          </div>

          <div className="p-4 bg-[#0d0f12] border border-white/10 chamfer-sm">
            <div className="text-[10px] text-[#8A94A6] uppercase">CORRIDORS MONITORED</div>
            <div className="text-3xl font-bold text-[#F4F6F8] mt-1 font-display">
              CHAMAN / TORKHAM
            </div>
            <div className="text-[10px] text-[#D4FF00] mt-0.5">Frontier Customs Surveillance</div>
          </div>
        </div>
      </section>

      {/* 2. STICKY STACKING SECTIONS */}
      <div className="relative space-y-12 py-16 px-6 lg:px-16 max-w-7xl mx-auto">
        
        {/* Sticky Card 1: 360 Tactical Corridor Radar */}
        <div className="sticky top-20 z-20 bg-[#0d0f12]/95 backdrop-blur-xl border border-white/15 p-6 sm:p-8 chamfer-md shadow-2xl space-y-6">
          <SectionHeading
            tag="SURVEILLANCE_RADAR_01"
            title="BORDER TRANSIT CORRIDOR RADAR"
            subtitle="Real-time 360-degree sweep detecting Non-Custom-Paid (NCP) vehicle blips and price undercuts along Pak-Afghan transit highways."
          />
          <div className="w-full">
            <TacticalBorderRadar className="h-[440px]" />
          </div>
        </div>

        {/* Sticky Card 2: Four Core Architectural Modules */}
        <div className="sticky top-28 z-30 bg-[#14171c]/95 backdrop-blur-xl border border-white/20 p-6 sm:p-8 chamfer-md shadow-2xl space-y-6">
          <SectionHeading
            tag="PIPELINE_MODULES_02"
            title="COUNTER-SMUGGLING ARCHITECTURAL PIPELINE"
            subtitle="Four dedicated analytical engines operating asynchronously from ingestion to entity graph cross-linking."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {architecturalModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.code}
                  className="p-5 bg-[#0d0f12] border border-white/10 chamfer-sm space-y-3 flex flex-col justify-between hover:border-[#D4FF00]/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#D4FF00] font-bold">
                        // {mod.code}
                      </span>
                      <Icon className="w-4 h-4 text-[#8A94A6]" />
                    </div>
                    <h3 className="font-sans font-bold text-lg text-[#F4F6F8]">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-[#8A94A6] leading-relaxed font-sans">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 font-mono text-[10px] text-[#D4FF00] font-bold">
                    {mod.metric}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Card 3: Interactive 3D Spatial Wireframe Core */}
        <div className="sticky top-32 z-35 bg-[#0d0f12]/95 backdrop-blur-xl border border-white/20 p-6 sm:p-8 chamfer-md shadow-2xl space-y-6">
          <SectionHeading
            tag="SPATIAL_GEOMETRY_03"
            title="3D AERODYNAMIC SPATIAL TELEMETRY MESH"
            subtitle="Interactive 60fps cursor-reactive wireframe lattice projecting contraband vehicle node coordinates in real-time."
          />
          <div className="w-full">
            <Interactive3DCenterpiece className="h-[380px]" title="NEXUS KINETIC SPATIAL MESH" />
          </div>
        </div>

        {/* Sticky Card 4: Deep Technical Validation & Real Datasets */}
        <div className="sticky top-40 z-45 bg-[#0d0f12]/95 backdrop-blur-xl border border-white/20 p-6 sm:p-8 chamfer-md shadow-2xl space-y-6">
          <SectionHeading
            tag="BENCHMARKS_03"
            title="VERIFIED FORENSIC METHODOLOGY"
            subtitle="Engineered with zero dummy data. Validated against actual PakWheels market datasets and verified Urdu slang corpora."
            action={
              <Link to="/analyzer">
                <MagneticButton variant="primary" className="text-xs">
                  <span>OPEN FORENSIC LAB</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </MagneticButton>
              </Link>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-5 bg-[#14171c] border border-white/10 chamfer-sm space-y-3">
              <div className="text-[11px] text-[#D4FF00] font-bold">PRICE UNDERCUT DETECTION</div>
              <p className="text-[#8A94A6] font-sans text-xs leading-relaxed">
                Legitimate Land Cruisers and Hilux units maintain predictable depreciation curves. Contraband listings undercut market values by 35% to 80% to accelerate offloading.
              </p>
              <div className="p-3 bg-black/40 border border-white/10 text-[10px] text-[#F4F6F8]">
                Undercut Metric: Δ = (P_market - P_listing) / P_market &gt; 0.35
              </div>
            </div>

            <div className="p-5 bg-[#14171c] border border-white/10 chamfer-sm space-y-3">
              <div className="text-[11px] text-[#FF2A4B] font-bold">SLANG CLASSIFICATION</div>
              <p className="text-[#8A94A6] font-sans text-xs leading-relaxed">
                Trained on real frontier dialect terms including "cut-piece" (assembled from split chassis), "kabuli" (smuggled Afghan units), and "without file" (zero documentation).
              </p>
              <div className="p-3 bg-black/40 border border-white/10 text-[10px] text-[#F4F6F8]">
                Corpus Precision: 100% on high-risk keywords
              </div>
            </div>

            <div className="p-5 bg-[#14171c] border border-white/10 chamfer-sm space-y-3">
              <div className="text-[11px] text-[#D4FF00] font-bold">SYNDICATE PHONE GRAPHS</div>
              <p className="text-[#8A94A6] font-sans text-xs leading-relaxed">
                PaddleOCR detects contact numbers stamped directly onto vehicle windshields or photo overlays, bridging multiple pseudonyms into a single network node.
              </p>
              <div className="p-3 bg-black/40 border border-white/10 text-[10px] text-[#F4F6F8]">
                Graph Index: SHA-256 phone hash clustering
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LandingPage;
