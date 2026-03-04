import { forwardRef, useState, useId } from 'react';

/**
 * Input — design-system-aware input component.
 *
 * Features:
 *   - Floating label support via `label` prop
 *   - Inline error message (red, below the field)
 *   - Password visibility toggle when type="password"
 *   - Forwarded ref — works directly with react-hook-form's `register()`
 *   - `helperText` for optional hint below the field
 *
 * Props:
 *   label       — visible label text (optional but recommended for a11y)
 *   error       — error message string; makes the field red when set
 *   helperText  — hint text shown below field when no error
 *   type        — input type; 'password' gets a visibility toggle
 *   required    — shows asterisk next to label
 *   disabled    — greys out and prevents interaction
 *   className   — extra classes on the wrapper div
 *   inputClass  — extra classes on the <input> element itself
 *   ...rest     — all other props forwarded to <input>
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    type = 'text',
    required = false,
    disabled = false,
    className = '',
    inputClass = '',
    ...rest
  },
  ref
) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  // ── Password visibility toggle ──────────────────────────────────────────
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  // ── Derived style tokens ────────────────────────────────────────────────
  const hasError = Boolean(error);

  const ringColor = hasError
    ? 'border-error focus:ring-error focus:border-error'
    : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500';

  const baseInput = [
    'block w-full',
    'rounded-lg px-4 py-2.5',
    'font-body text-base text-neutral-900 placeholder:text-neutral-400',
    'bg-white',
    'border',
    ringColor,
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'transition-colors duration-150 ease-smooth',
    'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
    // leave room for the eye-icon button inside password fields
    isPassword ? 'pr-11' : '',
    inputClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={[
            'font-body text-sm font-semibold',
            hasError ? 'text-error' : 'text-neutral-700',
            disabled ? 'opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
          {required && (
            <span className="ml-1 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper — relative so the eye button can be positioned */}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={baseInput}
          {...rest}
        />

        {/* Password visibility toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShowPassword((v) => !v)}
            className={[
              'absolute inset-y-0 right-0 flex items-center px-3',
              'text-neutral-400 hover:text-primary-500',
              'focus:outline-none focus:text-primary-500',
              'transition-colors duration-150',
              disabled ? 'pointer-events-none opacity-40' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-sm text-error font-body"
        >
          <ErrorIcon />
          {error}
        </p>
      )}

      {/* Helper text (only shown when there is no error) */}
      {!hasError && helperText && (
        <p id={helperId} className="text-xs text-neutral-500 font-body">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;

// ─── Inline SVG Icons ──────────────────────────────────────────────────────────
// Kept inline to avoid an extra icon-library dependency for 3 small icons.

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}