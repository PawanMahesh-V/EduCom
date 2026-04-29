import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faPlus, faUserGraduate, faBoxOpen, faTrash, faBox, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../styles/Marketplace.css';
import QuickPostModal from '../components/Marketplace/QuickPostModal';
import ItemDetailsModal from '../components/Marketplace/ItemDetailsModal';
import CheckoutModal from '../components/Marketplace/CheckoutModal';
import OTPModal from '../components/Marketplace/OTPModal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';

const Marketplace = ({ onMessageSeller }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId;

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'orders' | 'sales' | 'cart'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Category');
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState({ items: false, orders: false, sales: false });

  // Cart — persisted in localStorage so it survives navigation
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('educom_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('educom_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otpOrderId, setOtpOrderId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null,
  });

  const fetchItems = async (isBackground = false) => {
    if (activeTab === 'cart') return;
    try {
      if (!isBackground) setLoading(true);
      if (activeTab === 'orders') {
        const response = await api.get(`${API_BASE_URL}/marketplace/orders/me`);
        setOrders(response || []);
        setHasLoaded(prev => ({ ...prev, orders: true }));
      } else if (activeTab === 'sales') {
        const response = await api.get(`${API_BASE_URL}/marketplace/orders/received`);
        setReceivedOrders(response || []);
        setHasLoaded(prev => ({ ...prev, sales: true }));
      } else {
        const endpoint = '/marketplace';
        const params = new URLSearchParams();

        if (activeTab === 'items') {
          if (searchQuery) params.append('search', searchQuery);
          if (categoryFilter !== 'All Category') params.append('category', categoryFilter);
        }

        const response = await api.get(`${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`);
        setItems(response || []);
        setHasLoaded(prev => ({ ...prev, items: true }));
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
      if (activeTab === 'orders') setOrders([]);
      else if (activeTab === 'sales') setReceivedOrders([]);
      else setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Immediate fetch on tab change if not loaded, or background refresh if already loaded
  useEffect(() => {
    if (activeTab === 'cart') return;
    
    const needsLoading = !hasLoaded[activeTab];
    fetchItems(!needsLoading);
  }, [activeTab]);

  // Debounced fetch for search and filters
  useEffect(() => {
    if (activeTab !== 'items') return;
    
    const delayDebounceFn = setTimeout(() => {
      // Show loading UI when searching/filtering
      if (hasLoaded.items) {
        fetchItems(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categoryFilter]);

  const handlePostSuccess = () => {
    setHasLoaded(prev => ({ ...prev, items: false }));
    fetchItems();
    setItemToEdit(null);
  };

  const handleItemClick = (item) => {
    if (activeTab === 'items') {
      setSelectedItem(item);
    }
  };

  const handleEdit = (item) => {
    setItemToEdit(item);
    setIsPostModalOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmState({
      open: true,
      title: 'Delete Listing',
      message: 'Are you sure you want to remove this item from the marketplace? This action cannot be undone.',
      confirmText: 'Delete Post',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        try {
          await api.delete(`${API_BASE_URL}/marketplace/${id}`);
          fetchItems();
        } catch (error) {
          console.error('Failed to delete item:', error);
          alert('Failed to delete item');
        }
      }
    });
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    setCartItems(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev;
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prev => prev.filter(c => c.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, c) => sum + parseFloat(c.price || 0) * c.qty, 0);

  const handleUpdateStatus = async (orderId, newStatus, otp = null) => {
    try {
      await api.put(`${API_BASE_URL}/marketplace/orders/${orderId}/status`, { status: newStatus, otp });
      setHasLoaded(prev => ({ ...prev, orders: false, sales: false })); // Invalidate both order-related tabs
      fetchItems();
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const handleCancelOrder = (orderId) => {
    setConfirmState({
      open: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? The items will be returned to the marketplace inventory.',
      confirmText: 'Yes, Cancel Order',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        try {
          await api.put(`${API_BASE_URL}/marketplace/orders/${orderId}/cancel`);
          setHasLoaded({ items: false, orders: false, sales: false }); // Invalidate all on cancellation
          fetchItems();
        } catch (error) {
          console.error('Failed to cancel order:', error);
          alert(error.response?.data?.message || 'Failed to cancel order');
        }
      }
    });
  };

  return (
    <div className="marketplace-container">

      {/* Sub Navigation */}
      <div className="marketplace-sub-nav">
        <div className="marketplace-sub-nav-tabs">
          <div
            className={`sub-nav-item ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Items
          </div>
          <div
            className={`sub-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </div>
          <div
            className={`sub-nav-item ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            My Sales
          </div>
          <div
            className={`sub-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            &nbsp; Cart
            {cartItems.length > 0 && (
              <span className="cart-count-badge">{cartItems.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Search + Filter toolbar — only visible on Items tab */}
      {activeTab === 'items' && (
        <div className="marketplace-toolbar">
          <input
            className="marketplace-search-input"
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="marketplace-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Category">All Categories</option>
            <option value="Textbooks">Textbooks</option>
            <option value="Equipment">Equipment</option>
            <option value="Notes">Notes</option>
            <option value="Tutoring">Tutoring</option>
          </select>
          <button
            className="button primary post-item-btn"
            onClick={() => { setItemToEdit(null); setIsPostModalOpen(true); }}
            style={{ marginLeft: 'auto' }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Post an Item
          </button>
        </div>
      )}

      {/* =================== ITEMS TAB =================== */}
      {activeTab === 'items' && (
        <div className="marketplace-items-grid">
          {loading && items.length === 0 ? (
            <div className="marketplace-loading">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="marketplace-empty">No items found. Be the first to post!</div>
          ) : (
            items.map(item => {
              const parsedPrice = parseFloat(item.price);
              const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
              const isOwner = item.seller_id === currentUserId;
              return (
                <div
                  key={item.id}
                  className={`marketplace-card ${isOwner ? 'manageable' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="card-image-wrapper">
                    {item.category === 'Tutoring' ? (
                      <div className="avatar-placeholder-bg">
                        <img src={item.image_url || '/assets/marketplace/tutor.png'} alt={item.title} className="avatar-img" />
                        <div className="star-badge"><FontAwesomeIcon icon={faStar} /></div>
                        <div className="avatar-title">{item.seller_name || 'Tutor'}</div>
                        <div className="avatar-subtitle">{item.quantity} slots available</div>
                      </div>
                    ) : (
                      <div className="card-img-container">
                        <img src={item.image_url || '/assets/marketplace/textbook.png'} alt={item.title} className="card-image" />
                        {isOutOfStock && <div className="out-of-stock-banner">Out of Stock</div>}
                      </div>
                    )}
                    {isOwner && (
                      <div className="item-management-overlay">
                        <button className="mgmt-btn edit" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                          Edit Post
                        </button>
                        <button className="mgmt-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                          Delete Post
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{item.title}</h3>
                    <div className="card-price">Rs. {!isNaN(parsedPrice) ? parsedPrice.toFixed(2) : '0.00'}</div>
                    {item.category !== 'Tutoring' && (
                      <div className="seller-info">
                        <img src="/assets/marketplace/tutor.png" alt="Seller" className="seller-avatar-small" />
                        <span className="seller-name">{item.seller_name || 'User'}</span>
                      </div>
                    )}
                    <div className="card-rating-row">
                      <div className="seller-type">
                        <FontAwesomeIcon icon={faUserGraduate} className="seller-type-icon" />
                        {item.category}
                      </div>
                      <div className="rating-score">
                        <FontAwesomeIcon icon={faStar} className="star-icon" />
                        4.8
                      </div>
                    </div>
                    <button
                      className={`card-action-btn ${isOutOfStock ? 'buy' : (item.seller_id === currentUserId ? 'view' : 'buy')}`}
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        if (item.seller_id === currentUserId) {
                          e.stopPropagation();
                          handleItemClick(item);
                        } else {
                          e.stopPropagation();
                          handleAddToCart(e, item);
                        }
                      }}
                    >
                      {isOutOfStock ? 'Sold Out' : (item.seller_id === currentUserId ? 'View Product' : 'Add to Cart')}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}


      {/* =================== ORDERS TAB =================== */}
      {activeTab === 'orders' && (
        <div className="orders-container">
          {loading && orders.length === 0 ? (
            <div className="marketplace-loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="marketplace-empty">
              <FontAwesomeIcon icon={faBox} style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: 'var(--color-gray-300)' }} />
              You haven't placed any orders yet.
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date">{new Date(order.created_at).toLocaleDateString()}</div>
                    <div className={`order-status ${order.status}`}>
                      {order.status === 'cancelled_by_buyer' ? 'Cancelled by You' : order.status}
                    </div>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span className="order-item-title">{item.title}</span>
                        <span className="order-item-qty">x{item.quantity}</span>
                        <span className="order-item-price">Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-footer">
                    <div className="order-pickup">
                      <strong>Pickup:</strong> {order.campus}
                    </div>
                    <div className="order-footer-actions">
                      <div className="order-total">
                        Total: <strong>Rs. {parseFloat(order.total_amount).toFixed(2)}</strong>
                      </div>
                      {order.status === 'pending' && (
                        <button 
                          className="button delete small cancel-order-btn"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel Order
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button 
                          className="button primary small"
                          style={{ fontSize: 'var(--font-xs)', padding: '4px 12px' }}
                          onClick={() => {
                            setOtpOrderId(order.id);
                            setIsOTPModalOpen(true);
                          }}
                        >
                          Mark as Received
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* =================== SALES TAB =================== */}
      {activeTab === 'sales' && (
        <div className="orders-container">
          {loading && receivedOrders.length === 0 ? (
            <div className="marketplace-loading">Loading sales...</div>
          ) : receivedOrders.length === 0 ? (
            <div className="marketplace-empty">
              <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: 'var(--color-gray-300)' }} />
              No orders received yet for your items.
            </div>
          ) : (
            <div className="orders-list">
              {receivedOrders.map(order => (
                <div key={order.id} className="order-card sales-card">
                  <div className="order-header">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date">Buyer: <strong>{order.buyer_name || order.full_name}</strong></div>
                    {order.delivery_otp && (
                      <div className="order-otp-display">
                        Delivery OTP: <strong>{order.delivery_otp}</strong>
                      </div>
                    )}
                    <div className="order-status-actions">
                      {['completed', 'cancelled', 'cancelled_by_buyer'].includes(order.status) ? (
                        <span className={`order-status ${order.status}`}>
                          {order.status === 'cancelled_by_buyer' ? 'Buyer Cancelled' : order.status}
                        </span>
                      ) : (
                        <select 
                          className={`status-select ${order.status}`}
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span className="order-item-title">{item.title}</span>
                        <span className="order-item-qty">x{item.quantity}</span>
                        <span className="order-item-price">Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-footer">
                    <div className="order-contact">
                      <div className="contact-line"><strong>Phone:</strong> {order.phone}</div>
                      <div className="contact-line"><strong>Campus:</strong> {order.campus}</div>
                    </div>
                    <div className="order-total">
                      Subtotal: <strong>Rs. {parseFloat(order.total_amount).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== CART TAB =================== */}
      {activeTab === 'cart' && (
        <div className="cart-container">
          {cartItems.length === 0 ? (
            <div className="marketplace-empty">
              <FontAwesomeIcon icon={faShoppingCart} style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: 'var(--color-gray-300)' }} />
              Your cart is empty. Browse items and add them here!
            </div>
          ) : (
            <>
              <div className="cart-list">
                {cartItems.map(item => {
                  const parsedPrice = parseFloat(item.price);
                  return (
                    <div key={item.id} className="cart-item-row">
                      <img
                        src={item.image_url || '/assets/marketplace/textbook.png'}
                        alt={item.title}
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <div className="cart-item-title">{item.title}</div>
                        <div className="cart-item-category">{item.category}</div>
                        <div className="cart-item-seller">Seller: {item.seller_name || 'User'}</div>
                      </div>
                      <div className="cart-item-price">
                        Rs. {!isNaN(parsedPrice) ? parsedPrice.toFixed(2) : '0.00'}
                      </div>
                      <button
                        className="button delete icon-button small"
                        onClick={() => handleRemoveFromCart(item.id)}
                        title="Remove from cart"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total</span>
                  <span className="cart-total-amount">Rs. {cartTotal.toFixed(2)}</span>
                </div>
                <button className="button primary cart-checkout-btn" onClick={() => setIsCheckoutOpen(true)}>
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <QuickPostModal
        isOpen={isPostModalOpen}
        onClose={() => { setIsPostModalOpen(false); setItemToEdit(null); }}
        onSuccess={handlePostSuccess}
        editItem={itemToEdit}
      />

      <ItemDetailsModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onMessageSeller={onMessageSeller}
        onAddToCart={(item) => { handleAddToCart({ stopPropagation: () => {} }, item); setSelectedItem(null); }}
        currentUserId={currentUserId}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        cartTotal={cartTotal}
        currentUser={user}
        onOrderPlaced={() => {
          setCartItems([]);
          localStorage.removeItem('educom_cart');
          setHasLoaded(prev => ({ ...prev, items: false, orders: false }));
          setActiveTab('orders');
        }}
      />

      <OTPModal 
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        onVerify={(id, otp) => handleUpdateStatus(id, 'completed', otp)}
        orderId={otpOrderId}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
        variant="danger"
      />
    </div>
  );
};

export default Marketplace;
