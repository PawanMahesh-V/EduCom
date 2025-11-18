import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

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
    <div className="reset-password-page">
      
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-modal-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h2>Password Reset Successfully!</h2>
            <p>You can now login with your new password.</p>
            <button 
              className="success-modal-btn"
              onClick={() => navigate('/login')}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="reset-password-container">
        <div className="reset-password-header">
          <div className="success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <h1>Create New Password</h1>
          <p>Your identity has been verified. Set your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <div className="input-icon">
              </div>
              <input
                className="login-input"
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
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: strength.color }}>
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <div className="input-icon">
              </div>
              <input
              className="login-input"
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
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="back-to-login">
            <Link to="/login">← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ResetPasswordPage;