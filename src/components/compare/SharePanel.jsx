import React, { useState } from 'react';
import { ShareIcon, CheckIcon } from '@primer/octicons-react';
import { Button } from '../ui/Button';

export function SharePanel() {
  const [copying, setCopying] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-6 border-t border-border-muted mt-8">
      <span className="text-sm font-semibold text-fg-default">Share these results:</span>
      <div className="flex items-center gap-3">
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleCopyLink}
          className="flex items-center gap-2"
        >
          {copying ? <CheckIcon className="text-fg-success" /> : <ShareIcon />}
          {copying ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
    </div>
  );
}
