import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

import Button    from '../../common/Button';
import UserAvatar from '../../common/UserAvatar';

/**
 * UserDeactivateConfirm
 *
 * Confirmation dialog shown before deactivating (or reactivating) a user.
 * Uses a native <dialog> element for accessibility (focus trap, Escape key,
 * backdrop click-to-close).
 *
 * The label and button text flip based on whether the user is currently active:
 *   active   → "Deactivate" (danger)
 *   inactive → "Reactivate" (secondary)
 *
 * Props:
 *   user       — AdminUserResponse | null  (null = dialog closed)
 *   open       — boolean
 *   onClose    — () => void
 *   onConfirm  — (userId) => Promise<void>
 *   isLoading  — true while the deactivate/reactivate call is in flight
 */
export default function UserDeactivateConfirm({
  user,
  open,
  onClose,
  onConfirm,
  isLoading = false,
}) {
  const dialogRef = useRef(null);

  // ── Open / close the native <dialog> ──────────────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // ── Escape key / native cancel → call onClose ─────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      if (!isLoading) onClose?.();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose, isLoading]);

  // ── Backdrop click → close (unless loading) ───────────────────────────────
  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current && !isLoading) {
      onClose?.();
    }
  };

  // ── Confirm handler ───────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!user) return;
    await onConfirm?.(user.userId);
  };

  const isDeactivating = user?.isActive ?? true;
  const action         = isDeactivating ? 'Deactivate' : 'Reactivate';
  const actionLower    = action.toLowerCase();

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className={[
        'w-full max-w-md rounded-2xl bg-white shadow-floating',
        'p-0 backdrop:bg-neutral-900/50 backdrop:backdrop-blur-sm',
        'border-0 outline-none',
        'm-auto',
      ].join(' ')}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      aria-modal="true"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {/* Warning icon bubble */}
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isDeactivating
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-secondary-50 text-secondary-600 border border-secondary-100',
            ].join(' ')}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <h2
            id="confirm-modal-title"
            className="font-display text-lg font-bold text-neutral-900"
          >
            {action} user?
          </h2>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => !isLoading && onClose?.()}
          disabled={isLoading}
          className={[
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="px-6 pb-2" id="confirm-modal-desc">

        {/* User preview card */}
        {user && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <UserAvatar
              fullName={user.fullName}
              systemRole={user.systemRole}
              size="md"
            />
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-neutral-900 truncate">
                {user.fullName || '—'}
              </p>
              <p className="font-body text-xs text-neutral-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Warning message */}
        {isDeactivating ? (
          <p className="font-body text-sm text-neutral-600 leading-relaxed">
            This user will{' '}
            <span className="font-semibold text-neutral-900">
              lose access to the platform immediately
            </span>
            . They will not be able to log in or use any platform features until
            reactivated. Their data and history will be preserved.
          </p>
        ) : (
          <p className="font-body text-sm text-neutral-600 leading-relaxed">
            This user will{' '}
            <span className="font-semibold text-neutral-900">
              regain full access to the platform
            </span>
            . They will be able to log in and use platform features immediately
            after reactivation.
          </p>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => !isLoading && onClose?.()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={isDeactivating ? 'danger' : 'secondary'}
          size="md"
          isLoading={isLoading}
          onClick={handleConfirm}
        >
          {isLoading
            ? `${action}ing…`
            : `Yes, ${actionLower}`}
        </Button>
      </div>
    </dialog>
  );
}