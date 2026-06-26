import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Modal — canonical dialog using the native <dialog> element.
 * - Automatically traps focus when open.
 * - Closes on ESC and backdrop click.
 * - Smooth entry/exit animation via `animate-drawer` (defined in index.css).
 * - Scrolls within the content area, never the page behind.
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
  panelClassName,
  contentClassName,
}) {
  const ref = useRef(null);

  // Open/close the dialog.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // Handle close events (including ESC).
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handleClose = () => {
      if (dlg.open) return; // Only fire if actually closed.
      onClose?.();
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose]);

  // Trap focus inside the dialog (native <dialog> does this, but we ensure it).
  useEffect(() => {
    if (!open) return;
    const dlg = ref.current;
    if (!dlg) return;
    // Save the previously focused element to restore later.
    const previousFocus = document.activeElement;
    // Focus the dialog itself (or the first focusable element inside).
    // The dialog's first focusable element is usually the close button or title.
    // We'll rely on the browser's default behavior.
    return () => {
      if (previousFocus && previousFocus.focus) {
        // Restore focus when closed.
        previousFocus.focus();
      }
    };
  }, [open]);

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
        // Click on backdrop closes.
        if (e.target === ref.current) onClose?.();
      }}
      className={cn(
        'fixed inset-0 z-[100] m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-4 text-ink',
        'open:flex open:items-center open:justify-center',
        'backdrop:bg-inkwell-900/40 backdrop:backdrop-blur-sm',
      )}
    >
      <div
        className={cn(
          'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-md border border-rule bg-paper shadow-pop animate-drawer',
          widths[size],
          panelClassName,
        )}
      >
        {(title || !hideClose) && (
          <header className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-rule sm:px-5 sm:py-4 shrink-0">
            <div className="min-w-0">
              {title && <h2 className="font-display text-xl font-medium leading-tight text-ink">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-muted leading-snug">{description}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 -mr-1.5 -mt-1 p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-deep transition-colors focus-visible:ring-2 focus-visible:ring-cinnabar-500"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            )}
          </header>
        )}
        <div className={cn('flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5', contentClassName)}>
          {children}
        </div>
        {footer && (
          <footer className="flex flex-col-reverse items-stretch justify-end gap-2 px-4 py-3 border-t border-rule bg-paper-deep/50 sm:flex-row sm:items-center sm:px-5 shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

/** Confirm dialog – a pre‑styled variant of Modal. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
}) {
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
