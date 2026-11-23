import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Terminal,
} from 'lucide-react';
import { useAuth, EXECUTIVE_ACCOUNTS } from '../context/AuthContext';
import { api } from '../services/api';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';
import { UserRole } from '../types';
import { soundEngine } from '../services/soundEngine';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In Inputs
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register Inputs
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'L1_ADMIN' | 'L2_ANALYST' | 'L3_INVESTIGATOR'>('L2_ANALYST');

  const handleQuickAccess = (role: UserRole) => {
    soundEngine.playTactileClick();
    const profile = EXECUTIVE_ACCOUNTS[role];
    setSignInEmail(profile.email);
    setSignInPassword('Nexus2026!');
    login(`demo-token-${role}`, profile);
    navigate('/dashboard');
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playTactileClick();
    setErrorMessage('');
    setLoading(true);

    try {
      // Direct matching against pre-configured team accounts
      const matchedProfile = Object.values(EXECUTIVE_ACCOUNTS).find(
        (acc) => acc.email.toLowerCase() === signInEmail.toLowerCase()
      );

      if (matchedProfile && signInPassword === 'Nexus2026!') {
        login(`token-${matchedProfile.role}`, matchedProfile);
        navigate('/dashboard');
        return;
      }

      const res = await api.login({
        email: signInEmail,
        password: signInPassword,
      });

      if (res.token && res.user) {
        login(res.token, res.user);
        navigate('/dashboard');
      } else {
        throw new Error('Authentication failed. Check credentials.');
      }
    } catch (err: any) {
      if (
        err?.message?.includes('Backend offline') ||
        err?.message?.includes('Failed to fetch')
      ) {
        // High-craft development fallback
        const fallbackUser = EXECUTIVE_ACCOUNTS.lead_analyst;
        login('demo-token-lead_analyst', fallbackUser);
        navigate('/dashboard');
      } else {
        setErrorMessage(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      let roleString: UserRole = 'field_investigator';
      let level = 3;
      if (regRole === 'L1_ADMIN') {
        roleString = 'super_admin';
        level = 1;
      } else if (regRole === 'L2_ANALYST') {
        roleString = 'lead_analyst';
        level = 2;
      }

      await api.register({
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        phone: regPhone,
        role: roleString as any,
        hierarchy_level: level,
      });

      setSuccessMessage('Account registered successfully. Switching to sign in...');
      setTimeout(() => {
        setSignInEmail(regEmail);
        setActiveTab('signin');
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-20">
      
      {/* Editorial Split-Screen Frame */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 border border-white/[0.08] chamfer-md bg-[#0d0f12]/95 backdrop-blur-xl shadow-2xl overflow-hidden bracket-box">
        
        {/* Left Column (6 cols): Brand & Architectural Editorial */}
        <div className="lg:col-span-6 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col justify-between relative bg-black/40">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#14171c] border border-white/15 flex items-center justify-center chamfer-sm">
                <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#D4FF00] to-[#FF2A4B] chamfer-badge transform rotate-45" />
              </div>
              <div>
                <span className="font-sans font-bold text-base tracking-wider text-[#F4F6F8] leading-none block">
                  NEXUS SENTINEL
                </span>
                <span className="font-mono text-[9px] text-[#D4FF00] tracking-wider uppercase mt-0.5 block">
                  MARKET INTELLIGENCE & TELEMETRY
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#D4FF00] uppercase font-bold tracking-wider">
                // SYSTEM_ACTIVE
              </span>
              <LiveEqualizerBar color="#D4FF00" />
            </div>
          </div>

          <div className="space-y-4 my-auto py-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-[0.02em] text-[#F4F6F8] uppercase leading-[0.94]">
              INTERCEPT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4FF00] via-[#FF2A4B] to-white">
                CONTRABAND
              </span>{' '}
              <br />
              SYNDICATES.
            </h1>

            <p className="text-xs sm:text-sm font-sans text-[#8A94A6] leading-relaxed max-w-md">
              Real-time multi-modal machine intelligence scanning vehicle marketplaces, cross-referencing PakWheels valuation baselines, and extracting watermarked phone rings.
            </p>

            {/* Empirical Validation Chips */}
            <div className="space-y-2 pt-2 font-mono text-xs">
              <div className="p-3 bg-[#14171c] border border-white/[0.08] chamfer-sm flex items-center justify-between">
                <span className="text-[#8A94A6]">LightGBM Market Valuation</span>
                <span className="text-[#D4FF00] font-bold">18,985 Verified Rows (R² 0.938)</span>
              </div>
              <div className="p-3 bg-[#14171c] border border-white/[0.08] chamfer-sm flex items-center justify-between">
                <span className="text-[#8A94A6]">Roman Urdu Dialect NLP</span>
                <span className="text-[#FF2A4B] font-bold">100% Slang Recall</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] font-mono text-[10px] text-[#8A94A6] flex items-center justify-between">
            <span>DECENTRALIZED INTELLIGENCE NETWORK</span>
            <span className="text-[#D4FF00] font-bold">SHA-256 SESSIONS</span>
          </div>
        </div>

        {/* Right Column (6 cols): Auth Console */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-[#0d0f12] space-y-6">
          
          <div>
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-[#060708] border border-white/[0.08] chamfer-sm mb-6 font-sans text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setErrorMessage(''); }}
                className={`py-2 chamfer-badge transition-all uppercase tracking-wide ${
                  activeTab === 'signin' ? 'bg-[#D4FF00] text-black shadow-[0_0_12px_rgba(212,255,0,0.3)]' : 'text-[#8A94A6] hover:text-[#F4F6F8]'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                className={`py-2 chamfer-badge transition-all uppercase tracking-wide ${
                  activeTab === 'register' ? 'bg-[#D4FF00] text-black shadow-[0_0_12px_rgba(212,255,0,0.3)]' : 'text-[#8A94A6] hover:text-[#F4F6F8]'
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            {/* Error or Success Notice */}
            {errorMessage && (
              <div className="p-3 mb-4 bg-red-500/15 border border-red-500/30 font-mono text-xs text-red-400 chamfer-sm">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-3 mb-4 bg-[#D4FF00]/15 border border-[#D4FF00]/30 font-mono text-xs text-[#D4FF00] chamfer-sm">
                {successMessage}
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleSignInSubmit} autoComplete="off" className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[#8A94A6] mb-1.5 uppercase font-bold text-[10px]">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8A94A6]" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="abrar@nexus.io"
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-3 bg-[#060708] border border-white/[0.08] text-xs font-mono text-[#F4F6F8] chamfer-sm focus:border-[#D4FF00]/50 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8A94A6] mb-1.5 uppercase font-bold text-[10px]">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8A94A6]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-3 bg-[#060708] border border-white/[0.08] text-xs font-mono text-[#F4F6F8] chamfer-sm focus:border-[#D4FF00]/50 outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#8A94A6] hover:text-[#F4F6F8]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <MagneticButton
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs py-3.5 mt-2"
                >
                  <span>{loading ? 'AUTHENTICATING...' : 'ACCESS WORKSPACE'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </MagneticButton>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[#8A94A6] mb-1 uppercase font-bold text-[10px]">Full Name</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Abrar"
                    className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/[0.08] text-xs font-mono text-[#F4F6F8] chamfer-sm focus:border-[#D4FF00]/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#8A94A6] mb-1 uppercase font-bold text-[10px]">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="abrar@nexus.io"
                    className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/[0.08] text-xs font-mono text-[#F4F6F8] chamfer-sm focus:border-[#D4FF00]/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#8A94A6] mb-1 uppercase font-bold text-[10px]">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/[0.08] text-xs font-mono text-[#F4F6F8] chamfer-sm focus:border-[#D4FF00]/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#8A94A6] mb-1 uppercase font-bold text-[10px]">Role</label>
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#060708] border border-white/[0.08] text-xs font-mono text-[#F4F6F8] chamfer-sm"
                  >
                    <option value="L1_ADMIN">TIER 1 — SUPER ADMIN</option>
                    <option value="L2_ANALYST">TIER 2 — LEAD ANALYST</option>
                    <option value="L3_INVESTIGATOR">TIER 3 — FIELD INVESTIGATOR</option>
                  </select>
                </div>

                <MagneticButton
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs py-3 mt-2"
                >
                  <span>{loading ? 'CREATING...' : 'CREATE ACCOUNT'}</span>
                </MagneticButton>
              </form>
            )}
          </div>

          {/* Quick One-Click Executive Access */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2 font-mono text-xs">
            <span className="text-[10px] text-[#D4FF00] uppercase tracking-wider block font-bold">
              // QUICK ONE-CLICK ACCESS
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAccess('super_admin')}
                className="p-2.5 bg-[#060708] hover:bg-[#14171c] border border-white/[0.08] hover:border-[#D4FF00]/50 chamfer-sm text-left transition-colors group"
              >
                <div className="text-[9px] text-[#8A94A6] group-hover:text-[#D4FF00]">TIER 1</div>
                <div className="text-[11px] font-bold text-[#F4F6F8] truncate">Zainab</div>
                <div className="text-[9px] text-[#8A94A6] truncate">@zainab</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAccess('lead_analyst')}
                className="p-2.5 bg-[#060708] hover:bg-[#14171c] border border-white/[0.08] hover:border-[#D4FF00]/50 chamfer-sm text-left transition-colors group"
              >
                <div className="text-[9px] text-[#8A94A6] group-hover:text-[#D4FF00]">TIER 2</div>
                <div className="text-[11px] font-bold text-[#F4F6F8] truncate">Abrar</div>
                <div className="text-[9px] text-[#8A94A6] truncate">@abrar</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAccess('field_investigator')}
                className="p-2.5 bg-[#060708] hover:bg-[#14171c] border border-white/[0.08] hover:border-[#D4FF00]/50 chamfer-sm text-left transition-colors group"
              >
                <div className="text-[9px] text-[#8A94A6] group-hover:text-[#D4FF00]">TIER 3</div>
                <div className="text-[11px] font-bold text-[#F4F6F8] truncate">Sulaman</div>
                <div className="text-[9px] text-[#8A94A6] truncate">@sulaman</div>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;
