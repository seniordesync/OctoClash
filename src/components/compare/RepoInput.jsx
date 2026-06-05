import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { RepoIcon, XIcon, ShieldLockIcon } from '@primer/octicons-react';

export function RepoInput({ onFetchRepo }) {
  const { repos, removeRepo, infiniteMode, setInfiniteMode } = useAppStore();
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val || !val.includes('/')) return;
    
    if (!infiniteMode && repos.length >= 10) {
      alert("Max 10 repos. Enable infinite mode to add more.");
      return;
    }

    onFetchRepo(val);
    setInputValue('');
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleAdd} className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
            <RepoIcon />
          </span>
          <Input 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="owner/repo (e.g., facebook/react)"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="primary">
          Add
        </Button>
        <Tooltip text="Enter repository name in 'owner/repo' format. Max 10 by default." />
      </form>

      {/* Infinite Mode Toggle */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
          <input 
            type="checkbox" 
            checked={infiniteMode}
            onChange={(e) => setInfiniteMode(e.target.checked)}
            className="rounded border-border-default bg-canvas-default text-fg-accent focus:ring-fg-accent"
          />
          Enable infinite comparison
          <Tooltip text="Bypass the 10 repos limit." />
        </label>
        {infiniteMode && (
          <div className="flex items-center gap-2 text-xs text-fg-danger bg-canvas-subtle p-2 rounded border border-border-default inline-block max-w-max">
            <ShieldLockIcon size={14} />
            Warning: Comparing more than 10 repos can quickly exhaust GitHub API limits. Use a Personal Access Token.
          </div>
        )}
      </div>

      {/* Tag List */}
      <div className="flex flex-wrap gap-2">
        {repos.map(repo => (
          <div key={repo} className="flex items-center gap-2 px-3 py-1 bg-btn-bg border border-btn-border rounded-full text-sm text-fg-default">
            <RepoIcon size={14} className="text-fg-muted" />
            <span className="font-semibold">{repo}</span>
            <button 
              onClick={() => removeRepo(repo)}
              className="text-fg-muted hover:text-fg-danger transition-colors"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
