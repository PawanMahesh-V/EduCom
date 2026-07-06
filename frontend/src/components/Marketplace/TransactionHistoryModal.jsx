import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHistory, faCheckCircle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const TransactionHistoryModal = ({ isOpen, onClose, orders }) => {
  if (!isOpen) return null;

  // Filter logic remains unchanged
  const completedTransactions = orders.filter(o => o.status !== 'cancelled' && o.status !== 'cancelled_by_buyer' && o.status !== 'refunded');
  
  const totalEarned = completedTransactions.reduce((sum, order) => {
    return sum + order.items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  }, 0);

  return (
    <div className="th-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="th-modal-box fade-in">
        
        {/* Header */}
        <div className="th-modal-header">
          <div className="th-header-title-stack">
            <FontAwesomeIcon icon={faHistory} />
            <h3>Transaction History</h3>
          </div>
          <button className="th-close-trigger-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Total Summary Card */}
        <div className="th-summary-card">
          <span className="th-summary-label">Lifetime Earnings:</span>
          <span className="th-summary-value">Rs. {totalEarned.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
        </div>

        {/* Scrollable List */}
        <div className="th-transactions-list">
          {completedTransactions.length === 0 ? (
            <div className="th-empty-state">
              <FontAwesomeIcon icon={faBoxOpen} className="th-empty-icon" />
              <p>No completed transactions found in your history.</p>
            </div>
          ) : (
            completedTransactions.map(order => {
              const orderTotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
              return (
                <div key={order.id} className="th-transaction-row">
                  <div className="th-transaction-info">
                    <div className="th-transaction-meta">
                      <span className="th-order-id">Order #{order.id}</span>
                      <span className={`th-status-badge th-status-badge--${order.status}`}>
                        {order.status === 'completed' && <FontAwesomeIcon icon={faCheckCircle} />}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="th-buyer-identity">
                      Buyer: <strong>{order.buyer_name || order.full_name || 'Anonymous'}</strong>
                    </div>
                    <div className="th-item-manifest">
                      {order.items.map(item => `${item.title} (x${item.quantity})`).join(', ')}
                    </div>
                  </div>
                  
                  <div className="th-transaction-financials">
                    <span className="th-price-value">+ Rs. {orderTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    {/* <span className="th-payment-type">Cash on Delivery</span> */}
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