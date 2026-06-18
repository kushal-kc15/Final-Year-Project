import { useState } from 'react';
import { cn } from '../lib/utils.js';

/**
 * Tabs — under-rule indicator, not a chip.
 * The active tab gets a 2px cinnabar rule beneath it. The rest are flat.
 * No boxes, no shadow, no 'eyebrow' treatment per tab.
 */
export function Tabs({ tabs, value, onChange, className }) {
  const [internal, setInternal] = useState(tabs[0]?.value);
  const current = value ?? internal;
  const setCurrent = onChange ?? setInternal;

  return (
    <div role="tablist" className={cn('flex items-end gap-4 overflow-x-auto border-b border-rule sm:gap-6', className)}>
      {tabs.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => setCurrent(tab.value)}
            className={cn(
              'relative -mb-px shrink-0 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs num text-ink-muted">{tab.count}</span>
            )}
            {active && (
              <span aria-hidden className="absolute left-0 right-0 -bottom-px h-[2px] bg-cinnabar-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
