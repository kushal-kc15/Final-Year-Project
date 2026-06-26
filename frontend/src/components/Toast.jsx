import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils.js';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((toast) => {
    const id = nextId++;
    const t = {
      id,
      tone: 'info',
      duration: 3500,
      ...toast,
    };
    setToasts((cur) => [...cur, t]);

    if (t.duration > 0) {
      const handle = setTimeout(() => dismiss(id), t.duration);
      timers.current.set(id, handle);
    }
    return id;
  }, [dismiss]);

  const value = useMemo(
    () => ({
      push,
      success: (msg, opts = {}) =>
        push({ tone: 'success', message: msg, ...opts }),
      error: (msg, opts = {}) =>
        push({ tone: 'error', message: msg, duration: 5000, ...opts }),
      info: (msg, opts = {}) =>
        push({ tone: 'info', message: msg, ...opts }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const startTime = useRef(Date.now());
  const raf = useRef(null);

  // Animate progress bar for visual feedback.
  useEffect(() => {
    if (toast.duration <= 0) return;

    const duration = toast.duration;
    const start = Date.now();

    const update = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        raf.current = requestAnimationFrame(update);
      }
    };

    raf.current = requestAnimationFrame(update);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [toast.duration]);

  const tone = toast.tone;
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'error'
        ? AlertCircle
        : Info;

  const iconColor =
    tone === 'success'
      ? 'text-moss-600'
      : tone === 'error'
        ? 'text-cinnabar-600'
        : 'text-inkwell-500';

  const borderColor =
    tone === 'success'
      ? 'border-moss-200'
      : tone === 'error'
        ? 'border-cinnabar-200'
        : 'border-rule';

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3 bg-paper border rounded-md shadow-pop overflow-hidden',
        'animate-drawer',
        borderColor
      )}
      role="alert"
    >
      <Icon
        size={18}
        className={cn('mt-0.5 shrink-0', iconColor)}
        strokeWidth={1.75}
      />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-medium text-ink leading-tight">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-ink-soft leading-snug">
          {toast.message}
        </p>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick?.();
              onDismiss();
            }}
            className="mt-1.5 text-xs font-medium text-cinnabar-600 hover:text-cinnabar-700 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
        {/* Progress bar – subtle, bottom of toast */}
        {toast.duration > 0 && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-ink-faint/30 transition-all duration-150"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 -mr-1 p-1 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-deep transition-colors"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};