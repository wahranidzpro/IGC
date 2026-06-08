'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, GymEvent, EventRegistration } from '@/lib/db/dexie-db';
import { Calendar, Users, DollarSign, Trophy, Plus, MapPin, Clock, X, Edit3, Trash2, UserPlus, CheckCircle, Search, AlertTriangle } from 'lucide-react';

type EventFormData = {
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  price: number;
  maxParticipants: number;
};

const INITIAL_FORM: EventFormData = {
  name: '',
  type: 'competition',
  date: '',
  time: '',
  location: '',
  description: '',
  price: 0,
  maxParticipants: 30,
};

const TYPE_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  competition: 'Compétition',
  social: 'Social',
  workshop: 'Workshop',
};

const TYPE_COLORS: Record<string, string> = {
  coaching: 'bg-purple-500/20 text-purple-400',
  competition: 'bg-red-500/20 text-red-400',
  social: 'bg-green-500/20 text-green-400',
  workshop: 'bg-blue-500/20 text-blue-400',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  full: 'Complet',
  soon: 'Bientôt',
  completed: 'Terminé',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400',
  full: 'bg-red-500/20 text-red-400',
  soon: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-gray-500/20 text-gray-400',
};

function formatDateTime(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: '' };
    const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return { date, time: time !== '00:00' ? time : '' };
  } catch {
    return { date: dateStr, time: '' };
  }
}

function toDatetimeString(date: string, time: string): string {
  if (!date) return '';
  if (!time) return date;
  return `${date}T${time}`;
}

function parseFormFromEvent(event: GymEvent | null): EventFormData {
  if (!event) return { ...INITIAL_FORM };
  const { date, time } = splitDateTime(event.date);
  return {
    name: event.name || '',
    type: event.type || 'competition',
    date,
    time,
    location: event.location || '',
    description: event.description || '',
    price: event.price || 0,
    maxParticipants: event.maxParticipants || 30,
  };
}

function splitDateTime(dateStr: string): { date: string; time: string } {
  if (!dateStr) return { date: '', time: '' };
  if (dateStr.includes('T')) {
    const [date, time] = dateStr.split('T');
    return { date, time: time?.substring(0, 5) || '' };
  }
  return { date: dateStr, time: '' };
}

