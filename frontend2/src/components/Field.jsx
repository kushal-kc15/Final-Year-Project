import { forwardRef, useId } from 'react';
import { cn } from '../lib/utils.js';

/**
 * Vyapar Margadarshan form fields.
 * - No full bordered input box. The account-form convention: hairline bottom rule only.
 * - The label is a tracked micro-line above the field, not a placeholder.
 * - Help text and error text sit below the field.
 *
 * Variants:
 *   input   - single-line text
 *   textarea - multi-line
 *   select  - native select
 *   amount  - monospaced numeric with currency symbol
 */

function Label({ htmlFor, required, children, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('field-label flex items-center gap-1', className)}>
      <span>{children}</span>
      {required && <span aria-hidden className="text-cinnabar-500">*</span>}
    </label>
  );
}

export const Input = forwardRef(function Input(
  { label, help, error, required, className, id, ...rest },
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
        className={cn('field', error && 'border-cinnabar-500 focus:border-cinnabar-500', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={help || error ? `${inputId}-msg` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-msg`} className="field-error">{error}</p>
      ) : help ? (
        <p id={`${inputId}-msg`} className="field-help">{help}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, help, error, required, className, id, rows = 3, ...rest },
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
        className={cn('field resize-y', error && 'border-cinnabar-500 focus:border-cinnabar-500', className)}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-msg`} className="field-error">{error}</p>
      ) : help ? (
        <p id={`${inputId}-msg`} className="field-help">{help}</p>
      ) : null}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, help, error, required, className, id, children, ...rest },
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
        className={cn(
          'field appearance-none pr-8 bg-no-repeat bg-right',
          'bg-[length:14px] bg-[position:right_0_center]',
          error && 'border-cinnabar-500 focus:border-cinnabar-500',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23555555' stroke-width='1.5'><path d='M1 1l5 5 5-5'/></svg>\")",
        }}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={`${inputId}-msg`} className="field-error">{error}</p>
      ) : help ? (
        <p id={`${inputId}-msg`} className="field-help">{help}</p>
      ) : null}
    </div>
  );
});

/** Currency-aware amount field. NPR by default. */
export const AmountField = forwardRef(function AmountField(
  { label, help, error, required, currency = 'NPR', value, onChange, className, id, ...rest },
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
          className={cn(
            'field pl-6 num',
            error && 'border-cinnabar-500 focus:border-cinnabar-500',
            className
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-msg`} className="field-error">{error}</p>
      ) : help ? (
        <p id={`${inputId}-msg`} className="field-help">{help}</p>
      ) : null}
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox(
  { label, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label htmlFor={inputId} className={cn('inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-ink', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="h-4 w-4 appearance-none rounded-none border border-rule-strong bg-paper checked:bg-ink checked:border-ink focus-visible:ring-2 focus-visible:ring-cinnabar-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
});
