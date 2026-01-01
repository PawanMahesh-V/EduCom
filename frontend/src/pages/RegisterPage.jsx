import { authApi } from '../api';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { ROLES, DEPARTMENTS } from '../constants';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [formData, setFormData] = useState({
    reg_id: '',
    name: '',
    email: '',
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
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailValid, setEmailValid] = useState(null);

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

    // Reset email validation when email changes
    if (name === 'email') {
      setEmailValid(null);
    }
  };

  const checkEmailExists = async () => {
    const email = formData.email.trim();
    
    if (!email) return;
    
    if (!email.toLowerCase().endsWith('@szabist.pk')) {
      setFieldErrors(prev => ({
        ...prev,
        email: 'Only @szabist.pk email addresses are allowed'
      }));
      setEmailValid(false);
      return;
    }

    setEmailChecking(true);
    
    try {
      const data = await authApi.checkEmail(email);

      if (data.exists) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
        setEmailValid(false);
      } else if (data.pending) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'A registration request is already pending for this email'
        }));
        setEmailValid(false);
      } else {
        setFieldErrors(prev => ({
          ...prev,
          email: ''
        }));
        setEmailValid(true);
      }
    } catch (err) {
      // If check fails, just continue without validation
      setEmailValid(null);
    } finally {
      setEmailChecking(false);
    }
  };

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

    if (!formData.email.trim()) {
      errors.email = 'Please fill in this field.';
      hasError = true;
    } else if (!formData.email.toLowerCase().endsWith('@szabist.pk')) {
      errors.email = 'Only @szabist.pk email addresses are allowed';
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

    if (emailValid === false) {
      hasError = true;
    }

    setFieldErrors(errors);
    return !hasError;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const data = await authApi.register({
        reg_id: formData.reg_id,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        semester: formData.role === 'Student' ? formData.semester : null,
        program_year: formData.role === 'PM' ? formData.program_year : null
      });

      setStep(2); // Show success message
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="register-container">
          {step === 1 ? (
            <>
              <div className="register-welcome">
                <h1 className="register-title">Create Your Account</h1>
                <p className="register-subtitle">Join the EduCom learning community and start your journey</p>
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

                  <div className="register-form-group register-form-group--full">
                    <label className="register-label" htmlFor="email">
                      Email Address
                    </label>
                    <div className="register-input-wrapper">
                      <div className="register-input-icon">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </div>
                      <input
                        className={`register-input ${fieldErrors.email ? 'register-input--error' : ''} ${emailValid === true ? 'register-input--success' : ''}`}
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={checkEmailExists}
                        placeholder="your.email@szabist.pk"
                        disabled={loading}
                      />
                      {emailChecking && (
                        <div className="register-input-status">
                          <FontAwesomeIcon icon={faSpinner} spin />
                        </div>
                      )}
                      {emailValid === true && !emailChecking && (
                        <div className="register-input-status register-input-status--success">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                      )}
                    </div>
                    {renderFieldError('email')}
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
                  disabled={loading || emailChecking}
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

                <div className="register-footer">
                  <div className="register-divider">
                    <span>Already have an account?</span>
                  </div>
                  <Link to="/login" className="register-link-button">
                    Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
