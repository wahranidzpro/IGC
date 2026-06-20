'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PinUser } from '@/lib/db/dexie-db';
import { useAuth, createUserInCloud, updateUserInCloud, deleteUserFromCloud } from '@/lib/auth/context';
import { logAudit } from '@/lib/audit';
import { Shield, Plus, X, Lock, Unlock, Trash2, Edit, Search } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function AccessSettingsPage() {
  const { user: currentUser, role: currentRole } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<PinUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    pin: '',
    name: '',
    role: 'admin' as 'admin' | 'reception' | 'coach' | 'adherent',
    phone: '',
    coachId: undefined as number | undefined,
  });

  const pinUsers = useLiveQuery(() => db.pinUsers.toArray(), []);
  const members = useLiveQuery(() => db.members.toArray(), []);
  const coaches = useLiveQuery(() => db.coaches.toArray(), []);

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, username: value, phone: value });
    
    if (value.length >= 10) {
      const member = members?.find(m => m.phone === value);
      if (member) {
        setFormData(prev => ({ ...prev, username: value, phone: value, name: `${member.firstName} ${member.lastName}` }));
      }
    }
  };

  const handleAddPinUser = async () => {
    if (!formData.username || !formData.name || !formData.password) {
      return;
    }

    setLoading(true);
    try {
      await db.pinUsers.add({
        username: formData.username,
        password: formData.password,
        pin: formData.pin || '0000',
        name: formData.name,
        role: formData.role,
        phone: formData.username,
        coachId: formData.role === 'coach' ? formData.coachId : undefined,
        isLocked: false,
        createdAt: new Date(),
      });

      await createUserInCloud({
        username: formData.username,
        password: formData.password,
        pin: formData.pin || '0000',
        role: formData.role,
        name: formData.name,
        phone: formData.username,
      });

      logAudit({ action: 'access_user_create', newValue: formData.username }, (currentUser as { username?: string })?.username || 'unknown', currentRole || 'unknown');
      logger.info(`User created: ${formData.username}`);
    } catch (err) {
      logger.error('Failed to create user:', err);
    } finally {
      setLoading(false);
    }

    setFormData({ username: '', password: '', pin: '', name: '', role: 'admin', phone: '', coachId: undefined });
    setShowAddModal(false);
    setEditUser(null);
    setShowAddModal(false);
  };

  const handleDeletePinUser = async (id: number, username: string) => {
    await db.pinUsers.delete(id);
    logAudit({ action: 'access_user_delete', newValue: username }, (currentUser as { username?: string })?.username || 'unknown', currentRole || 'unknown');
    try { await deleteUserFromCloud(username); } catch {}
  };

  const handleToggleLock = async (pinUser: PinUser) => {
    const newLocked = !pinUser.isLocked;
    await db.pinUsers.update(pinUser.id!, { isLocked: newLocked });
    logAudit({ action: 'access_user_lock', newValue: `${pinUser.username} → ${newLocked ? 'verrouillé' : 'déverrouillé'}` }, (currentUser as { username?: string })?.username || 'unknown', currentRole || 'unknown');
    try { await updateUserInCloud({ username: pinUser.username, is_locked: newLocked }); } catch {}
  };

  const openEditUser = (user: PinUser) => {
    setFormData({ username: user.username, password: user.password, pin: user.pin, name: user.name, role: user.role as 'admin' | 'reception' | 'coach' | 'adherent', phone: user.phone || '', coachId: user.coachId });
    setEditUser(user);
    setShowAddModal(true);
  };

  const handleEditPinUser = async () => {
    if (!formData.username || !formData.name || !formData.password || !editUser?.id) return;

    setLoading(true);
    try {
      await db.pinUsers.update(editUser.id, {
        username: formData.username,
        password: formData.password,
        pin: formData.pin || '0000',
        name: formData.name,
        role: formData.role,
        phone: formData.username,
        coachId: formData.role === 'coach' ? formData.coachId : undefined,
      });

      await updateUserInCloud({
        username: editUser.username,
        password: formData.password,
        pin: formData.pin || '0000',
        role: formData.role,
        name: formData.name,
        phone: formData.username,
      });

      logAudit({ action: 'access_user_edit', newValue: formData.username }, (currentUser as { username?: string })?.username || 'unknown', currentRole || 'unknown');
      logger.info(`User updated: ${formData.username}`);
    } catch (err) {
      logger.error('Failed to update user:', err);
    } finally {
      setLoading(false);
    }

    setFormData({ username: '', password: '', pin: '', name: '', role: 'admin', phone: '', coachId: undefined });
    setEditUser(null);
    setShowAddModal(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'reception': return 'Réception';
      case 'coach': return 'Coach';
      case 'adherent': return 'Adhérent';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'reception': return 'bg-yellow-500/20 text-yellow-400';
      case 'coach': return 'bg-blue-500/20 text-blue-400';
      case 'adherent': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredUsers = pinUsers?.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.pin?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Acces</h2>
          <p className="text-gray-400 mt-1">Gerer les utilisateurs, identifiants et roles</p>
        </div>
<div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            <Plus className="w-5 h-5" />
          Nouvel Utilisateur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-2xl font-bold text-white">{pinUsers?.filter(p => p.role === 'admin').length || 0}</span>
          </div>
          <p className="text-gray-400">Administrateurs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-white">{pinUsers?.filter(p => p.role === 'reception').length || 0}</span>
          </div>
          <p className="text-gray-400">Réception</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">{pinUsers?.filter(p => p.role === 'coach').length || 0}</span>
          </div>
          <p className="text-gray-400">Coachs</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom ou identifiant..."
          className="w-full h-12 pl-12 pr-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Nom</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Identifiant</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Rôle</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Statut</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                <td className="px-6 py-4">
                  <code className="px-3 py-1 bg-gray-800 rounded-lg text-orange-400 font-mono">{user.username}</code>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleLock(user)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                      user.isLocked 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {user.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    {user.isLocked ? 'Verrouillé' : 'Actif'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEditUser(user)}
                    className="p-2 text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                    <button
                    onClick={() => user.id && user.username && handleDeletePinUser(user.id, user.username)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editUser ? 'Modifier Utilisateur' : 'Nouveau Utilisateur'}</h3>
              <button
                onClick={() => { setShowAddModal(false); setEditUser(null); setFormData({ username: '', password: '', pin: '', name: '', role: 'admin', phone: '', coachId: undefined }); }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Téléphone (Nom d&apos;utilisateur)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    placeholder="06XXXXXXXX"
                  />
                  {formData.username.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {members?.find(m => m.phone === formData.username) ? (
                        <span className="text-xs text-green-400">✓ Membre trouvé</span>
                      ) : (
                        <span className="text-xs text-gray-500">Nouveau</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Entrez le numéro - le nom se remplit automatiquement si membre existant</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  placeholder="Nom de l'utilisateur"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'reception' | 'coach' | 'adherent' })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="adherent">Adhérent</option>
                    <option value="reception">Réception</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">PIN (4 chiffres)</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    placeholder="0000"
                    maxLength={4}
                  />
                </div>
              </div>
              
              {formData.role === 'coach' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Coach associé</label>
                  <select
                    value={formData.coachId ?? ''}
                    onChange={(e) => setFormData({ ...formData, coachId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Sélectionner un coach --</option>
                    {coaches?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Associer ce compte utilisateur à un coach de la liste</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mot de passe</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  placeholder="Mot de passe requis"
                />
              </div>
            </div>

            <button
              onClick={editUser ? handleEditPinUser : handleAddPinUser}
              disabled={!formData.username || !formData.name || !formData.password || loading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : (editUser ? 'Enregistrer les modifications' : "Créer l'utilisateur")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}