import React from 'react';
import { QuestionIcon } from '@primer/octicons-react';
import { cn } from '../../utils/helpers';

export function Tooltip({ text, content, children, className }) {
  const displayContent = text || content;
  return (
    <div className={cn("group relative inline-flex items-center", className)}>
      {children ? children : <QuestionIcon size={16} className="text-fg-muted cursor-help" />}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs z-50">
        <div className="bg-fg-default text-canvas-default text-xs rounded-md py-1.5 px-3 shadow-lg break-words text-center">
          {displayContent}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-fg-default"></div>
        </div>
      </div>
    </div>
  );
}
