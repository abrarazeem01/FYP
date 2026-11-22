import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Shield,
  Layers,
  Radio,
  ExternalLink,
  ChevronRight,
  Gauge,
  Image as ImageIcon,
  Key,
  FileText,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useNexus } from '../context/NexusContext';
import { ScrapedPost } from '../types';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';

const SLANG_KEYWORDS = [
  'chaman clear',
  'chaman',
  'non custom',
  'non-custom',
  'ncp',
  'cut piece',
  'cut-piece',
  'cutpiece',
  'kabli',
  'kabuli',
  'baghair file',
  'without file',
  'punch chassis',
  'chassis punch',
  'chalta phirta',
  'chalta firta',
  'duty unpaid',
  'border cross',
  'open letter',
  'body change',
];

export const AnalyzerPage: React.FC = () => {
  const { selectedVehicleForForensics, addLog, refreshStats } = useNexus();

  const [rawText, setRawText] = useState(
    'Toyota Corolla 2020 NCP cut-piece Quetta chalta phirta without file 8 lakh final. Direct Chaman border delivery.'
  );
  const [imageUrl, setImageUrl] = useState('');
  const [manualPrice, setManualPrice] = useState<string>('800000');
  const [sellerName, setSellerName] = useState('Quetta Border Trade');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-load selected vehicle from context if routed from Command Center
  useEffect(() => {
    if (selectedVehicleForForensics) {
      setRawText(selectedVehicleForForensics.raw_text || '');
      setSellerName(selectedVehicleForForensics.seller_name || 'Dealer');
      if (selectedVehicleForForensics.extracted_json?.asking_price) {
        setManualPrice(String(selectedVehicleForForensics.extracted_json.asking_price));
      }
      setAnalysisResult(selectedVehicleForForensics);
    }
  }, [selectedVehicleForForensics]);

  // Dynamic token highlighting: highlights typed Roman Urdu slang in red!
  const highlightedTokens = useMemo(() => {
    if (!rawText) return [];
    const lowerText = rawText.toLowerCase();

    const matches: Array<{ start: number; end: number; term: string }> = [];
    for (const term of SLANG_KEYWORDS) {
      let idx = lowerText.indexOf(term);
      while (idx !== -1) {
        matches.push({ start: idx, end: idx + term.length, term });
        idx = lowerText.indexOf(term, idx + 1);
      }
    }

    matches.sort((a, b) => a.start - b.start);

    const nonOverlapping: Array<{ start: number; end: number }> = [];
    for (const m of matches) {
      if (!nonOverlapping.length) {
        nonOverlapping.push(m);
      } else {
        const last = nonOverlapping[nonOverlapping.length - 1];
        if (m.start <= last.end) {
          last.end = Math.max(last.end, m.end);
        } else {
          nonOverlapping.push(m);
        }
      }
    }

    const result: Array<{ text: string; isSlang: boolean }> = [];
    let cur = 0;
    for (const m of nonOverlapping) {
      if (m.start > cur) {
        result.push({ text: rawText.slice(cur, m.start), isSlang: false });
      }
      result.push({ text: rawText.slice(m.start, m.end), isSlang: true });
      cur = m.end;
    }
    if (cur < rawText.length) {
      result.push({ text: rawText.slice(cur), isSlang: false });
    }

    return result;
  }, [rawText]);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const parsedPrice = manualPrice ? parseFloat(manualPrice) : undefined;
      const res = await api.analyzePost({
        raw_text: rawText,
        image_url: imageUrl || undefined,
        manual_price: parsedPrice,
        seller_name: sellerName || undefined,
      });

      const analysisData = (res as any).analysis || res;
      setAnalysisResult(analysisData);
      const risk = analysisData.risk_score || 0;
      const flags = (analysisData.slang_flags || []).join(', ') || 'None';
      addLog(`[FORENSIC_LAB] Analyzed post: ${risk}% Risk. Flags: ${flags}`);
      await refreshStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Ensure backend service is reachable.');
    } finally {
      setLoading(false);
    }
  };

  const riskScore = analysisResult?.risk_score ?? 88;
  const askingPriceNum = analysisResult?.extracted_json?.asking_price ?? (manualPrice ? parseFloat(manualPrice) : 800000);
  const marketPriceNum = analysisResult?.predicted_market_price ?? 3850000;
  const deviationPct = analysisResult?.price_deviation_pct ?? -79.2;
  const slangFlags = analysisResult?.slang_flags ?? ['cut-piece', 'without file', 'chalta phirta'];
  const ocrFindings = analysisResult?.ocr_findings;

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Page Header */}
      <SectionHeading
        tag="FORENSIC_LAB_03"
        title="FORENSIC LAB // MULTI-MODAL MODEL SUITE"
        subtitle="Simultaneously evaluates LightGBM Pakistani market price regressions, Roman Urdu contraband slang classifiers, and PaddleOCR pixel watermarks."
        action={
          <div className="flex items-center gap-2 font-mono text-xs text-[#8A94A6]">
            <span className="text-[#D4FF00] font-bold">LIGHTGBM R² 0.938</span>
            <span>|</span>
            <span className="text-[#FF2A4B] font-bold">SLANG F1 1.00</span>
          </div>
        }
      />

      {/* 2. Interactive Analysis Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Input Stage + Tokenized Syntax Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#D4FF00] uppercase font-bold">
                  // AD_CAPTION_INPUT
                </span>
                <LiveEqualizerBar color="#D4FF00" />
              </div>
              <span className="font-mono text-[10px] text-[#8A94A6]">
                DYNAMIC SLANG SYNTAX DETECTION
              </span>
            </div>

            <form onSubmit={handleRunAnalysis} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8A94A6] mb-1.5 uppercase font-bold">
                  Listing Caption / Ad Post Text
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-4 py-3 bg-[#060708] border border-white/10 text-xs sm:text-sm text-[#F4F6F8] font-mono chamfer-sm resize-none leading-relaxed"
                  placeholder="Paste vehicle listing text here..."
                  required
                />
              </div>

              {/* Real-Time Tokenized Highlighting Preview Box */}
              <div className="p-4 bg-[#060708] border border-white/10 chamfer-sm space-y-1.5">
                <span className="font-mono text-[9px] uppercase text-[#D4FF00] tracking-wider block font-bold">
                  TOKENIZED SYNTAX ANALYSIS (RED = CONTRABAND SLANG)
                </span>
                <div className="text-xs sm:text-sm font-mono leading-relaxed text-[#8A94A6] break-words">
                  {highlightedTokens.map((tok, i) =>
                    tok.isSlang ? (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-[#FF2A4B]/25 border border-[#FF2A4B]/50 text-[#FF2A4B] font-bold mx-0.5 chamfer-badge shadow-[0_0_8px_rgba(255,42,75,0.3)]"
                        title="Contraband Dialect Token"
                      >
                        {tok.text}
                      </span>
                    ) : (
                      <span key={i}>{tok.text}</span>
                    )
                  )}
                </div>
              </div>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8A94A6] mb-1 uppercase font-bold">
                    Asking Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/10 text-xs font-mono text-[#F4F6F8] chamfer-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A94A6] mb-1 uppercase font-bold">
                    Seller / Dealer Entity
                  </label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/10 text-xs font-mono text-[#F4F6F8] chamfer-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8A94A6] mb-1 flex items-center gap-1.5 uppercase font-bold">
                  <ImageIcon className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Ad Photo URL for PaddleOCR Watermark Extraction
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/windshield-watermark.jpg"
                  className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/10 text-xs font-mono text-[#F4F6F8] chamfer-sm"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#FF2A4B]/15 border border-[#FF2A4B]/30 text-xs font-mono text-[#FF2A4B] chamfer-sm">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="text-xs px-6 py-3"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>EVALUATING MULTI-MODAL PIPELINES...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      <span>EXECUTE FORENSIC EVALUATION</span>
                    </>
                  )}
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols): Valuation Gauge + Anomaly Metrics */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* LightGBM Valuation Gauge Card */}
          <div className="p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#D4FF00] uppercase font-bold">
                  // VALUATION_GAUGE
                </span>
                <LiveEqualizerBar color="#D4FF00" />
              </div>
              <span
                className={`px-2 py-0.5 font-mono text-[9px] font-bold chamfer-badge ${
                  riskScore >= 75
                    ? 'bg-[#FF2A4B]/20 text-[#FF2A4B] border border-[#FF2A4B]/40'
                    : 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30'
                }`}
              >
                {riskScore}% RISK COEFFICIENT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#060708] border border-white/10 chamfer-sm">
                <span className="font-mono text-[9px] text-[#8A94A6] block uppercase">ASKING PRICE</span>
                <span className="text-xl font-bold font-display text-[#D4FF00]">
                  PKR {(askingPriceNum / 1e5).toFixed(1)} Lac
                </span>
                <span className="font-mono text-[10px] text-[#8A94A6] block mt-0.5">
                  {askingPriceNum.toLocaleString()} PKR
                </span>
              </div>
              <div className="p-3.5 bg-[#060708] border border-white/10 chamfer-sm">
                <span className="font-mono text-[9px] text-[#8A94A6] block uppercase">MARKET BENCHMARK</span>
                <span className="text-xl font-bold font-display text-[#F4F6F8]">
                  PKR {(marketPriceNum / 1e5).toFixed(1)} Lac
                </span>
                <span className="font-mono text-[10px] text-[#8A94A6] block mt-0.5">
                  PakWheels LightGBM
                </span>
              </div>
            </div>

            {/* Deviation Meter */}
            <div className="p-3.5 bg-[#060708] border border-white/10 chamfer-sm space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#8A94A6]">PRICE DEVIATION:</span>
                <span className={`font-bold ${deviationPct < -30 ? 'text-[#FF2A4B]' : 'text-emerald-400'}`}>
                  {deviationPct > 0 ? '+' : ''}{deviationPct}% BELOW MARKET
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    deviationPct < -50 ? 'bg-[#FF2A4B]' : deviationPct < -20 ? 'bg-[#D4FF00]' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, Math.abs(deviationPct)))}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-[#8A94A6] block">
                {deviationPct < -60 ? 'CRITICAL ANOMALY: Severe non-custom-paid undercutting pattern.' : 'Standard valuation range.'}
              </span>
            </div>
          </div>

          {/* Slang Detections Card */}
          <div className="p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-3">
            <span className="font-mono text-[10px] text-[#D4FF00] uppercase font-bold block">
              // IDENTIFIED_DIALECT_FLAGS
            </span>

            <div className="flex flex-wrap gap-1.5">
              {slangFlags.map((flag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 font-mono text-xs bg-[#FF2A4B]/15 text-[#FF2A4B] border border-[#FF2A4B]/30 chamfer-badge flex items-center gap-1.5 font-bold"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {flag.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* PaddleOCR Watermark Extracted Findings */}
          <div className="p-5 bg-[#0d0f12] border border-white/10 chamfer-md bracket-box space-y-3 font-mono text-xs">
            <span className="text-[10px] text-[#D4FF00] uppercase font-bold block">
              // PADDLEOCR_FINDINGS
            </span>
            <div className="space-y-1.5 text-[#8A94A6]">
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>PIXEL TEXT EXTRACTION</span>
                <span className="text-[#F4F6F8] font-bold">READY</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>DETECTED CONTACTS</span>
                <span className="text-[#D4FF00] font-bold">
                  {ocrFindings?.phones?.length || ocrFindings?.phone_numbers?.length || '0 EXTRACTED'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AnalyzerPage;
