import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faBox, faChartLine, faWallet, faTrash } from '@fortawesome/free-solid-svg-icons';
import QuickPostModal from '../components/Marketplace/QuickPostModal';
import ItemDetailsModal from '../components/Marketplace/ItemDetailsModal';
import CheckoutModal from '../components/Marketplace/CheckoutModal';
import OTPModal from '../components/Marketplace/OTPModal';
import TransactionHistoryModal from '../components/Marketplace/TransactionHistoryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SellerProfileModal from '../components/Marketplace/SellerProfileModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CustomSelect from '../components/Common/CustomSelect';
import Pagination from '../components/Common/Pagination';
import MarketplaceFilters from '../components/MarketplaceFilters';
import ItemCard from '../components/Marketplace/ItemCard';
import { useMarketplaceItems } from '../hooks/useMarketplaceItems';
import { useCart } from '../hooks/useCart';
import api from '../api/client';
import API_BASE_URL from '../config/api';

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
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const { socket } = useSocket();

  const {
    items,
    orders,
    receivedOrders,
    loading,
    hasLoaded,
    fetchItems,
    handleDeleteItem,
    handleUpdateStatus,
    handleCancelOrder,
    totalEarnings,
    setHasLoaded
  } = useMarketplaceItems(socket, activeTab, searchQuery, roleFilter);

  const {
    cartItems,
    hasLoadedCart,
    fetchCart,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    cartTotal,
    setCartItems
  } = useCart();

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



  useEffect(() => {
    if (!hasLoadedCart) fetchCart();
  }, []);

  useEffect(() => {
    const needsLoading = activeTab === 'cart' ? !hasLoadedCart : !hasLoaded[activeTab];
    if (activeTab === 'items') {
      fetchItems(!needsLoading);
      setPage(1);
    } else if (activeTab === 'cart') {
      if (needsLoading) fetchCart();
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
      } else if (tabName === 'cart') {
        fetchCart();
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

  const handleDeleteLocal = (id) => {
    setConfirmState({
      open: true,
      title: 'Delete Listing',
      message: 'Are you sure you want to remove this item from the marketplace? This action cannot be undone.',
      confirmText: 'Delete Post',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        await handleDeleteItem(id);
      }
    });
  };

  const handleCancelOrderLocal = (orderId) => {
    setConfirmState({
      open: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? The items will be returned to the marketplace inventory.',
      confirmText: 'Yes, Cancel Order',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        await handleCancelOrder(orderId);
      }
    });
  };

  return (
    <>
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
        <MarketplaceFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onOpenPostModal={() => { setItemToEdit(null); setIsPostModalOpen(true); }}
        />
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
              {paginatedItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentUserId={currentUserId}
                  cartItems={cartItems}
                  onItemClick={handleItemClick}
                  onEdit={handleEdit}
                  onDelete={handleDeleteLocal}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onSellerClick={setSelectedSeller}
                />
              ))}
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
                          <button className="mp-action-trigger-link mp-action-trigger-link--danger" onClick={() => handleCancelOrderLocal(order.id)}>
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
    </div>
    
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
  </>
);
};

export default Marketplace;