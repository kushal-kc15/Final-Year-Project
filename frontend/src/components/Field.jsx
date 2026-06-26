import { forwardRef, useId } from 'react';
import { cn } from '../lib/utils.js';

/**
 * Vyapar Margadarshan form fields.
 * - Hairline bottom rule style (no full box).
 * - Label is a tracked micro-line above, not a placeholder.
 * - Error and help text below.
 * - All fields support `disabled`, `required`, and `error` props.
 */
function Label({ htmlFor, required, children, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('field-label flex items-center gap-1', className)}>
      <span>{children}</span>
      {required && <span aria-hidden className="text-cinnabar-500">*</span>}
    </label>
  );
}

function Message({ id, error, help }) {
  if (error) {
    return (
      <p id={id} className="field-error flex items-center gap-1.5">
        <span className="inline-block h-1 w-1 rounded-full bg-cinnabar-500" aria-hidden />
        {error}
      </p>
    );
  }
  if (help) {
    return (
      <p id={id} className="field-help">{help}</p>
    );
  }
  return null;
}

export const Input = forwardRef(function Input(
  { label, help, error, required, className, id, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        className={cn(
          'field',
          error && 'border-cinnabar-500 focus:border-cinnabar-500',
          disabled && 'opacity-60 cursor-not-allowed bg-paper-deep/50',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={help || error ? `${inputId}-msg` : undefined}
        {...rest}
      />
      <Message id={`${inputId}-msg`} error={error} help={help} />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, help, error, required, className, id, rows = 3, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={cn(
          'field resize-y',
          error && 'border-cinnabar-500 focus:border-cinnabar-500',
          disabled && 'opacity-60 cursor-not-allowed bg-paper-deep/50',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      <Message id={`${inputId}-msg`} error={error} help={help} />
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, help, error, required, className, id, children, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <select
        ref={ref}
        id={inputId}
        disabled={disabled}
        className={cn(
          'field appearance-none pr-8 bg-no-repeat bg-right',
          'bg-[length:14px] bg-[position:right_0_center]',
          error && 'border-cinnabar-500 focus:border-cinnabar-500',
          disabled && 'opacity-60 cursor-not-allowed bg-paper-deep/50',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23555555' stroke-width='1.5'><path d='M1 1l5 5 5-5'/></svg>\")",
        }}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      >
        {children}
      </select>
      <Message id={`${inputId}-msg`} error={error} help={help} />
    </div>
  );
});

/** Amount field with currency symbol. */
export const AmountField = forwardRef(function AmountField(
  { label, help, error, required, currency = 'NPR', value, onChange, className, id, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const SYMBOLS = { NPR: '₨', INR: '₹', USD: '$', EUR: '€' };
  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <div className="relative">
        <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-[55%] text-ink-muted num text-base">
          {SYMBOLS[currency] ?? currency}
        </span>
        <input
          ref={ref}
          id={inputId}
          inputMode="decimal"
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'field pl-6 num',
            error && 'border-cinnabar-500 focus:border-cinnabar-500',
            disabled && 'opacity-60 cursor-not-allowed bg-paper-deep/50',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...rest}
        />
      </div>
      <Message id={`${inputId}-msg`} error={error} help={help} />
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox(
  { label, className, id, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-ink',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        className="h-4 w-4 appearance-none rounded-none border border-rule-strong bg-paper checked:bg-ink checked:border-ink focus-visible:ring-2 focus-visible:ring-cinnabar-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
});