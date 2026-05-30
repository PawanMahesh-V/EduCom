import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faPlus, faUserGraduate, faBoxOpen, faTrash, faBox, faChartLine, faWallet } from '@fortawesome/free-solid-svg-icons';
import QuickPostModal from '../components/Marketplace/QuickPostModal';
import ItemDetailsModal from '../components/Marketplace/ItemDetailsModal';
import CheckoutModal from '../components/Marketplace/CheckoutModal';
import OTPModal from '../components/Marketplace/OTPModal';
import TransactionHistoryModal from '../components/Marketplace/TransactionHistoryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SellerProfileModal from '../components/Marketplace/SellerProfileModal';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CustomSelect from '../components/Common/CustomSelect';
import { showSuccess, showError } from '../utils/alert';
import Pagination from '../components/Common/Pagination';

const Marketplace = ({ onMessageSeller }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserId = user?.id || user?.userId;

  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab) {
      return location.state.activeTab;
    }
    return 'items';
  });

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 1;
  
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
          fetchItems(true);
      };
      socket.on('inventory_updated', handleInventoryUpdate);
      return () => {
          socket.off('inventory_updated', handleInventoryUpdate);
      };
  }, [socket, activeTab, searchQuery, roleFilter]);

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
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

  const fetchSales = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/marketplace/orders/received`);
      setReceivedOrders(response || []);
      setHasLoaded(prev => ({ ...prev, sales: true }));
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setReceivedOrders([]);
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
          if (roleFilter !== 'All Roles') params.append('role', roleFilter);
          params.append('page', 1);
          params.append('limit', 1000); // Fetch all items for client-side pagination
        }

        const response = await api.get(`${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`);
        
        setItems(response?.items || []);
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

  useEffect(() => {
    if (!hasLoaded.cart) fetchCart();
    if (!hasLoaded.sales) fetchSales();
  }, []);

  useEffect(() => {
    const needsLoading = !hasLoaded[activeTab];
    if (activeTab === 'items') {
      fetchItems(!needsLoading);
      setPage(1);
    } else {
      fetchItems(!needsLoading);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'items') return;
    
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      if (hasLoaded.items) {
        fetchItems(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, roleFilter]);

  const handleTabClick = (tabName) => {
    if (activeTab === tabName) {
      if (tabName === 'items') {
        fetchItems(false);
        setPage(1);
      } else {
        fetchItems(false);
      }
    } else {
      setActiveTab(tabName);
    }
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
      await fetchCart(); 
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
      await fetchCart(); 
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      showError('Failed to remove item');
    }
  };

  const cartTotal = cartItems.reduce((sum, c) => sum + parseFloat(c.price || 0) * (c.qty || 1), 0);

  const totalEarnings = receivedOrders.reduce((total, order) => {
    if (order.status !== 'cancelled' && order.status !== 'cancelled_by_buyer' && order.status !== 'refunded') {
      const orderEarned = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      return total + orderEarned;
    }
    return total;
  }, 0);

  const handleUpdateStatus = async (orderId, newStatus, otp = null) => {
    try {
      await api.put(`${API_BASE_URL}/marketplace/orders/${orderId}/status`, { status: newStatus, otp });
      setHasLoaded(prev => ({ ...prev, orders: false, sales: false })); 
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
          setHasLoaded({ items: false, orders: false, sales: false }); 
          fetchItems();
        } catch (error) {
          console.error('Failed to cancel order:', error);
          showError(error.response?.data?.message || 'Failed to cancel order');
        }
      }
    });
  };

  return (
    <div className="mp-portal-layout">
      {/* Sub Navigation Bar Context */}
      <div className="mp-sub-nav">
        <div className="mp-sub-nav-tabs">
          <button
            className={`mp-sub-nav-item ${activeTab === 'items' ? 'mp-sub-nav-item--active' : ''}`}
            onClick={() => handleTabClick('items')}
          >
            Items
          </button>
          <button
            className={`mp-sub-nav-item ${activeTab === 'orders' ? 'mp-sub-nav-item--active' : ''}`}
            onClick={() => handleTabClick('orders')}
          >
            Orders
          </button>
          <button
            className={`mp-sub-nav-item ${activeTab === 'sales' ? 'mp-sub-nav-item--active' : ''}`}
            onClick={() => handleTabClick('sales')}
          >
            Sales
          </button>
          <button
            className={`mp-sub-nav-item ${activeTab === 'cart' ? 'mp-sub-nav-item--active' : ''}`}
            onClick={() => handleTabClick('cart')}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Cart</span>
            {cartItems.length > 0 && (
              <span className="mp-cart-badge-count">{cartItems.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Core Toolbar Controls Sub-Grid */}
      {activeTab === 'items' && (
        <div className="mp-toolbar">
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search textbook name, items or course resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="mp-toolbar-filter-group">
            <CustomSelect
              options={[
                { value: 'All Roles', label: 'All Roles' },
                { value: 'Student', label: 'Student' },
                { value: 'Teacher', label: 'Teacher' },
                { value: 'Admin', label: 'Admin' },
                { value: 'HOD', label: 'HOD' },
                { value: 'PM', label: 'PM' }
              ]}
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
            />
          </div>
          <button
            className="mp-btn-primary"
            onClick={() => { setItemToEdit(null); setIsPostModalOpen(true); }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Listing</span>
          </button>
        </div>
      )}

      {/* =================== THE PUBLIC ITEMS CATALOG MARKETPLACE MATRIX =================== */}
      {activeTab === 'items' && (() => {
        const paginatedItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        
        return (
        <div className="mp-fade-in-view">
          {loading && items.length === 0 ? (
            <div className="mp-loading-spinner-state"><div className="mp-spinner"></div><span>Loading items...</span></div>
          ) : paginatedItems.length === 0 ? (
            <div className="mp-empty-state-banner">No items match your search. Be the first to list an item!</div>
          ) : (
            <div className="mp-catalog-grid">
              {paginatedItems.map(item => {
                const parsedPrice = parseFloat(item.price);
                const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
                const isOwner = item.seller_id === currentUserId;
                const cartItem = cartItems.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`mp-product-card ${isOwner ? 'mp-product-card--manageable' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="mp-card-media-wrapper">
                      {item.category === 'Tutoring' ? (
                        <div className="mp-tutor-avatar-placeholder">
                          <img src={item.image_url || '/assets/marketplace/tutor.png'} alt={item.title} className="mp-tutor-img" />
                          <div className="mp-star-badge"><FontAwesomeIcon icon={faStar} /></div>
                          <div className="mp-tutor-title">{item.seller_name || 'Tutor Profile'}</div>
                          <div className="mp-tutor-slots">{item.quantity} slots left</div>
                        </div>
                      ) : (
                        <div className="mp-item-img-frame">
                          <img src={item.image_url || '/assets/marketplace/textbook.png'} alt={item.title} className="mp-product-image" />
                          {isOutOfStock && <div className="mp-out-of-stock-tag">Sold Out</div>}
                        </div>
                      )}
                      
                      {/* Managed Overrides Overlay for Owners */}
                      {isOwner && (
                        <div className="mp-owner-management-overlay" onClick={(e) => e.stopPropagation()}>
                          <button className="mp-overlay-action-btn mp-overlay-action-btn--edit" onClick={() => handleEdit(item)}>
                            Edit Listing
                          </button>
                          <button className="mp-overlay-action-btn mp-overlay-action-btn--delete" onClick={() => handleDelete(item.id)}>
                            Delete Post
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mp-card-body-details">
                      <h3 className="mp-card-item-title">{item.title}</h3>
                      <div className="mp-card-item-price">Rs. {!isNaN(parsedPrice) ? parsedPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</div>
                      
                      {item.category !== 'Tutoring' && (
                        <div className="mp-seller-attribution-line" onClick={(e) => { e.stopPropagation(); setSelectedSeller(item.seller_id); }}>
                          <span>Seller: <strong>{item.seller_name || 'User'}</strong></span>
                        </div>
                      )}
                      
                      <div className="mp-seller-role-row">
                        <FontAwesomeIcon icon={faUserGraduate} className="mp-role-mini-icon" />
                        <span>{item.seller_role || 'User'}</span>
                      </div>
                      
                      {/* Multi-staged Cart State Integration Blocks Toggle */}
                      {cartItem && !isOwner && !isOutOfStock ? (
                        <div className="mp-quantity-stepper-control" onClick={(e) => e.stopPropagation()}>
                          <button className="mp-stepper-btn" onClick={(e) => handleUpdateCartQuantity(e, item, -1)}>-</button>
                          <span className="mp-stepper-display">{cartItem.qty}</span>
                          <button className="mp-stepper-btn" onClick={(e) => handleUpdateCartQuantity(e, item, 1)} disabled={cartItem.qty >= item.quantity}>+</button>
                        </div>
                      ) : (
                        <button
                          className={`mp-card-action-trigger ${isOutOfStock ? 'mp-card-action-trigger--disabled' : (isOwner ? 'mp-card-action-trigger--owner' : '')}`}
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
                          {isOutOfStock ? 'Sold Out' : (isOwner ? 'View Details' : 'Add to Cart')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <Pagination 
              currentPage={page} 
              totalItems={items.length} 
              itemsPerPage={itemsPerPage} 
              onPageChange={setPage} 
            />
          </div>
        </div>
      );
      })()}

      {/* =================== BUYER PLACED ORDERS DIRECTORY TAB =================== */}
      {activeTab === 'orders' && (
        <div className="mp-fade-in-view">
          {loading && orders.length === 0 ? (
            <div className="mp-loading-spinner-state"><div className="mp-spinner"></div><span>Loading your orders...</span></div>
          ) : orders.length === 0 ? (
            <div className="mp-empty-state-view">
              <FontAwesomeIcon icon={faBox} className="mp-empty-icon" />
              <h3>No Placed Orders Found</h3>
              <p>You haven't placed any orders yet. Items you buy will appear here.</p>
            </div>
          ) : (
            <div className="mp-orders-list-stack">
              {orders.map(order => (
                <div key={order.id} className="mp-transaction-card">
                  <div className="mp-transaction-header">
                    <div className="mp-tx-header-left">
                      <span className="mp-tx-id">Order ID: #{order.id}</span>
                      <span className="mp-tx-timestamp">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`mp-status-pill mp-status-pill--${order.status}`}>
                      {order.status === 'cancelled_by_buyer' ? 'Cancelled by You' : order.status}
                    </span>
                  </div>

                  <div className="mp-transaction-itemized-manifest">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="mp-manifest-row">
                        <span className="mp-manifest-title">{item.title}</span>
                        <span className="mp-manifest-qty">x{item.quantity}</span>
                        <span className="mp-manifest-subtotal">Rs. {(parseFloat(item.price) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mp-transaction-footer">
                    <p className="mp-pickup-note">
                      <strong>Location:</strong> {order.campus} Campus
                    </p>
                    <div className="mp-tx-footer-actions-layout">
                      <div className="mp-tx-financial-meta">
                        <p className="mp-payment-method-indicator">Payment Method: {order.payment_method === 'payfast' ? ' Paid online' : 'Cash on Delivery'}</p>
                        <p className="mp-grand-total-display">Total Value: <strong>Rs. {parseFloat(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></p>
                      </div>
                      <div className="mp-action-btn-cluster">
                        {order.status === 'pending' && (
                          <button className="mp-action-trigger-link mp-action-trigger-link--danger" onClick={() => handleCancelOrder(order.id)}>
                            Cancel Order
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button className="mp-action-trigger-link mp-action-trigger-link--success" onClick={() => { setOtpOrderId(order.id); setIsOTPModalOpen(true); }}>
                            Mark as Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== SELLER RECEIVED DISPATCHES SALES TAB =================== */}
      {activeTab === 'sales' && (
        <div className="mp-fade-in-view">
          {/* Dashboard Aggregate Earnings Overview Card Element */}
          <div className="mp-earnings-bento-overview">
            <div className="mp-earnings-text-stack">
              <h2>My Sales</h2>
              <p>Summary of your earnings from sold items</p>
            </div>
            <div className="mp-earnings-wallet-trigger" onClick={() => setIsTransactionHistoryOpen(true)}>
              <div className="mp-wallet-icon-housing"><FontAwesomeIcon icon={faWallet} /></div>
              <div className="mp-wallet-digits">
                <span className="mp-wallet-label">Profits</span>
                <span className="mp-wallet-value">Rs. {totalEarnings.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          {loading && receivedOrders.length === 0 ? (
            <div className="mp-loading-spinner-state"><div className="mp-spinner"></div><span>Loading your sales...</span></div>
          ) : receivedOrders.length === 0 ? (
            <div className="mp-empty-state-view">
              <FontAwesomeIcon icon={faChartLine} className="mp-empty-icon" />
              <h3>No Sales Yet</h3>
              <p>Other users haven't purchased your items yet. New orders will appear here.</p>
            </div>
          ) : (
            <div className="mp-orders-list-stack">
              {receivedOrders.map(order => (
                <div key={order.id} className="mp-transaction-card mp-transaction-card--sales">
                  <div className="mp-transaction-header">
                    <div className="mp-tx-header-left">
                      <span className="mp-tx-id">Order ID: #{order.id}</span>
                      <span className="mp-tx-timestamp">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mp-tx-header-right-action-group">
                      {order.delivery_otp && order.status === 'delivered' && (
                        <div className="mp-delivery-otp-pill">
                          Verification OTP: <strong>{order.delivery_otp}</strong>
                        </div>
                      )}
                      <div className="mp-status-pill-adjuster">
                        {['completed', 'cancelled', 'cancelled_by_buyer', 'refunded'].includes(order.status) ? (
                          <span className={`mp-status-pill mp-status-pill--${order.status}`}>
                            {order.status === 'cancelled_by_buyer' ? 'Cancelled by Buyer' : order.status}
                          </span>
                        ) : (
                          <CustomSelect
                            options={[
                              { value: 'pending', label: 'Pending Request' },
                              { value: 'delivered', label: 'Mark Dispatched' },
                              { value: 'cancelled', label: 'Reject / Terminate' }
                            ]}
                            value={order.status}
                            onChange={(val) => handleUpdateStatus(order.id, val)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mp-transaction-itemized-manifest">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="mp-manifest-row">
                        <span className="mp-manifest-title">{item.title}</span>
                        <span className="mp-manifest-qty">x{item.quantity}</span>
                        <span className="mp-manifest-subtotal">Rs. {(parseFloat(item.price) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mp-transaction-footer">
                    <div className="mp-buyer-profile-contact-card">
                      <div className="mp-buyer-meta-name">Buyer: <strong>{order.buyer_name || order.full_name}</strong></div>
                      <div className="mp-buyer-meta-detail">Phone: {order.phone}</div>
                      <div className="mp-buyer-meta-detail">Location: {order.campus}</div>
                    </div>
                    <div className="mp-tx-financial-meta">
                      <p className="mp-payment-method-indicator">Payment Method: {order.payment_method === 'payfast' ? ' Paid Online' : 'Cash'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== SHOPPING CART CHECKOUT TAB =================== */}
      {activeTab === 'cart' && (
        <div className="mp-fade-in-view">
          {cartItems.length === 0 ? (
            <div className="mp-empty-state-view">
              <FontAwesomeIcon icon={faShoppingCart} className="mp-empty-icon" />
              <h3>Your Shopping Cart is Empty</h3>
              <p>Browse through items and add them here to check out.</p>
            </div>
          ) : (
            <div className="mp-cart-workspace-layout">
              <div className="mp-cart-items-stack">
                {cartItems.map(item => {
                  const parsedPrice = parseFloat(item.price);
                  return (
                    <div key={item.id} className="mp-cart-item-row">
                      <img src={item.image_url || '/assets/marketplace/textbook.png'} alt={item.title} className="mp-cart-row-img" />
                      <div className="mp-cart-row-details">
                        <h4 className="mp-cart-row-title">{item.title}</h4>
                        <span className="mp-cart-row-category-badge">{item.category}</span>
                        <p className="mp-cart-row-seller">Seller: {item.seller_name || 'User'}</p>
                        <p className="mp-cart-row-qty">Quantity: <strong>{item.qty}</strong></p>
                      </div>
                      <div className="mp-cart-row-price">
                        Rs. {!isNaN(parsedPrice) ? (parsedPrice * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                      </div>
                      <button className="mp-cart-row-remove-btn" onClick={() => handleRemoveFromCart(item.id)} title="Remove item">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Summary Panel */}
              <div className="mp-cart-checkout-summary-card">
                <div className="mp-summary-pricing-row">
                  <span>Subtotal</span>
                  <span className="mp-summary-grand-total-digits">Rs. {cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <button className="mp-btn-primary mp-btn-primary--checkout" onClick={() => setIsCheckoutOpen(true)}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Context Control Modals Portals Initialization Hooks */}
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
        onAddToCart={(item) => { handleAddToCart(null, item); setSelectedItem(null); }}
        currentUserId={currentUserId}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        cartTotal={cartTotal}
        currentUser={user}
        onOrderPlaced={async () => {
          try { await api.delete(`${API_BASE_URL}/marketplace/cart`); } catch (e) { console.error(e); }
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

      <TransactionHistoryModal
        isOpen={isTransactionHistoryOpen}
        onClose={() => setIsTransactionHistoryOpen(false)}
        orders={receivedOrders}
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