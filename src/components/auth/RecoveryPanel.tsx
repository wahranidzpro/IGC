'use client';

import { useState } from 'react';
import { performAdminRecovery, validateRecoveryAttempt, unlockAccountWithRecovery } from '@/lib/db/dexie-db';
import { Shield, X, Eye, EyeOff, AlertTriangle, CheckCircle, Lock, UserCheck, Key } from 'lucide-react';

interface RecoveryPanelProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecoveryPanel({ onClose, onSuccess }: RecoveryPanelProps) {
  const [mode, setMode] = useState<'reset' | 'unlock'>('reset');
  const [step, setStep] = useState<'info' | 'code' | 'success' | 'error'>('info');
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(3);

  const handleVerifyCode = async () => {
    if (!username.trim()) {
      setError('Entrez votre nom d\'utilisateur');
      return;
    }
    if (!recoveryCode.trim()) {
      setError('Entrez le code de recuperation');
      return;
    }

    setLoading(true);
    setError('');

    const validation = await validateRecoveryAttempt();
    setAttempts(validation.remaining);

    if (!validation.allowed) {
      setError(`Trop de tentatives. Reessayez dans ${Math.ceil((validation.lockedUntil - Date.now()) / 60000)} minutes.`);
      setLoading(false);
      return;
    }

    if (mode === 'unlock') {
      const result = await unlockAccountWithRecovery(username.trim(), recoveryCode);
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Erreur lors du deblocage');
        setStep('error');
      }
    } else {
      setStep('code');
    }

    setLoading(false);
  };

  const handleReset = async () => {
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('Le PIN doit contenir exactement 4 chiffres');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Les PINs ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    const result = await performAdminRecovery(recoveryCode, newPassword, newPin);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Erreur lors de la recuperation');
      setStep('error');
    }

    setLoading(false);
  };

  const handleSuccess = () => {
    setUsername('');
    setRecoveryCode('');
    setNewPassword('');
    setConfirmPassword('');
    setNewPin('');
    setConfirmPin('');
    setStep('info');
    setError('');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Mot de passe oublie</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-gray-800 p-1">
          <button
            onClick={() => { setMode('reset'); setError(''); setStep('info'); }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              mode === 'reset'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-1" />
            Nouveau mot de passe
          </button>
          <button
            onClick={() => { setMode('unlock'); setError(''); setStep('info'); }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              mode === 'unlock'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-1" />
            Debloquer compte
          </button>
        </div>

        <div className="p-6">
          {step === 'info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-400">
                  Entrez votre nom d&apos;utilisateur et le code de recuperation (sur votre carte imprimee).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nom d&apos;utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, reception, coach..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Code de recuperation
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono tracking-wider text-center text-lg focus:outline-none focus:border-orange-500"
                  maxLength={19}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {attempts} tentative(s) restante(s)
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  {error}
                </p>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Verifier
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'reset' && step === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-400">
                  Code valide. Crez votre nouveau mot de passe.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caracteres"
                    className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nouveau PIN (4 chiffres)
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirmer le PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Retapez le PIN"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:border-orange-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {mode === 'unlock' ? 'Compte debloque' : 'Mot de passe mis a jour'}
              </h3>
              <p className="text-sm text-gray-400">
                {mode === 'unlock'
                  ? `Le compte ${username} a ete debloque avec succes.`
                  : 'Votre mot de passe et PIN ont ete mis a jour.'}
              </p>
              <button
                onClick={handleSuccess}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
              >
                Retour a la connexion
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Erreur</h3>
              <p className="text-sm text-gray-400">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Reessayer
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
