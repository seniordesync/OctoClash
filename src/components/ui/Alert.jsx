import React from 'react';
import { AlertIcon, XCircleIcon, CheckCircleIcon, InfoIcon } from '@primer/octicons-react';

export function Alert({ message, type = 'error', onClose }) {
  if (!message) return null;

  let bgStyles = 'bg-canvas-subtle border-border-default';
  let textStyles = 'text-fg-default';
  let Icon = AlertIcon;

  if (type === 'error') {
    bgStyles = 'bg-[var(--color-fg-danger)] bg-opacity-10 border-[var(--color-fg-danger)] border-opacity-20';
    textStyles = 'text-fg-danger';
    Icon = XCircleIcon;
  } else if (type === 'success') {
    bgStyles = 'bg-[var(--color-fg-success)] bg-opacity-10 border-[var(--color-fg-success)] border-opacity-20';
    textStyles = 'text-fg-success';
    Icon = CheckCircleIcon;
  } else if (type === 'info') {
    bgStyles = 'bg-[var(--color-fg-accent)] bg-opacity-10 border-[var(--color-fg-accent)] border-opacity-20';
    textStyles = 'text-fg-accent';
    Icon = InfoIcon;
  } else if (type === 'warning') {
    bgStyles = 'bg-[#d4a72c] bg-opacity-10 border-[#d4a72c] border-opacity-20';
    textStyles = 'text-[#d4a72c]';
    Icon = AlertIcon;
  }

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
