import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen, 
  faArrowLeft, 
  faEnvelope, 
  faLock,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import loginImage from '../assets/login.svg';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ identifier: '', password: '' });
    
    let hasError = false;
    const errors = { identifier: '', password: '' };
    
    // Validate empty fields
    if (!formData.identifier.trim()) {
      errors.identifier = 'Please fill in this field.';
      hasError = true;
    }
    
    if (!formData.password) {
      errors.password = 'Please fill in this field.';
      hasError = true;
    }
    
    if (hasError) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    
    const identifier = formData.identifier.trim();
    
    if (identifier.includes('@')) {
      if (!identifier.toLowerCase().endsWith('@szabist.pk')) {
        setError('Only @szabist.pk email addresses are allowed');
        setLoading(false);
        return;
      }
    }
    
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    
    try {
      const response = await authApi.login(formData.identifier, formData.password);
      
      // Login now returns verification code info
      setUserEmail(response.email);
      setShowVerification(true);
      setError('');
      
      // Show dev code in console for development
      if (response.devCode) {
        console.log('Development verification code:', response.devCode);
      }

    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.token) {
        sessionStorage.setItem('userToken', data.token);
      } else {
        throw new Error('No token received from server');
      }

      switch (data.user.role) {
        case 'Admin':
          navigate('/admin');
          break;
        case 'Teacher':
        case 'HOD':
        case 'PM':
          navigate('/teacher');
          break;
        case 'Student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <header className="login-header-bar">
        <button className="login-back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Home</span>
        </button>
      </header>

      <div className="login-card glass">
        <div className="login-form-section">
          <div className="login-brand-header">
            <div className="brand-icon-wrapper">
              <FontAwesomeIcon icon={faBookOpen} className="login-brand-icon" />
            </div>
            <span className="brand-text">
              Edu<span className="brand-accent">Com</span>
            </span>
          </div>

          <div className="login-welcome">
            <h2>{showVerification ? 'Verify Your Login' : 'Welcome Back!'}</h2>
            <p>{showVerification ? 'Enter the 6-digit code sent to your email' : 'Sign in to your account to continue your learning journey'}</p>
          </div>

          {!showVerification ? (
            <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-label" htmlFor="identifier">
                Email or Registration ID
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <input
                  className="login-input"
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="your.email@szabist.pk"
                  disabled={loading}
                />
              </div>
              {fieldErrors.identifier && (
                <div className="login-error-message fade-in" style={{ marginTop: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.identifier}
                </div>
              )}
            </div>

            <div className="login-form-group">
              <div className="login-label-row">
                <label className="login-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="login-forgot-link">Forgot password?</Link>
              </div>
              <div className="input-wrapper">
                <div className="input-icon">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {fieldErrors.password && (
                <div className="login-error-message fade-in" style={{ marginTop: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {error && (
              <div className="login-error-message fade-in">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <button 
              className="login-submit-button" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Sending Code...
                </>
              ) : (
                'Continue'
              )}
            </button>

            <div className="login-footer">
              <div className="login-divider">
                <span>Don't have an account?</span>
              </div>
              <p className="login-contact">
                Contact your administrator to create an account
              </p>
            </div>
          </form>
          ) : (
            <form className="login-form" onSubmit={handleVerificationSubmit}>
            <div className="login-form-group">
              <label className="login-label" htmlFor="code">
                Verification Code
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <input
                  className="login-input"
                  type="text"
                  id="code"
                  name="code"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="login-error-message fade-in">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <button 
              className="login-submit-button" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <div className="login-footer">
              <button 
                type="button"
                className="login-back-link"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                  setError('');
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-primary)', 
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                ← Back to login
              </button>
            </div>
          </form>
          )}
        </div>

        <div className="login-image-section">
          <div className="illustration-container">
            <div className="illustration-wrapper">
              <img 
                src={loginImage} 
                alt="Welcome to EduCom" 
                className="login-illustration"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;