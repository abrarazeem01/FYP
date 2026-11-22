import React, { useState } from 'react';
import {
  Shield,
  QrCode,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Eye,
  RefreshCw,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SectionHeading } from '../components/SectionHeading';
import { MagneticButton } from '../components/MagneticButton';
import { LiveEqualizerBar } from '../components/LiveEqualizerBar';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isCursorTrailEnabled, toggleCursorTrail } = useTheme();

  const [totpData, setTotpData] = useState<{
    secret: string;
    provisioning_uri: string;
    qr_code_base64: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleSetup2FA = async () => {
    if (!user?.email) return;
    setLoading2FA(true);
    setVerifyError('');
    try {
      const data = await api.setup2FA(user.email);
      setTotpData(data);
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to initiate 2FA setup.');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpData || !totpCode.trim()) return;

    setLoading2FA(true);
    setVerifyError('');
    try {
      await api.verify2FA(totpData.secret, totpCode.trim(), user?.id);
      setVerifySuccess(true);
      updateUser({ is_2fa_enabled: true });
    } catch (err: any) {
      setVerifyError(err.message || 'Invalid or expired 6-digit TOTP code.');
    } finally {
      setLoading2FA(false);
    }
  };

  const displayName = user?.full_name?.replace(/^(Madam|Mr\.|Ms\.|Officer)\s+/i, '') || 'Abrar';
  const handle = user?.email ? `@${user.email.split('@')[0]}` : '@abrar';

  return (
    <div className="relative min-h-screen space-y-6 pb-16">
      
      {/* 1. Header with Equalizer */}
      <SectionHeading
        tag="SETTINGS_08"
        title="USER PROFILE & SECURITY"
        subtitle="Manage cryptographic credentials, 2-factor TOTP authentication, and kinetic rendering physics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Profile & Credentials */}
        <div className="p-6 bg-[#0d0f12]/95 backdrop-blur-md border border-white/[0.08] chamfer-md bracket-box space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#D4FF00] uppercase font-bold">
                // USER_PROFILE
              </span>
              <LiveEqualizerBar color="#D4FF00" />
            </div>
            <User className="w-4 h-4 text-[#D4FF00]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[#8A94A6] block text-[10px] uppercase font-bold">NAME & HANDLE</span>
              <span className="text-base font-bold text-[#F4F6F8] font-sans">
                {displayName} <span className="text-xs font-mono text-[#D4FF00] ml-1">{handle}</span>
              </span>
            </div>
            <div>
              <span className="text-[#8A94A6] block text-[10px] uppercase font-bold">EMAIL ADDRESS</span>
              <span className="text-[#F4F6F8]">{user?.email}</span>
            </div>
            <div>
              <span className="text-[#8A94A6] block text-[10px] uppercase font-bold">ACCESS TIER</span>
              <span className="text-[#D4FF00] font-bold uppercase">
                TIER {user?.hierarchy_level} ({user?.role?.replace('_', ' ')})
              </span>
            </div>
            <div>
              <span className="text-[#8A94A6] block text-[10px] uppercase font-bold">2FA ENFORCEMENT</span>
              <span className={user?.is_2fa_enabled ? 'text-[#D4FF00] font-bold' : 'text-amber-400 font-bold'}>
                {user?.is_2fa_enabled ? 'ENFORCED' : 'NOT ENROLLED'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Factor Authentication Setup */}
        <div className="p-6 bg-[#0d0f12]/95 backdrop-blur-md border border-white/[0.08] chamfer-md bracket-box space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#FF2A4B] uppercase font-bold">
                // TOTP_SECURITY
              </span>
              <Smartphone className="w-4 h-4 text-[#FF2A4B]" />
            </div>
            <span className="font-mono text-[10px] text-[#D4FF00] font-bold">SHA-256</span>
          </div>

          <p className="font-sans text-xs text-[#8A94A6] leading-relaxed">
            Protect workspace actions using standard TOTP hardware/software authenticators (Google Authenticator, YubiKey).
          </p>

          {!totpData ? (
            <div className="pt-2">
              <MagneticButton
                variant="primary"
                onClick={handleSetup2FA}
                disabled={loading2FA}
                className="text-xs"
              >
                {loading2FA ? 'GENERATING SECRET...' : 'ENROLL 2FA AUTHENTICATOR'}
              </MagneticButton>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-[#060708] border border-white/[0.08] chamfer-sm text-center">
                <img
                  src={`data:image/png;base64,${totpData.qr_code_base64}`}
                  alt="2FA QR Code"
                  className="w-36 h-36 mx-auto mb-2 border border-white/20 p-1 bg-white"
                />
                <span className="font-mono text-[10px] text-[#8A94A6] block break-all">
                  KEY: {totpData.secret}
                </span>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-2 font-mono text-xs">
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 bg-[#060708] border border-white/[0.08] chamfer-sm text-[#F4F6F8] text-center tracking-widest text-lg font-bold"
                  required
                />
                <MagneticButton
                  variant="primary"
                  type="submit"
                  disabled={loading2FA}
                  className="w-full text-xs"
                >
                  {loading2FA ? 'VERIFYING...' : 'VERIFY & ACTIVATE'}
                </MagneticButton>
              </form>
            </div>
          )}

          {verifySuccess && (
            <div className="p-3 bg-[#D4FF00]/15 border border-[#D4FF00]/30 text-xs font-mono text-[#D4FF00] chamfer-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4FF00]" />
              <span>Two-Factor Authentication is active and enforced.</span>
            </div>
          )}

          {verifyError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 text-xs font-mono text-red-400 chamfer-sm">
              {verifyError}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SettingsPage;
