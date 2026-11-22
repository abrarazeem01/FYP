import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../context/ThemeContext';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 font-mono bg-architectural">
      <GlassCard className="w-full max-w-md p-8 space-y-6" tilt spotlight>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF4D1C]/20 border border-[#FF4D1C]/50 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#FF4D1C]" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-contrast-primary">
            RESET <span className="font-editorial-italic font-normal lowercase text-[#FF4D1C]">Credentials</span>
          </h1>
          <p className="text-xs text-contrast-secondary">
            Establish new strong credentials for Nexus Sentinel access
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Credentials updated successfully. Redirecting to login...</span>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">
                Security Reset Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token received via email"
                className="w-full px-3.5 py-2.5 rounded-xl font-mono focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">
                New Strong Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl font-mono focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl font-mono focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className={`
                w-full py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all select-none
                ${
                  theme === 'dark'
                    ? 'bg-[#FF4D1C] hover:bg-[#E63908] text-white shadow-glow-vermilion'
                    : 'bg-[#FF4D1C] hover:bg-[#E63908] text-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]'
                }
              `}
            >
              <span>Commit Credentials</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-contrast-secondary">
          <Link to="/login" className="hover:text-[#FF4D1C] font-semibold transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
