import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faShoppingBag, faMapMarkerAlt,
  faCreditCard, faMoneyBillWave, faCheckCircle, faChevronRight,
  faUser, faPhone, faEnvelope, faSpinner, faLock
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/CheckoutModal.css';
import api from '../../api/client';
import API_BASE_URL from '../../config/api';
import CustomSelect from '../Common/CustomSelect';
import { showError } from '../../utils/alert';

// ─── Payment Options ────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when you receive the item',
    icon: faMoneyBillWave,
    color: '#10b981',
  },
  {
    id: 'payfast',
    label: 'PayFast',
    desc: 'Pay securely via card, bank or mobile wallet',
    icon: faCreditCard,
    color: '#0d627a',
  },
];

const STEPS = ['Order Review', 'Contact Info', 'Payment', 'Confirm'];

// ─── Dynamically load the GoPayFast onsite engine script ────────────────────
const loadPayFastEngine = (engineUrl) =>
  new Promise((resolve, reject) => {
    if (typeof window.payfast_do_onsite_payment === 'function') {
      resolve();
      return;
    }
    // Remove any stale script tag first
    const existing = document.getElementById('pf-engine-script');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id   = 'pf-engine-script';
    script.src  = engineUrl || 'https://sandbox.gopayfast.com/onsite/engine.js';
    script.onload  = resolve;
    script.onerror = () => reject(new Error('Failed to load PayFast engine'));
    document.head.appendChild(script);
  });

