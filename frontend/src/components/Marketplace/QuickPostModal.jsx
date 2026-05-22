import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import imageCompression from 'browser-image-compression';
import '../../styles/MarketplaceModals.css';
import api from '../../api/client';
import API_BASE_URL from '../../config/api';
import CustomSelect from '../Common/CustomSelect';

const QuickPostModal = ({ isOpen, onClose, onSuccess, editItem = null }) => {
    const [formData, setFormData] = useState({
        title: editItem?.title || '',
        description: editItem?.description || '',
        price: editItem?.price || '',
        quantity: editItem?.quantity || 1
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
                    description: editItem.description || '',
                    price: editItem.price || '',
                    quantity: editItem.quantity || 1
                });
                setImagePreview(editItem.image_url || null);
                setImageFile(null);
            } else {
                setFormData({
                    title: '',
                    description: '',
                    price: '',
                    quantity: 1
                });
                setImagePreview(null);
                setImageFile(null);
            }
        }
    }, [editItem, isOpen]);

    if (!isOpen) return null;



    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'quantity' && parseInt(value) > 1000) {
            value = '1000';
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            try {
                // Compress image
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true
                };
                const compressedFile = await imageCompression(file, options);
                setImageFile(compressedFile);
                
                // Create preview URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Error compressing image:", error);
                setError("Failed to process image. Please try another one.");
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Using fetch directly because ApiClient.post automatically JSON.stringifies 
            // the body and sets Content-Type to application/json, which breaks multipart/form-data.
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('price', formData.price);
            submitData.append('quantity', formData.quantity);
            if (imageFile) submitData.append('image', imageFile);

            const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
            
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
                    title: '', description: '',
                    price: '', quantity: 1
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
                                    placeholder="e.g., Book" 
                                    value={formData.title} 
                                    onChange={handleChange} 
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price *</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        className="no-spin"
                                        required 
                                        min="0" 
                                        placeholder="10000" 
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
                                        min="1" 
                                        max="1000"
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
