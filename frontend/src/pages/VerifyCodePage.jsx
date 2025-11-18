import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const VerifyCodePage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (!storedEmail) {
      navigate('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
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
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('resetToken', data.resetToken);
        navigate('/reset-password');
      } else {
        setError(data.message || 'Invalid verification code');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('New code sent to your email!');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-code-page">
      <div className="verify-code-container">
        <div className="verify-code-header">
          <h1>Enter Verification Code</h1>
          <p>We sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="verify-code-form">
          <div className="code-inputs" onPaste={handlePaste}>
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
                className="code-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading || code.join('').length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button 
              type="button" 
              className="resend-btn" 
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </button>
          </div>

          <div className="back-to-login">
            <Link to="/login">← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyCodePage;
