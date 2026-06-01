'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/context/language-context';
import { useState } from 'react';
import { 
  Users, Settings, Home, LogOut, Dumbbell, CreditCard, TrendingDown, 
  Package, QrCode, UserCheck, ShoppingCart, ClipboardList, MessageSquare, 
  Building2, ChevronDown, ChevronRight, Trophy, Star, UserPlus, Calendar, ShoppingBag, 
  Wrench, Box, Languages, Bot, Database, BarChart3, FileText, DoorOpen, Wifi, Shield, Gift, Activity, Fingerprint
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  roles: ('admin' | 'reception' | 'coach' | 'adherent')[];
}

interface NavSection {
  titleKey: string;
  icon: React.ReactNode;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navSections: NavSection[] = [
  {
    titleKey: 'sidebar.principal',
    icon: <Home className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/', labelKey: 'sidebar.dashboard', icon: <Home className="w-5 h-5" />, roles: ['admin', 'reception', 'coach'] },
      { href: '/checkin', labelKey: 'sidebar.checkin', icon: <QrCode className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/members', labelKey: 'sidebar.members', icon: <Users className="w-5 h-5" />, roles: ['admin', 'reception', 'coach'] },
      { href: '/members/habits', labelKey: 'sidebar.habits', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin'] },
      { href: '/pos', labelKey: 'sidebar.pos', icon: <ShoppingCart className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/products', labelKey: 'sidebar.products', icon: <Package className="w-5 h-5" />, roles: ['admin', 'reception'] },
    ]
  },
  {
    titleKey: 'sidebar.materiel',
    icon: <Wrench className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/equipment', labelKey: 'sidebar.equipment', icon: <Box className="w-5 h-5" />, roles: ['admin'] },
      { href: '/consumables', labelKey: 'sidebar.consumables', icon: <ShoppingBag className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.gestion',
    icon: <Dumbbell className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/coaches', labelKey: 'sidebar.coaches', icon: <UserCheck className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/programs', labelKey: 'sidebar.programs', icon: <Dumbbell className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/plans', labelKey: 'sidebar.plans', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'reception'] },
    ]
  },
  {
    titleKey: 'sidebar.personnel',
    icon: <Users className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/personnel', labelKey: 'sidebar.personnel.manage', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.access',
    icon: <DoorOpen className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/rfid', labelKey: 'sidebar.rfid', icon: <Fingerprint className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/turnstiles', labelKey: 'sidebar.turnstiles', icon: <DoorOpen className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/turnstiles/logs', labelKey: 'sidebar.access.logs', icon: <QrCode className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/turnstiles/install', labelKey: 'sidebar.turnstiles.install', icon: <Wifi className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.finance',
    icon: <CreditCard className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/finance/assistant', labelKey: 'sidebar.finance.assistant', icon: <FileText className="w-5 h-5" />, roles: ['admin'] },
      { href: '/payments', labelKey: 'sidebar.payments', icon: <CreditCard className="w-5 h-5" />, roles: ['admin'] },
      { href: '/expenses', labelKey: 'sidebar.expenses', icon: <TrendingDown className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.administration',
    icon: <Settings className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/admin', labelKey: 'sidebar.admin', icon: <Shield className="w-5 h-5" />, roles: ['admin'] },
      { href: '/notifications', labelKey: 'sidebar.notifications', icon: <MessageSquare className="w-5 h-5" />, roles: ['admin', 'reception'] },
      { href: '/admin/monitoring', labelKey: 'sidebar.monitoring', icon: <Activity className="w-5 h-5" />, roles: ['admin'] },
      { href: '/admin/audit', labelKey: 'sidebar.audit', icon: <Shield className="w-5 h-5" />, roles: ['admin'] },
      { href: '/admin/loyalty', labelKey: 'sidebar.loyalty', icon: <Gift className="w-5 h-5" />, roles: ['admin'] },
      { href: '/admin/database', labelKey: 'sidebar.database', icon: <Database className="w-5 h-5" />, roles: ['admin'] },
      { href: '/settings/access', labelKey: 'sidebar.pin', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.rentabilisation',
    icon: <Trophy className="w-4 h-4" />,
    defaultOpen: false,
    items: [
      { href: '/fidelity', labelKey: 'sidebar.fidelity', icon: <Star className="w-5 h-5" />, roles: ['admin'] },
      { href: '/commissions', labelKey: 'sidebar.commissions', icon: <CreditCard className="w-5 h-5" />, roles: ['admin'] },
      { href: '/private-coaching', labelKey: 'sidebar.coaching', icon: <UserPlus className="w-5 h-5" />, roles: ['admin'] },
      { href: '/events', labelKey: 'sidebar.events', icon: <Calendar className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.config',
    icon: <Building2 className="w-4 h-4" />,
    defaultOpen: false,
    items: [
      { href: '/settings/general', labelKey: 'sidebar.settings', icon: <Building2 className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    titleKey: 'sidebar.chatbot',
    icon: <Bot className="w-4 h-4" />,
    defaultOpen: true,
    items: [
      { href: '/ai-coach', labelKey: 'sidebar.coach', icon: <Bot className="w-5 h-5" />, roles: ['adherent'] },
    ]
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navSections.forEach(section => {
      initial[section.titleKey] = section.defaultOpen || false;
    });
    return initial;
  });

  const toggleSection = (titleKey: string) => {
    setOpenSections(prev => ({ ...prev, [titleKey]: !prev[titleKey] }));
  };

  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => role && item.roles.includes(role as any))
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} h-screen flex flex-col flex-shrink-0 transition-all duration-300`} style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)', borderLeft: lang === 'ar' ? '1px solid var(--border)' : undefined }}>
      {/* Logo + Lang switcher */}
      <div className="p-4 flex flex-col items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center justify-center">
          <div className={`rounded-xl flex items-center justify-center overflow-hidden transition-all ${collapsed ? 'w-12 h-12' : 'w-16 h-16'}`}>
            <img src="/logo-transparent.png" alt="GYM" className="w-full h-full object-contain" />
          </div>
        </Link>
        {!collapsed && (
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === 'fr' ? 'العربية' : 'Français'}
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.titleKey} className="space-y-1">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.titleKey)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
              >
                {openSections[section.titleKey] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {t(section.titleKey)}
              </button>
            )}
            {(!collapsed ? openSections[section.titleKey] : false) && section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'hover:bg-white/5 text-white/70 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <span className={isActive ? 'text-white' : 'text-white/50'}>{item.icon}</span>
                  {!collapsed && <span className="font-medium text-sm">{t(item.labelKey)}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        {collapsed && (
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all"
            title={lang === 'fr' ? 'العربية' : 'Français'}
          >
            <Languages className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">{t('sidebar.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
