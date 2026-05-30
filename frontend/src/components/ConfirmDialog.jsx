import React from 'react';

const ConfirmDialog = ({
  open,
  title = 'Confirm Operation',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger' // 'danger' or 'primary'
}) => {
  if (!open) return null;

  // Dynamically assigns premium thematic action colors based on context variations
  const confirmClass = variant === 'danger' ? 'cd-btn cd-btn--danger' : 'cd-btn cd-btn--primary';

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('cd-modal-overlay')) {
      onCancel?.();
    }
  };

  return (
    <div className="cd-modal-overlay" onClick={handleOverlayClick}>
      <div className="cd-modal-box fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="cd-modal-title">{title}</h2>
        <p className="cd-modal-message">{message}</p>
        
        <div className="cd-modal-action-footer">
          <button className="cd-btn cd-btn--secondary" type="button" onClick={onCancel}>
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