import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, X, Image as ImageIcon, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNexus } from '../context/NexusContext';
import { api } from '../services/api';
import { MagneticButton } from './MagneticButton';
import { LiveEqualizerBar } from './LiveEqualizerBar';

export const ScanListingModal: React.FC = () => {
  const { scanModalOpen, setScanModalOpen, addLog, refreshStats, selectVehicleForForensics } = useNexus();
  const [adText, setAdText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!scanModalOpen) return null;

  const handleClose = () => {
    setScanModalOpen(false);
    setScanResult(null);
    setErrorMsg(null);
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adText.trim()) {
      setErrorMsg('Please input vehicle listing text.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    addLog(`>>> Manual scan initiated: "${adText.slice(0, 45)}..."`);

    try {
      const priceVal = manualPrice ? parseFloat(manualPrice) : undefined;
      const result = await api.scanListing({
        raw_text: adText.trim(),
        image_url: imageUrl.trim() || undefined,
        seller_name: sellerName.trim() || undefined,
        manual_price: priceVal,
      });

      setScanResult(result);
      await refreshStats();
      addLog(`[FORENSIC SCAN COMPLETE] Analyzed: ${result.risk_score}% Risk [${result.status.toUpperCase()}].`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed');
      addLog(`[SCAN ERROR] ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl bg-[#111315] border border-white/20 chamfer-md bracket-box shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090a0b]/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#181b1e] border border-white/15 flex items-center justify-center text-[#00f0ff] chamfer-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-[#F4F6F8] tracking-wide uppercase">
                  MANUAL FORENSIC SCANNER
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-[#8e98a0]">
                    LIGHTGBM MARKET REGRESSION & OCR EXTRACTION
                  </span>
                  <LiveEqualizerBar color="#00f0ff" />
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-[#8e98a0] hover:text-[#f7fafb] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {!scanResult ? (
              <form onSubmit={handleScanSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[#8e98a0] mb-1.5 uppercase font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#00f0ff]" />
                    Listing Text / Roman Urdu Post Caption *
                  </label>
                  <textarea
                    rows={4}
                    value={adText}
                    onChange={(e) => setAdText(e.target.value)}
                    placeholder="e.g. 2020 Toyota Corolla GLI NCP cut-piece Quetta chalta phirta without file 8 lakh final. Contact 0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-[#090a0b] border border-white/10 text-xs sm:text-sm text-[#f7fafb] chamfer-sm resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#8e98a0] mb-1.5 uppercase font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#00f0ff]" />
                      Image URL (PaddleOCR Watermark)
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/ad-image.jpg"
                      className="w-full px-3.5 py-2 bg-[#090a0b] border border-white/10 text-xs text-[#f7fafb] chamfer-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8e98a0] mb-1.5 uppercase font-bold">
                      Seller / Dealer Name
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="e.g. Quetta Motors Trade"
                      className="w-full px-3.5 py-2 bg-[#090a0b] border border-white/10 text-xs text-[#f7fafb] chamfer-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8e98a0] mb-1.5 uppercase font-bold">
                    Asking Price (Optional PKR override)
                  </label>
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="e.g. 800000"
                    className="w-full px-3.5 py-2 bg-[#090a0b] border border-white/10 text-xs text-[#f7fafb] chamfer-sm"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 text-xs font-mono text-red-400 chamfer-sm">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <MagneticButton variant="stealth" onClick={handleClose} type="button">
                    CANCEL
                  </MagneticButton>
                  <MagneticButton variant="primary" type="submit" disabled={isScanning}>
                    {isScanning ? 'RUNNING FORENSICS...' : 'SCAN & INGEST LISTING'}
                  </MagneticButton>
                </div>
              </form>
            ) : (
              /* Results View */
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-[#090a0b] border border-white/10 chamfer-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-sans text-[#F4F6F8]">
                      SCAN COMPLETED
                    </span>
                    <span className="px-2 py-0.5 bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-bold chamfer-badge">
                      {scanResult.risk_score}% RISK COEFFICIENT
                    </span>
                  </div>

                  <div className="text-[#8e98a0]">
                    Status: <span className="text-[#d4ff00] uppercase font-bold">{scanResult.status}</span>
                  </div>

                  {scanResult.price_deviation_pct && (
                    <div className="text-[#8e98a0]">
                      Price Deviation: <span className="text-red-400 font-bold">{scanResult.price_deviation_pct}% below benchmark</span>
                    </div>
                  )}

                  {scanResult.slang_flags && scanResult.slang_flags.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {scanResult.slang_flags.map((f: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] chamfer-badge">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <MagneticButton
                    variant="secondary"
                    onClick={() => {
                      setScanResult(null);
                      setAdText('');
                    }}
                  >
                    SCAN ANOTHER
                  </MagneticButton>
                  <MagneticButton
                    variant="primary"
                    onClick={() => {
                      selectVehicleForForensics(scanResult);
                      handleClose();
                    }}
                  >
                    INSPECT IN FORENSIC LAB
                  </MagneticButton>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScanListingModal;
