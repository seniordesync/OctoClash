import React, { useId } from 'react';
import { QuestionIcon } from '@primer/octicons-react';
import { cn } from '../../utils/helpers';

export function Tooltip({ text, content, children, className }) {
  const displayContent = text || content;
  const tooltipId = useId();

  const clonedChildren = children ? React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        'aria-describedby': typeof displayContent === 'string' ? tooltipId : undefined
      });
    }
    return child;
  }) : null;

  return (
    <div 
      className={cn("group/tooltip relative inline-flex items-center", className)}
      tabIndex={children ? undefined : 0}
      aria-label={typeof displayContent === 'string' && !children ? displayContent : undefined}
      aria-describedby={!children && typeof displayContent === 'string' ? tooltipId : undefined}
    >
      {clonedChildren ? clonedChildren : <QuestionIcon size={16} className="text-fg-muted cursor-help outline-none focus:ring-2 focus:ring-fg-accent rounded-sm" />}
      <div 
        id={tooltipId}
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block group-focus/tooltip:block w-max max-w-xs z-[100] pointer-events-none"
        aria-hidden="true"
      >
        <div className="bg-fg-default text-canvas-default text-xs rounded-md py-1.5 px-3 shadow-lg break-words text-center">
          {displayContent}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-fg-default"></div>
        </div>
      </div>
    </div>
  );
}
