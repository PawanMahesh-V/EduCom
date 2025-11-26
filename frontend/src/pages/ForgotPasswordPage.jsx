import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification code sent! Check your email.');
        // Store email and navigate to verify page
        sessionStorage.setItem('resetEmail', email);
        setTimeout(() => {
          navigate('/verify-code');
        }, 2000);
      } else {
        setError(data.message || 'Failed to process request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <div className="auth-brand-icon-wrapper">
              <FontAwesomeIcon icon={faKey} className="auth-brand-icon" />
            </div>
            <div className="auth-brand-text">
              Edu<span className="auth-brand-accent">Com</span>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="auth-welcome">
            <h2>Forgot Password?</h2>
            <p>Enter your email address and we'll send you a verification code to reset your password.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="auth-input-icon" />
                <input
                  type="email"
                  id="email"
                  className="auth-input"
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
                <div className="auth-error-message fade-in mt-2">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{fieldError}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="auth-error-message fade-in">
                <FontAwesomeIcon icon={faExclamationCircle} />
                <span>{error}</span>
              </div>
            )}
            
            {message && (
              <div className="auth-success-message fade-in">
                <FontAwesomeIcon icon={faCircleCheck} />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="auth-submit-button" disabled={loading}>
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
  );
};

export default ForgotPasswordPage;
