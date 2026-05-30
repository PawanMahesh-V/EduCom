import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import imageCompression from 'browser-image-compression';
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
                setError('Please select a valid image file formatting type.');
                return;
            }

            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true
                };
                const compressedFile = await imageCompression(file, options);
                setImageFile(compressedFile);
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Error compressing image:", error);
                setError("Failed to process image payload structure. Please try another file.");
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
                throw new Error(data.message || 'Failed to deploy item node allocation mapping');
            }

            if (data) {
                onSuccess(data);
                setFormData({
                    title: '', description: '',
                    price: '', quantity: 1
                });
                setImageFile(null);
                setImagePreview(null);
                onClose();
            }
        } catch (err) {
            // MERGED CATCH: Handles API errors, network issues, or processing faults in one block
            setError(err.message || 'An unexpected error occurred while processing your listing.');
            console.error("Submission error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="qp-modal-overlay" onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}>
            <div className="qp-modal-box fade-in">
                
                <div className="qp-modal-header">
                    <h2 className="qp-modal-title">{editItem ? 'Modify Marketplace Listing' : 'Establish Product Listing'}</h2>
                    <button className="qp-close-trigger-btn" onClick={onClose} disabled={isSubmitting} aria-label="Close modal view">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                {error && <div className="qp-field-error-notice fade-in">{error}</div>}

                <form onSubmit={handleSubmit} className="qp-modal-form">
                    <div className="qp-split-layout">
                        
                        <div className="qp-media-column">
                            <div className="qp-form-group">
                                <label className="qp-form-label">Product Visual Photo</label>
                                <div className={`qp-upload-dropzone ${imagePreview ? 'qp-upload-dropzone--has-preview' : ''}`} onClick={triggerFileInput}>
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Product Upload Preview" className="qp-upload-img-preview" />
                                            <div className="qp-upload-change-overlay">
                                                <span>Click to replace image file</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="qp-upload-empty-state-stack">
                                            <FontAwesomeIcon icon={faUpload} className="qp-upload-icon-avatar" />
                                            <span className="qp-upload-headline">Upload Product Photo</span>
                                            <span className="qp-upload-sub-dimensions-hint">PNG, JPG formats up to 10MB</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="qp-info-column">
                            <div className="qp-form-group">
                                <label className="qp-form-label">Product Title *</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    required 
                                    disabled={isSubmitting}
                                    placeholder="e.g., CS-402 Recommended Textbook" 
                                    value={formData.title} 
                                    onChange={handleChange} 
                                    className="qp-input-field"
                                />
                            </div>

                            <div className="qp-form-row-grid">
                                <div className="qp-form-group">
                                    <label className="qp-form-label">Price * (PKR)</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        required 
                                        min="0" 
                                        disabled={isSubmitting}
                                        placeholder="e.g., 1200" 
                                        value={formData.price} 
                                        onChange={handleChange} 
                                        className="qp-input-field qp-input-field--no-spin"
                                    />
                                </div>
                                <div className="qp-form-group">
                                    <label className="qp-form-label">Units Stock *</label>
                                    <input 
                                        type="number" 
                                        name="quantity" 
                                        required 
                                        min="1" 
                                        max="1000"
                                        disabled={isSubmitting}
                                        placeholder="1" 
                                        value={formData.quantity} 
                                        onChange={handleChange} 
                                        className="qp-input-field"
                                    />
                                </div>
                            </div>

                            <div className="qp-form-group">
                                <label className="qp-form-label">Item Condition & Description *</label>
                                <textarea 
                                    name="description" 
                                    required 
                                    disabled={isSubmitting}
                                    placeholder="Provide details about the item's condition, meeting preferences, etc..." 
                                    rows="4" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    className="qp-textarea-field"
                                />
                            </div>

                            <div className="qp-modal-action-footer">
                                <button type="button" className="qp-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="qp-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Processing Pipeline...</span>
                                        </>
                                    ) : (
                                        <span>{editItem ? 'Update Listing Matrix' : 'Publish Product Listing'}</span>
                                    )}
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