import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faShoppingBag, faMapMarkerAlt,
  faCreditCard, faMoneyBillWave, faCheckCircle, faChevronRight,
  faUser, faPhone, faEnvelope, faSpinner, faLock, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import API_BASE_URL from '../../config/api';
import CustomSelect from '../Common/CustomSelect';
import { showError } from '../../utils/alert';

// ─── Payment Options Options ────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay the seller manually upon item pickup on campus',
    icon: faMoneyBillWave,
    color: '#10b981',
  },
  {
    id: 'payfast',
    label: 'PayFast Secure Gateway',
    desc: 'Pay securely instantly via bank accounts, card or mobile wallets',
    icon: faCreditCard,
    color: '#064e3b',
  },
];

const STEPS = ['Order Review', 'Contact Info', 'Payment Option', 'Confirmation'];

// ─── Dynamically load the GoPayFast onsite engine script ────────────────────
const loadPayFastEngine = (engineUrl) =>
  new Promise((resolve, reject) => {
    if (typeof window.payfast_do_onsite_payment === 'function') {
      resolve();
      return;
    }
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
    campus:     '79 Campus',
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
      campus:     '79 Campus',
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

            window.payfast_do_onsite_payment(
              { uuid: response.uuid },
              async (result) => {
                if (result === true) {
                  setPlacing(false);
                  setPfStatus('');
                  setPlaced(true);
                  setTimeout(() => {
                    resetModal();
                    if (onOrderPlaced) onOrderPlaced();
                    onClose();
                  }, 2500);
                } else {
                  setPlacing(false);
                  setPfStatus('');
                  showError('Payment was cancelled. Your order has not been placed.');
                }
              }
            );
            return; 
          } catch (engineErr) {
            console.warn('[PayFast] Engine load failed, falling back to redirect:', engineErr.message);
          }
        }

        // ── REDIRECT MODE (fallback) ──────────────────────────────────
        setPfStatus('redirecting');
        const payload    = response.payload || {};
        const paymentUrl = response.paymentUrl;

        if (paymentUrl && Object.keys(payload).length > 0) {
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
      console.error(error);
      showError('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
      setPfStatus('');
    }
  };

  return (
    <div className="ck-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ck-modal-box fade-in">

        {/* Header Title Section */}
        <div className="ck-modal-header">
          <div className="ck-header-profile-block">
            <div className="ck-header-icon-shell">
              <FontAwesomeIcon icon={faShoppingBag} />
            </div>
            <div className="ck-header-text-stack">
              <h2 className="ck-modal-title">Checkout</h2>
              <p className="ck-modal-subtitle">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
            </div>
          </div>
          <button className="ck-close-trigger-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Step Flow Tracker Matrix */}
        {!placed && (
          <div className="ck-step-flow-bar">
            {STEPS.map((label, i) => (
              <div key={i} className={`ck-step-node ${i === step ? 'ck-step-node--active' : ''} ${i < step ? 'ck-step-node--done' : ''}`}>
                <div className="ck-step-badge">
                  {i < step ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}
                </div>
                <span className="ck-step-label">{label}</span>
                {i < STEPS.length - 1 && <div className="ck-step-pipeline" />}
              </div>
            ))}
          </div>
        )}

        {/* Form Sections Viewport Render */}
        <div className="ck-modal-body-viewport">

          {/* ─── STEP 0: Item Review ─── */}
          {step === 0 && (
            <div className="ck-section-view">
              <h3 className="ck-section-heading">Review Your Order</h3>
              <div className="ck-items-list-frame">
                {cartItems.map(item => {
                  const price = parseFloat(item.price);
                  return (
                    <div key={item.id} className="ck-item-manifest-row">
                      <img
                        src={item.image_url || '/assets/marketplace/textbook.png'}
                        alt={item.title}
                        className="ck-item-thumbnail"
                      />
                      <div className="ck-item-details-stack">
                        <div className="ck-item-title-text">{item.title}</div>
                        <div className="ck-item-metadata-text">{item.category} · Seller: {item.seller_name || 'User'}</div>
                        <div className="ck-item-qty-tag">Quantity: {item.qty || 1}</div>
                      </div>
                      <div className="ck-item-calculated-price">
                        Rs. {!isNaN(price) ? (price * (item.qty || 1)).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="ck-financial-breakdown-card">
                <div className="ck-summary-row"><span>Subtotal</span><span>Rs. {cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div className="ck-summary-row"><span>Delivery</span><span className="ck-free-badge">Free (Campus Pickup)</span></div>
                <div className="ck-summary-row ck-summary-row--grand-total"><span>Total</span><span>Rs. {cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
              </div>
            </div>
          )}

          {/* ─── STEP 1: Contact Form Input Info ─── */}
          {step === 1 && (
            <div className="ck-section-view">
              <h3 className="ck-section-heading">Contact Information</h3>
              <div className="ck-form-layout-stack">
                <div className="ck-form-group">
                  <label><FontAwesomeIcon icon={faUser} /> Name</label>
                  <input name="fullName" value={form.fullName} readOnly className="ck-input-field ck-input-field--readonly" />
                </div>
                <div className="ck-form-group">
                  <label><FontAwesomeIcon icon={faEnvelope} /> Email</label>
                  <input name="email" type="email" value={form.email} readOnly className="ck-input-field ck-input-field--readonly" />
                </div>
                <div className="ck-form-group">
                  <label><FontAwesomeIcon icon={faPhone} /> Phone Number</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="e.g., 03xxxxxxxxx" className="ck-input-field" />
                  {form.phone.length > 0 && !isPhoneValid && (
                    <div className="ck-field-error-notice">
                      <FontAwesomeIcon icon={faExclamationCircle} />
                      <span>{form.phone.length !== 11 ? 'Phone number must be exactly 11 digits.' : 'Invalid format. Must start with 03.'}</span>
                    </div>
                  )}
                </div>
                <div className="ck-form-group">
                  <label><FontAwesomeIcon icon={faMapMarkerAlt} /> Pickup Campus</label>
                  <CustomSelect
                    options={[
                      { value: '79 Campus',  label: '79 Campus Block'  },
                      { value: '98 Campus',  label: '98 Campus Block'  },
                      { value: '99 Campus',  label: '99 Campus Block'  },
                      { value: '100 Campus', label: '100 Campus Block' },
                      { value: '153 Campus', label: '153 Campus Block' },
                      { value: '154 Campus', label: '154 Campus Block' },
                      { value: '172 Campus', label: '172 Campus Block' },
                    ]}
                    value={form.campus}
                    onChange={(val) => setForm({ ...form, campus: val })}
                  />
                </div>
                <div className="ck-form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    name="pickupNote"
                    value={form.pickupNote}
                    onChange={handleChange}
                    rows="3"
                    placeholder="e.g., Available after 3:00 PM..."
                    className="ck-textarea-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Secure Payment Gateway Selection ─── */}
          {step === 2 && (
            <div className="ck-section-view">
              <h3 className="ck-section-heading">Select Payment Method</h3>
              <div className="ck-payment-methods-stack">
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.id}
                    className={`ck-payment-selection-card ${paymentMethod === pm.id ? 'ck-payment-selection-card--selected' : ''}`}
                    onClick={() => setPaymentMethod(pm.id)}
                  >
                    <div className="ck-payment-card-icon-avatar" style={{ color: pm.color }}>
                      <FontAwesomeIcon icon={pm.icon} />
                    </div>
                    <div className="ck-payment-card-text-block">
                      <div className="ck-payment-card-label-title">{pm.label}</div>
                      <div className="ck-payment-card-description">{pm.desc}</div>
                    </div>
                    <div className={`ck-payment-radio-node ${paymentMethod === pm.id ? 'ck-payment-radio-node--checked' : ''}`} />
                  </div>
                ))}
              </div>

              {/* Dynamic contextual payment notice banners fields */}
              {paymentMethod === 'payfast' && (
                <div className="ck-payment-informational-box ck-payment-informational-box--payfast">
                  <FontAwesomeIcon icon={faLock} />
                  <span>You will be redirected to PayFast's secure website to complete your payment.</span>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="ck-payment-informational-box ck-payment-informational-box--cod">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Pay with cash when you pick up your order on campus.</span>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: Final Aggregate Confirmation Summary ─── */}
          {step === 3 && !placed && (
            <div className="ck-section-view">
              <h3 className="ck-section-heading">Confirm Your Order</h3>

              <div className="ck-confirmation-bento-grid">
                <div className="ck-confirm-summary-card">
                  <div className="ck-confirm-card-header">Items ({cartItems.length})</div>
                  <div className="ck-confirm-card-scroll-area">
                    {cartItems.map(item => (
                      <div key={item.id} className="ck-confirm-item-manifest-line">
                        <span className="ck-confirm-item-title-string">{item.title}</span>
                        <span className="ck-confirm-item-price-string">Rs. {(parseFloat(item.price) * (item.qty || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ck-confirm-summary-card">
                  <div className="ck-confirm-card-header">Contact Details</div>
                  <div className="ck-confirm-meta-text-line"><strong>Name:</strong> {form.fullName}</div>
                  <div className="ck-confirm-meta-text-line"><strong>Email:</strong> {form.email}</div>
                  <div className="ck-confirm-meta-text-line"><strong>Phone:</strong> {form.phone}</div>
                </div>
                <div className="ck-confirm-summary-card">
                  <div className="ck-confirm-card-header">Logistics</div>
                  <div className="ck-confirm-meta-text-line"><strong>Campus:</strong> {form.campus}</div>
                  {form.pickupNote && <div className="ck-confirm-meta-text-line ck-confirm-meta-text-line--italic">"{form.pickupNote}"</div>}
                </div>
                <div className="ck-confirm-summary-card">
                  <div className="ck-confirm-card-header">Payment Method</div>
                  <div className="ck-confirm-meta-text-line ck-confirm-meta-text-line--emerald">
                    <FontAwesomeIcon
                      icon={paymentMethod === 'payfast' ? faCreditCard : faMoneyBillWave}
                      className="mr-2"
                    />
                    <span>{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</span>
                  </div>
                </div>
              </div>

              <div className="ck-financial-breakdown-card" style={{ marginTop: '24px' }}>
                <div className="ck-summary-row ck-summary-row--grand-total">
                  <span>Total Amount</span>
                  <span>Rs. {cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* PayFast Background Thread Intercept Banners */}
              {pfStatus && (
                <div className="ck-gateway-loading-overlay-banner fade-in">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>{pfStatus === 'loading' ? 'Connecting to PayFast...' : 'Redirecting to payment gateway. Please wait...'}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── SUCCESS SCREEN VIEWPORT RENDERING FLOW ─── */}
          {placed && (
            <div className="ck-success-state-view slide-up">
              <div className="ck-success-icon-ring">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <h3 className="ck-success-headline">Order Placed!</h3>
              <p className="co-success-message">
                Your order has been placed successfully. The seller will contact you via <strong>{form.email}</strong> or <strong>{form.phone}</strong> soon.
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Footer Controlling State Navigation Buttons */}
        {!placed && (
          <div className="ck-modal-footer">
            {step > 0 && (
              <button className="ck-btn-secondary" onClick={handleBack} disabled={placing}>
                Back
              </button>
            )}
            <div className="ck-modal-footer-right-alignment">
              <span className="ck-footer-pricing-aggregate-label">
                Total Amount: <strong>Rs. {cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
              </span>
              {step < STEPS.length - 1 ? (
                <button
                  className="ck-btn-primary"
                  onClick={handleNext}
                  disabled={step === 1 && !canProceedStep1}
                >
                  <span>Continue</span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              ) : (
                <button
                  className={`ck-btn-primary ${paymentMethod === 'payfast' ? 'ck-btn-primary--payfast' : 'ck-btn-primary--order'}`}
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>{pfStatus === 'loading' ? 'Encrypting...' : 'Deploying...'}</span>
                    </>
                  ) : paymentMethod === 'payfast' ? (
                    <>
                      <FontAwesomeIcon icon={faLock} />
                      <span>Authorize PayFast Gateway</span>
                    </>
                  ) : (
                    <span>Confirm & Place Order</span>
                  )}
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