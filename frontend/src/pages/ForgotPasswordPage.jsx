import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>Forgot Password</h1>
          <p>Enter your email address and we'll send you instructions to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError('');
                if (error) setError('');
              }}
              placeholder="your.email@szabist.pk"
              disabled={loading}
            />
            {fieldError && (
              <div className="error-message" style={{ marginTop: '0.5rem' }}>
                {fieldError}
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>

          <div className="back-to-login">
            <Link to="/login">← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
