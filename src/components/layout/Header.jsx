import React, { useEffect } from 'react';
import { MarkGithubIcon, MoonIcon, SunIcon } from '@primer/octicons-react';
import { useAppStore } from '../../store/appStore';

export function Header() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'dark' ? MoonIcon : (theme === 'light' ? SunIcon : MoonIcon);

  return (
    <header className="bg-canvas-subtle border-b border-border-muted py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MarkGithubIcon size={32} className="text-fg-default" />
        <h1 className="text-xl font-semibold text-fg-default tracking-tight">RepoLens</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 border border-border-default rounded-md bg-canvas-default text-fg-muted hover:text-fg-default hover:bg-btn-hoverBg transition-colors flex items-center gap-2"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={16} />
          <span className="text-xs uppercase font-semibold">{theme}</span>
        </button>
      </div>
    </header>
  );
}
