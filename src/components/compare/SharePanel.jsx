import React, { useState } from 'react';
import { ShareIcon, DownloadIcon, CheckIcon } from '@primer/octicons-react';
import { Button } from '../ui/Button';
import html2canvas from 'html2canvas';

export function SharePanel({ targetId = 'compare-container' }) {
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadPng = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0d1117' : '#ffffff',
        scale: 2, // higher resolution
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `octoclash-compare-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-html2canvas-ignore="true" className="flex flex-wrap items-center gap-4 py-6 border-t border-border-muted mt-8">
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
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleDownloadPng}
          className="flex items-center gap-2"
          disabled={downloading}
        >
          {downloading ? (
            <div className="animate-spin w-4 h-4 border-2 border-canvas-default border-t-transparent rounded-full" />
          ) : (
            <DownloadIcon />
          )}
          {downloading ? 'Exporting...' : 'Export to PNG'}
        </Button>
      </div>
    </div>
  );
}
