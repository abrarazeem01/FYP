import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  LayoutDashboard,
  Search,
  Cpu,
  FileSpreadsheet,
  Users,
  Settings,
  Sparkles,
  ChevronDown,
  LogOut,
  Radio,
  Check,
  Network,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, switchRoleForDemo, logout } = useAuth();
  const { theme, isCursorTrailEnabled, toggleCursorTrail } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Overview', icon: Radio },
    { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { path: '/scraper', label: 'FB OSINT', icon: Search },
    { path: '/entity-graph', label: 'Entity Graph', icon: Network },
    { path: '/analyzer', label: 'Forensics Lab', icon: Cpu },
    { path: '/cases', label: 'Cases Queue', icon: FileSpreadsheet },
    ...(user?.role === 'super_admin'
      ? [{ path: '/admin', label: 'Governance', icon: Users }]
      : []),
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'L1 SUPER ADMIN',
          color: theme === 'dark' ? 'bg-[#FF4D1C]/20 text-[#FF4D1C] border-[#FF4D1C]/40' : 'bg-[#FF4D1C]/15 text-[#B82A02] border-[#0F172A]',
        };
      case 'lead_analyst':
        return {
          label: 'L2 LEAD ANALYST',
          color: theme === 'dark' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-500/15 text-amber-800 border-[#0F172A]',
        };
      default:
        return {
          label: 'L3 INVESTIGATOR',
          color: theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-cyan-500/15 text-cyan-800 border-[#0F172A]',
        };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-3 z-40 w-full px-3 sm:px-6 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left Brand Badge Pill */}
        <Link
          to="/"
          className={`
            flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all group select-none
            ${
              theme === 'dark'
                ? 'bg-[#0E1117]/90 backdrop-blur-md border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                : 'bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
            }
          `}
        >
          <div className="w-7 h-7 rounded-lg bg-[#FF4D1C]/20 border border-[#FF4D1C]/50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-4 h-4 text-[#FF4D1C] animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-contrast-primary">
                NEXUS<span className="text-[#FF4D1C]">SENTINEL</span>
              </span>
              <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-[#FF4D1C] text-white">
                v1.0
              </span>
            </div>
            <p className="text-[9px] font-mono text-contrast-muted tracking-tight mt-0.5">
              ANTI-SMUGGLING
            </p>
          </div>
        </Link>

        {/* Center Floating Tactile Pill Dock */}
        <nav
          className={`
            hidden md:flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-md transition-all
            ${
              theme === 'dark'
                ? 'bg-[#0E1117]/90 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
                : 'bg-white/95 border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]'
            }
          `}
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors select-none flex items-center gap-2"
              >
                {/* Tactile active spring pill indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                    className={`
                      absolute inset-0 rounded-xl
                      ${
                        theme === 'dark'
                          ? 'bg-[#FF4D1C] shadow-[0_0_20px_rgba(255,77,28,0.5)]'
                          : 'bg-[#FF4D1C] border border-[#0F172A]'
                      }
                    `}
                  />
                )}

                <span
                  className={`
                    relative z-10 flex items-center gap-1.5 transition-colors duration-150
                    ${
                      isActive
                        ? 'text-white font-bold'
                        : theme === 'dark'
                        ? 'text-zinc-400 hover:text-white'
                        : 'text-slate-600 hover:text-black'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Kinetic Trail Toggle + Active Identity Dropdown */}
        <div className="flex items-center gap-2">
          {/* Kinetic Trail Toggle Pill */}
          <button
            onClick={toggleCursorTrail}
            title={isCursorTrailEnabled ? 'Disable Kinetic Cursor Trail' : 'Enable Kinetic Cursor Trail'}
            className={`
              hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-mono transition-all select-none
              ${
                theme === 'dark'
                  ? isCursorTrailEnabled
                    ? 'border border-[#FF4D1C]/50 bg-[#FF4D1C]/15 text-[#FF4D1C]'
                    : 'border border-white/10 bg-[#0E1117] text-zinc-400 hover:text-zinc-200'
                  : isCursorTrailEnabled
                  ? 'border-2 border-[#0F172A] bg-[#FF4D1C]/15 text-[#FF4D1C] shadow-[2px_2px_0px_#0F172A]'
                  : 'border-2 border-[#0F172A] bg-white text-slate-600 shadow-[2px_2px_0px_#0F172A]'
              }
            `}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isCursorTrailEnabled ? 'TRAIL ON' : 'TRAIL OFF'}</span>
          </button>

          {/* Active Officer Identity Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`
                flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl text-xs transition-all select-none
                ${
                  theme === 'dark'
                    ? 'bg-[#0E1117] hover:bg-[#141923] border border-white/10 text-white shadow-md'
                    : 'bg-white hover:bg-slate-50 border-2 border-[#0F172A] text-[#090D16] shadow-[3px_3px_0px_#0F172A]'
                }
              `}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left">
                <div className="font-semibold leading-tight text-contrast-primary">
                  {user?.full_name || 'Guest'}
                </div>
                <div className={`mt-0.5 inline-block text-[8px] font-mono px-1 rounded border font-bold ${badge.color}`}>
                  {badge.label}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-contrast-muted ml-1" />
            </button>

            {/* Quick Role Switcher Dropdown */}
            <AnimatePresence>
              {roleMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`
                    absolute right-0 mt-2 w-60 rounded-2xl p-2.5 z-50 text-xs font-mono
                    ${
                      theme === 'dark'
                        ? 'bg-[#0E1117] border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                        : 'bg-white border-2 border-[#0F172A] shadow-[5px_5px_0px_#0F172A]'
                    }
                  `}
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <div className="px-2 py-1 text-[10px] text-contrast-muted uppercase tracking-wider border-b border-zinc-500/20 pb-1 mb-1.5 font-bold">
                    Switch Active Officer
                  </div>

                  <button
                    onClick={() => switchRoleForDemo('super_admin')}
                    className={`
                      w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors
                      ${user?.role === 'super_admin' ? (theme === 'dark' ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-zinc-500/10'}
                    `}
                  >
                    <div>
                      <div className="font-bold text-contrast-primary">Miss Hiba</div>
                      <div className="text-[10px] text-contrast-muted">Command Chief (L1)</div>
                    </div>
                    {user?.role === 'super_admin' ? (
                      <Check className="w-3.5 h-3.5 text-[#FF4D1C]" />
                    ) : (
                      <span className="text-[9px] font-bold text-[#FF4D1C]">L1 ADMIN</span>
                    )}
                  </button>

                  <button
                    onClick={() => switchRoleForDemo('lead_analyst')}
                    className={`
                      w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors
                      ${user?.role === 'lead_analyst' ? (theme === 'dark' ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-zinc-500/10'}
                    `}
                  >
                    <div>
                      <div className="font-bold text-contrast-primary">Abrar</div>
                      <div className="text-[10px] text-contrast-muted">OSINT Lead (L2)</div>
                    </div>
                    {user?.role === 'lead_analyst' ? (
                      <Check className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500">L2 ANALYST</span>
                    )}
                  </button>

                  <button
                    onClick={() => switchRoleForDemo('field_investigator')}
                    className={`
                      w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors
                      ${user?.role === 'field_investigator' ? (theme === 'dark' ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-zinc-500/10'}
                    `}
                  >
                    <div>
                      <div className="font-bold text-contrast-primary">Sulaman</div>
                      <div className="text-[10px] text-contrast-muted">Border Operative (L3)</div>
                    </div>
                    {user?.role === 'field_investigator' ? (
                      <Check className="w-3.5 h-3.5 text-cyan-500" />
                    ) : (
                      <span className="text-[9px] font-bold text-cyan-500">L3 FIELD</span>
                    )}
                  </button>

                  <div className="border-t border-zinc-500/20 pt-1.5 mt-1.5">
                    <button
                      onClick={() => {
                        logout();
                        setRoleMenuOpen(false);
                        navigate('/login');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-red-500 font-bold flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Session</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
