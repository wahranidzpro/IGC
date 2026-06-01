'use client';

import { useState } from 'react';
import { Printer, Shield, Check, Copy, Eye, EyeOff } from 'lucide-react';

interface RecoveryCardProps {
  username: string;
  password: string;
  pin: string;
  recoveryCode: string;
  onConfirm: () => void;
}

export default function RecoveryCard({ username, password, pin, recoveryCode, onConfirm }: RecoveryCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Infinity Gym - Carte de Recuperation</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
            .content { border: 2px solid #f97316; border-top: none; padding: 20px; border-radius: 0 0 12px 12px; }
            .section { margin-bottom: 20px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .value { font-size: 18px; font-weight: bold; color: #333; padding: 10px; background: #f5f5f5; border-radius: 8px; }
            .recovery { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; }
            .recovery .value { font-family: monospace; font-size: 20px; letter-spacing: 2px; color: #ea580c; background: white; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 8px; font-size: 12px; color: #721c24; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Infinity Gym</h1>
            <p>Carte de Recuperation - Admin</p>
          </div>
          <div class="content">
            <div class="section">
              <div class="label">Identifiant</div>
              <div class="value">${username}</div>
            </div>
            <div class="section">
              <div class="label">Mot de passe</div>
              <div class="value">${password}</div>
            </div>
            <div class="section">
              <div class="label">PIN (4 chiffres)</div>
              <div class="value">${pin}</div>
            </div>
            <div class="section recovery">
              <div class="label">Code de Recuperation d'Urgence</div>
              <div class="value">${recoveryCode}</div>
            </div>
            <div class="warning">
              <strong>IMPORTANT :</strong> Gardez cette carte en lieu sur. Ne la partagez avec personne.
              Le code de recuperation est necessaire pour reinitialiser votre mot de passe en cas d'oubli.
            </div>
          </div>
          <div class="footer">
            <p>Genere le ${new Date().toLocaleDateString('fr-FR')} - Infinity Gym Management System</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Informations Sauvegardees</h2>
          <p className="text-gray-400 mb-6">
            Vos identifiants ont ete enregistres. Conservez la carte imprimee en lieu sur.
          </p>
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all"
          >
            Acceder a l'application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Bienvenue - Infinity Gym</h2>
              <p className="text-orange-100 text-sm">Premiere configuration - IMPRIMEZ cette carte</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400">
              <strong>Important :</strong> Imprimez cette carte et gardez-la en lieu sur.
              Ces informations ne seront affichees qu'une seule fois.
            </p>
          </div>

          {/* Credentials */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Identifiant</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-semibold">
                  {username}
                </div>
                <button
                  onClick={() => copyToClipboard(username, 'username')}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {copied === 'username' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Mot de passe</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono">
                  {showPassword ? password : '••••••••'}
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
                <button
                  onClick={() => copyToClipboard(password, 'password')}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {copied === 'password' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">PIN (4 chiffres)</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-center text-xl tracking-widest">
                  {showPin ? pin : '••••'}
                </div>
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {showPin ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
                <button
                  onClick={() => copyToClipboard(pin, 'pin')}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {copied === 'pin' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Recovery Code */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <label className="block text-xs font-medium text-orange-400 mb-2">Code de Recuperation d'Urgence</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-800 border border-orange-500/50 rounded-xl text-orange-400 font-mono text-lg tracking-wider text-center">
                  {showRecovery ? recoveryCode : '••••-••••-••••-••••'}
                </div>
                <button
                  onClick={() => setShowRecovery(!showRecovery)}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {showRecovery ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
                <button
                  onClick={() => copyToClipboard(recoveryCode, 'recovery')}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  {copied === 'recovery' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              <p className="text-xs text-orange-400/70 mt-2">
                Utilisez ce code si vous oubliez votre mot de passe
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
            <button
              onClick={() => setConfirmed(true)}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              J'ai sauvegarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
