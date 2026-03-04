import { forwardRef } from 'react';

/**
 * Button — design-system-aware button component.
 *
 * Variants:
 *   primary   — filled primary-500 background (default)
 *   secondary — filled secondary-500 (teal) background
 *   ghost     — transparent with primary border + text
 *   danger    — filled error-red background
 *
 * Props:
 *   variant    — 'primary' | 'secondary' | 'ghost' | 'danger'
 *   size       — 'sm' | 'md' | 'lg'
 *   isLoading  — shows inline spinner, disables interaction
 *   disabled   — native disabled behaviour
 *   fullWidth  — stretches to fill container
 *   type       — 'button' | 'submit' | 'reset'
 *   className  — additional Tailwind classes for one-off overrides
 *   children   — button label / content
 *   ...rest    — forwarded to the <button> element
 */

const VARIANT_CLASSES = {
  primary: [
    'bg-primary-500 text-white',
    'hover:bg-primary-600 active:bg-primary-700',
    'focus:ring-primary-500',
    'disabled:bg-primary-300',
    'shadow-elegant hover:shadow-elevated',
  ].join(' '),

  secondary: [
    'bg-secondary-500 text-white',
    'hover:bg-secondary-600 active:bg-secondary-700',
    'focus:ring-secondary-500',
    'disabled:bg-secondary-300',
    'shadow-elegant hover:shadow-elevated',
  ].join(' '),

  ghost: [
    'bg-transparent text-primary-600 border border-primary-400',
    'hover:bg-primary-50 hover:border-primary-500 active:bg-primary-100',
    'focus:ring-primary-500',
    'disabled:text-primary-300 disabled:border-primary-200',
  ].join(' '),

  danger: [
    'bg-error text-white',
    'hover:bg-red-700 active:bg-red-800',
    'focus:ring-red-500',
    'disabled:bg-red-300',
    'shadow-elegant hover:shadow-elevated',
  ].join(' '),
};

const SIZE_CLASSES = {
  sm: 'px-3.5 py-2 text-sm gap-1.5 rounded-md',
  md: 'px-5 py-2.5 text-base gap-2 rounded-lg',
  lg: 'px-7 py-3.5 text-lg gap-2.5 rounded-xl',
};

const SPINNER_SIZE = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

function LoadingSpinner({ sizeClass }) {
  return (
    <svg
      className={`${sizeClass} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  const base = [
    'inline-flex items-center justify-center',
    'font-body font-semibold',
    'transition-all duration-200 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'select-none',
    fullWidth ? 'w-full' : '',
  ].join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`${base} ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary} ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${className}`}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading && <LoadingSpinner sizeClass={SPINNER_SIZE[size]} />}
      {children}
    </button>
  );
});

export default Button;