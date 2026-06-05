import React from 'react';
import { MarkGithubIcon } from '@primer/octicons-react';

export function MonaOctocat({ className = '' }) {
  // We use the official MarkGithubIcon from Primer and wrap it in an animation
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <MarkGithubIcon size={64} className="text-fg-muted" />
    </div>
  );
}
