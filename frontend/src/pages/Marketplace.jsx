import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faPlus, faUserGraduate, faBoxOpen, faTrash, faBox, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../styles/Marketplace.css';
import QuickPostModal from '../components/Marketplace/QuickPostModal';
import ItemDetailsModal from '../components/Marketplace/ItemDetailsModal';
import CheckoutModal from '../components/Marketplace/CheckoutModal';
import OTPModal from '../components/Marketplace/OTPModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SellerProfileModal from '../components/Marketplace/SellerProfileModal';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CustomSelect from '../components/Common/CustomSelect';
import { showSuccess, showError } from '../utils/alert';

const Marketplace = ({ onMessageSeller }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId;

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'orders' | 'sales' | 'cart'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Category');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [orders, setOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState({ items: false, orders: false, sales: false, cart: false });

  const { socket } = useSocket();

  // Listen for inventory updates
  useEffect(() => {
      if (!socket) return;
      const handleInventoryUpdate = () => {
          // Silently refresh items
          fetchItems(true, page);
      };
      socket.on('inventory_updated', handleInventoryUpdate);
      return () => {
          socket.off('inventory_updated', handleInventoryUpdate);
      };
  }, [socket, activeTab, page, searchQuery, categoryFilter]);

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

  const [selectedSeller, setSelectedSeller] = useState(null);

  const fetchCart = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/marketplace/cart`);
      setCartItems(response || []);
      setHasLoaded(prev => ({ ...prev, cart: true }));
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
    }
  };

  const fetchItems = async (isBackground = false, currentPage = 1) => {
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
      } else if (activeTab === 'cart') {
        const response = await api.get(`${API_BASE_URL}/marketplace/cart`);
        setCartItems(response || []);
        setHasLoaded(prev => ({ ...prev, cart: true }));
      } else {
        const endpoint = '/marketplace';
        const params = new URLSearchParams();

        if (activeTab === 'items') {
          if (searchQuery) params.append('search', searchQuery);
          if (categoryFilter !== 'All Category') params.append('category', categoryFilter);
          params.append('page', currentPage);
          params.append('limit', 20);
        }

        const response = await api.get(`${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`);
        
        if (currentPage === 1) {
            setItems(response?.items || []);
        } else {
            setItems(prev => [...prev, ...(response?.items || [])]);
        }
        
        setHasMore(response?.items?.length === 20);
        setHasLoaded(prev => ({ ...prev, items: true }));
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
      if (activeTab === 'orders') setOrders([]);
      else if (activeTab === 'sales') setReceivedOrders([]);
      else if (activeTab === 'cart') setCartItems([]);
      else setItems([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Fetch cart globally on mount so grid items can show cart state
  useEffect(() => {
    if (!hasLoaded.cart) fetchCart();
  }, []);

  // Immediate fetch on tab change if not loaded, or background refresh if already loaded
  useEffect(() => {
    const needsLoading = !hasLoaded[activeTab];
    if (activeTab === 'items') {
      fetchItems(!needsLoading, 1);
      setPage(1);
    } else {
      fetchItems(!needsLoading);
    }
  }, [activeTab]);

  // Debounced fetch for search and filters
  useEffect(() => {
    if (activeTab !== 'items') return;
    
    const delayDebounceFn = setTimeout(() => {
      // Always reset to page 1 on search/filter
      setPage(1);
      if (hasLoaded.items) {
        fetchItems(false, 1);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categoryFilter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(false, nextPage);
  };

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
          showError('Failed to delete item');
        }
      }
    });
  };

  const handleAddToCart = async (e, item) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`${API_BASE_URL}/marketplace/cart`, { item_id: item.id, quantity: 1 });
      await fetchCart(); // Always refresh cart state
      showSuccess(`${item.title} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showError('Failed to add to cart');
    }
  };

  const handleUpdateCartQuantity = async (e, item, delta) => {
    if (e) e.stopPropagation();
    try {
      const cartItem = cartItems.find(c => c.id === item.id);
      const newQuantity = (cartItem ? cartItem.qty : 0) + delta;
      
      if (newQuantity <= 0) {
        await api.delete(`${API_BASE_URL}/marketplace/cart/${item.id}`);
      } else {
        await api.put(`${API_BASE_URL}/marketplace/cart/${item.id}`, { quantity: newQuantity });
      }
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      showError('Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (id) => {
    try {
      await api.delete(`${API_BASE_URL}/marketplace/cart/${id}`);
      await fetchCart(); // refresh cart
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      showError('Failed to remove item');
    }
  };

  const cartTotal = cartItems.reduce((sum, c) => sum + parseFloat(c.price || 0) * (c.qty || 1), 0);

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
          showError(error.response?.data?.message || 'Failed to cancel order');
        }
      }
    });
  };

  return (
    <div className="marketplace-container">

      {/* Sub Navigation */}
      <div className="dashboard-sub-nav">
        <div className="dashboard-sub-nav-tabs">
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
        <div className="dashboard-toolbar">
          <input
            className="dashboard-search-input"
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CustomSelect
            options={[
              { value: 'All Category', label: 'All Categories' },
              { value: 'Textbooks', label: 'Textbooks' },
              { value: 'Equipment', label: 'Equipment' },
              { value: 'Notes', label: 'Notes' },
              { value: 'Tutoring', label: 'Tutoring' }
            ]}
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
          />
          <button
            className="button primary dashboard-action-btn"
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
              const cartItem = cartItems.find(c => c.id === item.id);
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
                      <div className="seller-info" onClick={(e) => { e.stopPropagation(); setSelectedSeller(item.seller_id); }} style={{ cursor: 'pointer' }}>
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
                    {cartItem && !isOwner && !isOutOfStock ? (
                      <div className="grid-quantity-selector" onClick={(e) => e.stopPropagation()}>
                        <button className="grid-qty-btn" onClick={(e) => handleUpdateCartQuantity(e, item, -1)}>-</button>
                        <span className="grid-qty-display">{cartItem.qty}</span>
                        <button className="grid-qty-btn" onClick={(e) => handleUpdateCartQuantity(e, item, 1)} disabled={cartItem.qty >= item.quantity}>+</button>
                      </div>
                    ) : (
                      <button
                        className={`card-action-btn ${isOutOfStock ? 'buy' : (isOwner ? 'view' : 'buy')}`}
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOwner) {
                            handleItemClick(item);
                          } else {
                            handleAddToCart(e, item);
                          }
                        }}
                      >
                        {isOutOfStock ? 'Sold Out' : (isOwner ? 'View Product' : 'Add to Cart')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {hasMore && items.length > 0 && (
            <div className="load-more-container" style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px' }}>
              <button className="button secondary" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
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
                    <div className="order-header-left">
                      <div className="order-id">Order #{order.id}</div>
                      <div className="order-date">{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="order-header-right">
                      <div className={`order-status ${order.status}`}>
                        {order.status === 'cancelled_by_buyer' ? 'Cancelled by You' : order.status}
                      </div>
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
                          className="cancel-order-btn"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel Order
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button 
                          className="receive-order-btn"
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
                    <div className="order-header-left">
                      <div className="order-id">Order #{order.id}</div>
                    </div>
                    <div className="order-header-right">
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
                          <CustomSelect
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'delivered', label: 'Delivered' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                            value={order.status}
                            onChange={(val) => handleUpdateStatus(order.id, val)}
                          />
                        )}
                      </div>
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
                      <div className="order-date">Buyer: <strong>{order.buyer_name || order.full_name}</strong></div>
                      <div className="contact-line"><strong>Buyer Phone:</strong> {order.phone}</div>
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
                        <div className="cart-item-seller"> Quantity: {item.qty}</div>
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
        onOrderPlaced={async () => {
          try {
            await api.delete(`${API_BASE_URL}/marketplace/cart`);
          } catch (e) {
            console.error('Failed to clear backend cart', e);
          }
          setCartItems([]);
          setHasLoaded(prev => ({ ...prev, items: false, orders: false, cart: false }));
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

      <SellerProfileModal
        sellerId={selectedSeller}
        isOpen={!!selectedSeller}
        onClose={() => setSelectedSeller(null)}
        onAddToCart={(item) => { handleAddToCart(null, item); }}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default Marketplace;