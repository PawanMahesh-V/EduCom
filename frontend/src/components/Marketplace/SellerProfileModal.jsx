import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserGraduate, faStar, faBox } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import API_BASE_URL from '../../config/api';

const SellerProfileModal = ({ sellerId, isOpen, onClose, onAddToCart, currentUserId }) => {
    const [seller, setSeller] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && sellerId) {
            fetchSellerProfile();
        }
    }, [isOpen, sellerId]);

    const fetchSellerProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get(`${API_BASE_URL}/marketplace/seller/${sellerId}`);
            setSeller(response?.seller || { name: 'Seller' });
            setItems(response?.items || []);
        } catch (error) {
            console.error('Failed to fetch seller profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="sp-modal-overlay" onClick={onClose}>
            <div className="sp-modal-box fade-in" onClick={e => e.stopPropagation()}>
                <div className="sp-modal-header">
                    <h2 className="sp-modal-title">Seller Profile</h2>
                    <button className="sp-close-trigger-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="sp-modal-body">
                    {loading ? (
                        <div className="sp-loading-state"><div className="sp-spinner"></div><span>Loading seller profile...</span></div>
                    ) : error ? (
                        <div className="sp-error-state">Could not load seller information.</div>
                    ) : (
                        <>
                            <div className="sp-profile-summary-card">
                                <div className="sp-avatar-large">
                                    <FontAwesomeIcon icon={faUserGraduate} />
                                </div>
                                <div className="sp-info-stack">
                                    <h3>{seller?.name}</h3>
                                    <div className="sp-rating-pill">
                                        <FontAwesomeIcon icon={faStar} className="sp-star-icon" /> 
                                        <span>4.8 Seller Rating</span>
                                    </div>
                                    <div className="sp-items-badge">
                                        <FontAwesomeIcon icon={faBox} /> 
                                        <span>{items.length} Active Listings</span>
                                    </div>
                                </div>
                            </div>

                            <h4 className="sp-section-heading">Catalog Listings</h4>
                            
                            <div className="sp-items-grid">
                                {items.length === 0 ? (
                                    <div className="sp-empty-state">This seller currently has no active listings.</div>
                                ) : (
                                    items.map(item => {
                                        const parsedPrice = parseFloat(item.price);
                                        const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
                                        
                                        return (
                                            <div key={item.id} className="sp-product-mini-card">
                                                <div className="sp-card-img-frame">
                                                    <img src={item.image_url || '/assets/marketplace/textbook.png'} alt={item.title} />
                                                    {isOutOfStock && <div className="sp-oos-banner">Sold Out</div>}
                                                </div>
                                                <div className="sp-card-details">
                                                    <h3 className="sp-card-title">{item.title}</h3>
                                                    <div className="sp-card-price">Rs. {!isNaN(parsedPrice) ? parsedPrice.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</div>
                                                    
                                                    <button
                                                        className={`sp-card-action ${isOutOfStock ? 'sp-card-action--disabled' : ''}`}
                                                        disabled={isOutOfStock || item.seller_id === currentUserId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!isOutOfStock && item.seller_id !== currentUserId) {
                                                                onAddToCart(item);
                                                            }
                                                        }}
                                                    >
                                                        {isOutOfStock ? 'Sold Out' : (item.seller_id === currentUserId ? 'Your Listing' : 'Add to Cart')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerProfileModal;