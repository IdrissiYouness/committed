import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

/**
 * ConfirmDialog — generic confirmation dialog.
 *
 * Replaces all window.confirm() calls with a branded, accessible dialog that
 * matches the UserDeactivateConfirm pattern (native <dialog> element, focus
 * trap, Escape key, backdrop click-to-close).
 *
 * Props:
 *   open         — controls visibility
 *   title        — dialog heading
 *   description  — body text (string or JSX)
 *   confirmLabel — confirm button text   (default: "Confirm")
 *   cancelLabel  — cancel button text    (default: "Cancel")
 *   variant      — 'danger' | 'warning'  (default: 'danger')
 *   isLoading    — true while async action runs
 *   onConfirm    — () => void | Promise<void>
 *   onClose      — () => void
 */
export default function ConfirmDialog({
  open = false,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

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

  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current && !isLoading) onClose?.();
  };

  const iconClass =
    variant === 'danger'
      ? 'bg-red-50 text-red-600 border border-red-100'
      : 'bg-warning-50 text-warning-600 border border-warning-100';

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className={[
        'w-full max-w-md rounded-2xl bg-white shadow-floating',
        'p-0 backdrop:bg-neutral-900/50 backdrop:backdrop-blur-sm',
        'border-0 outline-none m-auto',
      ].join(' ')}
      aria-labelledby="cdlg-title"
      aria-describedby={description ? 'cdlg-desc' : undefined}
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id="cdlg-title" className="font-display text-lg font-bold text-neutral-900">
            {title}
          </h2>
        </div>
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

      {/* Body */}
      {description && (
        <div className="px-6 pb-2" id="cdlg-desc">
          <p className="font-body text-sm text-neutral-600 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => !isLoading && onClose?.()}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant === 'danger' ? 'danger' : 'secondary'}
          size="md"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? `${confirmLabel}ing…` : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
