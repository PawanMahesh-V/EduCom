import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faPlus, faUserGraduate, faBoxOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles/Marketplace.css';
import QuickPostModal from '../components/Marketplace/QuickPostModal';
import ItemDetailsModal from '../components/Marketplace/ItemDetailsModal';
import CheckoutModal from '../components/Marketplace/CheckoutModal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';

const Marketplace = ({ onMessageSeller }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId;

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'myItems' | 'cart'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Category');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null,
  });

  const fetchItems = async () => {
    if (activeTab === 'cart') return; // Cart is local state, no fetch needed
    try {
      setLoading(true);
      const endpoint = activeTab === 'myItems' ? '/marketplace/my-items' : '/marketplace';
      const params = new URLSearchParams();

      if (activeTab === 'items') {
        if (searchQuery) params.append('search', searchQuery);
        if (categoryFilter !== 'All Category') params.append('category', categoryFilter);
      }

      const response = await api.get(`${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`);
      setItems(response || []);
    } catch (error) {
      console.error('Failed to fetch marketplace items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categoryFilter, activeTab]);

  const handlePostSuccess = () => {
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
            className={`sub-nav-item ${activeTab === 'myItems' ? 'active' : ''}`}
            onClick={() => setActiveTab('myItems')}
          >
            My Items
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

      {/* Post an Item button — below sub-nav, only on My Items tab */}
      {activeTab === 'myItems' && (
        <div className="marketplace-toolbar">
          <button
            className="button primary"
            onClick={() => { setItemToEdit(null); setIsPostModalOpen(true); }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Post an Item
          </button>
        </div>
      )}

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
        </div>
      )}

      {/* =================== ITEMS TAB =================== */}
      {activeTab === 'items' && (
        <div className="marketplace-items-grid">
          {loading ? (
            <div className="marketplace-loading">Loading...</div>
          ) : items.length === 0 ? (
            <div className="marketplace-empty">No items found. Be the first to post!</div>
          ) : (
            items.map(item => {
              const parsedPrice = parseFloat(item.price);
              const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
              return (
                <div
                  key={item.id}
                  className="marketplace-card"
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

      {/* =================== MY ITEMS TAB =================== */}
      {activeTab === 'myItems' && (
        <div className="marketplace-items-grid">
          {loading ? (
            <div className="marketplace-loading">Loading...</div>
          ) : items.length === 0 ? (
            <div className="marketplace-empty">
              <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }} />
              You haven't posted any items yet.
            </div>
          ) : (
            items.map(item => {
              const parsedPrice = parseFloat(item.price);
              const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
              return (
                <div key={item.id} className="marketplace-card manageable">
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
                    <div className="item-management-overlay">
                      <button className="mgmt-btn edit" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                        Edit Post
                      </button>
                      <button className="mgmt-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                        Delete Post
                      </button>
                    </div>
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
                  </div>
                </div>
              );
            })
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
          setActiveTab('items');
        }}
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
