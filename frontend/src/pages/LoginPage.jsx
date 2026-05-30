import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, getEmailError } from '../utils/validation';
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
  const { login, user } = useAuth();
  
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

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    
    if (user && token) {
      switch (user.role) {
        case 'Admin':
          navigate('/admin', { replace: true });
          break;
        case 'Teacher':
        case 'HOD':
        case 'PM':
          navigate('/teacher', { replace: true });
          break;
        case 'Student':
          navigate('/student', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    const emailError = getEmailError(formData.identifier);
    if (emailError) {
      if (!formData.identifier.trim()) {
         errors.identifier = 'Please fill in this field.';
         hasError = true;
      } else if (!isValidEmail(formData.identifier)) {
         errors.identifier = emailError;
         hasError = true;
      }
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
    
    try {
      await login(formData.identifier, formData.password);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Decorative Blur Orbs */}
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
        <div className="login-brand" onClick={() => navigate('/')}>
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
            {/* Input Identifier Block */}
            <div className="login-form-group">
              <label className="login-label" htmlFor="identifier">
                Email or Registration ID
              </label>
              <div className={`login-input-wrapper ${fieldErrors.identifier ? 'login-input-wrapper--error' : ''}`}>
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
                <div className="login-error-message fade-in">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.identifier}</span>
                </div>
              )}
            </div>

            {/* Input Password Block */}
            <div className="login-form-group">
              <div className="login-label-row">
                <label className="login-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="login-forgot-link">Forgot password?</Link>
              </div>
              <div className={`login-input-wrapper ${fieldErrors.password ? 'login-input-wrapper--error' : ''}`}>
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
                <div className="login-error-message fade-in">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {/* General Submission Error Notification */}
            {error && (
              <div className="login-error-message login-error-message--general fade-in">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <button 
              className="login-submit-button" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="login-spinner"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Continue</span>
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