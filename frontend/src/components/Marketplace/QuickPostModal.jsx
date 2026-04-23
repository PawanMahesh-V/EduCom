import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import '../../styles/MarketplaceModals.css';
import api from '../../api/client';
import API_BASE_URL from '../../config/api';

const QuickPostModal = ({ isOpen, onClose, onSuccess, editItem = null }) => {
    const [formData, setFormData] = useState({
        title: editItem?.title || '',
        category: editItem?.category || 'Textbooks',
        description: editItem?.description || '',
        price: editItem?.price || '',
        quantity: editItem?.quantity || 1,
        tags: Array.isArray(editItem?.tags) ? editItem.tags.join(', ') : (editItem?.tags || ''),
        deliveryOptions: []
    });
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editItem?.image_url || null);
    const fileInputRef = useRef(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                setFormData({
                    title: editItem.title || '',
                    category: editItem.category || 'Textbooks',
                    description: editItem.description || '',
                    price: editItem.price || '',
                    quantity: editItem.quantity || 1,
                    tags: Array.isArray(editItem.tags) ? editItem.tags.join(', ') : (editItem.tags || ''),
                    deliveryOptions: []
                });
                setImagePreview(editItem.image_url || null);
                setImageFile(null);
            } else {
                setFormData({
                    title: '',
                    category: 'Textbooks',
                    description: '',
                    price: '',
                    quantity: 1,
                    tags: '',
                    deliveryOptions: []
                });
                setImagePreview(null);
                setImageFile(null);
            }
        }
    }, [editItem, isOpen]);

    if (!isOpen) return null;

    const deliveryChoices = ["Campus Pickup", "Digital Download", "Email Transfer"];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            setImageFile(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleDeliveryChange = (choice) => {
        setFormData(prev => {
            const options = [...prev.deliveryOptions];
            if (options.includes(choice)) {
                return { ...prev, deliveryOptions: options.filter(o => o !== choice) };
            } else {
                return { ...prev, deliveryOptions: [...options, choice] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Append delivery options to tags as a comma separated string
            let finalTags = formData.tags;
            if (formData.deliveryOptions.length > 0) {
                const deliveryStr = formData.deliveryOptions.join(', ');
                finalTags = finalTags ? `${finalTags}, ${deliveryStr}` : deliveryStr;
            }

            // Using fetch directly because ApiClient.post automatically JSON.stringifies 
            // the body and sets Content-Type to application/json, which breaks multipart/form-data.
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('category', formData.category);
            submitData.append('description', formData.description);
            submitData.append('price', formData.price);
            submitData.append('quantity', formData.quantity);
            if (finalTags) submitData.append('tags', finalTags);
            if (imageFile) submitData.append('image', imageFile);

            const token = localStorage.getItem('userToken');
            
            const url = editItem 
                ? `${API_BASE_URL}/marketplace/${editItem.id}` 
                : `${API_BASE_URL}/marketplace`;
                
            const response = await fetch(url, {
                method: editItem ? 'PUT' : 'POST',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: submitData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to post item');
            }

            if (data) {
                onSuccess(data);
                // Reset form
                setFormData({
                    title: '', category: 'Textbooks', description: '',
                    price: '', quantity: 1, tags: '', deliveryOptions: []
                });
                setImageFile(null);
                setImagePreview(null);
                onClose();
            }
        } catch (err) {
            setError(err.message || 'Failed to post item');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content post-item-modal">
                <div className="modal-header">
                    <h2>{editItem ? 'Edit Item' : 'Post an Item'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                {error && <div className="modal-error">{error}</div>}

                <form onSubmit={handleSubmit} className="post-item-form">
                    <div className="post-item-layout">
                        {/* Left Side: Image Upload */}
                        <div className="post-item-image-side">
                            <div className="form-group">
                                <label>Item Image</label>
                                <div className="image-upload-zone" onClick={triggerFileInput}>
                                    {imagePreview ? (
                                        <>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="upload-preview-img"
                                            />
                                            <span className="upload-change-hint">Click to change image</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faUpload} className="upload-icon" />
                                            <span className="upload-title">Upload Product Photo</span>
                                            <span className="upload-hint">PNG, JPG up to 10MB</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Form Details */}
                        <div className="post-item-details-side">
                            <div className="form-group">
                                <label>Title *</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    required 
                                    placeholder="e.g., CS-101 Lab Manual" 
                                    value={formData.title} 
                                    onChange={handleChange} 
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category *</label>
                                    <select name="category" value={formData.category} onChange={handleChange}>
                                        <option value="Textbooks">Textbook</option>
                                        <option value="Equipment">Equipment</option>
                                        <option value="Notes">Notes</option>
                                        <option value="Tutoring">Tutoring</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Price (Rs.) *</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        required 
                                        min="0" 
                                        step="0.01" 
                                        placeholder="0.00" 
                                        value={formData.price} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input 
                                        type="number" 
                                        name="quantity" 
                                        required 
                                        min="0" 
                                        value={formData.quantity} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea 
                                    name="description" 
                                    required 
                                    placeholder="Explain what's included..." 
                                    rows="4" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tags (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        name="tags" 
                                        placeholder="e.g., Programming, CS101, Notes" 
                                        value={formData.tags} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>

                            <div className="form-group delivery-options">
                                <label>Delivery/Exchange Method</label>
                                <div className="checkbox-group">
                                    {deliveryChoices.map(choice => (
                                        <label key={choice} className="checkbox-label">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.deliveryOptions.includes(choice)} 
                                                onChange={() => handleDeliveryChange(choice)} 
                                            />
                                            {choice}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : (editItem ? 'Update Listing' : 'Publish Listing')}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickPostModal;
