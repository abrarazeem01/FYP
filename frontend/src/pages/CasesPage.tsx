import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Clock,
  UserCheck,
  Send,
  Edit3,
  Filter,
  CheckCircle,
  X,
  Plus,
  Eye,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InvestigationCase, CaseVerdict, CasePriority } from '../types';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';

export const CasesPage: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editVerdict, setEditVerdict] = useState<CaseVerdict>('under_investigation');
  const [editPriority, setEditPriority] = useState<CasePriority>('medium');
  const [saving, setSaving] = useState(false);
  const [filterVerdict, setFilterVerdict] = useState<string>('all');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases().catch(() => [
        {
          id: 'case-1',
          post_id: 'post-101',
          priority: 'critical' as const,
          verdict: 'under_investigation' as const,
          field_notes: 'Physical raid planned in Chaman border warehouse. Suspected tampered chassis.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned: { full_name: 'Sulaman', email: 'sulaman@nexus.io' },
          escalated: { full_name: 'Abrar' },
          scraped_posts: {
            id: 'post-101',
            message_hash: 'h1',
            raw_text: 'Toyota Land Cruiser V8 2018 non custom cut piece Quetta border delivery.',
            extracted_json: { make: 'Toyota', model: 'Land Cruiser', year: 2018, city: 'Quetta', asking_price: 3500000 },
            slang_flags: ['non-custom', 'cut-piece'],
            risk_score: 96,
            status: 'verified_ncp' as const,
            created_at: new Date().toISOString(),
          },
        },
        {
          id: 'case-2',
          post_id: 'post-102',
          priority: 'high' as const,
          verdict: 'pending' as const,
          field_notes: 'Chassis punch verified. Awaiting inspection confirmation from Zainab.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned: { full_name: 'Sulaman', email: 'sulaman@nexus.io' },
          escalated: { full_name: 'Abrar' },
          scraped_posts: {
            id: 'post-102',
            message_hash: 'h2',
            raw_text: 'Honda Civic 2020 kabuli without file chalta phirta sasti gari.',
            extracted_json: { make: 'Honda', model: 'Civic', year: 2020, city: 'Peshawar', asking_price: 1800000 },
            slang_flags: ['kabuli', 'without file', 'chalta phirta'],
            risk_score: 82,
            status: 'flagged' as const,
            created_at: new Date().toISOString(),
          },
        },
      ]);
      setCases(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const openCaseDetails = (c: InvestigationCase) => {
    setSelectedCase(c);
    setEditNotes(c.field_notes || '');
    setEditVerdict(c.verdict);
    setEditPriority(c.priority);
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSaving(true);
    try {
      const updated = await api.updateCase(selectedCase.id, {
        verdict: editVerdict,
        priority: editPriority,
        field_notes: editNotes,
      });
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? { ...c, ...updated } : c)));
      setSelectedCase(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterVerdict === 'all') return true;
    return c.verdict === filterVerdict;
  });

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Header with Equalizer & Actions */}
      <SectionHeading
        tag="CASES_DOSSIERS_06"
        title="INVESTIGATION CASES QUEUE"
        subtitle="Active enforcement dossiers, verified contraband warrants, and inter-agency intelligence dispatches."
        action={
          <div className="flex items-center gap-2 font-mono text-xs text-[#8e98a0]">
            <span className="text-[#00f0ff] font-bold">TOTAL ACTIVE: {cases.length}</span>
          </div>
        }
      />

      {/* 2. Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          {['all', 'pending', 'under_investigation', 'seizure_approved', 'dismissed'].map((v) => (
            <button
              key={v}
              onClick={() => setFilterVerdict(v)}
              className={`px-3 py-1.5 chamfer-badge uppercase transition-all ${
                filterVerdict === v
                  ? 'bg-[#00f0ff] text-black font-bold'
                  : 'bg-[#111315] text-[#8e98a0] hover:text-[#f7fafb] border border-white/10'
              }`}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((c) => {
          const post = c.scraped_posts;
          const ext = post?.extracted_json || {};
          const isCritical = c.priority === 'critical';

          return (
            <div
              key={c.id}
              className="p-5 bg-[#111315] border border-white/10 hover:border-[#00f0ff]/50 chamfer-sm bracket-box transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[9px] uppercase text-[#8e98a0]">
                      CASE // {c.id}
                    </span>
                    <h3 className="font-sans font-bold text-base text-[#F4F6F8]">
                      {ext.year || ''} {ext.make || 'Vehicle'} {ext.model || ''}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 font-mono text-[9px] font-bold chamfer-badge uppercase ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30'
                    }`}
                  >
                    {c.priority}
                  </span>
                </div>

                <div className="p-3 bg-[#090a0b] border border-white/10 chamfer-sm font-mono text-xs space-y-1">
                  <div className="text-[#8e98a0] text-[10px] uppercase">FIELD NOTES</div>
                  <p className="text-[#f7fafb] line-clamp-2 leading-relaxed">
                    {c.field_notes || 'No notes logged.'}
                  </p>
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] text-[#8e98a0]">
                  <span>VERDICT:</span>
                  <span className="text-[#d4ff00] uppercase font-bold">
                    {c.verdict.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#8e98a0]">
                  ASSIGNED: {c.assigned?.full_name || 'Sulaman'}
                </span>

                <MagneticButton
                  variant="secondary"
                  onClick={() => openCaseDetails(c)}
                  className="text-[10px] px-3 py-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>REVIEW DOSSIER</span>
                </MagneticButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Edit Dossier Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#111315] border border-white/20 p-6 chamfer-md bracket-box shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#00f0ff] uppercase font-bold">
                    // EDIT_CASE_DOSSIER
                  </span>
                  <LiveEqualizerBar color="#00f0ff" />
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1 text-[#8e98a0] hover:text-[#f7fafb]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateCase} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[#8e98a0] mb-1 uppercase font-bold">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as CasePriority)}
                    className="w-full px-3 py-2 bg-[#090a0b] border border-white/10 chamfer-sm text-[#f7fafb]"
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="critical">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8e98a0] mb-1 uppercase font-bold">Verdict</label>
                  <select
                    value={editVerdict}
                    onChange={(e) => setEditVerdict(e.target.value as CaseVerdict)}
                    className="w-full px-3 py-2 bg-[#090a0b] border border-white/10 chamfer-sm text-[#f7fafb]"
                  >
                    <option value="pending">PENDING</option>
                    <option value="under_investigation">UNDER INVESTIGATION</option>
                    <option value="seizure_approved">SEIZURE APPROVED</option>
                    <option value="dismissed">DISMISSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8e98a0] mb-1 uppercase font-bold">Field Notes</label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090a0b] border border-white/10 chamfer-sm text-[#f7fafb] resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <MagneticButton
                    variant="stealth"
                    onClick={() => setSelectedCase(null)}
                    type="button"
                  >
                    CANCEL
                  </MagneticButton>
                  <MagneticButton
                    variant="primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'UPDATING...' : 'SAVE DOSSIER'}
                  </MagneticButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CasesPage;
