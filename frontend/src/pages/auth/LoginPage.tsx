import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { Scissors, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, Sparkles, User, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settings] = useState({ salonName: 'CUT&STYLE', businessName: 'SALON & SPA' });

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && role && !authLoading) {
      if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'WORKER') {
        navigate('/worker/billing', { replace: true });
      }
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid email or password.');
        toast.error(result.error || 'Invalid email or password.');
        return;
      }

      toast.success('Login successful!');

      // Check if user navigated here from a protected route
      const destination = location.state?.from?.pathname;
      if (destination && destination !== '/login') {
        navigate(destination, { replace: true });
      } else if (result.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/worker/billing', { replace: true });
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoAccounts = authService.getDemoCredentials();

  return (
    <div className="min-h-screen bg-[#090a0d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#c5a880]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#13141a]/95 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Development Mode Indicator Badge */}
        <div className="flex items-center justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Development Mode (Mock Auth)
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#c5a880] to-[#846356] text-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#c5a880]/20">
            <Scissors className="w-7 h-7 transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
            {settings.salonName.substring(0, 3)}<span className="text-[#c5a880]">&</span>{settings.salonName.substring(4) || 'STYLE'}
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-400 mt-1 font-medium">
            {settings.businessName}
          </p>
        </div>

        {/* Quick-Fill Demo Credentials Helper */}
        <div className="mb-6 bg-[#181a22] border border-white/10 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Demo Accounts</span>
            <span className="text-[10px] text-gray-400 font-normal">Click to auto-fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickFill(acc.email, acc.password)}
                className={`p-2.5 rounded-xl border text-left transition-all group ${
                  acc.role === 'ADMIN'
                    ? 'bg-purple-950/20 border-purple-500/30 hover:bg-purple-900/40 hover:border-purple-400/50'
                    : 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-400/50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-0.5">
                  {acc.role === 'ADMIN' ? (
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {acc.role === 'ADMIN' ? 'Demo Admin' : 'Demo Worker'}
                </div>
                <div className="text-[10px] text-gray-400 font-mono truncate">{acc.email}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">Pass: {acc.password}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5" htmlFor="email-input">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                id="email-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cutandstyle.com"
                disabled={isSubmitting}
                className="w-full bg-[#1b1d26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5" htmlFor="password-input">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full bg-[#1b1d26] border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#c5a880] text-black font-semibold text-sm hover:bg-[#d6be9a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c5a880]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-[11px] text-gray-500">
          {settings.salonName} {settings.businessName} Management System
        </div>
      </div>
    </div>
  );
};
