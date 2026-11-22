import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Radio,
  FileSearch,
  Network,
  Cpu,
  FolderGit2,
  Users,
  Settings,
  Plus,
  Lock,
  Sun,
  Moon,
  Zap,
  Command,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useNexus } from '../context/NexusContext';
import { useTheme } from '../context/ThemeContext';
import { soundEngine } from '../services/soundEngine';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanModal?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenScanModal,
}) => {
  const navigate = useNavigate();
  const { togglePiiMasked, piiMasked, checkBackendHealth } = useNexus();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    {
      id: 'dashboard',
      category: 'NAVIGATION',
      title: 'Command Center & Telemetry',
      shortcut: 'G D',
      icon: LayoutDashboard,
      perform: () => { navigate('/dashboard'); onClose(); },
    },
    {
      id: 'scraper',
      category: 'NAVIGATION',
      title: 'OSINT Live Marketplace Scraper',
      shortcut: 'G S',
      icon: Radio,
      perform: () => { navigate('/scraper'); onClose(); },
    },
    {
      id: 'analyzer',
      category: 'NAVIGATION',
      title: 'Forensic Lab & Roman Urdu NLP',
      shortcut: 'G F',
      icon: FileSearch,
      perform: () => { navigate('/analyzer'); onClose(); },
    },
    {
      id: 'entity-graph',
      category: 'NAVIGATION',
      title: '3D Entity Graph & Syndicate Mesh',
      shortcut: 'G E',
      icon: Network,
      perform: () => { navigate('/entity-graph'); onClose(); },
    },
    {
      id: 'models',
      category: 'NAVIGATION',
      title: 'Model Diagnostics & LightGBM Metrics',
      shortcut: 'G M',
      icon: Cpu,
      perform: () => { navigate('/models'); onClose(); },
    },
    {
      id: 'cases',
      category: 'NAVIGATION',
      title: 'Investigation Dossiers & Warrants',
      shortcut: 'G C',
      icon: FolderGit2,
      perform: () => { navigate('/cases'); onClose(); },
    },
    {
      id: 'admin',
      category: 'NAVIGATION',
      title: 'Team Personnel & Access Tiers',
      shortcut: 'G A',
      icon: Users,
      perform: () => { navigate('/admin'); onClose(); },
    },
    {
      id: 'settings',
      category: 'NAVIGATION',
      title: 'User Profile, 2FA & Preferences',
      shortcut: 'G P',
      icon: Settings,
      perform: () => { navigate('/settings'); onClose(); },
    },
    {
      id: 'scan',
      category: 'ACTION',
      title: '+ Scan Listing Manually',
      shortcut: 'N',
      icon: Plus,
      perform: () => {
        onClose();
        if (onOpenScanModal) onOpenScanModal();
      },
    },
    {
      id: 'pii',
      category: 'ACTION',
      title: piiMasked ? 'Reveal Unmasked PII Telemetry' : 'Enforce SHA-256 PII Redaction',
      shortcut: 'P',
      icon: Lock,
      perform: () => { togglePiiMasked(); onClose(); },
    },
    {
      id: 'theme',
      category: 'ACTION',
      title: theme === 'dark' ? 'Switch to Editorial Light Mode' : 'Switch to Stealth Dark Mode',
      shortcut: 'T',
      icon: theme === 'dark' ? Sun : Moon,
      perform: () => { toggleTheme(); onClose(); },
    },
    {
      id: 'ping',
      category: 'SYSTEM',
      title: 'Ping Backend Health & Latency',
      shortcut: 'H',
      icon: Zap,
      perform: () => { checkBackendHealth(); onClose(); },
    },
  ];

  const filtered = actions.filter((act) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      act.title.toLowerCase().includes(q) ||
      act.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        soundEngine.playTactileClick();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        soundEngine.playTactileClick();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          soundEngine.playTactileClick();
          filtered[selectedIndex].perform();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99990] flex items-start justify-center pt-24 sm:pt-32 p-4 select-none">
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Floating Command Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl bg-[#0d0f12]/95 backdrop-blur-2xl border border-white/[0.12] chamfer-md shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden bracket-box z-10"
          >
            {/* Top Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-black/30">
              <Search className="w-4 h-4 text-[#D4FF00] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or jump to view..."
                className="w-full bg-transparent text-sm font-sans text-[#F4F6F8] placeholder-[#8A94A6] outline-none"
              />
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-[#8A94A6] chamfer-badge shrink-0">
                ESC
              </span>
            </div>

            {/* Actions List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[#8A94A6]">
                  No matching commands found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundEngine.playTactileClick();
                        item.perform();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 transition-colors duration-150 cursor-pointer chamfer-sm ${
                        isSelected
                          ? 'bg-[#14171c] text-[#F4F6F8] border border-[#D4FF00]/40'
                          : 'text-[#8A94A6] hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 flex items-center justify-center chamfer-sm ${
                            isSelected ? 'bg-[#D4FF00]/15 text-[#D4FF00]' : 'bg-white/5 text-[#8A94A6]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span
                            className={`text-xs font-medium block truncate ${
                              isSelected ? 'text-[#F4F6F8]' : 'text-[#8A94A6]'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="font-mono text-[9px] text-[#8A94A6] uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-black/40 border border-white/10 text-zinc-400">
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && <ArrowRight className="w-3 h-3 text-[#D4FF00]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Guidance */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/[0.08] flex items-center justify-between font-mono text-[9px] text-[#8A94A6]">
              <div className="flex items-center gap-3">
                <span><kbd className="text-[#F4F6F8]">↑↓</kbd> NAVIGATE</span>
                <span><kbd className="text-[#F4F6F8]">↵</kbd> EXECUTE</span>
              </div>
              <span className="text-[#D4FF00]">NEXUS QUICK LAUNCHER</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPaletteModal;
