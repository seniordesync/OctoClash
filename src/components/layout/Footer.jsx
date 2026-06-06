import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { KeyIcon } from '@primer/octicons-react';

export function Footer() {
  const token = useAppStore(state => state.token);
  const setToken = useAppStore(state => state.setToken);
  const [val, setVal] = useState(token);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setToken(val.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <footer className="border-t border-border-muted mt-12 py-8 bg-canvas-default text-sm text-fg-muted">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} OctoClash.</span>
          <span>Open Source No-Backend Tool.</span>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="token-input" className="flex items-center gap-2 font-medium">
            <KeyIcon size={16} />
            GitHub Personal Access Token
            <a href="https://github.com/settings/tokens/new?description=OctoClash" target="_blank" rel="noreferrer" className="text-fg-accent hover:underline text-xs">(Get one)</a>
            <Tooltip text="Used to bypass API limits. Stored safely in your browser's localStorage." />
          </label>
          <Input 
            id="token-input"
            type="password" 
            placeholder="ghp_..." 
            className="w-48 h-8 text-xs"
            value={val}
            onChange={e => setVal(e.target.value)}
          />
          <Button size="sm" onClick={handleSave} variant={saved ? 'primary' : 'default'}>
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </div>
    </footer>
  );
}
