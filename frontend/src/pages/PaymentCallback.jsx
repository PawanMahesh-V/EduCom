import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faArrowLeft, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import '../styles/Marketplace.css'; // Reuse marketplace styles

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const simulated = searchParams.get('simulated');

  useEffect(() => {
    // Simulate a brief verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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

  const isSuccess = status === 'success';

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
              We couldn't process your payment. Please try again or choose a different payment method.
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            className="button primary" 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '12px 24px' }}
          >
            <FontAwesomeIcon icon={faShoppingBag} style={{ marginRight: '8px' }} />
            Go to My Orders
          </button>
          <button 
            className="button secondary" 
            onClick={() => navigate('/marketplace')}
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
