import React, { useEffect, useState } from 'react';
import { MarkGithubIcon, MoonIcon, SunIcon, SyncIcon } from '@primer/octicons-react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';

export function Header() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);
    const handler = (e) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      if (systemIsDark) root.classList.add('dark');
      else root.classList.remove('dark');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, systemIsDark]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'system' ? SyncIcon : (theme === 'dark' ? MoonIcon : SunIcon);

  return (
    <header className="bg-canvas-subtle border-b border-border-muted py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MarkGithubIcon size={32} className="text-fg-default" />
        <h1 className="text-xl font-semibold text-fg-default tracking-tight">OctoClash</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Clear Cache Button */}
        <Button 
          variant="default"
          className="gap-2 p-2"
          onClick={() => {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('octoclash_cache_')) {
                localStorage.removeItem(key);
              }
            });
            window.location.reload();
          }}
          aria-label="Clear cache and reload data"
          title="Force refresh data from GitHub"
        >
          <SyncIcon size={16} />
          <span className="text-xs uppercase font-semibold hidden sm:inline">Refresh Data</span>
        </Button>

        {/* Theme Toggle */}
        <Button 
          variant="default"
          className="gap-2 p-2"
          onClick={toggleTheme}
          aria-label={`Toggle theme. Current theme is ${theme}`}
          aria-live="polite"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={16} />
          <span className="text-xs uppercase font-semibold">{theme}</span>
        </Button>
      </div>
    </header>
  );
}
