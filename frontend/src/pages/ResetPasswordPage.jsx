import { authApi } from '../api';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, 
  faEye, 
  faEyeSlash, 
  faCheckCircle,
  faArrowLeft,
  faExclamationCircle 
} from '@fortawesome/free-solid-svg-icons';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('resetToken');
    if (!token) {
      navigate('/forgot-password');
    } else {
      setResetToken(token);
    }
  }, [navigate]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.resetPassword(resetToken, newPassword);
      if (data) {
        sessionStorage.clear();
        
        setShowSuccessModal(true);
      } else {
        setError('Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="reset-success-modal-overlay">
          <div className="reset-success-modal">
            <div className="reset-success-modal-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h2>Password Reset Successfully!</h2>
            <p>You can now login with your new password.</p>
            <button 
              className="reset-success-modal-button"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      <div className="reset-page">
        {/* Animated Background */}
        <div className="reset-background">
          <div className="reset-orb reset-orb--1"></div>
          <div className="reset-orb reset-orb--2"></div>
          <div className="reset-orb reset-orb--3"></div>
        </div>

        {/* Header Bar */}
        <header className="reset-header">
          <button className="reset-back-button" onClick={() => navigate('/')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back</span>
          </button>
          <div className="reset-brand">
            <FontAwesomeIcon icon={faCheckCircle} className="reset-brand-icon" />
            <span className="reset-brand-text">
              Edu<span className="reset-brand-accent">Com</span>
            </span>
          </div>
        </header>

        <div className="reset-content">
          <div className="reset-container">
            {/* Welcome Section */}
            <div className="reset-welcome">
              <h1 className="reset-title">Create New Password</h1>
              <p className="reset-subtitle">Your identity has been verified. Set your new password below.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="reset-form">
              <div className="reset-form-group">
                <label htmlFor="newPassword" className="reset-label">New Password</label>
                <div className="reset-input-wrapper">
                  <div className="reset-input-icon">
                    <FontAwesomeIcon icon={faLock} />
                  </div>
                  <input
                    className="reset-input"
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="reset-form-group">
                <label htmlFor="confirmPassword" className="reset-label">Confirm Password</label>
                <div className="reset-input-wrapper">
                  <div className="reset-input-icon">
                    <FontAwesomeIcon icon={faLock} />
                  </div>
                  <input
                    className="reset-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="reset-error-message fade-in">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="reset-submit-button" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faLock} />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="reset-footer">
              <div className="reset-divider">
                <span>or</span>
              </div>
              <button className="reset-back-link" onClick={() => navigate('/login')}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ResetPasswordPage;