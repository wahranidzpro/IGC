'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Settings, Phone, Mail, Globe, Save, Loader2, Users,
  DollarSign, Clock, Image, Link, Sun,
  MapPin, Building2, CheckCircle2, AlertCircle, Upload,
  Camera, MessageCircle, Music2, Video, X, Eye
} from 'lucide-react';

const CURRENCIES = [
  { value: 'DA', label: 'DA - Dinar Algérien' },
  { value: 'EUR', label: '€ - Euro' },
  { value: 'USD', label: '$ - Dollar US' },
  { value: 'GBP', label: '£ - Livre Sterling' },
  { value: 'MAD', label: 'MAD - Dirham Marocain' },
  { value: 'TND', label: 'TND - Dinar Tunisien' },
];

const TIMEZONES = [
  { value: 'Africa/Algiers', label: 'Afrique/Alger (UTC+1)' },
  { value: 'Africa/Casablanca', label: 'Afrique/Casablanca (UTC+0)' },
  { value: 'Africa/Tunis', label: 'Afrique/Tunis (UTC+1)' },
  { value: 'Africa/Cairo', label: 'Afrique/Le Caire (UTC+2)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
  { value: 'Europe/London', label: 'Europe/Londres (UTC+0)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
  { value: 'America/New_York', label: 'Amérique/New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Amérique/Los Angeles (UTC-8)' },
  { value: 'Asia/Dubai', label: 'Asie/Dubaï (UTC+4)' },
];

const DAYS_OF_WEEK = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
];

interface OpeningHour {
  open: string;
  close: string;
  closed: boolean;
}

type OpeningHours = Record<string, OpeningHour>;

interface ClubInfo {
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  capacity: number;
  currency: string;
  timezone: string;
  logo: string;
  openingHours: OpeningHours;
  instagram: string;
  facebook: string;
  tiktok: string;
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  lundi: { open: '08:00', close: '22:00', closed: false },
  mardi: { open: '08:00', close: '22:00', closed: false },
  mercredi: { open: '08:00', close: '22:00', closed: false },
  jeudi: { open: '08:00', close: '22:00', closed: false },
  vendredi: { open: '08:00', close: '22:00', closed: false },
  samedi: { open: '09:00', close: '20:00', closed: false },
  dimanche: { open: '09:00', close: '14:00', closed: false },
};

const DEFAULTS: ClubInfo = {
  name: 'Infinity Gym Center',
  phone: '+213 6XX XXX XXX',
  email: 'infinity.gym.ig@gmail.com',
  website: 'www.infinitygym.dz',
  address: 'Alger, Algérie',
  capacity: 50,
  currency: 'DA',
  timezone: 'Africa/Algiers',
  logo: '',
  openingHours: DEFAULT_OPENING_HOURS,
  instagram: '',
  facebook: '',
  tiktok: '',
};

function parseOpeningHours(value: string): OpeningHours {
  try {
    const parsed = JSON.parse(value);
    const result: OpeningHours = {};
    for (const day of DAYS_OF_WEEK) {
      const d = parsed[day.key];
      result[day.key] = d
        ? { open: d.open || '08:00', close: d.close || '22:00', closed: !!d.closed }
        : { open: '08:00', close: '22:00', closed: false };
    }
    return result;
  } catch {
    return { ...DEFAULT_OPENING_HOURS };
  }
}

export default function GeneralSettingsPage() {
  const settingsRecords = useLiveQuery(() => db.settings.toArray(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ClubInfo>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [synced, setSynced] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const getSetting = useCallback((key: string): string | undefined => {
    return settingsRecords?.find(r => r.key === key)?.value;
  }, [settingsRecords]);

  useEffect(() => {
    if (!settingsRecords) return;

    const hoursRaw = getSetting('club_hours');
    const hours = hoursRaw ? parseOpeningHours(hoursRaw) : DEFAULT_OPENING_HOURS;

    setFormData({
      name: getSetting('club_name') || DEFAULTS.name,
      phone: getSetting('club_phone') || DEFAULTS.phone,
      email: getSetting('club_email') || DEFAULTS.email,
      website: getSetting('club_website') || DEFAULTS.website,
      address: getSetting('club_address') || DEFAULTS.address,
      capacity: Number(getSetting('club_capacity')) || DEFAULTS.capacity,
      currency: getSetting('club_currency') || DEFAULTS.currency,
      timezone: getSetting('club_timezone') || DEFAULTS.timezone,
      logo: getSetting('club_logo') || '',
      openingHours: hours,
      instagram: getSetting('club_instagram') || '',
      facebook: getSetting('club_facebook') || '',
      tiktok: getSetting('club_tiktok') || '',
    });
    setLogoPreview(getSetting('club_logo') || '');
  }, [settingsRecords, getSetting]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;
    const fetchFromCloud = async () => {
      try {
        const { data } = await (client.from('synced_club_info') as any)
          .select('*')
          .single()
          .catch(() => ({ data: null }));
        if (data) {
          setFormData(prev => ({
            ...prev,
            name: data.club_name || prev.name,
            phone: data.club_phone || prev.phone,
            email: data.club_email || prev.email,
            website: data.club_website || prev.website,
            address: data.club_address || prev.address,
            capacity: Number(data.club_capacity) || prev.capacity,
            currency: data.club_currency || prev.currency,
            timezone: data.club_timezone || prev.timezone,
            logo: data.club_logo || prev.logo,
            openingHours: data.club_hours ? parseOpeningHours(data.club_hours) : prev.openingHours,
            instagram: data.club_instagram || prev.instagram,
            facebook: data.club_facebook || prev.facebook,
            tiktok: data.club_tiktok || prev.tiktok,
          }));
          if (data.club_logo) setLogoPreview(data.club_logo);
        }
      } catch {}
    };
    fetchFromCloud();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Le logo ne doit pas dépasser 2 Mo');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      setFormData(prev => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleHoursChange = (day: string, field: keyof OpeningHour, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], [field]: value },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    setSynced(false);

    try {
      const pairs: { key: string; value: string }[] = [
        { key: 'club_name', value: formData.name },
        { key: 'club_phone', value: formData.phone },
        { key: 'club_email', value: formData.email },
        { key: 'club_website', value: formData.website },
        { key: 'club_address', value: formData.address },
        { key: 'club_capacity', value: String(formData.capacity) },
        { key: 'club_currency', value: formData.currency },
        { key: 'club_timezone', value: formData.timezone },
        { key: 'club_logo', value: formData.logo },
        { key: 'club_hours', value: JSON.stringify(formData.openingHours) },
        { key: 'club_instagram', value: formData.instagram },
        { key: 'club_facebook', value: formData.facebook },
        { key: 'club_tiktok', value: formData.tiktok },
      ];

      await db.transaction('rw', db.settings, async () => {
        for (const { key, value } of pairs) {
          await db.settings.put({ key, value });
        }
      });

      if (isSupabaseConfigured && supabase) {
        try {
          const payload = {
            club_name: formData.name,
            club_phone: formData.phone,
            club_email: formData.email,
            club_website: formData.website,
            club_address: formData.address,
            club_capacity: String(formData.capacity),
            club_currency: formData.currency,
            club_timezone: formData.timezone,
            club_logo: formData.logo,
            club_hours: JSON.stringify(formData.openingHours),
            club_instagram: formData.instagram,
            club_facebook: formData.facebook,
            club_tiktok: formData.tiktok,
          };
          await (supabase.from('synced_club_info') as any).upsert(payload, { onConflict: 'id' });
          setSynced(true);
        } catch {}
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const SectionCard = ({ title, icon: Icon, iconColor, children }: { title: string; icon: any; iconColor: string; children: React.ReactNode }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const FieldLabel = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
    <label className="block text-sm font-medium text-gray-400 mb-2">
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {children}
      </span>
    </label>
  );

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
    />
  );

  const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
      {...props}
      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
    />
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Paramètres Généraux</h2>
          <p className="text-gray-400 mt-1">Configurer les informations du club</p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300">
          Ces informations apparaissent sur la page de connexion et dans tout le système.
        </p>
      </div>

      {/* Informations du Club */}
      <SectionCard title="Informations du Club" icon={Building2} iconColor="bg-orange-500/20">
        <div className="space-y-5">
          <div>
            <FieldLabel icon={Settings}>Nom du Club</FieldLabel>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de votre salle de sport"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={Phone}>Numéro de Téléphone</FieldLabel>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+213 6XX XXX XXX"
              />
            </div>
            <div>
              <FieldLabel icon={Mail}>Adresse Email</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@exemple.dz"
              />
            </div>
          </div>
          <div>
            <FieldLabel icon={Globe}>Site Web</FieldLabel>
            <Input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="www.exemple.dz"
            />
          </div>
          <div>
            <FieldLabel icon={MapPin}>Adresse / Ville</FieldLabel>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alger, Algérie"
            />
          </div>
        </div>
      </SectionCard>

      {/* Configuration */}
      <SectionCard title="Configuration" icon={Settings} iconColor="bg-purple-500/20">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={DollarSign}>Devise</FieldLabel>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel icon={Clock}>Fuseau Horaire</FieldLabel>
              <Select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel icon={Users}>Capacité maximale de la salle</FieldLabel>
            <Input
              type="number"
              min={1}
              max={5000}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Math.max(1, Number(e.target.value)) })}
            />
            <p className="text-xs text-gray-500 mt-1">Utilisé pour le calcul du taux d&apos;occupation sur le dashboard</p>
          </div>
        </div>
      </SectionCard>

      {/* Apparence */}
      <SectionCard title="Apparence" icon={Sun} iconColor="bg-yellow-500/20">
        <div className="space-y-5">
          <div>
            <FieldLabel icon={Image}>Logo du Club</FieldLabel>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:border-orange-500 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {logoPreview ? 'Changer le logo' : 'Télécharger un logo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => { setLogoPreview(''); setFormData(prev => ({ ...prev, logo: '' })); }}
                    className="mt-2 flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" /> Supprimer
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-2">Format PNG, JPG. Max 2 Mo.</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Horaires d'ouverture */}
      <SectionCard title="Horaires d&apos;Ouverture" icon={Clock} iconColor="bg-green-500/20">
        <div className="space-y-4">
          {DAYS_OF_WEEK.map(day => {
            const h = formData.openingHours[day.key] || { open: '08:00', close: '22:00', closed: false };
            return (
              <div key={day.key} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                <div className="w-24 shrink-0">
                  <span className={`text-sm font-medium ${h.closed ? 'text-gray-600' : 'text-white'}`}>
                    {day.label}
                  </span>
                </div>
                <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.closed}
                    onChange={(e) => handleHoursChange(day.key, 'closed', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gray-500">Fermé</span>
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={h.open}
                    disabled={h.closed}
                    onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)}
                    className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm disabled:opacity-30 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <span className="text-gray-600">—</span>
                  <input
                    type="time"
                    value={h.close}
                    disabled={h.closed}
                    onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)}
                    className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm disabled:opacity-30 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Réseaux sociaux */}
      <SectionCard title="Réseaux Sociaux" icon={Camera} iconColor="bg-pink-500/20">
        <div className="space-y-5">
          <div>
            <FieldLabel icon={Camera}>Instagram</FieldLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">@</span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="votre_salle"
                className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <FieldLabel icon={MessageCircle}>Facebook</FieldLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">@</span>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="InfinityGymOfficiel"
                className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <FieldLabel icon={Music2}>TikTok</FieldLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">@</span>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                placeholder="infinitygym"
                className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Prévisualisation */}
      <SectionCard title="Prévisualisation" icon={Eye} iconColor="bg-cyan-500/20">
        <p className="text-sm text-gray-500 mb-4">Aperçu de la page de connexion</p>
        <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden max-w-sm mx-auto">
          <div className="bg-gradient-to-b from-orange-600 to-orange-700 p-6 text-center">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-3 rounded-xl bg-white/10 p-2" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-10 h-10 text-white/60" />
              </div>
            )}
            <h2 className="text-xl font-bold text-white">{formData.name || 'Votre Club'}</h2>
            <div className="flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-white/60" />
              <p className="text-sm text-white/70">{formData.address || 'Adresse'}</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{formData.phone || '+213 6XX XXX XXX'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{formData.email || 'contact@exemple.dz'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{formData.website || 'www.exemple.dz'}</span>
            </div>
            {formData.openingHours && (
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="text-gray-300">
                  {DAYS_OF_WEEK.slice(0, 3).map(day => {
                    const h = formData.openingHours[day.key];
                    return (
                      <div key={day.key} className="flex justify-between gap-4">
                        <span className="text-gray-500">{day.label.slice(0, 3)}</span>
                        <span>{h?.closed ? 'Fermé' : `${h?.open || '--'}:${h?.close || '--'}`}</span>
                      </div>
                    );
                  })}
                  <span className="text-gray-600 text-xs mt-1 block">+ {Object.values(formData.openingHours).filter(h => !h.closed).length - 3} jours</span>
                </div>
              </div>
            )}
            {(formData.instagram || formData.facebook || formData.tiktok) && (
              <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                {formData.instagram && <Camera className="w-4 h-4 text-pink-400" />}
                {formData.facebook && <MessageCircle className="w-4 h-4 text-blue-400" />}
                {formData.tiktok && <Music2 className="w-4 h-4 text-gray-300" />}
                <span className="text-xs text-gray-500">@{formData.instagram || formData.facebook || formData.tiktok}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-800 text-center">
              <span className="text-xs text-gray-600">—— {formData.currency || 'DA'} ——</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Save Button */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {saveError && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enregistrement...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-300" />
              Sauvegardé {synced ? '✓' : '(local)'}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}
