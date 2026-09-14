import { Modal } from '../ui/Modal';

/**
 * Confirm-dialog wrapper around the shared Modal with friendlier labels.
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