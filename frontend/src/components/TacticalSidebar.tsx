import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Cpu,
  Network,
  Activity,
  FileSpreadsheet,
  Settings,
  Users,
  Compass,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNexus } from '../context/NexusContext';
import { UserRole } from '../types';

interface TacticalSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export const TacticalSidebar: React.FC<TacticalSidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, switchRoleForDemo, logout } = useAuth();
  const { stats } = useNexus();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = [
    {
      code: '00',
      label: 'Overview',
      path: '/landing',
      icon: Compass,
      desc: 'System architecture & pipeline overview',
    },
    {
      code: '01',
      label: 'Command Center',
      path: '/dashboard',
      icon: LayoutDashboard,
      desc: 'Live intelligence workspace',
    },
    {
      code: '02',
      label: 'OSINT Ingestion',
      path: '/scraper',
      icon: Search,
      desc: 'Marketplace listing scrapers',
    },
    {
      code: '03',
      label: 'Forensic Lab',
      path: '/analyzer',
      icon: Cpu,
      desc: 'LightGBM & Urdu NLP models',
    },
    {
      code: '04',
      label: 'Syndicate Graph',
      path: '/entity-graph',
      icon: Network,
      desc: 'Cross-listing entity clusters',
    },
    {
      code: '05',
      label: 'Model Diagnostics',
      path: '/models',
      icon: Activity,
      desc: 'F1 / R² calibration curves',
    },
    {
      code: '06',
      label: 'Cases Queue',
      path: '/cases',
      icon: FileSpreadsheet,
      badge: stats?.active_investigations || 0,
      desc: 'Active evidence dossiers',
    },
    ...(user?.role === 'super_admin'
      ? [
          {
            code: '07',
            label: 'Governance',
            path: '/admin',
            icon: Users,
            desc: 'Access control & audit logs',
          },
        ]
      : []),
    {
      code: '08',
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      desc: 'API endpoints & configurations',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-[74px] hover:w-[240px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#0d0f12]/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between select-none group/rail shadow-2xl">
      {/* 1. TOP LOGO EMBLEM */}
      <div className="flex flex-col">
        <div className="h-[64px] px-4 flex items-center gap-3.5 border-b border-white/10 overflow-hidden">
          <div
            onClick={() => navigate('/landing')}
            className="w-10 h-10 shrink-0 bg-[#14171c] border border-white/15 flex items-center justify-center chamfer-sm cursor-pointer hover:border-[#D4FF00] transition-colors"
          >
            <div className="w-4 h-4 bg-gradient-to-br from-[#D4FF00] to-[#FF2A4B] chamfer-badge transform rotate-45" />
          </div>
          <div className="opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 whitespace-nowrap min-w-0">
            <div className="font-sans font-bold text-sm tracking-wider text-[#F4F6F8] leading-none uppercase">
              NEXUS
            </div>
            <div className="font-mono text-[9px] text-[#D4FF00] tracking-wider uppercase mt-1">
              PERFORMANCE OSINT
            </div>
          </div>
        </div>

        {/* 2. NAVIGATION LINKS */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/dashboard' && location.pathname === '/');
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: linkActive }) => {
                  const active = linkActive || isActive;
                  return `relative flex items-center gap-3.5 px-3 py-2.5 rounded-none transition-all duration-200 group/item ${
                    active
                      ? 'bg-[#14171c] text-[#F4F6F8] border-l-2 border-[#D4FF00]'
                      : 'text-[#8A94A6] hover:text-[#F4F6F8] hover:bg-[#0d0f12]'
                  }`;
                }}
              >
                {/* Icon & Code Tag */}
                <div className="relative shrink-0 flex items-center justify-center w-8 h-8">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover/item:scale-110 ${
                      isActive ? 'text-[#D4FF00]' : 'text-[#8A94A6]'
                    }`}
                  />
                  {/* Subtle code marker when collapsed */}
                  <span className="absolute -bottom-1 -right-1 font-mono text-[8px] opacity-70 text-zinc-400 group-hover/rail:hidden">
                    {item.code}
                  </span>
                </div>

                {/* Expanded Label */}
                <div className="opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 whitespace-nowrap flex-1 flex items-center justify-between min-w-0">
                  <div className="truncate">
                    <span className="font-mono text-[10px] text-[#D4FF00] mr-2">
                      {item.code}
                    </span>
                    <span className="text-xs font-semibold tracking-wide">
                      {item.label}
                    </span>
                  </div>

                  {/* Real Badge if available */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Active bracket accent */}
                {isActive && (
                  <span className="absolute right-1 w-1 h-3 bg-[#D4FF00] opacity-90" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* 3. BOTTOM ROLE & USER UTILITY */}
      <div className="p-2 border-t border-white/10 space-y-2">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 bg-[#0d0f12] hover:bg-[#14171c] border border-white/10 transition-colors text-left"
            title="Switch User Role"
          >
            <Shield className="w-4 h-4 text-[#D4FF00] shrink-0" />
            <div className="opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate min-w-0 flex-1">
              <div className="text-[10px] font-mono text-[#8A94A6]">ACTIVE ROLE</div>
              <div className="text-xs font-bold text-[#F4F6F8] uppercase truncate">
                {user?.role?.replace('_', ' ') || 'ANALYST'}
              </div>
            </div>
          </button>

          {/* Role Dropdown */}
          <AnimatePresence>
            {roleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-[78px] bottom-0 w-52 p-2 bg-[#0d0f12] border border-white/15 shadow-2xl z-50 chamfer-sm space-y-1"
              >
                <div className="px-2 py-1 font-mono text-[9px] text-[#8A94A6] uppercase border-b border-white/10 mb-1">
                  DEMO ROLE ELEVATION
                </div>
                {(['super_admin', 'lead_analyst', 'field_investigator'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRoleForDemo(role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-mono transition-colors flex items-center justify-between ${
                      user?.role === role
                        ? 'bg-[#D4FF00]/15 text-[#D4FF00] border-l-2 border-[#D4FF00]'
                        : 'text-[#8A94A6] hover:text-[#F4F6F8] hover:bg-white/5'
                    }`}
                  >
                    <span>{role.toUpperCase()}</span>
                    {user?.role === role && <span className="text-[10px]">●</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#8A94A6] hover:text-[#FF2A4B] hover:bg-[#FF2A4B]/10 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 text-xs font-mono">
            TERMINATE SESSION
          </span>
        </button>
      </div>
    </aside>
  );
};

export default TacticalSidebar;
