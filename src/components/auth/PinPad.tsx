'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/context/language-context';
import { Lock, Eye, EyeOff, AlertCircle, User, KeyRound, Phone, Mail, Globe } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';

type LoginMode = 'admin' | 'adherent';

interface ClubInfo {
  name: string;
  phone: string;
  email: string;
  website: string;
}

interface PinPadProps {
  onForgotPassword?: () => void;
}

export function PinPad({ onForgotPassword }: PinPadProps) {
  const { login, loginAsAdherent } = useAuth();
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<LoginMode>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animateTab, setAnimateTab] = useState(false);

  const clubInfo = useLiveQuery<ClubInfo>(async () => {
    const nameSetting = await db.settings.where('key').equals('gym_name').first();
    const phoneSetting = await db.settings.where('key').equals('gym_phone').first();
    const emailSetting = await db.settings.where('key').equals('gym_email').first();
    const websiteSetting = await db.settings.where('key').equals('gym_website').first();
    return {
      name: (nameSetting?.value as string) || 'Infinity Gym Center',
      phone: (phoneSetting?.value as string) || '+213 6XX XXX XXX',
      email: (emailSetting?.value as string) || 'infinity.gym.ig@gmail.com',
      website: (websiteSetting?.value as string) || 'www.infinitygym.dz',
    };
  }, []);

  useEffect(() => {
    setAnimateTab(true);
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username.trim(), password, 'admin');
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Identifiants invalides');
    }
  };

  const handleAdherentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }
    setLoading(true);
    setError('');
    const result = await loginAsAdherent(phone, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Numéro ou mot de passe invalide');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #e94560 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #e94560 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Gradient Orbes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/30 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-orange-600/20 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

      {/* Header Logo */}
      <div className="relative z-10 pt-8 pb-4 text-center">
        <h1 className="text-5xl font-bold text-white tracking-[0.2em] drop-shadow-2xl" style={{
          fontFamily: '"Rajdhani", "Montserrat", sans-serif',
          fontWeight: 800,
          textShadow: '0 0 60px rgba(234, 88, 12, 0.6), 0 6px 12px rgba(0,0,0,0.5)',
          letterSpacing: '0.15em'
        }}>{clubInfo?.name || t('gym.name')}</h1>
      </div>

      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
        <img 
          src="/logo-transparent.png" 
          alt="" 
          className="w-[600px] h-[600px] object-contain"
        />
      </div>

      {/* Card Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Mode Tabs */}
          <div className="flex bg-black/20 backdrop-blur-sm rounded-2xl p-1.5 mb-6">
            <button
              type="button"
              onClick={() => { setMode('admin'); setError(''); setAnimateTab(false); setTimeout(() => setAnimateTab(true), 10); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                mode === 'admin' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              🛡️ Administrateur
            </button>
            <button
              type="button"
              onClick={() => { setMode('adherent'); setError(''); setAnimateTab(false); setTimeout(() => setAnimateTab(true), 10); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                mode === 'adherent' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              🏋️ Adhérent
            </button>
          </div>

          {/* Form Card - Plus transparent pour voir le logo */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-8 border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">
                  {mode === 'admin' ? 'Connexion Staff' : 'Connexion Adhérent'}
                </h2>
                <p className="text-white/50 text-xs">
                  {mode === 'admin' ? 'Accédez au tableau de bord' : 'Accédez à votre espace'}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-5 p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {mode === 'admin' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 text-white/70">Nom d&apos;utilisateur</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError(''); }}
                      className="w-full h-14 pl-12 pr-4 text-white bg-white/5 border border-white/10 rounded-2xl outline-none transition-all duration-200 placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/10"
                      placeholder="admin"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2 text-white/70">Mot de passe</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full h-14 pl-12 pr-14 text-white bg-white/5 border border-white/10 rounded-2xl outline-none transition-all duration-200 placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/10"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!username.trim() || !password || loading}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base tracking-wide hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connexion...
                    </>
                  ) : (
                    <>Se connecter →</>
                  )}
                </button>

                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="w-full py-3 text-white/60 hover:text-orange-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Mot de passe oublie?
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleAdherentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 text-white/70">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setError(''); }}
                      className="w-full h-14 pl-12 pr-4 text-white bg-white/5 border border-white/10 rounded-2xl outline-none transition-all duration-200 placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/10"
                      placeholder="05 XX XX XX XX"
                      inputMode="tel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2 text-white/70">
                    <KeyRound className="inline w-4 h-4 mr-1" />
                    Mot de passe
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full h-14 pl-12 pr-14 text-white bg-white/5 border border-white/10 rounded-2xl outline-none transition-all duration-200 placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/10"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!phone || phone.length < 8 || loading}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base tracking-wide hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Vérification...
                    </>
                  ) : (
                    <>Accéder à mon espace →</>
                  )}
                </button>

                <div className="mt-4 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <p className="text-amber-400/80 text-xs text-center leading-relaxed">
                    <strong>⚠️ Pas encore inscrit ?</strong><br/>
                    Veuillez vous rapprocher de l&apos;administration du club pour créer votre compte adhérent.
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-4 text-white/40 text-xs mb-3">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {clubInfo?.phone || '+213 6XX XXX XXX'}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {clubInfo?.email || 'infinity.gym.ig@gmail.com'}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {clubInfo?.website || 'www.infinitygym.dz'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-white/20 text-xs">
              © <span className="text-white/60 font-medium">{clubInfo?.name || 'Infinity Gym Center'}</span> — Tous droits réservés
            </p>
            <p className="text-white/15 text-xs mt-1">
              Designed &amp; Developed by <span className="text-white/40 font-medium">WahraniDev Pro</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}