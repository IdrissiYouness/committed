import { useMemo } from 'react';

/**
 * UserAvatar
 *
 * Displays a user's initials in a coloured circle.
 * Colour is determined by systemRole:
 *   admin  → primary palette (navy)
 *   user   → secondary palette (teal)
 *
 * Sizes:
 *   sm  → h-8  w-8  text-xs
 *   md  → h-10 w-10 text-sm   (default)
 *   lg  → h-12 w-12 text-base
 *   xl  → h-16 w-16 text-xl
 *
 * Usage:
 *   <UserAvatar fullName="Alice Dupont" systemRole="USER" size="md" />
 */

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

const ROLE_CLASSES = {
  admin:  'bg-primary-100 text-primary-700 ring-primary-200',
  user:   'bg-secondary-100 text-secondary-700 ring-secondary-200',
  default:'bg-neutral-100 text-neutral-600 ring-neutral-200',
};

/**
 * Derive up to two initials from a full name.
 * "Alice Dupont" → "AD"
 * "Alice"        → "A"
 * null/undefined → "?"
 */
function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserAvatar({
  fullName,
  systemRole,
  size = 'md',
  className = '',
}) {
  const initials   = useMemo(() => getInitials(fullName), [fullName]);
  const roleKey    = systemRole?.toLowerCase() ?? 'default';
  const colorClass = ROLE_CLASSES[roleKey] ?? ROLE_CLASSES.default;
  const sizeClass  = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <div
      className={[
        'inline-flex shrink-0 items-center justify-center',
        'rounded-xl font-display font-bold',
        'ring-2 ring-offset-1',
        sizeClass,
        colorClass,
        className,
      ].join(' ')}
      aria-label={fullName ? `${fullName} avatar` : 'User avatar'}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}