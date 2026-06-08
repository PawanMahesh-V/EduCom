import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShieldAlt, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

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

    // Auto-advance to next input field block
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
      setError(err.response?.data?.message || 'Invalid OTP code. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="om-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="om-modal-box fade-in">
        <button className="om-close-trigger-btn" onClick={onClose} aria-label="Close verification modal">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="om-modal-header">
          <div className="om-icon-shell">
            <FontAwesomeIcon icon={faShieldAlt} />
          </div>
          <h2 className="om-modal-title">Delivery Verification</h2>
          <p className="om-modal-subtitle">Please input the 6-digit verification code provided by the seller node to securely authorize <strong>Order #{orderId}</strong>.</p>
        </div>

        <form onSubmit={handleSubmit} className="om-modal-form">
          <div className="om-inputs-sequence-row">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`om-digit-field ${error ? 'om-digit-field--error' : ''}`}
                placeholder="-"
                disabled={loading}
              />
            ))}
          </div>

          {error && <div className="om-field-error-message fade-in">{error}</div>}

          <button 
            type="submit" 
            className="om-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Authorizing Handshake...</span>
              </>
            ) : (
              <span>Complete Delivery Assignment</span>
            )}
          </button>
        </form>
     </div>
    </div>
  );
};

export default OTPModal;