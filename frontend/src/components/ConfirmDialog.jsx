import React from 'react';

const ConfirmDialog = ({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!open) return null;

  const confirmClass = variant === 'danger' ? 'button delete' : 'button primary';

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal')) {
      onCancel?.();
    }
  };

  return (
    <div className="modal confirm-modal" onClick={handleOverlayClick}>
      <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions confirm-actions">
          <button className="button secondary" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={confirmClass} type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
