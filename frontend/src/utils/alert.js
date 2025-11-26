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

// Convenience methods
export const showSuccess = (message) => showAlert(message, 'success');
export const showError = (message) => showAlert(message, 'error');
export const showWarning = (message) => showAlert(message, 'warning');
export const showInfo = (message) => showAlert(message, 'info');
