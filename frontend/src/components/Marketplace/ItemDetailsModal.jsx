import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faStar, faUserGraduate, faShoppingCart, faCommentDots, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import '../../styles/MarketplaceModals.css';

const ItemDetailsModal = ({ item, isOpen, onClose, onMessageSeller, onAddToCart, currentUserId }) => {
    const [quantity, setQuantity] = useState(1);

    if (!isOpen || !item) return null;

    // Default image if missing
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
        <div className="modal-overlay">
            <div className="modal-content item-details-modal">
                <button className="close-btn" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="item-details-layout">
                    {/* Left: Image Carousel / Main Image */}
                    <div className="item-image-section">
                        <div className="main-image-container">
                            <img src={displayImage} alt={item.title} className="detail-main-image" />
                            {isOutOfStock && (
                                <div className="out-of-stock-overlay">Out of Stock</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Item Details */}
                    <div className="item-info-section">
                        <div className="item-header">
                            <span className="item-category-tag">{item.category}</span>
                            <h2 className="item-title">{item.title}</h2>
                            <div className="item-price">Rs. {Number(item.price).toFixed(2)}</div>
                        </div>

                        <div className="item-seller-card">
                            <img src="/assets/marketplace/tutor.png" alt="Seller" className="seller-avatar" />
                            <div className="seller-details">
                                <span className="seller-name">{item.seller_name || 'User'}</span>
                                <div className="seller-rating">
                                    <FontAwesomeIcon icon={faStar} className="star-icon" /> 4.8 Rating
                                </div>
                            </div>
                            {!isOwnListing && (
                                <button
                                    className="btn-icon message-seller-btn"
                                    title={`Message ${item.seller_name || 'Seller'}`}
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
                                </button>
                            )}
                        </div>

                        <div className="item-core-data">
                            <div className="data-row">
                                <span className="data-label">Status</span>
                                <span className={`status-tag ${item.status || 'available'}`}>
                                    {(item.status || 'available').replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Stock</span>
                                <span>{item.quantity} available</span>
                            </div>
                            {item.tags && (Array.isArray(item.tags) ? item.tags.length > 0 : item.tags.length > 0) && (
                                <div className="data-row">
                                    <span className="data-label">Tags</span>
                                    <div className="tags-list">
                                        {Array.isArray(item.tags) 
                                            ? item.tags.map((tag, i) => <span key={i} className="tag-pill">{tag}</span>)
                                            : typeof item.tags === 'string' 
                                                ? item.tags.replace(/^{|}$/g, '').split(',').map((tag, i) => tag.trim() ? <span key={i} className="tag-pill">{tag.trim().replace(/^"|"$/g, '')}</span> : null)
                                                : null
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="item-description">
                            <h3>Description</h3>
                            <p>{item.description || 'No description provided.'}</p>
                        </div>

                        <div className="item-actions">
                            {isOwnListing ? (
                                <button className="btn-primary flex-grow" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                                    Your Listing
                                </button>
                            ) : (
                                <>
                                    {!isOutOfStock && (
                                        <div className="quantity-selector">
                                            <button onClick={() => handleQuantityChange(-1)}>-</button>
                                            <span>{quantity}</span>
                                            <button onClick={() => handleQuantityChange(1)}>+</button>
                                        </div>
                                    )}
                                    <button
                                        className="btn-primary flex-grow"
                                        disabled={isOutOfStock}
                                        onClick={() => onAddToCart && onAddToCart({ ...item, qty: quantity })}
                                    >
                                        <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="item-secondary-info">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <span>Available for pickup at SZABIST Campus</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemDetailsModal;
