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
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.clear();
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
        
        setShowSuccessModal(true);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { text: '', color: '', width: '0%' };
    if (password.length < 6) return { text: 'Too short', color: '#f44336', width: '25%' };
    if (password.length < 8) return { text: 'Weak', color: '#ff9800', width: '50%' };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { text: 'Good', color: '#4caf50', width: '75%' };
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      return { text: 'Strong', color: '#2196f3', width: '100%' };
    }
    return { text: 'Fair', color: '#ffc107', width: '60%' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="auth-success-modal-overlay">
          <div className="auth-success-modal">
            <div className="auth-success-modal-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h2>Password Reset Successfully!</h2>
            <p>You can now login with your new password.</p>
            <button 
              className="auth-success-modal-button"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      <div className="auth-container">
        {/* Animated Background */}
        <div className="auth-background">
          <div className="gradient-orb gradient-orb--1"></div>
          <div className="gradient-orb gradient-orb--2"></div>
        </div>

        {/* Header Bar */}
        <div className="auth-header">
          <button className="auth-back-button" onClick={() => navigate('/')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="auth-card auth-card--narrow">
          <div className="auth-form-section">
            {/* Brand Header */}
            <div className="auth-brand-header">
              <div className="auth-brand-icon-wrapper auth-brand-icon-wrapper--green">
                <FontAwesomeIcon icon={faCheckCircle} className="auth-brand-icon" />
              </div>
              <div className="auth-brand-text">
                Edu<span className="auth-brand-accent">Com</span>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="auth-welcome">
              <h2>Create New Password</h2>
              <p>Your identity has been verified. Set your new password below.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label htmlFor="newPassword" className="auth-label">New Password</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                  <input
                    className="auth-input"
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
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                {newPassword && (
                  <div className="auth-password-strength">
                    <div className="auth-strength-bar">
                      <div 
                        className="auth-strength-fill password-strength-bar" 
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      ></div>
                    </div>
                    <span className="auth-strength-text password-strength-text" style={{ color: strength.color }}>
                      {strength.text}
                    </span>
                  </div>
                )}
              </div>

              <div className="auth-form-group">
                <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                  <input
                    className="auth-input"
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
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error-message fade-in">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="auth-submit-button" disabled={loading}>
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
            <div className="auth-footer">
              <div className="auth-divider">
                <span>or</span>
              </div>
              <button className="auth-back-link" onClick={() => navigate('/login')}>
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