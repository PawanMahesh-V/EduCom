// Custom Alert Function with Better Styling
export const showAlert = (message, type = 'info') => {
  // Remove any existing alert
  const existing = document.querySelector('.custom-browser-alert');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'custom-browser-alert';

  // Determine icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information'
  };

  // Create alert box
  overlay.innerHTML = `
    <div class="custom-alert-box">
      <div class="custom-alert-icon ${type}">
        ${icons[type] || icons.info}
      </div>
      <h3 class="custom-alert-title">${titles[type] || titles.info}</h3>
      <p class="custom-alert-message">${message}</p>
      <button class="custom-alert-button ${type}">OK</button>
    </div>
  `;

  // Add to body
  document.body.appendChild(overlay);

  // Get button and add click handler
  const button = overlay.querySelector('.custom-alert-button');
  const close = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  button.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Auto-focus button
  button.focus();

  // Return promise for chaining
  return new Promise((resolve) => {
    button.addEventListener('click', () => resolve(), { once: true });
  });
};

export const showConfirm = (message, title = 'Confirm Action') => {
  const existing = document.querySelector('.custom-browser-alert');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'custom-browser-alert';

  overlay.innerHTML = `
    <div class="custom-alert-box">
      <div class="custom-alert-icon warning">?</div>
      <h3 class="custom-alert-title">${title}</h3>
      <p class="custom-alert-message">${message}</p>
      <div class="custom-alert-actions" style="display: flex; gap: 10px; justify-content: flex-end; width: 100%; margin-top: 20px;">
        <button class="custom-alert-cancel" style="background: #e5e7eb; color: #374151; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer;">Cancel</button>
        <button class="custom-alert-confirm" style="background: #1282A2; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer;">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const confirmBtn = overlay.querySelector('.custom-alert-confirm');
  const cancelBtn = overlay.querySelector('.custom-alert-cancel');

  return new Promise((resolve) => {
    const close = (result) => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));

    // Close on background click (optional, treating as cancel)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });

    confirmBtn.focus();
  });
};

// Convenience methods
export const showSuccess = (message) => showAlert(message, 'success');
export const showError = (message) => showAlert(message, 'error');
export const showWarning = (message) => showAlert(message, 'warning');
export const showInfo = (message) => showAlert(message, 'info');
