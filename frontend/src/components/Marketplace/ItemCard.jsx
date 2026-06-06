import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUserGraduate } from '@fortawesome/free-solid-svg-icons';

const ItemCard = ({
  item,
  currentUserId,
  cartItems,
  onItemClick,
  onEdit,
  onDelete,
  onAddToCart,
  onUpdateCartQuantity,
  onSellerClick
}) => {
  const parsedPrice = parseFloat(item.price);
  const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
  const isOwner = item.seller_id === currentUserId;
  const cartItem = cartItems.find(c => c.id === item.id);

  return (
    <div
      className={`mp-product-card ${isOwner ? 'mp-product-card--manageable' : ''}`}
      onClick={() => onItemClick(item)}
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
            <button className="mp-overlay-action-btn mp-overlay-action-btn--edit" onClick={() => onEdit(item)}>
              Edit Listing
            </button>
            <button className="mp-overlay-action-btn mp-overlay-action-btn--delete" onClick={() => onDelete(item.id)}>
              Delete Post
            </button>
          </div>
        )}
      </div>

      <div className="mp-card-body-details">
        <h3 className="mp-card-item-title">{item.title}</h3>
        <div className="mp-card-item-price">Rs. {!isNaN(parsedPrice) ? parsedPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</div>
        
        {item.category !== 'Tutoring' && (
          <div className="mp-seller-attribution-line" onClick={(e) => { e.stopPropagation(); onSellerClick(item.seller_id); }}>
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
            <button className="mp-stepper-btn" onClick={(e) => onUpdateCartQuantity(e, item, -1)}>-</button>
            <span className="mp-stepper-display">{cartItem.qty}</span>
            <button className="mp-stepper-btn" onClick={(e) => onUpdateCartQuantity(e, item, 1)} disabled={cartItem.qty >= item.quantity}>+</button>
          </div>
        ) : (
          <button
            className={`mp-card-action-trigger ${isOutOfStock ? 'mp-card-action-trigger--disabled' : (isOwner ? 'mp-card-action-trigger--owner' : '')}`}
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (isOwner) {
                onItemClick(item);
              } else {
                onAddToCart(e, item);
              }
            }}
          >
            {isOutOfStock ? 'Sold Out' : (isOwner ? 'View Details' : 'Add to Cart')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
