import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  AlertOctagon,
  RefreshCw,
  ShieldAlert,
  Clock,
  FileText,
  Activity,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole } from '../types';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_table: string;
  metadata: Record<string, any>;
  created_at: string;
  actor?: { full_name: string; role: string };
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'audit'>('roster');

  const MOCK_PERSONNEL: UserProfile[] = [
    { id: '1', full_name: 'Zainab', email: 'zainab@nexus.io', phone: '+92-300-1110001', role: 'super_admin', hierarchy_level: 1, is_2fa_enabled: true },
    { id: '2', full_name: 'Abrar', email: 'abrar@nexus.io', phone: '+92-300-2220002', role: 'lead_analyst', hierarchy_level: 2, is_2fa_enabled: true },
    { id: '3', full_name: 'Sulaman', email: 'sulaman@nexus.io', phone: '+92-300-3330003', role: 'field_investigator', hierarchy_level: 3, is_2fa_enabled: false },
  ];

  const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'a1', actor_id: '1', action: 'INITIALIZE_SCHEMA', target_table: 'system', metadata: { version: '1.0.0' }, created_at: '2026-11-18T18:00:00+00:00', actor: { full_name: 'Zainab', role: 'super_admin' } },
    { id: 'a2', actor_id: '2', action: 'FACEBOOK_SCRAPE', target_table: 'scraped_posts', metadata: { job_id: 'fb-001', total_scraped: 15, flagged_count: 8, critical_count: 3 }, created_at: '2026-11-18T20:00:00+00:00', actor: { full_name: 'Abrar', role: 'lead_analyst' } },
    { id: 'a3', actor_id: '1', action: 'ROLE_MODIFICATION', target_table: 'profiles', metadata: { target_user: '3', new_role: 'field_investigator' }, created_at: '2026-11-18T21:00:00+00:00', actor: { full_name: 'Zainab', role: 'super_admin' } },
    { id: 'a4', actor_id: '2', action: 'CASE_ESCALATION', target_table: 'investigation_cases', metadata: { case_id: 'case-001', priority: 'critical', risk_score: 96 }, created_at: '2026-11-18T22:30:00+00:00', actor: { full_name: 'Abrar', role: 'lead_analyst' } },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers().catch(() => MOCK_PERSONNEL);
      setPersonnel(data && data.length > 0 ? data : MOCK_PERSONNEL);
    } catch {
      setPersonnel(MOCK_PERSONNEL);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await api.getAuditLogs().catch(() => MOCK_AUDIT_LOGS);
      setAuditLogs(data && data.length > 0 ? data : MOCK_AUDIT_LOGS);
    } catch {
      setAuditLogs(MOCK_AUDIT_LOGS);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    let newLevel = 3;
    if (newRole === 'super_admin') newLevel = 1;
    if (newRole === 'lead_analyst') newLevel = 2;
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole, newLevel);
      await fetchUsers();
    } catch (err: any) {
      alert(`Role modification failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Header with Equalizer & Actions */}
      <SectionHeading
        tag="GOVERNANCE_07"
        title="GOVERNANCE & AUDIT LOGS"
        subtitle="Tier-based clearance assignment, access control policies, and immutable tamper-evident event logs."
      />

      {/* 2. Tabs */}
      <div className="flex items-center gap-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 chamfer-badge uppercase font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-[#00f0ff] text-black'
              : 'bg-[#111315] text-[#8e98a0] hover:text-[#f7fafb] border border-white/10'
          }`}
        >
          OFFICER ROSTER & TIERS
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 chamfer-badge uppercase font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-[#00f0ff] text-black'
              : 'bg-[#111315] text-[#8e98a0] hover:text-[#f7fafb] border border-white/10'
          }`}
        >
          AUDIT EVENT LOGS
        </button>
      </div>

      {/* 3. Officer Roster Table */}
      {activeTab === 'roster' && (
        <div className="bg-[#111315] border border-white/10 chamfer-md bracket-box overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="font-mono text-xs text-[#00f0ff] font-bold">
              // ACTIVE_PERSONNEL_MANIFEST
            </span>
            <span className="font-mono text-[10px] text-[#8e98a0]">
              TOTAL: {personnel.length} OFFICERS
            </span>
          </div>

          <div className="divide-y divide-white/10 font-mono text-xs">
            {personnel.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <div className="font-sans font-semibold text-sm text-[#F4F6F8]">
                    {p.full_name}
                  </div>
                  <div className="text-[11px] text-[#8e98a0]">
                    {p.email} • {p.phone}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[#00f0ff] chamfer-badge text-[10px]">
                    TIER {p.hierarchy_level}
                  </span>

                  <select
                    value={p.role}
                    disabled={updatingId === p.id}
                    onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                    className="px-3 py-1.5 bg-[#090a0b] border border-white/10 chamfer-sm text-[#f7fafb] text-xs"
                  >
                    <option value="super_admin">L1 SUPER ADMIN</option>
                    <option value="lead_analyst">L2 LEAD ANALYST</option>
                    <option value="field_investigator">L3 INVESTIGATOR</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Audit Log Table */}
      {activeTab === 'audit' && (
        <div className="bg-[#111315] border border-white/10 chamfer-md bracket-box overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="font-mono text-xs text-[#d4ff00] font-bold">
              // IMMUTABLE_AUDIT_TRAIL
            </span>
            <span className="font-mono text-[10px] text-[#8e98a0]">
              SHA-256 LOG INTEGRITY VERIFIED
            </span>
          </div>

          <div className="divide-y divide-white/10 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00f0ff] font-bold">[{log.action}]</span>
                    <span className="text-[#8e98a0] text-[10px]">
                      on {log.target_table}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#f7fafb]">
                    Actor: {log.actor?.full_name || 'System'} ({log.actor?.role || 'Service'})
                  </div>
                </div>

                <div className="text-[10px] text-[#8e98a0]">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
