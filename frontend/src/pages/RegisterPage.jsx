import { authApi } from '../api';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faArrowLeft, 
  faEnvelope, 
  faLock,
  faEye,
  faEyeSlash,
  faUser,
  faIdCard,
  faBuilding,
  faUserGraduate,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { ROLES, DEPARTMENTS } from '../constants';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Steps: 1 = Email, 2 = Details Form, 3 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    reg_id: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
    department: 'CS',
    semester: '1',
    program_year: '1'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check for returning from verify-code page
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const verified = sessionStorage.getItem('registrationVerified');
    const storedEmail = sessionStorage.getItem('verifyEmail');
    
    if (stepParam === 'details' && verified === 'true' && storedEmail) {
      setEmail(storedEmail);
      setStep(2);
      // Clear verification flag (keep email for registration)
      sessionStorage.removeItem('registrationVerified');
    }
  }, [searchParams]);

  // Handle email submission (Step 1)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setFieldErrors({ email: 'Please enter your email address' });
      return;
    }

    if (!trimmedEmail.endsWith('@szabist.pk')) {
      setFieldErrors({ email: 'Only @szabist.pk email addresses are allowed' });
      return;
    }

    setLoading(true);

    try {
      await authApi.sendRegistrationCode(trimmedEmail);
      // Store email and flow type for VerifyCodePage
      sessionStorage.setItem('verifyEmail', trimmedEmail);
      sessionStorage.setItem('verifyFlow', 'registration');
      navigate('/verify-code');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
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

  // Validate registration form
  const validateForm = () => {
    const errors = {};
    let hasError = false;

    if (!formData.reg_id.trim()) {
      errors.reg_id = 'Please fill in this field.';
      hasError = true;
    }

    if (!formData.name.trim()) {
      errors.name = 'Please fill in this field.';
      hasError = true;
    }

    if (!formData.password) {
      errors.password = 'Please fill in this field.';
      hasError = true;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      hasError = true;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please fill in this field.';
      hasError = true;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (formData.role === 'Student' && !formData.semester) {
      errors.semester = 'Please select a semester';
      hasError = true;
    }

    if (formData.role === 'PM' && !formData.program_year) {
      errors.program_year = 'Please select a program year';
      hasError = true;
    }

    setFieldErrors(errors);
    return !hasError;
  };

  // Render field error
  const renderFieldError = (fieldName) => {
    if (!fieldErrors[fieldName]) return null;
    return (
      <div className="register-error-message fade-in mt-1">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="field-error-text">{fieldErrors[fieldName]}</span>
      </div>
    );
  };

  // Handle registration form submit (Step 2)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await authApi.register({
        reg_id: formData.reg_id,
        name: formData.name,
        email: email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        semester: formData.role === 'Student' ? formData.semester : null,
        program_year: formData.role === 'PM' ? formData.program_year : null
      });

      // Clear session storage
      sessionStorage.removeItem('verifyEmail');
      sessionStorage.removeItem('verifyFlow');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Email Entry
  const renderEmailStep = () => (
    <>
      <div className="register-welcome">
        <h1 className="register-title">Create Your Account</h1>
        <p className="register-subtitle">Enter your email address and we'll send you a verification code to get started.</p>
      </div>

      <form className="register-form" onSubmit={handleEmailSubmit}>
        <div className="register-form-group register-form-group--full">
          <label className="register-label" htmlFor="email">
            Email Address
          </label>
          <div className="register-input-wrapper">
            <div className="register-input-icon">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <input
              className={`register-input ${fieldErrors.email ? 'register-input--error' : ''}`}
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({});
                if (error) setError('');
              }}
              placeholder="your.email@szabist.pk"
              disabled={loading}
              autoFocus
            />
          </div>
          {renderFieldError('email')}
        </div>

        {error && (
          <div className="register-error-message fade-in">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <button 
          className="register-submit-button" 
          type="submit"
          disabled={loading}
        >
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

      <div className="register-footer">
        <div className="register-divider">
          <span>or</span>
        </div>
        <button className="register-back-link" onClick={() => navigate('/login')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Login</span>
        </button>
      </div>
    </>
  );

  // Render Step 2: Details Form
  const renderDetailsStep = () => (
    <>
      <div className="register-welcome">
        <div className="register-verified-badge">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Email Verified</span>
        </div>
        <h1 className="register-title">Complete Your Profile</h1>
        <p className="register-subtitle">Fill in your details to finish registration</p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="register-form-grid">
          <div className="register-form-group">
            <label className="register-label" htmlFor="reg_id">
              Registration ID
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faIdCard} />
              </div>
              <input
                className={`register-input ${fieldErrors.reg_id ? 'register-input--error' : ''}`}
                type="text"
                id="reg_id"
                name="reg_id"
                value={formData.reg_id}
                onChange={handleInputChange}
                placeholder="e.g., BCSBS2212263"
                disabled={loading}
              />
            </div>
            {renderFieldError('reg_id')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="name">
              Full Name
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <input
                className={`register-input ${fieldErrors.name ? 'register-input--error' : ''}`}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
            {renderFieldError('name')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="password">
              Password
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                className={`register-input ${fieldErrors.password ? 'register-input--error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                disabled={loading}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {renderFieldError('password')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                className={`register-input ${fieldErrors.confirmPassword ? 'register-input--error' : ''}`}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {renderFieldError('confirmPassword')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="role">
              Role
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faUserGraduate} />
              </div>
              <select
                className="register-input register-select"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={loading}
              >
                {ROLES.filter(r => r !== 'Admin').map(r => (
                  <option key={r} value={r}>
                    {r === 'PM' ? 'PM (Program Manager)' : r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="department">
              Department
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faBuilding} />
              </div>
              <select
                className="register-input register-select"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={loading}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'Student' && (
            <div className="register-form-group">
              <label className="register-label" htmlFor="semester">
                Semester
              </label>
              <div className="register-input-wrapper">
                <div className="register-input-icon">
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>
                <select
                  className={`register-input register-select ${fieldErrors.semester ? 'register-input--error' : ''}`}
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
              {renderFieldError('semester')}
            </div>
          )}

          {formData.role === 'PM' && (
            <div className="register-form-group">
              <label className="register-label" htmlFor="program_year">
                Program Year
              </label>
              <div className="register-input-wrapper">
                <div className="register-input-icon">
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>
                <select
                  className={`register-input register-select ${fieldErrors.program_year ? 'register-input--error' : ''}`}
                  id="program_year"
                  name="program_year"
                  value={formData.program_year}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
              {renderFieldError('program_year')}
            </div>
          )}
        </div>

        {error && (
          <div className="register-error-message fade-in">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <button 
          className="register-submit-button" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner-small"></div>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>
    </>
  );

  // Render Step 3: Success
  const renderSuccessStep = () => (
    <div className="register-success-state">
      <div className="register-success-icon">
        <FontAwesomeIcon icon={faCheckCircle} />
      </div>
      <h2>Registration Submitted!</h2>
      <p>Your registration request has been submitted successfully.</p>
      <p className="register-success-note">
        Please wait for admin approval. You will be notified via email once your account is activated.
      </p>
      <button 
        className="register-submit-button"
        onClick={() => navigate('/login')}
      >
        Go to Login
      </button>
    </div>
  );

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="register-orb register-orb--1"></div>
        <div className="register-orb register-orb--2"></div>
        <div className="register-orb register-orb--3"></div>
      </div>

      <header className="register-header">
        <button className="register-back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back</span>
        </button>
        <div className="register-brand">
          <FontAwesomeIcon icon={faGraduationCap} className="register-brand-icon" />
          <span className="register-brand-text">
            Edu<span className="register-brand-accent">Com</span>
          </span>
        </div>
      </header>

      <div className="register-content">
        <div className={`register-container ${step === 2 ? 'register-container--wide' : ''}`}>
          {step === 1 && renderEmailStep()}
          {step === 2 && renderDetailsStep()}
          {step === 3 && renderSuccessStep()}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
