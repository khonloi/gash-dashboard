// CreateProductModal.jsx
import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { MdFormatBold, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdFormatUnderlined, MdLooksOne, MdLooksTwo, MdLooks3 } from 'react-icons/md';
import { ToastContext } from '../../context/ToastContext';
import Api from '../../common/SummaryAPI';

const CreateProductModal = ({
    isOpen,
    onClose,
    onSubmit,
    categories,
    loading,
    error
}) => {
    const { showToast } = useContext(ToastContext);
    const [formData, setFormData] = useState({
        productName: '',
        categoryId: '',
        description: '',
        productStatus: 'active',
    });
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const descriptionRef = useRef(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        bullet: false,
        numbered: false,
        h1: false,
        h2: false,
        h3: false,
    });

    const updateActiveFormats = () => {
        if (!descriptionRef.current) return;
        const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            bullet: document.queryCommandState('insertUnorderedList'),
            numbered: document.queryCommandState('insertOrderedList'),
            h1: formatBlock === 'h1',
            h2: formatBlock === 'h2',
            h3: formatBlock === 'h3',
        });
    };

    useEffect(() => {
        const editor = descriptionRef.current;
        if (editor) {
            editor.addEventListener('input', updateActiveFormats);
            editor.addEventListener('keyup', updateActiveFormats);
            editor.addEventListener('mouseup', updateActiveFormats);
            editor.addEventListener('focus', updateActiveFormats);
            return () => {
                editor.removeEventListener('input', updateActiveFormats);
                editor.removeEventListener('keyup', updateActiveFormats);
                editor.removeEventListener('mouseup', updateActiveFormats);
                editor.removeEventListener('focus', updateActiveFormats);
            };
        }
    }, []);

    // Validate individual field
    const validateField = useCallback((name, value, currentFormData = formData) => {
        switch (name) {
            case 'productName':
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                const trimmedProductName = value.trim();
                const productNamePattern = /^[a-zA-ZÀ-ỹ0-9\s\-]+$/;
                if (trimmedProductName.length < 3 || trimmedProductName.length > 100 || !productNamePattern.test(trimmedProductName)) {
                    return 'Product name must be 3 to 100 characters long and contain only letters, numbers, spaces, and hyphens';
                }
                return null;
            case 'categoryId':
                if (!value) return 'Please fill in all required fields';
                return null;
            case 'description':
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                // For HTML content, get text content length
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = value;
                const textContent = tempDiv.textContent || tempDiv.innerText || '';
                const trimmedDescription = textContent.trim();
                // Check if blank after extracting text content
                if (trimmedDescription === '') return 'Please fill in all required fields';
                if (trimmedDescription.length < 50 || trimmedDescription.length > 2000) {
                    return 'Description must be between 50 and 2000 characters long';
                }
                return null;
            default:
                return null;
        }
    }, [formData]);

    // Validation functions
    const validateForm = useCallback(() => {
        const errors = {};

        // Validate productName
        const productNameError = validateField('productName', formData.productName);
        if (productNameError) errors.productName = productNameError;

        // Validate categoryId
        const categoryIdError = validateField('categoryId', formData.categoryId);
        if (categoryIdError) errors.categoryId = categoryIdError;

        // Validate description
        const descriptionError = validateField('description', formData.description);
        if (descriptionError) errors.description = descriptionError;

        // Validate images
        if (images.length === 0) {
            errors.images = 'Please fill in all required fields';
        } else {
            // Validate mainImageIndex is valid (within range)
            if (mainImageIndex < 0 || mainImageIndex >= images.length) {
                errors.images = 'Exactly one product image must have isMain set to true';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, images, mainImageIndex, validateField]);

    // Handle field change with real-time validation
    const handleFieldChange = useCallback((field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Validate the current field with updated formData
            const error = validateField(field, value, updated);

            // Update errors
            setValidationErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
                return newErrors;
            });

            return updated;
        });
    }, [validateField]);

    // Upload helper (single image)
    const uploadSingleImage = useCallback(async (file) => {
        if (!file) return '';
        try {
            const response = await Api.upload.image(file);

            // Try different possible response structures
            const imageUrl = response.data?.url ||
                response.data?.data?.url ||
                response.data?.imageUrl ||
                response.data?.data?.imageUrl ||
                response.data;

            if (!imageUrl) {
                return '';
            }

            return imageUrl;
        } catch (err) {
            return '';
        }
    }, []);

    // Handle multiple image file selection
    const handleImageFilesChange = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate all files are images
        const allImagesValid = files.every(file => file.type.startsWith('image/'));
        if (!allImagesValid) {
            alert('All files must be images');
            e.target.value = '';
            return;
        }

        setImages(prev => [...prev, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    }, []);

    // Remove an image
    const removeImage = useCallback((index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        // Adjust main image index if needed
        if (mainImageIndex === index) {
            setMainImageIndex(0);
        } else if (mainImageIndex > index) {
            setMainImageIndex(prev => prev - 1);
        }
    }, [mainImageIndex]);


    // Handle form submit
    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();

        // Validate form - this will set validationErrors
        if (!validateForm()) {
            // Show generic message since error messages are already displayed under each field
            showToast('Please check the input fields again', 'error');
            return;
        }

        try {
            // Upload all images
            const uploadedImageUrls = await Promise.all(
                images.map(file => uploadSingleImage(file))
            );

            // Validate that all images were uploaded successfully
            const failedUploads = uploadedImageUrls.filter(url => !url || url === '');
            if (failedUploads.length > 0) {
                showToast('Some images failed to upload. Please try again.', 'error');
                return;
            }

            // Prepare image data with isMain flag
            const imageData = uploadedImageUrls.map((url, index) => ({
                imageUrl: url,
                isMain: index === mainImageIndex
            }));

            // Call parent onSubmit with form data and images
            await onSubmit({
                ...formData,
                productImageIds: imageData,
            });

            // Reset form
            setFormData({
                productName: '',
                categoryId: '',
                description: '',
                productStatus: 'active',
            });
            setImages([]);
            setImagePreviews([]);
            setMainImageIndex(0);
            setValidationErrors({});
        } catch (err) {
            console.error("Create product error:", err);

            let errorMessage = "An unexpected error occurred";
            const blankFields = {};
            let hasFieldErrors = false;

            // Handle API response errors - prioritize backend message
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
                // Extract actual message if wrapped in "Failed to create product: "
                if (errorMessage.includes('Failed to create product: ')) {
                    errorMessage = errorMessage.replace('Failed to create product: ', '');
                }

                // If error is "Please fill in all required fields", highlight blank fields
                if (errorMessage === "Please fill in all required fields" ||
                    errorMessage.toLowerCase().includes("fill in all required")) {
                    if (!formData.productName || !formData.productName.trim()) {
                        blankFields.productName = "Please fill in all required fields";
                        hasFieldErrors = true;
                    }
                    if (!formData.categoryId) {
                        blankFields.categoryId = "Please fill in all required fields";
                        hasFieldErrors = true;
                    }
                    if (!formData.description || !formData.description.trim()) {
                        blankFields.description = "Please fill in all required fields";
                        hasFieldErrors = true;
                    }
                    if (images.length === 0) {
                        blankFields.images = "Please fill in all required fields";
                        hasFieldErrors = true;
                    }
                    if (Object.keys(blankFields).length > 0) {
                        setValidationErrors(prev => ({ ...prev, ...blankFields }));
                    }
                }
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            // Handle specific backend validation errors
            if (err.response?.data?.message) {
                const backendMessage = errorMessage; // Use extracted message
                if (backendMessage.includes('Please fill in all required fields')) {
                    setValidationErrors(prev => ({
                        ...prev,
                        images: 'Please fill in all required fields'
                    }));
                    hasFieldErrors = true;
                } else if (backendMessage.includes('Exactly one product image must have isMain set to true')) {
                    setValidationErrors(prev => ({
                        ...prev,
                        images: 'Exactly one product image must have isMain set to true'
                    }));
                    hasFieldErrors = true;
                } else if (backendMessage.includes('Invalid category ID')) {
                    setValidationErrors(prev => ({
                        ...prev,
                        categoryId: 'Invalid category ID'
                    }));
                    hasFieldErrors = true;
                } else if (backendMessage.includes('Product with this name already exists')) {
                    setValidationErrors(prev => ({
                        ...prev,
                        productName: 'Product with this name already exists'
                    }));
                    hasFieldErrors = true;
                } else if (backendMessage.includes('Product status must be')) {
                    setValidationErrors(prev => ({
                        ...prev,
                        productStatus: backendMessage
                    }));
                    hasFieldErrors = true;
                }
            }

            // Handle specific HTTP status codes
            if (err.response?.status === 401) {
                errorMessage = "You are not authorized to perform this action";
            } else if (err.response?.status === 403) {
                errorMessage = "Access denied. Only admin and manager can perform this action";
            } else if (err.response?.status === 404) {
                errorMessage = "Service not available";
            } else if (err.response?.status >= 500) {
                errorMessage = "Server error. Please try again later.";
            }

            // Show toast: if field errors are displayed, show generic message; otherwise show specific error
            if (hasFieldErrors || Object.keys(blankFields).length > 0) {
                showToast("Please check the input fields again", "error");
            } else {
                showToast(errorMessage, "error");
            }
        }
    }, [formData, images, mainImageIndex, uploadSingleImage, onSubmit, validateForm, showToast]);

    // Reset form when modal closes
    const handleClose = useCallback(() => {
        setFormData({
            productName: '',
            categoryId: '',
            description: '',
            productStatus: 'active',
        });
        setImages([]);
        setImagePreviews([]);
        setMainImageIndex(0);
        setValidationErrors({});
        onClose();
    }, [onClose]);

    // Set initial description HTML
    useEffect(() => {
        if (isOpen && descriptionRef.current) {
            descriptionRef.current.innerHTML = formData.description;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl border-2 w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300"
                style={{ borderColor: '#A86523' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b shrink-0"
                    style={{ borderColor: '#A86523' }}
                >
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Add New Product</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ '--tw-ring-color': '#A86523' }}
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                            <div>
                                <label htmlFor="productName" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="productName"
                                    type="text"
                                    value={formData.productName}
                                    onChange={(e) => handleFieldChange('productName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:ring-2 bg-white text-sm lg:text-base ${validationErrors.productName
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 hover:border-gray-400 focus:border-[#A86523] focus:ring-[#A86523]'
                                        }`}
                                    placeholder="Enter product name"
                                    required
                                />
                                {validationErrors.productName && (
                                    <p className="mt-1.5 text-sm text-red-600">{validationErrors.productName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="categoryId"
                                    value={formData.categoryId}
                                    onChange={(e) => handleFieldChange('categoryId', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 bg-white text-sm lg:text-base ${validationErrors.categoryId
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 hover:border-gray-400 focus:border-[#A86523] focus:ring-[#A86523]'
                                        }`}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.filter(category => category.isDeleted !== true).map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.cat_name}
                                        </option>
                                    ))}
                                </select>
                                {validationErrors.categoryId && (
                                    <p className="mt-1.5 text-sm text-red-600">{validationErrors.categoryId}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <div className="border rounded-xl overflow-hidden shadow-sm border-gray-200">
                                {/* Toolbar */}
                                <div className="flex items-center gap-1 bg-[#FCEFCB]/50 p-2 border-b border-gray-200 flex-wrap">
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('bold', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.bold ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdFormatBold /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('italic', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.italic ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdFormatItalic /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('underline', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.underline ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdFormatUnderlined /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            descriptionRef.current.focus();
                                            const url = prompt('Enter URL:');
                                            if (url) document.execCommand('createLink', false, url);
                                            updateActiveFormats();
                                        }}
                                        className="p-2 hover:bg-[#FCEFCB] rounded"><MdLink /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('insertUnorderedList', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.bullet ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdFormatListBulleted /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('insertOrderedList', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.numbered ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdFormatListNumbered /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('formatBlock', false, 'h1'); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.h1 ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdLooksOne /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('formatBlock', false, 'h2'); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.h2 ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdLooksTwo /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('formatBlock', false, 'h3'); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.h3 ? 'bg-[#FCEFCB]' : 'hover:bg-[#FCEFCB]'}`}><MdLooks3 /></button>
                                </div>

                                {/* Rich editor – taller + cursor works */}
                                <div
                                    ref={descriptionRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => handleFieldChange('description', e.currentTarget.innerHTML)}
                                    className={`min-h-48 px-4 py-3 prose prose-sm max-w-none focus:outline-none bg-white ${validationErrors.description ? 'border-red-500' : ''
                                        }`}
                                    style={{ minHeight: '320px' }}
                                />
                            </div>
                            {validationErrors.description && (
                                <p className="mt-1.5 text-sm text-red-600">{validationErrors.description}</p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Images <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-4">
                                {/* File Input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageFilesChange}
                                    className="hidden"
                                    id="image-files"
                                />
                                {validationErrors.images && (
                                    <p className="text-sm text-red-600">{validationErrors.images}</p>
                                )}

                                {/* Upload Button and Image Previews Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {/* Upload Button */}
                                    <label
                                        htmlFor="image-files"
                                        className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 bg-white hover:bg-gray-50 ${validationErrors.images
                                            ? 'border-red-400 bg-red-50'
                                            : 'border-gray-300'
                                            }`}
                                    >
                                        <svg
                                            className={`w-7 h-7 mb-1 ${validationErrors.images ? 'text-red-500' : 'text-gray-400'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                        <p className={`text-xs font-medium ${validationErrors.images ? 'text-red-600' : 'text-gray-600'}`}>
                                            Upload
                                        </p>
                                    </label>

                                    {/* Image Previews */}
                                    {imagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className={`relative border-2 rounded-lg overflow-hidden aspect-square ${mainImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                                                }`}
                                        >
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2 flex space-x-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMainImageIndex(index)}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${mainImageIndex === index
                                                        ? 'bg-yellow-500 text-white'
                                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <FaStar />
                                                </button>
                                            </div>
                                            {mainImageIndex === index && (
                                                <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                                                    Main
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div
                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 border-t shrink-0"
                    style={{ borderColor: '#A86523' }}
                >
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 font-medium text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ '--tw-ring-color': '#A86523' }}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2.5 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:hover:shadow-md"
                        style={{ backgroundColor: '#E9A319', '--tw-ring-color': '#A86523' }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#A86523';
                        }}
                        onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#E9A319';
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Creating...</span>
                            </div>
                        ) : (
                            'Create Product'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProductModal;