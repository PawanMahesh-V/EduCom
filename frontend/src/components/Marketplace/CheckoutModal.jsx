import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faShoppingBag, faMapMarkerAlt, faCreditCard,
  faMobileAlt, faMoneyBillWave, faCheckCircle, faChevronRight,
  faUser, faPhone, faEnvelope, faUniversity
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/CheckoutModal.css';
import api from '../../api/client';
import API_BASE_URL from '../../config/api';
import CustomSelect from '../Common/CustomSelect';
import { showError } from '../../utils/alert';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: faMoneyBillWave, desc: 'Pay when you receive' },
  { id: 'easypaisa', label: 'Easypaisa', icon: faMobileAlt, desc: 'Mobile wallet payment' },
  { id: 'jazzcash', label: 'JazzCash', icon: faMobileAlt, desc: 'Mobile wallet payment' },
  { id: 'bank', label: 'Bank Transfer', icon: faUniversity, desc: 'Direct bank transfer' },
];

const STEPS = ['Order Review', 'Contact Info', 'Payment', 'Confirm'];

const CheckoutModal = ({ isOpen, onClose, cartItems, cartTotal, onOrderPlaced, currentUser }) => {
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    campus: 'SZABIST Campus',
    pickupNote: '',
  });
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handlePlaceOrder = async () => {
    try {
      setPlacing(true);
      const orderData = {
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        campus: form.campus,
        pickup_note: form.pickupNote,
        payment_method: paymentMethod,
        total_amount: cartTotal,
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          qty: item.qty || 1
        }))
      };

      await api.post(`${API_BASE_URL}/marketplace/orders`, orderData);
      
      setPlacing(false);
      setPlaced(true);
      
      setTimeout(() => {
        setPlaced(false);
        setStep(0);
        setForm({ fullName: currentUser?.name || '', email: currentUser?.email || '', phone: '', campus: 'SZABIST Campus', pickupNote: '' });
        setPaymentMethod('cod');
        if (onOrderPlaced) onOrderPlaced();
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Failed to place order:', error);
      showError('Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  const canProceedStep1 = form.fullName.trim() && form.email.trim() && form.phone.trim();

  return (
    <div className="checkout-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkout-modal">

        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-header-left">
            <FontAwesomeIcon icon={faShoppingBag} className="checkout-header-icon" />
            <div>
              <h2 className="checkout-title">Checkout</h2>
              <p className="checkout-subtitle">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="checkout-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="checkout-steps">
          {STEPS.map((label, i) => (
            <div key={i} className={`checkout-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-circle">{i < step ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}</div>
              <span className="step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="checkout-body">

          {/* ─── STEP 0: Order Review ─── */}
          {step === 0 && (
            <div className="checkout-section">
              <h3 className="section-title">Review Your Order</h3>
              <div className="checkout-items-list">
                {cartItems.map(item => {
                  const price = parseFloat(item.price);
                  return (
                    <div key={item.id} className="checkout-item-row">
                      <img
                        src={item.image_url || '/assets/marketplace/textbook.png'}
                        alt={item.title}
                        className="checkout-item-img"
                      />
                      <div className="checkout-item-info">
                        <div className="checkout-item-title">{item.title}</div>
                        <div className="checkout-item-meta">{item.category} · Seller: {item.seller_name || 'User'}</div>
                        <div className="checkout-item-qty">Qty: {item.qty || 1}</div>
                      </div>
                      <div className="checkout-item-price">
                        Rs. {!isNaN(price) ? (price * (item.qty || 1)).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="checkout-order-summary">
                <div className="summary-row"><span>Subtotal</span><span>Rs. {cartTotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Delivery</span><span className="free-tag">Free (Campus Pickup)</span></div>
                <div className="summary-row total-row"><span>Total</span><span>Rs. {cartTotal.toFixed(2)}</span></div>
              </div>
            </div>
          )}

          {/* ─── STEP 1: Contact Info ─── */}
          {step === 1 && (
            <div className="checkout-section">
              <h3 className="section-title">Contact & Pickup Info</h3>
              <div className="checkout-form">
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faUser} /> Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faEnvelope} /> Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faPhone} /> Phone Number</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="03xx-xxxxxxx" />
                </div>
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faMapMarkerAlt} /> Pickup Campus</label>
                  <CustomSelect
                    options={[
                      { value: 'SZABIST Campus', label: 'SZABIST Campus' },
                      { value: 'Main Library', label: 'Main Library' },
                      { value: 'Student Center', label: 'Student Center' },
                      { value: 'Cafeteria Area', label: 'Cafeteria Area' }
                    ]}
                    value={form.campus}
                    onChange={(val) => setForm({ ...form, campus: val })}
                  />
                </div>
                <div className="checkout-field">
                  <label>Pickup Note (Optional)</label>
                  <textarea
                    name="pickupNote"
                    value={form.pickupNote}
                    onChange={handleChange}
                    rows="3"
                    placeholder="e.g. I'm available after 2PM on weekdays..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Payment ─── */}
          {step === 2 && (
            <div className="checkout-section">
              <h3 className="section-title">Select Payment Method</h3>
              <div className="payment-methods-grid">
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.id}
                    className={`payment-card ${paymentMethod === pm.id ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(pm.id)}
                  >
                    <div className="payment-card-icon">
                      <FontAwesomeIcon icon={pm.icon} />
                    </div>
                    <div className="payment-card-info">
                      <div className="payment-card-label">{pm.label}</div>
                      <div className="payment-card-desc">{pm.desc}</div>
                    </div>
                    <div className={`payment-radio ${paymentMethod === pm.id ? 'checked' : ''}`} />
                  </div>
                ))}
              </div>

              {paymentMethod !== 'cod' && (
                <div className="payment-note">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>You'll receive payment instructions after placing the order.</span>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: Confirm ─── */}
          {step === 3 && !placed && (
            <div className="checkout-section">
              <h3 className="section-title">Order Summary</h3>

              <div className="confirm-grid">
                <div className="confirm-block">
                  <div className="confirm-block-title">Items ({cartItems.length})</div>
                  {cartItems.map(item => (
                    <div key={item.id} className="confirm-item">
                      <span>{item.title}</span>
                      <span>Rs. {(parseFloat(item.price) * (item.qty || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="confirm-block">
                  <div className="confirm-block-title">Contact</div>
                  <div className="confirm-detail">{form.fullName}</div>
                  <div className="confirm-detail">{form.email}</div>
                  <div className="confirm-detail">{form.phone}</div>
                </div>
                <div className="confirm-block">
                  <div className="confirm-block-title">Pickup</div>
                  <div className="confirm-detail">{form.campus}</div>
                  {form.pickupNote && <div className="confirm-detail muted">{form.pickupNote}</div>}
                </div>
                <div className="confirm-block">
                  <div className="confirm-block-title">Payment</div>
                  <div className="confirm-detail">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</div>
                </div>
              </div>

              <div className="checkout-order-summary" style={{ marginTop: '20px' }}>
                <div className="summary-row total-row">
                  <span>Total Payable</span>
                  <span>Rs. {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── SUCCESS ─── */}
          {placed && (
            <div className="checkout-success">
              <div className="success-icon-wrap">
                <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
              </div>
              <h3 className="success-title">Order Placed!</h3>
              <p className="success-msg">
                Your order has been submitted successfully. The seller will contact you at <strong>{form.email}</strong> or <strong>{form.phone}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {!placed && (
          <div className="checkout-footer">
            {step > 0 && (
              <button className="checkout-btn secondary" onClick={handleBack}>Back</button>
            )}
            <div className="checkout-footer-right">
              <span className="checkout-total-label">Total: <strong>Rs. {cartTotal.toFixed(2)}</strong></span>
              {step < STEPS.length - 1 ? (
                <button
                  className="checkout-btn primary"
                  onClick={handleNext}
                  disabled={step === 1 && !canProceedStep1}
                >
                  Continue <FontAwesomeIcon icon={faChevronRight} />
                </button>
              ) : (
                <button
                  className="checkout-btn primary place-order"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
