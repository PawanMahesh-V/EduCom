import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faArrowLeft, faShoppingBag, faSpinner } from '@fortawesome/free-solid-svg-icons';
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

  return (
    <div className="pc-viewport-wrapper">
      <div className="pc-status-card fade-in">
        {isSuccess ? (
          <>
            <div className="pc-icon-shell pc-icon-shell--success">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h1 className="pc-status-title">Payment Successful!</h1>
            <p className="pc-status-desc">
              Thank you for your purchase! Your order <strong>#{orderId}</strong> has been finalized.
              {simulated && <span className="pc-simulated-note">(Simulated transaction for presentation)</span>}
            </p>
          </>
        ) : (
          <>
            <div className="pc-icon-shell pc-icon-shell--error">
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <h1 className="pc-status-title">Payment Failed</h1>
            <p className="pc-status-desc">
              {errorMessage || "We couldn't process your payment. Please try again or choose a different payment method."}
            </p>
          </>
        )}

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