import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Phone, Check, X, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+923001234567');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Client-side validation rules matching backend security.py
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  const strengthCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate with backend server regex endpoint
      const validation = await api.validateSignup({
        full_name: fullName,
        email,
        password,
        phone,
      });

      if (!validation.is_valid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      // Successful registration flow -> call real register endpoint
      const regRes = await api.register({
        full_name: fullName,
        email,
        password,
        role: 'L3_INVESTIGATOR',
        phone,
      });

      if (regRes && regRes.token && regRes.user) {
        login(regRes.token, regRes.user);
        navigate('/dashboard');
        return;
      }
    } catch (err: any) {
      setErrors({ server: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8 font-mono bg-architectural">
      <GlassCard className="w-full max-w-lg p-8 space-y-6" tilt spotlight>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF4D1C]/20 border border-[#FF4D1C]/50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#FF4D1C]" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-contrast-primary">
            OFFICER <span className="font-editorial-italic font-normal lowercase text-[#FF4D1C]">Registration</span>
          </h1>
          <p className="text-xs text-contrast-secondary">
            Enlist in Nexus Sentinel Automotive Intelligence Unit
          </p>
        </div>

        {errors.server && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
            {errors.server}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">
              Full Legal Name (Letters only, 3-50 chars)
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Inspector Sulaman Tariq"
                className="w-full px-3.5 py-2.5 rounded-xl pl-9 focus:outline-none"
                required
              />
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
            {errors.full_name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.full_name}</p>}
          </div>

          <div>
            <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sulaman@nexus.io"
                className="w-full px-3.5 py-2.5 rounded-xl pl-9 focus:outline-none"
                required
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.email}</p>}
          </div>

          <div>
            <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">
              Pakistani Mobile (+923XXXXXXXXX)
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+923001234567"
                className="w-full px-3.5 py-2.5 rounded-xl pl-9 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
            {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-[10px] text-contrast-muted uppercase block mb-1 font-bold">Strong Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl pl-9 focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
            {errors.password && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.password}</p>}

            {/* Live Strength Meter */}
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 rounded-full ${
                      strengthCount >= level
                        ? strengthCount >= 4
                          ? 'bg-emerald-500'
                          : strengthCount >= 3
                          ? 'bg-amber-500'
                          : 'bg-[#FF4D1C]'
                        : 'bg-zinc-500/20'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] text-contrast-muted pt-1 font-semibold">
                <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-500' : ''}`}>
                  {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-500' : ''}`}>
                  {hasUpperCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase (A-Z)
                </span>
                <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-emerald-500' : ''}`}>
                  {hasLowerCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase (a-z)
                </span>
                <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-500' : ''}`}>
                  {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Symbol (@$!%*?&)
                </span>
              </div>
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
            `}
          >
            <span>Complete Registration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-contrast-secondary">
          Already Enrolled?{' '}
          <Link to="/login" className="text-[#FF4D1C] hover:underline font-bold">
            Sign In Here
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