export default function EventsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<GymEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [registerEventId, setRegisterEventId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GymEvent | null>(null);
  const [registerMemberId, setRegisterMemberId] = useState('');
  const [registerMemberName, setRegisterMemberName] = useState('');
  const [searchMember, setSearchMember] = useState('');

  const events = useLiveQuery(() => db.events.orderBy('date').toArray(), []) || [];
  const registrations = useLiveQuery(() => db.eventRegistrations.toArray(), []) || [];
  const members = useLiveQuery(() => db.members.toArray(), []) || [];

  const now = useMemo(() => new Date(), []);

  const upcomingEvents = useMemo(
    () => events.filter(e => new Date(e.date) >= now || e.status === 'open' || e.status === 'soon' || e.status === 'full'),
    [events, now]
  );
  const pastEvents = useMemo(
    () => events.filter(e => new Date(e.date) < now && e.status !== 'open' && e.status !== 'soon' && e.status !== 'full'),
    [events, now]
  );

  const totalRevenue = useMemo(
    () => registrations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + r.amountPaid, 0),
    [registrations]
  );
  const totalParticipants = useMemo(
    () => registrations.filter(r => r.status !== 'cancelled').length,
    [registrations]
  );
  const competitionCount = useMemo(
    () => events.filter(e => e.type === 'competition' || e.type === 'tournament').length,
    [events]
  );

  const eventRegistrations = useCallback((eventId: number) => registrations.filter(r => r.eventId === eventId), [registrations]);

  const filteredMembers = useMemo(
    () =>
      searchMember
        ? members.filter(
            m =>
              `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchMember.toLowerCase()) ||
              m.phone.includes(searchMember)
          )
        : [],
    [members, searchMember]
  );

  const handleCreate = useCallback(async (form: EventFormData) => {
    const now = new Date();
    await db.events.add({
      name: form.name,
      type: form.type as GymEvent['type'],
      date: toDatetimeString(form.date, form.time),
      price: form.price,
      location: form.location,
      maxParticipants: form.maxParticipants,
      participants: 0,
      status: 'open',
      description: form.description,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    } as GymEvent);
    setShowModal(false);
  }, []);

  const handleUpdate = useCallback(async (id: number, form: EventFormData) => {
    const now = new Date();
    await db.events.update(id, {
      name: form.name,
      type: form.type as GymEvent['type'],
      date: toDatetimeString(form.date, form.time),
      price: form.price,
      location: form.location,
      maxParticipants: form.maxParticipants,
      description: form.description,
      updatedAt: now,
      syncStatus: 'pending',
    });
    setShowModal(false);
    setEditEvent(null);
  }, []);

  const handleDelete = useCallback(async (event: GymEvent) => {
    await db.events.delete(event.id!);
    await db.eventRegistrations.where('eventId').equals(event.id!).delete();
    setDeleteConfirm(null);
  }, []);

  const handleRegister = useCallback(
    async (eventId: number) => {
      const mid = parseInt(registerMemberId);
      if (!mid) return;
      const member = members.find(m => m.id === mid);
      const event = events.find(e => e.id === eventId);
      if (!member || !event) return;

      const name = `${member.firstName} ${member.lastName}`;
      await db.eventRegistrations.add({
        eventId,
        eventName: event.name,
        memberId: mid,
        memberName: name,
        amountPaid: event.price,
        status: 'registered',
        registeredAt: new Date(),
        createdAt: new Date(),
        syncStatus: 'pending',
      } as EventRegistration);

      const newCount = (event.participants || 0) + 1;
      const updates: Record<string, any> = { participants: newCount, syncStatus: 'pending' };
      if (newCount >= (event.maxParticipants || 999)) {
        updates.status = 'full';
      }
      await db.events.update(eventId, updates);

      setRegisterEventId(null);
      setRegisterMemberId('');
      setRegisterMemberName('');
      setSearchMember('');
    },
    [members, events, registerMemberId]
  );

  const handleCheckin = useCallback(async (regId: number) => {
    await db.eventRegistrations.update(regId, { status: 'checked_in', checkedInAt: new Date(), syncStatus: 'pending' });
  }, []);

  const openCreate = () => {
    setEditEvent(null);
    setShowModal(true);
  };

  const openEdit = (event: GymEvent) => {
    setEditEvent(event);
    setShowModal(true);
  };

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Événements</h2>
          <p className="text-gray-400 mt-1">Gérez vos événements, compétitions et ateliers</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Nouvel Événement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5 text-blue-400" />} label="Total Événements" value={events.length} />
        <StatCard icon={<Users className="w-5 h-5 text-purple-400" />} label="Participants" value={totalParticipants} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-green-400" />} label="Revenu Total" value={`${totalRevenue.toLocaleString()} DA`} />
        <StatCard icon={<Trophy className="w-5 h-5 text-orange-400" />} label="Compétitions" value={competitionCount} />
      </div>

      <div className="flex gap-2 bg-gray-800/50 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
            activeTab === 'upcoming' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-400 hover:text-white'
          }`}
        >
          À Venir ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
            activeTab === 'past' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-400 hover:text-white'
          }`}
        >
          Passés ({pastEvents.length})
        </button>
      </div>

      {displayedEvents.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Aucun événement {activeTab === 'upcoming' ? 'à venir' : 'passé'}</p>
          <p className="text-sm mt-1">Créez votre premier événement avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedEvents.map(event => {
            const regs = eventRegistrations(event.id!);
            const activeRegs = regs.filter(r => r.status !== 'cancelled');
            const revenue = activeRegs.length * event.price;
            const { date, time } = formatDateTime(event.date);
            const isPast = activeTab === 'past';

            return (
              <div key={event.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[event.type] || 'bg-gray-500/20 text-gray-400'}`}>
                    {TYPE_LABELS[event.type] || event.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[event.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {STATUS_LABELS[event.status] || event.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{event.name}</h3>
                {event.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-2 text-gray-400 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{date}</span>
                  </div>
                  {time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{event.location || 'Non spécifié'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{activeRegs.length}/{event.maxParticipants} participants</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <span className="text-xl font-bold text-orange-400">
                      {event.price === 0 ? 'Gratuit' : `${event.price.toLocaleString()} DA`}
                    </span>
                    {revenue > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{revenue.toLocaleString()} DA de revenu</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isPast && (
                      <button
                        onClick={() => setRegisterEventId(event.id!)}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer"
                        title="Inscrire un membre"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(event)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(event)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {regs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Participants ({activeRegs.length})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {regs.map(reg => (
                        <div key={reg.id} className="flex items-center justify-between text-sm py-1">
                          <span className="text-gray-300 truncate">{reg.memberName}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {reg.status === 'registered' && !isPast && (
                              <button
                                onClick={() => handleCheckin(reg.id!)}
                                className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" /> Check-in
                              </button>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                reg.status === 'checked_in'
                                  ? 'bg-green-500/20 text-green-400'
                                  : reg.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {reg.status === 'checked_in' ? 'Présent' : reg.status === 'cancelled' ? 'Annulé' : 'Inscrit'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <EventModal
          event={editEvent}
          onClose={() => {
            setShowModal(false);
            setEditEvent(null);
          }}
          onSave={(form: EventFormData) => {
            if (editEvent?.id) {
              handleUpdate(editEvent.id, form);
            } else {
              handleCreate(form);
            }
          }}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          eventName={deleteConfirm.name}
          registrationsCount={eventRegistrations(deleteConfirm.id!).length}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}

      {registerEventId && (
        <RegisterMemberModal
          search={searchMember}
          onSearchChange={setSearchMember}
          results={filteredMembers}
          selectedId={registerMemberId}
          selectedName={registerMemberName}
          onSelect={(id, name) => {
            setRegisterMemberId(id);
            setRegisterMemberName(name);
            setSearchMember(name);
          }}
          onConfirm={() => handleRegister(registerEventId)}
          onClose={() => {
            setRegisterEventId(null);
            setRegisterMemberId('');
            setRegisterMemberName('');
            setSearchMember('');
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">{icon}</div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function DeleteConfirmModal({
  eventName,
  registrationsCount,
  onCancel,
  onConfirm,
}: {
  eventName: string;
  registrationsCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Supprimer l'événement</h3>
        </div>
        <p className="text-gray-400 text-sm mb-2">
          Êtes-vous sûr de vouloir supprimer <span className="text-white font-medium">{eventName}</span> ?
        </p>
        {registrationsCount > 0 && (
          <p className="text-red-400 text-sm mb-4">
            {registrationsCount} inscription{registrationsCount > 1 ? 's' : ''} seront également supprimée{registrationsCount > 1 ? 's' : ''}.
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium cursor-pointer"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function EventModal({
  event,
  onClose,
  onSave,
}: {
  event: GymEvent | null;
  onClose: () => void;
  onSave: (form: EventFormData) => void;
}) {
  const [form, setForm] = useState<EventFormData>(() => parseFormFromEvent(event));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">{event ? "Modifier l'événement" : 'Nouvel événement'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Nom de l'événement</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none transition-colors"
              placeholder="Ex: Compétition Bench Press"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none transition-colors"
            >
              <option value="coaching">Coaching</option>
              <option value="competition">Compétition</option>
              <option value="social">Social</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Heure</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Lieu</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none transition-colors"
              placeholder="Ex: Salle principale"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none transition-colors resize-none"
              placeholder="Description optionnelle"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Prix (DA)</label>
              <input
                type="number"
                min={0}
                value={form.price || ''}
                onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none transition-colors"
                placeholder="0 = gratuit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Capacité max</label>
              <input
                type="number"
                min={1}
                value={form.maxParticipants || ''}
                onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.date}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {event ? 'Enregistrer les modifications' : "Créer l'événement"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterMemberModal({
  search,
  onSearchChange,
  results,
  selectedId,
  selectedName,
  onSelect,
  onConfirm,
  onClose,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  results: { id?: number; firstName: string; lastName: string; phone: string }[];
  selectedId: string;
  selectedName: string;
  onSelect: (id: string, name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Inscrire un membre</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Rechercher un membre</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none transition-colors"
                placeholder="Nom ou téléphone..."
              />
            </div>
          </div>

          {results.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {results.slice(0, 10).map(m => (
                <button
                  key={m.id}
                  onClick={() => onSelect(String(m.id!), `${m.firstName} ${m.lastName}`)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-colors cursor-pointer ${
                    selectedId === String(m.id!)
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  {m.firstName} {m.lastName}
                  <span className="text-gray-500 ml-2">{m.phone}</span>
                </button>
              ))}
            </div>
          )}

          {search && results.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-3">Aucun membre trouvé</p>
          )}

          {selectedName && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Membre sélectionné : {selectedName}
            </div>
          )}

          <button
            onClick={onConfirm}
            disabled={!selectedId}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Confirmer l'inscription
          </button>
        </div>
      </div>
    </div>
  );
}
