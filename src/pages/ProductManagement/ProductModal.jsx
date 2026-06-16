// ProductModal.jsx - Combined Create and Edit Product Modal
import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { MdFormatBold, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdFormatUnderlined, MdLooksOne, MdLooksTwo, MdLooks3 } from 'react-icons/md';
import { ToastContext } from '../../context/ToastContext';
import Api from '../../common/SummaryAPI';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const ProductModal = ({
    isOpen,
    onClose,
    onSubmit,
    product, // Optional: if provided, it's edit mode
    categories,
    loading,
    error
}) => {
    const { showToast } = useContext(ToastContext);
    const isEditMode = !!product;

    const [localLoading, setLocalLoading] = useState(false);

    const [formData, setFormData] = useState({
        productName: '',
        categoryId: '',
        description: '',
        productStatus: 'pending', // Default to 'pending' - will be set to 'active' when variant is added
    });
    const [imagesList, setImagesList] = useState([]);
    const [imageUrlLink, setImageUrlLink] = useState('');
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

    // Initialize form data when product changes (edit mode)
    useEffect(() => {
        if (isEditMode && product && isOpen) {
            const initialData = {
                productName: product.productName || '',
                categoryId: product.categoryId?._id || product.categoryId || '',
                description: product.description || '',
                productStatus: product.productStatus || 'active',
            };
            setFormData(initialData);
            
            const initialImages = (product.productImageIds || []).map(img => ({
                type: 'existing',
                url: img.imageUrl,
                isMain: img.isMain
            }));
            setImagesList(initialImages);
            setImageUrlLink('');
            
            // Find the main image index
            const mainIndex = initialImages.findIndex(img => img.isMain);
            setMainImageIndex(mainIndex >= 0 ? mainIndex : 0);

            // Set description HTML
            if (descriptionRef.current) {
                descriptionRef.current.innerHTML = initialData.description;
            }
        } else if (!isEditMode && isOpen) {
            // Reset form for create mode
            setFormData({
                productName: '',
                categoryId: '',
                description: '',
                productStatus: 'pending', // Default to 'pending' - will be set to 'active' when variant is added
            });
            setImagesList([]);
            setImageUrlLink('');
            setMainImageIndex(0);
            setValidationErrors({});
            if (descriptionRef.current) {
                descriptionRef.current.innerHTML = '';
            }
        }
    }, [product, isOpen, isEditMode]);

    // Set initial description HTML for create mode
    useEffect(() => {
        if (!isEditMode && isOpen && descriptionRef.current) {
            descriptionRef.current.innerHTML = formData.description;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isEditMode]);

    // Get character count from HTML description
    const getDescriptionCharCount = useCallback((htmlContent) => {
        if (!htmlContent) return 0;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        return textContent.trim().length;
    }, []);

    // Validate individual field
    const validateField = useCallback((name, value, currentFormData = formData) => {
        switch (name) {
            case 'productName':
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                const trimmedProductName = value.trim();
                const productNamePattern = /^[a-zA-ZÀ-ỹ0-9\s\-]+$/;
                if (trimmedProductName.length < 5 || trimmedProductName.length > 100 || !productNamePattern.test(trimmedProductName)) {
                    return 'Product name must be 5 to 100 characters long and contain only letters, numbers, spaces, and hyphens';
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
                if (trimmedDescription.length < 10) {
                    return 'Description must be at least 10 characters';
                }
                if (trimmedDescription.length > 10000) {
                    return 'Description must be at most 10000 characters';
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
        if (imagesList.length === 0) {
            errors.images = 'Please fill in all required fields';
        } else {
            // Validate mainImageIndex is valid (within range of all images)
            if (mainImageIndex < 0 || mainImageIndex >= imagesList.length) {
                errors.images = 'Exactly one product image must have isMain set to true';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, imagesList, mainImageIndex, validateField]);

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

    // Upload helper (single image) with retry mechanism
    const uploadSingleImage = useCallback(async (file, retries = 2) => {
        if (!file) return '';

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    // Wait before retry with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const response = await Api.upload.image(file);

                // Backend returns: { success: true, url: '...', filename: '...' }
                const imageUrl = response.data?.url || response.data?.data?.url;

                if (!imageUrl) {
                    if (attempt === retries) {
                        return '';
                    }
                    continue; // Retry
                }

                return imageUrl;
            } catch (err) {
                const isLastAttempt = attempt === retries;

                if (isLastAttempt) {
                    return '';
                }

                // If it's a network error, retry
                if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || !err.response) {
                    continue;
                }

                // If it's a server error (5xx), retry
                if (err.response?.status >= 500) {
                    continue;
                }

                // For other errors (4xx), don't retry
                return '';
            }
        }

        return '';
    }, []);

    // Handle new image file selection
    const handleNewImageFilesChange = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate all files are images
        const allImagesValid = files.every(file => file.type.startsWith('image/'));
        if (!allImagesValid) {
            showToast('All files must be images', 'error');
            e.target.value = '';
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagesList(prev => [
                    ...prev,
                    {
                        type: 'file',
                        file: file,
                        url: reader.result
                    }
                ]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    }, [showToast]);

    // Handle adding image link
    const handleAddImageLink = useCallback(() => {
        if (!imageUrlLink || imageUrlLink.trim() === '') return;
        const trimmedLink = imageUrlLink.trim();

        // Basic URL validation
        try {
            new URL(trimmedLink);
        } catch (_) {
            showToast('Please enter a valid image URL', 'error');
            return;
        }

        setImagesList(prev => [
            ...prev,
            {
                type: 'link',
                url: trimmedLink
            }
        ]);
        setImageUrlLink('');
    }, [imageUrlLink, showToast]);

    // Remove an image
    const removeImage = useCallback((index) => {
        setImagesList(prev => prev.filter((_, i) => i !== index));
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

        // Set loading immediately
        setLocalLoading(true);

        // Validate form - this will set validationErrors
        if (!validateForm()) {
            // Show generic message since error messages are already displayed under each field
            showToast('Please check the input fields again', 'error');
            setLocalLoading(false);
            return;
        }

        try {
            // Process and upload images
            const finalImages = [];
            for (let i = 0; i < imagesList.length; i++) {
                const img = imagesList[i];
                if (img.type === 'file') {
                    const uploadedUrl = await uploadSingleImage(img.file);
                    if (!uploadedUrl) {
                        showToast('Failed to upload one or more images. Please try again.', 'error');
                        setLocalLoading(false);
                        return;
                    }
                    finalImages.push({
                        imageUrl: uploadedUrl,
                        isMain: i === mainImageIndex
                    });
                } else {
                    finalImages.push({
                        imageUrl: img.url,
                        isMain: i === mainImageIndex
                    });
                }
            }

            // Call parent onSubmit with form data and images
            await onSubmit({
                ...formData,
                productImageIds: finalImages,
            });

            // Reset form
            setFormData({
                productName: '',
                categoryId: '',
                description: '',
                productStatus: 'pending', // Default to 'pending' - will be set to 'active' when variant is added
            });
            setImagesList([]);
            setImageUrlLink('');
            setMainImageIndex(0);
            setValidationErrors({});
            setLocalLoading(false);
        } catch (err) {
            console.error(`${isEditMode ? 'Edit' : 'Add'} product error:`, err);

            let errorMessage = isEditMode ? "Failed to update product" : "Failed to create product";
            const blankFields = {};
            let hasFieldErrors = false;

            // Handle API response errors - prioritize backend message
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
                // Extract actual message if wrapped
                const prefix = isEditMode ? 'Failed to update product: ' : 'Failed to create product: ';
                if (errorMessage.includes(prefix)) {
                    errorMessage = errorMessage.replace(prefix, '');
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
                    if (imagesList.length === 0) {
                        blankFields.images = "Please fill in all required fields";
                        hasFieldErrors = true;
                    }
                    if (Object.keys(blankFields).length > 0) {
                        setValidationErrors(prev => ({ ...prev, ...blankFields }));
                    }
                }
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (!err.response) {
                errorMessage = isEditMode ? "Failed to update product. Please try again later." : "Failed to create product. Please try again later.";
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
                } else if (backendMessage.includes('Product not found')) {
                    errorMessage = 'Product not found';
                } else if (backendMessage.includes('Cannot update a discontinued product')) {
                    errorMessage = 'Cannot update a discontinued product';
                } else if (backendMessage.includes('Invalid product ID')) {
                    errorMessage = 'Invalid product ID';
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
                errorMessage = isEditMode ? "Product not found" : "Service not available";
            } else if (err.response?.status >= 500) {
                errorMessage = "Server error. Please try again later.";
            }

            // Show toast: if field errors are displayed, show generic message; otherwise show specific error
            if (hasFieldErrors || Object.keys(blankFields).length > 0) {
                showToast("Please check the input fields again", "error");
            } else {
                showToast(errorMessage, "error");
            }
        } finally {
            setLocalLoading(false);
        }
    }, [formData, imagesList, mainImageIndex, onSubmit, validateForm, uploadSingleImage, showToast, isEditMode]);

    // Reset form when modal closes
    const handleClose = useCallback(() => {
        setFormData({
            productName: '',
            categoryId: '',
            description: '',
            productStatus: 'active',
        });
        setImagesList([]);
        setImageUrlLink('');
        setMainImageIndex(0);
        setValidationErrors({});
        onClose();
    }, [onClose]);

    if (!isOpen) return null;
    if (isEditMode && !product) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-4xl" zIndex="z-50">
            <Modal.Header>
                {isEditMode ? 'Edit Product' : 'Add New Product'}
            </Modal.Header>

            <Modal.Body className="p-4 sm:p-6 lg:p-8 flex-1">
                <form id="productForm" onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                            <div>
                                <label htmlFor={isEditMode ? "edit-productName" : "productName"} className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id={isEditMode ? "edit-productName" : "productName"}
                                    type="text"
                                    value={formData.productName}
                                    onChange={(e) => handleFieldChange('productName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:ring-2 bg-white text-sm lg:text-base ${validationErrors.productName
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 hover:border-gray-400 focus:border-[rgb(217 119 6)] focus:ring-[rgb(217 119 6)]'
                                        }`}
                                    placeholder="Enter product name"
                                    required
                                />
                                {validationErrors.productName && (
                                    <p className="mt-1.5 text-sm text-red-600">{validationErrors.productName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor={isEditMode ? "edit-categoryId" : "categoryId"} className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id={isEditMode ? "edit-categoryId" : "categoryId"}
                                    value={formData.categoryId}
                                    onChange={(e) => handleFieldChange('categoryId', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 bg-white text-sm lg:text-base ${validationErrors.categoryId
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 hover:border-gray-400 focus:border-[rgb(217 119 6)] focus:ring-[rgb(217 119 6)]'
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
                            <div className={`border rounded-xl overflow-hidden shadow-sm ${isEditMode ? 'rounded-lg' : ''} ${isEditMode ? 'border-gray-200' : 'border-gray-200'}`}>
                                {/* Toolbar */}
                                <div className={`flex items-center gap-1 p-2 border-b flex-wrap ${isEditMode ? 'bg-gray-100' : 'bg-[rgb(254 243 199)]/50'}`}>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('bold', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.bold ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdFormatBold /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('italic', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.italic ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdFormatItalic /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('underline', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.underline ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdFormatUnderlined /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            descriptionRef.current.focus();
                                            const url = prompt('Enter URL:');
                                            if (url) document.execCommand('createLink', false, url);
                                            updateActiveFormats();
                                        }}
                                        className={`p-2 rounded ${isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]'}`}><MdLink /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('insertUnorderedList', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.bullet ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdFormatListBulleted /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('insertOrderedList', false); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.numbered ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdFormatListNumbered /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('formatBlock', false, 'h1'); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.h1 ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdLooksOne /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('formatBlock', false, 'h2'); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.h2 ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdLooksTwo /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { descriptionRef.current.focus(); document.execCommand('formatBlock', false, 'h3'); updateActiveFormats(); }}
                                        className={`p-2 rounded ${activeFormats.h3 ? (isEditMode ? 'bg-gray-300' : 'bg-[rgb(254 243 199)]') : (isEditMode ? 'hover:bg-gray-300' : 'hover:bg-[rgb(254 243 199)]')}`}><MdLooks3 /></button>
                                </div>

                                {/* Rich editor */}
                                <div
                                    ref={descriptionRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => handleFieldChange('description', e.currentTarget.innerHTML)}
                                    className={`min-h-48 px-4 py-3 prose prose-sm max-w-none focus:outline-none bg-white ${validationErrors.description ? 'border-red-500' : ''
                                        }`}
                                    style={{ minHeight: isEditMode ? '24em' : '320px' }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                {validationErrors.description && (
                                    <p className="text-sm text-red-600">{validationErrors.description}</p>
                                )}
                                <div className="ml-auto">
                                    <p className={`text-xs font-medium ${getDescriptionCharCount(formData.description) < 10
                                        ? 'text-orange-600'
                                        : getDescriptionCharCount(formData.description) > 10000
                                            ? 'text-red-600'
                                            : getDescriptionCharCount(formData.description) > 9500
                                                ? 'text-yellow-600'
                                                : 'text-gray-500'
                                        }`}>
                                        {getDescriptionCharCount(formData.description)} / 10000 characters
                                        {getDescriptionCharCount(formData.description) < 10 && (
                                            <span className="ml-1">(Minimum: 10)</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Image Management */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Images <span className="text-red-500">*</span>
                            </label>

                            {/* Image Link Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={imageUrlLink}
                                    onChange={(e) => setImageUrlLink(e.target.value)}
                                    placeholder="Or paste an image link here..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm lg:text-base focus:border-[rgb(217 119 6)] focus:ring-[rgb(217 119 6)] focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddImageLink}
                                    className="px-4 py-2 bg-gradient-to-r from-[rgb(245 158 11)] to-[rgb(217 119 6)] hover:from-[rgb(217 119 6)] hover:to-[rgb(180 83 9)] text-white font-medium rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Add Link
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* File Input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleNewImageFilesChange}
                                    className="hidden"
                                    id={isEditMode ? "edit-image-files" : "image-files"}
                                />
                                {validationErrors.images && (
                                    <p className="text-sm text-red-600">{validationErrors.images}</p>
                                )}

                                {/* Upload Button and Images Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {/* Upload Button */}
                                    <label
                                        htmlFor={isEditMode ? "edit-image-files" : "image-files"}
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

                                    {/* Images */}
                                    {imagesList.map((img, index) => (
                                        <div
                                            key={index}
                                            className={`relative border-2 rounded-lg overflow-hidden aspect-square ${mainImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2 flex space-x-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110"
                                                    title="Remove image"
                                                >
                                                    ×
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMainImageIndex(index)}
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110 ${mainImageIndex === index
                                                        ? 'bg-yellow-500 text-white'
                                                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-yellow-500 border border-gray-300'
                                                        }`}
                                                    title={mainImageIndex === index ? "Main image" : "Set as main image"}
                                                >
                                                    <FaStar />
                                                </button>
                                            </div>
                                            {img.type === 'file' && (
                                                <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md">
                                                    New Upload
                                                </div>
                                            )}
                                            {img.type === 'link' && (
                                                <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md">
                                                    Link
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
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={localLoading}>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    form="productForm" 
                    variant="primary" 
                    disabled={localLoading}
                    className="px-6"
                >
                    {localLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            <span>Processing...</span>
                        </div>
                    ) : (
                        isEditMode ? 'Edit' : 'Add'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProductModal;

