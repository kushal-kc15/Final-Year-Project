import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Modal — a single canonical dialog. We use the native <dialog> element for
 * proper focus trapping, ESC handling, and ::backdrop styling. No portal
 * library, no animation library, no overflow surprises.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  hideClose = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // ESC closes — bind to dialog.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handle = (e) => { if (e.target === dlg) onClose?.(); };
    dlg.addEventListener('close', handle);
    return () => dlg.removeEventListener('close', handle);
  }, [onClose]);

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
  };

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        // Click outside the inner panel closes.
        if (e.target === ref.current) onClose?.();
      }}
      className={cn(
        'm-0 max-h-[100dvh] w-full max-w-[calc(100vw-1rem)] p-0 bg-transparent text-ink sm:max-h-[90vh]',
        'backdrop:bg-inkwell-900/40 backdrop:backdrop-blur-sm',
        'open:animate-drawer',
        widths[size],
      )}
    >
      <div className="m-2 max-h-[calc(100dvh-1rem)] bg-paper border border-rule rounded-md shadow-pop overflow-hidden sm:m-6 sm:max-h-[calc(90vh-3rem)]">
        {(title || !hideClose) && (
          <header className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-rule sm:px-5 sm:py-4">
            <div className="min-w-0">
              {title && <h2 className="font-display text-xl font-medium leading-tight text-ink">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-muted leading-snug">{description}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 -mr-1.5 -mt-1 p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-deep transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            )}
          </header>
        )}
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 sm:max-h-[calc(90vh-9rem)] sm:px-5">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-col-reverse items-stretch justify-end gap-2 px-4 py-3 border-t border-rule bg-paper-deep/50 sm:flex-row sm:items-center sm:px-5">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

/** Confirm dialog — sugar over Modal. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', destructive = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium text-ink-soft bg-paper border border-rule-strong rounded-sm hover:bg-paper-deep transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-10 px-4 text-sm font-medium text-paper border rounded-sm transition-colors disabled:opacity-60',
              destructive
                ? 'bg-cinnabar-500 border-cinnabar-500 hover:bg-cinnabar-600'
                : 'bg-ink border-ink hover:bg-inkwell-700'
            )}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-soft leading-relaxed">{description}</p>
    </Modal>
  );
}