// ─── Component ────────────────────────────────────────────────────────────────
const CheckoutModal = ({ isOpen, onClose, cartItems, cartTotal, onOrderPlaced, currentUser }) => {
  const [step, setStep]                 = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm]                 = useState({
    fullName:   currentUser?.name  || '',
    email:      currentUser?.email || '',
    phone:      '',
    campus:     'SZABIST Campus',
    pickupNote: '',
  });
  const [placing, setPlacing] = useState(false);
  const [placed,  setPlaced]  = useState(false);
  const [pfStatus, setPfStatus] = useState(''); // '' | 'loading' | 'redirecting'

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'phone') value = value.replace(/\D/g, '').slice(0, 11);
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const isPhoneValid    = /^03\d{9}$/.test(form.phone.trim());
  const canProceedStep1 = form.fullName.trim() && form.email.trim() && isPhoneValid;

  const resetModal = () => {
    setPlaced(false);
    setStep(0);
    setForm({
      fullName:   currentUser?.name  || '',
      email:      currentUser?.email || '',
      phone:      '',
      campus:     'SZABIST Campus',
      pickupNote: '',
    });
    setPaymentMethod('cod');
    setPfStatus('');
  };

  // ── Place Order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    try {
      setPlacing(true);

      const orderData = {
        full_name:      form.fullName,
        email:          form.email,
        phone:          form.phone,
        campus:         form.campus,
        pickup_note:    form.pickupNote,
        payment_method: paymentMethod,
        total_amount:   cartTotal,
        items:          cartItems.map(item => ({
          id:    item.id,
          title: item.title,
          price: item.price,
          qty:   item.qty || 1,
        })),
      };

      // ── PayFast flow ──────────────────────────────────────────────────
      if (paymentMethod === 'payfast') {
        setPfStatus('loading');

        const response = await api.post(
          `${API_BASE_URL}/marketplace/orders/payfast/initiate`,
          orderData
        );

        if (!response.success) {
          throw new Error('PayFast initiation failed');
        }

        // ── ONSITE POPUP MODE ─────────────────────────────────────────
        if (response.mode === 'onsite' && response.uuid) {
          try {
            await loadPayFastEngine(response.engineUrl);

            // window.payfast_do_onsite_payment is now available
            window.payfast_do_onsite_payment(
              { uuid: response.uuid },
              async (result) => {
                if (result === true) {
                  // Payment confirmed by popup
                  setPlacing(false);
                  setPfStatus('');
                  setPlaced(true);
                  setTimeout(() => {
                    resetModal();
                    if (onOrderPlaced) onOrderPlaced();
                    onClose();
                  }, 2500);
                } else {
                  // User closed / cancelled the popup
                  setPlacing(false);
                  setPfStatus('');
                  showError('Payment was cancelled. Your order has not been placed.');
                }
              }
            );
            return; // wait for popup callback
          } catch (engineErr) {
            console.warn('[PayFast] Engine load failed, falling back to redirect:', engineErr.message);
            // Fall through to redirect mode below
          }
        }

        // ── REDIRECT MODE (fallback) ──────────────────────────────────
        setPfStatus('redirecting');
        const payload    = response.payload || {};
        const paymentUrl = response.paymentUrl;

        if (paymentUrl && Object.keys(payload).length > 0) {
          // Build a hidden form and submit it
          const formEl = document.createElement('form');
          formEl.method = 'POST';
          formEl.action = paymentUrl;
          Object.keys(payload).forEach(key => {
            const input   = document.createElement('input');
            input.type    = 'hidden';
            input.name    = key;
            input.value   = payload[key];
            formEl.appendChild(input);
          });
          document.body.appendChild(formEl);
          formEl.submit();
        } else if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          throw new Error('No payment URL returned');
        }
        return;
      }

      // ── Cash on Delivery flow ─────────────────────────────────────────
      await api.post(`${API_BASE_URL}/marketplace/orders`, orderData);
      setPlacing(false);
      setPlaced(true);
      setTimeout(() => {
        resetModal();
        if (onOrderPlaced) onOrderPlaced();
        onClose();
      }, 2500);

    } catch (error) {
      console.error('[Checkout] Failed to place order:', error);
      showError('Failed to place order. Please try again.');
      setPlacing(false);
      setPfStatus('');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
              <div className="step-circle">
                {i < step ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}
              </div>
              <span className="step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Body */}
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
                  <input name="fullName" value={form.fullName} readOnly className="readonly-field" />
                </div>
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faEnvelope} /> Email</label>
                  <input name="email" type="email" value={form.email} readOnly className="readonly-field" />
                </div>
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faPhone} /> Phone Number</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="03xx-xxxxxxx" />
                  {form.phone.length > 0 && !isPhoneValid && (
                    <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      {form.phone.length !== 11 ? 'Phone number must be exactly 11 digits.' : 'Phone number is invalid'}
                    </span>
                  )}
                </div>
                <div className="checkout-field">
                  <label><FontAwesomeIcon icon={faMapMarkerAlt} /> Pickup Campus</label>
                  <CustomSelect
                    options={[
                      { value: '79 Campus',  label: '79 Campus'  },
                      { value: '98 Campus',  label: '98 Campus'  },
                      { value: '99 Campus',  label: '99 Campus'  },
                      { value: '100 Campus', label: '100 Campus' },
                      { value: '153 Campus', label: '153 Campus' },
                      { value: '154 Campus', label: '154 Campus' },
                      { value: '172 Campus', label: '172 Campus' },
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

          {/* ─── STEP 2: Payment Method ─── */}
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
                    <div className="payment-card-icon" style={{ color: pm.color }}>
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

              {/* PayFast info box */}
              {paymentMethod === 'payfast' && (
                <div className="payment-note pf-info">
                  <FontAwesomeIcon icon={faLock} />
                  <span>
                    You'll be redirected to PayFast Pakistan's secure payment portal. Powered by{' '}
                    <strong>gopayfast.com</strong>.
                  </span>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="payment-note">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Pay the seller in cash when you pick up your item on campus.</span>
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
                  <div className="confirm-detail">
                    <FontAwesomeIcon
                      icon={paymentMethod === 'payfast' ? faCreditCard : faMoneyBillWave}
                      style={{ marginRight: '6px', color: paymentMethod === 'payfast' ? '#0d627a' : '#10b981' }}
                    />
                    {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}
                  </div>
                  {paymentMethod === 'payfast' && (
                    <div className="confirm-detail muted" style={{ fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faLock} style={{ marginRight: '4px' }} />
                      Powered by gopayfast.com
                    </div>
                  )}
                </div>
              </div>

              <div className="checkout-order-summary" style={{ marginTop: '20px' }}>
                <div className="summary-row total-row">
                  <span>Total Payable</span>
                  <span>Rs. {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* PayFast loading/redirecting overlay message */}
              {pfStatus === 'loading' && (
                <div className="pf-loading-msg">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  &nbsp; Connecting to PayFast Pakistan…
                </div>
              )}
              {pfStatus === 'redirecting' && (
                <div className="pf-loading-msg">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  &nbsp; Redirecting to PayFast Pakistan payment page…
                </div>
              )}
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
                Your order has been submitted successfully. The seller will contact you at{' '}
                <strong>{form.email}</strong> or <strong>{form.phone}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!placed && (
          <div className="checkout-footer">
            {step > 0 && (
              <button className="checkout-btn secondary" onClick={handleBack} disabled={placing}>
                Back
              </button>
            )}
            <div className="checkout-footer-right">
              <span className="checkout-total-label">
                Total: <strong>Rs. {cartTotal.toFixed(2)}</strong>
              </span>
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
                  {placing
                    ? <><FontAwesomeIcon icon={faSpinner} spin />&nbsp;{pfStatus === 'loading' ? 'Connecting…' : 'Placing…'}</>
                    : paymentMethod === 'payfast'
                      ? <><FontAwesomeIcon icon={faLock} />&nbsp;Pay with PayFast</>
                      : 'Place Order'
                  }
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
