import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faStar, faUserGraduate, faShoppingCart, faCommentDots, faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';

const ItemDetailsModal = ({ item, isOpen, onClose, onMessageSeller, onAddToCart, currentUserId }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  const displayImage = item.image_url || '/assets/marketplace/textbook.png';
  const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
  const isOwnListing = item.seller_id && currentUserId && item.seller_id === currentUserId;

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const newVal = prev + delta;
      if (newVal < 1) return 1;
      if (newVal > item.quantity) return item.quantity;
      return newVal;
    });
  };

  return (
    <div className="mdl-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mdl-box fade-in">
        {/* Close Button Trigger */}
        <button className="mdl-close-trigger-btn" onClick={onClose} aria-label="Close details modal">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="mdl-split-layout">
          {/* Left Side: Product Media Section */}
          <div className="mdl-media-column">
            <div className="mdl-image-frame">
              <img src={displayImage} alt={item.title} className="mdl-product-image" />
              {isOutOfStock && (
                <div className="mdl-out-of-stock-overlay-banner">Sold Out</div>
              )}
            </div>
          </div>

          {/* Right Side: Product Meta Details Section */}
          <div className="mdl-info-column">
            <div className="mdl-header-block">
              <span className="mdl-category-badge-tag">{item.category}</span>
              <h2 className="mdl-product-title">{item.title}</h2>
              <div className="mdl-product-price">Rs. {Number(item.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>

            {/* Merchant Identity Row Card */}
            <div className="mdl-merchant-card">
              <div className="mdl-merchant-meta">
                <div className="mdl-merchant-avatar">{item.seller_name?.charAt(0) || 'U'}</div>
                <div className="mdl-merchant-text-stack">
                  <span className="mdl-merchant-name">{item.seller_name || 'User Profile'}</span>
                  <span className="mdl-merchant-role">
                    <FontAwesomeIcon icon={faUserGraduate} />
                    <span>{item.seller_role || 'Student'}</span>
                  </span>
                </div>
              </div>
              {!isOwnListing && (
                <button
                  className="mdl-merchant-chat-btn"
                  title={`Initiate inquiry with ${item.seller_name || 'Seller'}`}
                  onClick={() => {
                    if (onMessageSeller && item.seller_id) {
                      onMessageSeller({
                        id: item.seller_id,
                        name: item.seller_name || 'User',
                      });
                      onClose();
                    }
                  }}
                  disabled={!onMessageSeller || !item.seller_id}
                >
                  <FontAwesomeIcon icon={faCommentDots} />
                  <span>Chat</span>
                </button>
              )}
            </div>

            {/* Inventory Metrics Fields */}
            <div className="mdl-inventory-status-bar">
              <div className="mdl-status-row">
                <span className="mdl-status-label">Availability Status</span>
                <span className={`mdl-status-badge mdl-status-badge--${item.status || 'available'}`}>
                  {(item.status || 'available').replace('_', ' ')}
                </span>
              </div>
              <div className="mdl-status-row">
                <span className="mdl-status-label">Available Inventory</span>
                <span className="mdl-status-count-value">{item.quantity} units left</span>
              </div>
            </div>

            {/* Main Rich Description Text */}
            <div className="mdl-description-pane">
              <div className="id-description-content">
                <p>{item.description || 'No description provided.'}</p>
              </div>
            </div>

            {/* Core Action Footer Control Layer */}
            <div className="mdl-actions-footer-bar">
              {isOwnListing ? (
                <button className="mdl-btn-primary mdl-btn-primary--disabled" disabled>
                  Your Active Product Listing
                </button>
              ) : (
                <>
                  {!isOutOfStock && (
                    <div className="mdl-quantity-counter-stepper">
                      <button className="mdl-stepper-btn" onClick={() => handleQuantityChange(-1)}>-</button>
                      <span className="mdl-stepper-display-value">{quantity}</span>
                      <button className="mdl-stepper-btn" onClick={() => handleQuantityChange(1)}>+</button>
                    </div>
                  )}
                  <button
                    className="mdl-btn-primary mdl-btn-primary--action flex-grow"
                    disabled={isOutOfStock}
                    onClick={() => onAddToCart && onAddToCart({ ...item, qty: quantity })}
                  >
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Cart'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Structural Location Disclaimer Line */}
            <div className="mdl-logistics-disclaimer-row">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>Exchange execution available exclusively via campus pickup desks.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;