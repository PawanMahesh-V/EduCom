import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHistory, faCheckCircle, faBoxOpen, faBan } from '@fortawesome/free-solid-svg-icons';

const TransactionHistoryModal = ({ isOpen, onClose, orders }) => {
  if (!isOpen) return null;

  // Filter out completely cancelled or refunded orders for earnings calculation
  const completedTransactions = orders.filter(o => o.status !== 'cancelled' && o.status !== 'cancelled_by_buyer' && o.status !== 'refunded');
  
  const totalEarned = completedTransactions.reduce((sum, order) => {
    return sum + order.items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  }, 0);

  return (
    <div className="checkout-overlay" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkout-modal" style={{ maxWidth: '600px', width: '90%', padding: '24px 32px', margin: 0, height: 'auto', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ backgroundColor: '#0d627a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', margin: '-24px -32px 24px -32px', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
            <FontAwesomeIcon icon={faHistory} style={{ fontSize: '1.2rem' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Transaction History</h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '1rem' }} />
          </button>
        </div>

        {/* Total Summary */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>Lifetime Earnings:</span>
          <span style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '700' }}>Rs. {totalEarned.toFixed(2)}</span>
        </div>

        {/* Scrollable List */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {completedTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '2.5rem', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>No completed transactions yet.</p>
            </div>
          ) : (
            completedTransactions.map(order => {
              const orderTotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
              return (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>Order #{order.id}</span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: order.status === 'completed' ? '#dcfce7' : '#f1f5f9', color: order.status === 'completed' ? '#166534' : '#475569', fontWeight: '500' }}>
                        {order.status === 'completed' ? <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '4px' }}/> : null}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Buyer: <strong>{order.buyer_name || order.full_name || 'Anonymous'}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {order.items.map(item => `${item.title} (x${item.quantity})`).join(', ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#059669' }}>+ Rs. {orderTotal.toFixed(2)}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cash on Delivery
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
