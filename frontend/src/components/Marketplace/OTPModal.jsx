import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShieldAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './OTPModal.css';

const OTPModal = ({ isOpen, onClose, onVerify, orderId }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onVerify(orderId, fullOtp);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-content">
        <button className="otp-modal-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="otp-modal-header">
          <div className="otp-icon-wrapper">
            <FontAwesomeIcon icon={faShieldAlt} />
          </div>
          <h2>Delivery Verification</h2>
          <p>Please enter the 6-digit OTP provided by the seller for Order #{orderId}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={error ? 'otp-input error' : 'otp-input'}
                placeholder="-"
              />
            ))}
          </div>

          {error && <div className="otp-error-message">{error}</div>}

          <button 
            type="submit" 
            className={`otp-submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Complete Delivery'}
          </button>
        </form>

        <div className="otp-modal-footer">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Secure marketplace transaction</span>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
