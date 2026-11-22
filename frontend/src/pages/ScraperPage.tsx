import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Zap,
  Trash2,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Image as ImageIcon,
  Plus,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useNexus } from '../context/NexusContext';
import { ScrapedPost } from '../types';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';

export const ScraperPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pastedUrl,
    setPastedUrl,
    batchLimit,
    setBatchLimit,
    isScraping,
    liveLogs,
    clearLogs,
    scrapedVehicles,
    executeScrape,
    selectVehicleForForensics,
    setScanModalOpen,
  } = useNexus();

  const [inputUrl, setInputUrl] = useState(pastedUrl);
  const [inputLimit, setInputLimit] = useState(batchLimit);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);

  const handleExecuteScrape = async () => {
    if (!inputUrl.trim()) {
      setErrorMessage('Please enter a target URL.');
      return;
    }
    setErrorMessage(null);
    setFeedbackMsg(null);
    setPastedUrl(inputUrl.trim());
    setBatchLimit(inputLimit);

    try {
      const res = await executeScrape(inputUrl.trim(), inputLimit);
      if (res?.status === 'empty' || res?.count === 0) {
        setFeedbackMsg('Scrape complete: 0 listings extracted from target.');
      } else {
        setFeedbackMsg(`Successfully ingested ${res?.count || 0} vehicle listings.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Scraper execution failed.');
    }
  };

  const handleInspect = (post: ScrapedPost) => {
    selectVehicleForForensics(post);
    navigate('/analyzer');
  };

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Header with Equalizer & Actions */}
      <SectionHeading
        tag="OSINT_INGESTION_02"
        title="OSINT MARKETPLACE INGESTION STUDIO"
        subtitle="Asynchronous headless browser automation scraping public auto classifieds, extracting high-res photos, and normalizing currency values."
        action={
          <div className="flex items-center gap-3">
            <MagneticButton
              variant="secondary"
              onClick={() => setScanModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>MANUAL SINGLE SCAN</span>
            </MagneticButton>
          </div>
        }
      />

      {/* 2. Ingestion Target Configuration Card */}
      <div className="p-6 bg-[#111315] border border-white/10 chamfer-md bracket-box space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#00f0ff] uppercase font-bold">
              // TARGET_FEED_URL
            </span>
            <LiveEqualizerBar color="#00f0ff" />
          </div>
          <span className="font-mono text-[10px] text-[#8e98a0]">
            ASYNC CHROMIUM HEADLESS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-9">
            <label className="block text-xs font-mono text-[#8e98a0] mb-1.5 uppercase font-bold">
              Target Marketplace / Classified Group URL
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://facebook.com/groups/pakistan.cars or classified listing URL..."
              className="w-full px-4 py-3 bg-[#090a0b] border border-white/10 text-xs sm:text-sm text-[#f7fafb] font-mono chamfer-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-mono text-[#8e98a0] mb-1.5 uppercase font-bold">
              Ingestion Limit
            </label>
            <select
              value={inputLimit}
              onChange={(e) => setInputLimit(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#090a0b] border border-white/10 text-xs sm:text-sm text-[#f7fafb] font-mono chamfer-sm"
            >
              <option value={5}>5 LISTINGS</option>
              <option value={10}>10 LISTINGS</option>
              <option value={20}>20 LISTINGS</option>
              <option value={50}>50 LISTINGS</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 text-xs font-mono text-red-400 chamfer-sm">
            {errorMessage}
          </div>
        )}

        {feedbackMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-400 chamfer-sm">
            {feedbackMsg}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <MagneticButton
            variant="primary"
            onClick={handleExecuteScrape}
            disabled={isScraping}
            className="text-xs px-6 py-3"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>SCRAPING TARGET CORRIDORS...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LAUNCH OSINT SWEEP</span>
              </>
            )}
          </MagneticButton>
        </div>
      </div>

      {/* 3. Live Telemetry Terminal Console */}
      <div className="bg-[#111315] border border-white/10 chamfer-md bracket-box overflow-hidden">
        <div className="p-3 px-4 bg-[#090a0b] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00f0ff]" />
            <span className="font-mono text-xs font-bold text-[#f7fafb]">
              ASYNC CHROMIUM LIVE LOG STREAM
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearLogs}
              className="text-[10px] font-mono text-[#8e98a0] hover:text-[#f7fafb] transition-colors"
            >
              CLEAR LOGS
            </button>
            <button
              onClick={() => setTerminalCollapsed(!terminalCollapsed)}
              className="p-1 text-[#8e98a0] hover:text-[#f7fafb]"
            >
              {terminalCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!terminalCollapsed && (
          <div className="p-4 bg-[#060708] h-48 overflow-y-auto font-mono text-xs text-[#8e98a0] space-y-1">
            {liveLogs.length === 0 ? (
              <div className="text-white/20 italic">// Awaiting scraper invocation...</div>
            ) : (
              liveLogs.map((log: any, idx: number) => {
                const isErr = log.level === 'error' || log.message?.includes('ERROR');
                return (
                  <div key={idx} className={`leading-relaxed ${isErr ? 'text-red-400 font-bold' : 'text-[#8e98a0]'}`}>
                    <span className="text-white/30 mr-2">[{log.timestamp || '--:--'}]</span>
                    <span>{log.message || log}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Extracted Vehicles Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-bold text-lg text-[#F4F6F8]">
            INGESTED LISTING DOSSIERS ({scrapedVehicles.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scrapedVehicles.slice(0, 9).map((v) => {
            const ext = v.extracted_json || {};
            const risk = v.risk_score || 0;

            return (
              <div
                key={v.id || v.message_hash}
                className="p-4 bg-[#111315] border border-white/10 hover:border-[#00f0ff]/50 chamfer-sm bracket-box transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-sans font-bold text-sm text-[#F4F6F8]">
                      {ext.year || ''} {ext.make || 'Vehicle'} {ext.model || ''}
                    </h4>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 chamfer-badge font-bold">
                      {risk}% RISK
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#8e98a0] line-clamp-2">
                    {v.raw_text}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#f7fafb] font-bold">
                    {ext.asking_price ? `PKR ${(ext.asking_price / 100000).toFixed(1)} Lac` : 'Unpriced'}
                  </span>

                  <MagneticButton
                    variant="secondary"
                    onClick={() => handleInspect(v)}
                    className="text-[10px] px-3 py-1"
                  >
                    <span>ANALYZE</span>
                    <ArrowRight className="w-3 h-3" />
                  </MagneticButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ScraperPage;
