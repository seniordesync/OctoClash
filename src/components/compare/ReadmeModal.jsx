import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { XIcon } from '@primer/octicons-react';
import { useAppStore } from '../../store/appStore';
import { useGitHubApi } from '../../hooks/useGitHubApi';

// Ensure all links open in a new tab securely to prevent reverse tabnabbing
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function ReadmeModal() {
  const previewRepo = useAppStore(state => state.previewRepo);
  const setPreviewRepo = useAppStore(state => state.setPreviewRepo);
  const { fetchReadmeHtml } = useGitHubApi();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (previewRepo) {
      setLoading(true);
      fetchReadmeHtml(previewRepo).then(res => {
        if (isMounted) {
          setHtml(res);
          setLoading(false);
        }
      }).catch(err => {
        if (isMounted) {
          setHtml("<div class='p-4 text-center text-fg-muted'>Failed to load README or repository has no README.</div>");
          setLoading(false);
        }
      });
    }
    return () => { isMounted = false; };
  }, [previewRepo, fetchReadmeHtml]);

  if (!previewRepo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setPreviewRepo(null)}>
      <div 
        className="bg-canvas-default border border-border-default rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-canvas-subtle rounded-t-xl">
          <h2 className="text-fg-default font-semibold text-lg flex items-center gap-2">
            <span className="text-fg-muted">README.md</span>
            <span className="text-fg-muted font-normal text-sm">({previewRepo})</span>
          </h2>
          <button 
            onClick={() => setPreviewRepo(null)}
            className="text-fg-muted hover:text-fg-default p-1 rounded-md hover:bg-canvas-overlay transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 prose dark:prose-invert max-w-none prose-a:text-fg-accent hover:prose-a:underline markdown-body">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-fg-accent border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
          )}
        </div>
      </div>
    </div>
  );
}
