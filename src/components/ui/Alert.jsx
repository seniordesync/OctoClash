import React from 'react';
import { AlertIcon, XCircleIcon } from '@primer/octicons-react';

export function Alert({ message, type = 'error', onClose }) {
  if (!message) return null;

  const bgStyles = type === 'error' ? 'bg-canvas-subtle border-border-default' : 'bg-canvas-subtle border-border-default';
  const textStyles = type === 'error' ? 'text-fg-danger' : 'text-fg-default';
  const Icon = type === 'error' ? XCircleIcon : AlertIcon;

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-md ${bgStyles}`}>
      <Icon className={`mt-0.5 ${textStyles}`} size={16} />
      <div className="flex-1 text-sm font-semibold">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-fg-muted hover:text-fg-default">
          <XCircleIcon size={16} />
        </button>
      )}
    </div>
  );
}
