import { useState } from 'react';
import { cn } from '../lib/utils.js';

/**
 * Tabs – under-rule indicator, not a chip.
 * The active tab gets a 2px cinnabar rule beneath it. The rest are flat.
 * No boxes, no shadow, no 'eyebrow' treatment per tab.
 *
 * @param {Array<{value: string, label: string, count?: number}>} tabs
 * @param {string} value – controlled active value
 * @param {function} onChange – called with new value
 * @param {string} size – 'sm' | 'md' (default: 'md')
 */
export function Tabs({
  tabs,
  value,
  onChange,
  size = 'md',
  className,
}) {
  const [internal, setInternal] = useState(tabs[0]?.value);
  const current = value ?? internal;
  const setCurrent = onChange ?? setInternal;

  const sizes = {
    sm: 'py-2 text-xs',
    md: 'py-2.5 text-sm',
  };

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-end gap-4 overflow-x-auto border-b border-rule sm:gap-6',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${tab.value}`}
            id={`tab-${tab.value}`}
            onClick={() => setCurrent(tab.value)}
            className={cn(
              'relative -mb-px shrink-0 font-medium transition-colors',
              sizes[size] || sizes.md,
              active
                ? 'text-ink'
                : 'text-ink-muted hover:text-ink-soft'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs num text-ink-muted">
                {tab.count}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-px h-[2px] bg-cinnabar-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}