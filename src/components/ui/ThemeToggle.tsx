'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/context/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
      style={{ background: 'var(--surface-alt)' }}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" style={{ color: 'var(--text)' }} />}
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {theme === 'dark' ? 'Jour' : 'Nuit'}
      </span>
    </button>
  );
}
