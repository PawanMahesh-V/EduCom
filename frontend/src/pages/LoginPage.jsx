import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faArrowLeft, 
  faEnvelope, 
  faLock,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
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
      const lower = identifier.toLowerCase();
      const allowedDomain = lower.endsWith('@szabist.pk') || lower.endsWith('@szabist.edu.pk');
      if (!allowedDomain) {
        setError('Only @szabist.pk or @szabist.edu.pk email addresses are allowed');
        setLoading(false);
        return;
      }
    }
    
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    
    try {
      const response = await authApi.login(formData.identifier, formData.password);
      
      // Store email, password (for resend), and flow type for VerifyCodePage
      sessionStorage.setItem('verifyEmail', response.email);
      sessionStorage.setItem('verifyFlow', 'login');
      sessionStorage.setItem('loginPassword', formData.password);
      
      // Navigate to verify page
      navigate('/verify-code');

    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-orb login-orb--1"></div>
        <div className="login-orb login-orb--2"></div>
        <div className="login-orb login-orb--3"></div>
      </div>

      <header className="login-header">
        <button className="login-back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back</span>
        </button>
        <div className="login-brand">
          <FontAwesomeIcon icon={faGraduationCap} className="login-brand-icon" />
          <span className="login-brand-text">
            Edu<span className="login-brand-accent">Com</span>
          </span>
        </div>
      </header>

      <div className="login-content">
        <div className="login-container">
          <div className="login-welcome">
            <h1 className="login-title">Welcome Back!</h1>
            <p className="login-subtitle">Sign in to your account to continue your learning journey</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-label" htmlFor="identifier">
                Email or Registration ID
              </label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <input
                  className="login-input"
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="your.email@szabist.pk or @szabist.edu.pk"
                  disabled={loading}
                />
              </div>
              {fieldErrors.identifier && (
                <div className="login-error-message fade-in mt-2">
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
              <div className="login-input-wrapper">
                <div className="login-input-icon">
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
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {fieldErrors.password && (
                <div className="login-error-message fade-in mt-2">
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
                  Signing In...
                </>
              ) : (
                'Continue'
              )}
            </button>

            <div className="login-footer">
              <div className="login-divider">
                <span>Don't have an account?</span>
              </div>
              <Link to="/register" className="login-link-button">
                Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;