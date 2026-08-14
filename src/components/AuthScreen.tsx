import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLogin: (profile: Partial<UserProfile>) => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { signInWithGoogle } = await import('../lib/supabase');
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err?.message?.includes('provider is not enabled') || err?.message?.includes('validation_failed')) {
        setErrorMsg('Supabase Dashboard üzerinde Google İletkeni (Provider) henüz aktif edilmemiş. Lütfen Supabase Panel > Authentication > Providers > Google sekmesinden Google seçeneğini "Enabled" (Açık) konumuna getirin.');
      } else {
        setErrorMsg(err.message || 'Google ile giriş başlatılamadı.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    if (mode === 'signup' && !displayName) {
      setErrorMsg('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { signInWithEmail, signUpWithEmail } = await import('../lib/supabase');

      if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, displayName);
        if (res.user) {
          setSuccessMsg('Hesabınız oluşturuldu! Oturum açılıyor...');
          setTimeout(() => {
            onLogin({
              id: res.user?.id,
              email: email,
              displayName: displayName,
              username: email.split('@')[0],
              isLoggedIn: true,
            });
          }, 800);
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.user) {
          onLogin({
            id: res.user.id,
            email: res.user.email || email,
            displayName: res.user.user_metadata?.display_name || email.split('@')[0],
            username: res.user.user_metadata?.username || email.split('@')[0],
            isLoggedIn: true,
          });
        }
      }
    } catch (err: any) {
      console.error('Email Auth error:', err);
      setErrorMsg(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0D0D0E] rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              GearList <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">2026 Pro</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <div className="p-7 sm:p-8 rounded-3xl bg-[#161618]/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Welcome Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Supabase PostgreSQL Veritabanı
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {mode === 'login' ? 'Hesabınıza Giriş Yapın' : 'Yeni Hesabınızı Oluşturun'}
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Anime, dizi, film ve müzik kütüphanenizi güvenle veritabanında saklayın.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0D0D0E] border border-white/10 text-xs font-bold">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setMode('signup'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition ${mode === 'signup' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Kayıt Ol
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Google ile Devam Et</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase font-mono">veya e-posta</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Ad Soyad</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0D0E] border border-white/10 text-xs text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400">E-posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0D0E] border border-white/10 text-xs text-white outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400">Şifre</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0D0E] border border-white/10 text-xs text-white outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>GearList Pro • Gerçek API & Supabase Veritabanı Entegrasyonu</span>
        </div>
      </footer>
    </div>
  );
};
