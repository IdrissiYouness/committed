import React from 'react';

/**
 * Reusable Badge component for displaying status indicators.
 * 
 * @param {Object} props
 * @param {string} [props.variant='neutral'] - 'success', 'warning', 'error', 'info', or 'neutral'
 * @param {string} props.children - The badge text
 * @param {string} [props.className] - Additional classes
 */
export default function Badge({ variant = 'neutral', children, className = '' }) {
  const baseStyles = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';
  
  const variants = {
    success: 'bg-success-50 text-success-700 ring-success-600/20',
    warning: 'bg-warning-50 text-warning-700 ring-warning-600/20',
    error: 'bg-error-50 text-error-700 ring-error-600/20',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    neutral: 'bg-neutral-50 text-neutral-600 ring-neutral-500/10',
  };

  const selectedVariant = variants[variant] || variants.neutral;

  return (
    <span className={`${baseStyles} ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
}