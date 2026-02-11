import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const StepSuccess = ({ onNavigateLogin }) => {
  return (
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
        onClick={onNavigateLogin}
      >
        Go to Login
      </button>
    </div>
  );
};

export default StepSuccess;
