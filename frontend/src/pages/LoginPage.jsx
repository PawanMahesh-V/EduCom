import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import { login } from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [isRegId, setIsRegId] = useState(true);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(formData.identifier, formData.password);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('userToken', response.token);

      // Redirect based on user role
      switch (response.user.role) {
        case 'Admin':
          navigate('/admin');
          break;
        case 'Teacher':
          navigate('/teacher');
          break;
        case 'Student':
          navigate('/student');
          break;
        case 'HOD':
          navigate('/hod');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
  };

  const toggleIdentifierType = () => {
    setIsRegId(!isRegId);
    setFormData(prev => ({
      ...prev,
      identifier: ''
    }));
  };

  return (
    <div className="login-container">
      
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="identifier">
              Registration ID
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              placeholder="Enter your SZABIST E-mail"
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#forgot-password" className="forgot-inline">Forgot password?</a>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-submit">
            Sign In
          </button>

          <div className="login-footer">
            <div className="divider">Don't have an account?</div>
            <div className="contact">Contact your administrator to create an account</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;