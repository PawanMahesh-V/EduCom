import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faArrowLeft, faShoppingBag, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const orderId = searchParams.get('order_id') || searchParams.get('basket_id');
  const errCode = searchParams.get('err_code');
  const statusParam = searchParams.get('status');
  const simulated = searchParams.get('simulated');

  const role = user?.role;

  const getDashboardPath = () => {
    if (!role) return '/';
    const r = role.toLowerCase();
    if (r === 'admin') return '/admin';
    if (r === 'student') return '/student';
    if (['teacher', 'hod', 'pm'].includes(r)) return '/teacher';
    return '/';
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!orderId) {
          setErrorMessage('No order reference found.');
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        const queryParams = searchParams.toString();
        const response = await api.get(`${API_BASE_URL}/marketplace/orders/payfast/verify?${queryParams}`);
        
        const payfastErrorMap = {
          '017': 'Invalid Card Details or Card Not Supported.',
          '024': 'Transaction declined by issuer. Please check your balance.',
          '90': 'Payment Gateway Error (System Malfunction). The PayFast sandbox may be temporarily unavailable or rejecting this amount.',
          '99': 'Transaction Cancelled by User.'
        };
        
        if (response && response.success) {
          setIsSuccess(true);
        } else {
          setIsSuccess(false);
          let finalMsg = response.message || searchParams.get('err_msg');
          if (!finalMsg || finalMsg.trim() === '' || finalMsg === 'No error message') {
            finalMsg = payfastErrorMap[errCode] || 'Payment failed or was cancelled.';
          }
          setErrorMessage(finalMsg);
        }
      } catch (error) {
        setIsSuccess(false);
        setErrorMessage(typeof error === 'string' ? error : (error.message || 'An error occurred during verification.'));
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, orderId, statusParam, errCode]);

  if (loading) {
    return (
      <div className="pc-viewport-wrapper">
        <div className="pc-status-card">
          <div className="pc-spinner-ring"><FontAwesomeIcon icon={faSpinner} spin /></div>
          <h2 className="pc-status-title">Verifying Payment...</h2>
          <p className="pc-status-desc">Please do not navigate away from this gateway portal.</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (isSuccess) {
      return {
        icon: faCheckCircle,
        iconClass: 'pc-icon-shell--success',
        title: 'Payment Successful!',
        desc: (
          <>
            Thank you for your purchase! Your order <strong>#{orderId}</strong> has been finalized.
            {simulated && <span className="pc-simulated-note">(Simulated transaction for presentation)</span>}
          </>
        )
      };
    }

    const upperMsg = errorMessage ? errorMessage.toUpperCase() : '';
    const err = searchParams.get('err_code') || '';
    
    if (upperMsg.includes('CANCELLED') || err === 'CANCELLED' || err === '99') {
      return {
        icon: faTimesCircle,
        iconClass: 'pc-icon-shell--error',
        title: 'Authentication Cancelled',
        desc: 'You cancelled the authentication challenge. The transaction could not be completed.'
      };
    }

    if (err === 'N' || upperMsg.includes('TRANSACTION DENIED') || upperMsg.includes('NOT VERIFIED')) {
      return {
        icon: faTimesCircle,
        iconClass: 'pc-icon-shell--error',
        title: 'Transaction Denied',
        desc: 'Not Authenticated / Account Not Verified. Your transaction has been declined.'
      };
    }
    
    if (err === 'U' || upperMsg.includes('NOT AVAILABLE')) {
      return {
        icon: faExclamationTriangle,
        iconClass: 'pc-icon-shell--warning',
        title: 'Authentication Not Available',
        desc: 'Authentication could not be performed due to technical issues or your issuer not participating. Please try again later.'
      };
    }

    if (err === 'R' || upperMsg.includes('REJECTED')) {
      return {
        icon: faTimesCircle,
        iconClass: 'pc-icon-shell--error',
        title: 'Authentication Rejected',
        desc: 'Your card issuer explicitly rejected the authentication request.'
      };
    }

    if (err === 'E' || upperMsg.includes('SERVER ERROR')) {
      return {
        icon: faExclamationTriangle,
        iconClass: 'pc-icon-shell--warning',
        title: 'Authentication Server Error',
        desc: 'A server-side error occurred during authentication. Please try again.'
      };
    }

    if (err === 'AI' || upperMsg.includes('ASM POLICY')) {
      return {
        icon: faTimesCircle,
        iconClass: 'pc-icon-shell--error',
        title: 'API Gateway Policy Error',
        desc: 'Internal testing error related to API Gateway security/policy rules.'
      };
    }

    return {
      icon: faTimesCircle,
      iconClass: 'pc-icon-shell--error',
      title: 'Payment Failed',
      desc: errorMessage || "We couldn't process your payment. Please try again or choose a different payment method."
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="pc-viewport-wrapper">
      <div className="pc-status-card fade-in">
        <div className={`pc-icon-shell ${statusInfo.iconClass}`}>
          <FontAwesomeIcon icon={statusInfo.icon} />
        </div>
        <h1 className="pc-status-title">{statusInfo.title}</h1>
        <p className="pc-status-desc">
          {statusInfo.desc}
        </p>

        <div className="pc-action-cluster">
          <button 
            className="pc-btn pc-btn--primary" 
            onClick={() => navigate(getDashboardPath(), { state: { activeSection: 'marketplace', activeTab: 'orders' } })}
          >
            <FontAwesomeIcon icon={faShoppingBag} />
            <span>Go to My Orders</span>
          </button>
          <button 
            className="pc-btn pc-btn--secondary" 
            onClick={() => navigate(getDashboardPath(), { state: { activeSection: 'marketplace', activeTab: 'items' } })}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Marketplace</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;