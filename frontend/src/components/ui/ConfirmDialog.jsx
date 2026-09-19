import { Modal } from './Modal';

/**
 * Reusable confirm-dialog around the shared Modal — used for every
 * destructive action (delete / reset) so users always get a confirmation step.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      message={message}
      onConfirm={onConfirm}
      onCancel={onCancel}
      type={danger ? 'danger' : 'info'}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
    />
  );
}