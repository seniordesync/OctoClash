import React from 'react';

export function MonaOctocat({ className }) {
  return (
    <div className={`mascot-float flex justify-center items-center ${className}`}>
      <svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="var(--color-canvas-subtle)" stroke="var(--color-border-default)" strokeWidth="4"/>
        {/* Face/Head */}
        <path d="M 30 70 Q 50 85 70 70" fill="none" stroke="var(--color-fg-default)" strokeWidth="3" strokeLinecap="round"/>
        {/* Eyes with animation */}
        <g className="mascot-eye">
          <circle cx="38" cy="45" r="5" fill="var(--color-fg-default)"/>
          <circle cx="62" cy="45" r="5" fill="var(--color-fg-default)"/>
        </g>
        {/* Tentacles/Ears */}
        <path d="M 20 40 Q 15 20 35 25" fill="none" stroke="var(--color-fg-default)" strokeWidth="4" strokeLinecap="round"/>
        <path d="M 80 40 Q 85 20 65 25" fill="none" stroke="var(--color-fg-default)" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
