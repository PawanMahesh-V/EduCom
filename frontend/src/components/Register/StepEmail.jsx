import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const StepEmail = ({ email, setEmail, loading, error, fieldErrors, onSubmit, onBack, setFieldErrors, setError }) => {
  return (
    <>
      <div className="register-welcome">
        <h1 className="register-title">Create Your Account</h1>
        <p className="register-subtitle">Enter your email address and we'll send you a verification code to get started.</p>
      </div>

      <form className="register-form" onSubmit={onSubmit}>
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
              placeholder="your.email@szabist.pk or @szabist.edu.pk"
              disabled={loading}
              autoFocus
            />
          </div>
          {fieldErrors.email && (
             <div className="register-error-message fade-in mt-1">
                 <span className="field-error-text">{fieldErrors.email}</span>
             </div>
          )}
        </div>

        {error && (
          <div className="register-error-message fade-in">
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
        <button className="register-back-link" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Login</span>
        </button>
      </div>
    </>
  );
};

export default StepEmail;
