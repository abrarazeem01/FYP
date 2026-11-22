import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../context/ThemeContext';

export const ForgotPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 font-mono bg-architectural">
      <GlassCard className="w-full max-w-md p-8 space-y-6" tilt spotlight>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF4D1C]/20 border border-[#FF4D1C]/50 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#FF4D1C]" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-contrast-primary">
            ACCOUNT <span className="font-editorial-italic font-normal lowercase text-[#FF4D1C]">Recovery</span>
          </h1>
          <p className="text-xs text-contrast-secondary">
            Send password recovery dispatch to authenticated government mailbox
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>RECOVERY DISPATCH SENT</span>
            </div>
            <p className="leading-relaxed">
              If an active officer profile matches <strong>{email}</strong>, a secure reset token has been dispatched.
            </p>
            <Link
              to="/reset-password"
              className="inline-block mt-2 font-bold text-[#FF4D1C] hover:underline"
            >
              Proceed to Enter Token →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@nexus.io"
                  className="w-full px-3.5 py-2.5 rounded-xl pl-9 focus:outline-none"
                  required
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all select-none
                ${
                  theme === 'dark'
                    ? 'bg-[#FF4D1C] hover:bg-[#E63908] text-white shadow-glow-vermilion'
                    : 'bg-[#FF4D1C] hover:bg-[#E63908] text-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]'
                }
                disabled:opacity-50
              `}
            >
              <span>{loading ? 'Dispatching...' : 'Send Recovery Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-contrast-secondary">
          <Link to="/login" className="hover:text-[#FF4D1C] flex items-center justify-center gap-1 font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
