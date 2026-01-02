import { authApi } from '../api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faArrowLeft, 
  faKey,
  faCircleCheck,
  faExclamationCircle 
} from '@fortawesome/free-solid-svg-icons';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFieldError('');
    
    // Validate empty field
    if (!email.trim()) {
      setFieldError('Please fill in this field.');
      return;
    }
    
    // Validate @szabist.pk domain
    if (!email.toLowerCase().endsWith('@szabist.pk')) {
      setFieldError('Only @szabist.pk email addresses are allowed');
      return;
    }
    
    setLoading(true);

    try {
      const data = await authApi.forgotPassword(email);
      if (data) {
        setMessage('Verification code sent! Check your email.');
        // Store email and navigate to verify page
        sessionStorage.setItem('resetEmail', email);
        setTimeout(() => {
          navigate('/verify-code');
        }, 2000);
      } else {
        setError('Failed to process request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      {/* Animated Background */}
      <div className="forgot-background">
        <div className="forgot-orb forgot-orb--1"></div>
        <div className="forgot-orb forgot-orb--2"></div>
        <div className="forgot-orb forgot-orb--3"></div>
      </div>

      {/* Header Bar */}
      <header className="forgot-header">
        <button className="forgot-back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back</span>
        </button>
        <div className="forgot-brand">
          <FontAwesomeIcon icon={faKey} className="forgot-brand-icon" />
          <span className="forgot-brand-text">
            Edu<span className="forgot-brand-accent">Com</span>
          </span>
        </div>
      </header>

      <div className="forgot-content">
        <div className="forgot-container">
          {/* Welcome Section */}
          <div className="forgot-welcome">
            <h1 className="forgot-title">Forgot Password?</h1>
            <p className="forgot-subtitle">Enter your email address and we'll send you a verification code to reset your password.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="forgot-form-group">
              <label htmlFor="email" className="forgot-label">Email Address</label>
              <div className="forgot-input-wrapper">
                <div className="forgot-input-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <input
                  type="email"
                  id="email"
                  className="forgot-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError('');
                    if (error) setError('');
                  }}
                  placeholder="your.email@szabist.pk"
                  disabled={loading}
                />
              </div>
              {fieldError && (
                <div className="forgot-error-message fade-in mt-2">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{fieldError}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="forgot-error-message fade-in">
                <FontAwesomeIcon icon={faExclamationCircle} />
                <span>{error}</span>
              </div>
            )}
            
            {message && (
              <div className="forgot-success-message fade-in">
                <FontAwesomeIcon icon={faCircleCheck} />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="forgot-submit-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="forgot-footer">
            <div className="forgot-divider">
              <span>or</span>
            </div>
            <button className="forgot-back-link" onClick={() => navigate('/login')}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
