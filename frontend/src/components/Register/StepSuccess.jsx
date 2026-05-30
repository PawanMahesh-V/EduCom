import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const StepSuccess = ({ onNavigateLogin }) => {
  return (
    <div className="register-success-state fade-in">
      {/* Centered Success Confirmation Branding Badge */}
      <div className="register-success-icon">
        <FontAwesomeIcon icon={faCheckCircle} />
      </div>
      
      <h2 className="register-title">Registration Submitted!</h2>
      <p className="register-subtitle">Your academic account request has been routed successfully.</p>
      
      {/* Informative Alert Pane detailing the background admin tracking routine */}
      <p className="register-success-note">
        Please wait for administrative verification review. A notification dispatch will be transmitted to your institutional inbox as soon as account workspace privileges go live.
      </p>
      
      <button 
        type="button"
        className="register-submit-button"
        onClick={onNavigateLogin}
      >
        Go to Login
      </button>
    </div>
  );
};

export default StepSuccess;