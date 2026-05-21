import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faArrowLeft, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import '../styles/Marketplace.css'; // Reuse marketplace styles
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

        const validationHash = searchParams.get('validation_hash');

        if (validationHash) {
          console.log('[PaymentCallback] Initiating backend hash verification for order:', orderId);
          // Convert searchParams to a string to pass along
          const queryParams = searchParams.toString();
          const response = await api.get(`${API_BASE_URL}/marketplace/orders/payfast/verify?${queryParams}`);
          
          console.log('[PaymentCallback] Backend verification response:', response);
          if (response && response.success) {
            setIsSuccess(true);
          } else {
            setIsSuccess(false);
            setErrorMessage(response.message || 'Payment verification failed.');
          }
        } else {
          // Fallback logic for legacy/simulated checkout URLs
          if (statusParam === 'success' || errCode === '000') {
            setIsSuccess(true);
          } else {
            setIsSuccess(false);
            setErrorMessage('Payment failed or cancelled.');
          }
        }
      } catch (error) {
        console.error('[PaymentCallback] Verification error:', error);
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
      <div className="marketplace-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="marketplace-loading"></div>
          <h2 style={{ marginTop: '20px', color: 'var(--color-dark)' }}>Verifying Payment...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Please do not close this window.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: 'var(--shadow-xl)', 
        maxWidth: '500px', 
        width: '90%', 
        textAlign: 'center',
        border: '1px solid var(--color-medium-light)'
      }}>
        {isSuccess ? (
          <>
            <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '80px', color: '#10b981', marginBottom: '20px' }} />
            <h1 style={{ fontSize: '28px', color: 'var(--color-dark)', marginBottom: '12px' }}>Payment Successful!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: '1.6' }}>
              Thank you for your purchase! Your order <strong>#{orderId}</strong> has been placed and the seller has been notified.
              {simulated && <span style={{ display: 'block', marginTop: '10px', fontStyle: 'italic', fontSize: '12px' }}>(This was a simulated transaction for FYP presentation)</span>}
            </p>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '80px', color: '#ef4444', marginBottom: '20px' }} />
            <h1 style={{ fontSize: '28px', color: 'var(--color-dark)', marginBottom: '12px' }}>Payment Failed</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: '1.6' }}>
              {errorMessage || "We couldn't process your payment. Please try again or choose a different payment method."}
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            className="button primary" 
            onClick={() => navigate(getDashboardPath(), { state: { activeSection: 'marketplace', activeTab: 'orders' } })}
            style={{ padding: '12px 24px' }}
          >
            <FontAwesomeIcon icon={faShoppingBag} style={{ marginRight: '8px' }} />
            Go to My Orders
          </button>
          <button 
            className="button secondary" 
            onClick={() => navigate(getDashboardPath(), { state: { activeSection: 'marketplace', activeTab: 'items' } })}
            style={{ padding: '12px 24px' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
            Back to Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
