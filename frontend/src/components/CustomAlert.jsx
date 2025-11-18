import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const CustomAlert = ({ message, type = 'info', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faExclamationCircle;
      case 'warning':
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Information';
    }
  };

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className={`custom-alert ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="custom-alert-header">
          <h3>
            <FontAwesomeIcon icon={getIcon()} />
            {getTitle()}
          </h3>
        </div>
        <div className="custom-alert-body">
          {message}
        </div>
        <div className="custom-alert-footer">
          <button className="custom-alert-button primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
