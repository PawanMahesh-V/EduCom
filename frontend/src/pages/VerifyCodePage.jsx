import { authApi } from '../api';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faShieldHalved,
  faExclamationCircle,
  faRotate,
  faClock
} from '@fortawesome/free-solid-svg-icons';

const VerifyCodePage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [flowType, setFlowType] = useState(''); // 'registration' or 'passwordReset'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const timerRef = useRef(null);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/Reset timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeLeft(600); // Reset to 10 minutes
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verifyEmail');
    const storedFlow = sessionStorage.getItem('verifyFlow');
    
    if (!storedEmail || !storedFlow) {
      // No valid session, redirect to home
      navigate('/');
    } else {
      setEmail(storedEmail);
      setFlowType(storedFlow);
      startTimer();
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [navigate]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      document.getElementById('code-5')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (flowType === 'registration') {
        // Registration flow
        await authApi.verifyRegistrationCode(email, verificationCode);
        // Mark email as verified and navigate to registration details
        sessionStorage.setItem('registrationVerified', 'true');
        navigate('/register?step=details');
      } else if (flowType === 'login') {
        // Login flow
        const data = await authApi.verifyLogin(email, verificationCode);
        
        // Store user session
        sessionStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
          sessionStorage.setItem('userToken', data.token);
        }
        
        // Clear verify session
        sessionStorage.removeItem('verifyEmail');
        sessionStorage.removeItem('verifyFlow');
        
        // Navigate based on role
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
      } else {
        // Password reset flow
        const data = await authApi.verifyResetCode(email, verificationCode);
        if (data && data.resetToken) {
          sessionStorage.setItem('resetToken', data.resetToken);
          navigate('/reset-password');
        } else {
          setError('Invalid verification code');
          setCode(['', '', '', '', '', '']);
          document.getElementById('code-0')?.focus();
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      if (flowType === 'registration') {
        await authApi.sendRegistrationCode(email);
      } else if (flowType === 'login') {
        // For login, we need to re-authenticate with stored password
        const password = sessionStorage.getItem('loginPassword');
        if (password) {
          await authApi.login(email, password);
        } else {
          setError('Session expired. Please login again.');
          navigate('/login');
          return;
        }
      } else {
        await authApi.forgotPassword(email);
      }
      startTimer(); // Reset timer to 10:00
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Get title and subtitle based on flow
  const getTitle = () => {
    if (flowType === 'registration') return 'Verify Your Email';
    if (flowType === 'login') return 'Verify Your Login';
    return 'Enter Verification Code';
  };

  const getSubtitle = () => {
    if (flowType === 'registration') {
      return <>We sent a 6-digit code to<br /><strong className="color-primary">{email}</strong></>;
    }
    return <>We sent a 6-digit code to <strong className="color-primary">{email}</strong></>;
  };

  return (
    <div className="verify-page">
      {/* Animated Background */}
      <div className="verify-background">
        <div className="verify-orb verify-orb--1"></div>
        <div className="verify-orb verify-orb--2"></div>
        <div className="verify-orb verify-orb--3"></div>
      </div>

      {/* Header Bar */}
      <header className="verify-header">
        <button className="verify-back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back</span>
        </button>
        <div className="verify-brand">
          <FontAwesomeIcon icon={faShieldHalved} className="verify-brand-icon" />
          <span className="verify-brand-text">
            Edu<span className="verify-brand-accent">Com</span>
          </span>
        </div>
      </header>

      <div className="verify-content">
        <div className="verify-container">
          {/* Welcome Section */}
          <div className="verify-welcome">
            <h1 className="verify-title">{getTitle()}</h1>
            <p className="verify-subtitle">{getSubtitle()}</p>
          </div>

          {/* Timer Display */}
          <div className={`verify-timer ${timeLeft <= 60 ? 'verify-timer--warning' : ''} ${timeLeft === 0 ? 'verify-timer--expired' : ''}`}>
            <FontAwesomeIcon icon={faClock} />
            <span>Code expires in: <strong>{formatTime(timeLeft)}</strong></span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="verify-form">
            <div className="verify-code-inputs" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="verify-code-input"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="verify-error-message fade-in">
                <FontAwesomeIcon icon={faExclamationCircle} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="verify-submit-button" disabled={loading || code.join('').length !== 6}>
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShieldHalved} />
                  <span>Verify Code</span>
                </>
              )}
            </button>

            <div className="verify-resend-section">
              <p>Didn't receive the code?</p>
              <button 
                type="button" 
                className="verify-resend-button" 
                onClick={handleResendCode}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faRotate} />
                <span>Resend Code</span>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="verify-footer">
            <div className="verify-divider">
              <span>or</span>
            </div>
            <button className="verify-back-link" onClick={() => {
              // Clean up login password if stored
              sessionStorage.removeItem('loginPassword');
              navigate(flowType === 'registration' ? '/register' : '/login');
            }}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>{flowType === 'registration' ? 'Use a different email' : 'Back to Login'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCodePage;
