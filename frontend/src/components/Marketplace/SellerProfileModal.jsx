import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserGraduate, faStar, faBox } from '@fortawesome/free-solid-svg-icons';
import '../../styles/MarketplaceModals.css';
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content marketplace-modal seller-profile-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Seller Profile</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="modal-body custom-scrollbar">
                    {loading ? (
                        <div className="marketplace-loading">Loading profile...</div>
                    ) : (
                        <>
                            <div className="seller-profile-header">
                                <div className="seller-avatar-large">
                                    <FontAwesomeIcon icon={faUserGraduate} />
                                </div>
                                <div className="seller-info-large">
                                    <h3>{seller?.name}</h3>
                                    <div className="rating-score">
                                        <FontAwesomeIcon icon={faStar} className="star-icon" /> 4.8 (Seller Rating)
                                    </div>
                                    <div className="total-items-badge">
                                        <FontAwesomeIcon icon={faBox} /> {items.length} Active Listings
                                    </div>
                                </div>
                            </div>

                            <h4 className="seller-items-title">Items from this seller</h4>
                            
                            <div className="marketplace-items-grid compact-grid">
                                {items.length === 0 ? (
                                    <div className="marketplace-empty">This seller has no active items.</div>
                                ) : (
                                    items.map(item => {
                                        const parsedPrice = parseFloat(item.price);
                                        const isOutOfStock = item.status === 'out_of_stock' || item.quantity === 0;
                                        
                                        return (
                                            <div key={item.id} className="marketplace-card">
                                                <div className="card-image-wrapper">
                                                    <div className="card-img-container">
                                                        <img src={item.image_url || '/assets/marketplace/textbook.png'} alt={item.title} className="card-image" />
                                                        {isOutOfStock && <div className="out-of-stock-banner">Out of Stock</div>}
                                                    </div>
                                                </div>
                                                <div className="card-content">
                                                    <h3 className="card-title">{item.title}</h3>
                                                    <div className="card-price">Rs. {!isNaN(parsedPrice) ? parsedPrice.toFixed(2) : '0.00'}</div>
                                                    <button
                                                        className={`card-action-btn ${isOutOfStock ? 'buy' : 'buy'}`}
                                                        disabled={isOutOfStock || item.seller_id === currentUserId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!isOutOfStock && item.seller_id !== currentUserId) {
                                                                onAddToCart(item);
                                                            }
                                                        }}
                                                    >
                                                        {isOutOfStock ? 'Sold Out' : (item.seller_id === currentUserId ? 'Your Item' : 'Add to Cart')}
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
