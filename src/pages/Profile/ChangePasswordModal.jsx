import React, { useState, useContext, useCallback } from "react";
import Api from "../../common/SummaryAPI";
import { useToast } from "../../hooks/useToast";
import { AuthContext } from "../../context/AuthContext";
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import PasswordInput from '../../components/ui/PasswordInput';

const ChangePasswordModal = ({ handleCancel }) => {
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        repeatPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const { user } = useContext(AuthContext);
    const { showToast } = useToast();

    // Validate individual field
    const validateField = useCallback((name, value, currentFormData = form) => {
        switch (name) {
            case 'oldPassword': {
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                return null;
            }
            case 'newPassword': {
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                // Password validation: at least 8 characters and include three of four types
                if (value.length < 8) {
                    return 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special';
                }
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                const characterTypesMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
                if (characterTypesMet < 3) {
                    return 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special';
                }
                return null;
            }
            case 'repeatPassword':
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                if (value !== currentFormData.newPassword) {
                    return 'Repeated password does not match';
                }
                return null;
            default:
                return null;
        }
    }, [form]);

    // Validate form
    const validateForm = useCallback(() => {
        const errors = {};

        // Validate oldPassword
        const oldPasswordError = validateField('oldPassword', form.oldPassword);
        if (oldPasswordError) errors.oldPassword = oldPasswordError;

        // Validate newPassword
        const newPasswordError = validateField('newPassword', form.newPassword);
        if (newPasswordError) errors.newPassword = newPasswordError;

        // Validate repeatPassword
        const repeatPasswordError = validateField('repeatPassword', form.repeatPassword);
        if (repeatPasswordError) errors.repeatPassword = repeatPasswordError;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form, validateField]);

    // Handle field change with real-time validation
    const handleFieldChange = useCallback((field, value) => {
        setForm(prev => {
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
                // If changing newPassword, also revalidate repeatPassword
                if (field === 'newPassword') {
                    const repeatPasswordError = validateField('repeatPassword', updated.repeatPassword, updated);
                    if (repeatPasswordError) {
                        newErrors.repeatPassword = repeatPasswordError;
                    } else if (updated.repeatPassword) {
                        delete newErrors.repeatPassword;
                    }
                }
                return newErrors;
            });

            return updated;
        });
    }, [validateField]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Set loading immediately
        setLoading(true);

        // Validate form - this will set validationErrors
        if (!validateForm()) {
            // Show generic message since error messages are already displayed under each field
            showToast('Please check the input fields again', 'error');
            setLoading(false);
            return;
        }

        // Check if new password is different from old password
        if (form.oldPassword === form.newPassword) {
            setValidationErrors(prev => ({ ...prev, newPassword: 'New password must be different from old password' }));
            showToast('Please check the input fields again', 'error');
            setLoading(false);
            return;
        }

        try {
            await Api.accounts.changePassword(user._id, {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            showToast("Password changed successfully", "success", 2000);
            // Reset form
            setForm({
                oldPassword: "",
                newPassword: "",
                repeatPassword: "",
            });
            setValidationErrors({});
            handleCancel();
        } catch (err) {
            console.error("Change password error:", err.response || err.message);
            let errorMessage = "Failed to change password";

            // Handle API response errors
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            // Handle specific validation errors from backend
            if (err.response?.data?.message) {
                const backendMessage = errorMessage;
                if (backendMessage.includes('Please fill in all required fields') ||
                    backendMessage.toLowerCase().includes('fill in all required')) {
                    if (!form.oldPassword || !form.oldPassword.trim()) {
                        setValidationErrors(prev => ({ ...prev, oldPassword: 'Please fill in all required fields' }));
                    }
                    if (!form.newPassword || !form.newPassword.trim()) {
                        setValidationErrors(prev => ({ ...prev, newPassword: 'Please fill in all required fields' }));
                    }
                    if (!form.repeatPassword || !form.repeatPassword.trim()) {
                        setValidationErrors(prev => ({ ...prev, repeatPassword: 'Please fill in all required fields' }));
                    }
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                } else if (backendMessage.includes('Current password is incorrect') ||
                    backendMessage.includes('Old password is incorrect')) {
                    setValidationErrors(prev => ({ ...prev, oldPassword: 'Old password is incorrect' }));
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                } else if (backendMessage.includes('New password must be at least 8 characters') ||
                    backendMessage.includes('Password must include at least three') ||
                    backendMessage.includes('Passwords must be at least 8 characters')) {
                    setValidationErrors(prev => ({ ...prev, newPassword: 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special' }));
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                } else if (backendMessage.includes('New password must be different') ||
                    backendMessage.includes('same as old password')) {
                    setValidationErrors(prev => ({ ...prev, newPassword: 'New password must be different from old password' }));
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                }
            }

            // Handle specific HTTP status codes
            if (err.response?.status === 401) {
                errorMessage = "You are not authorized to perform this action";
            } else if (err.response?.status === 403) {
                errorMessage = "Access denied";
            } else if (err.response?.status === 404) {
                errorMessage = "Service not available";
            } else if (err.response?.status >= 500) {
                errorMessage = "Server error. Please try again later.";
            }

            showToast(errorMessage, "error", 4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={handleCancel} maxWidth="max-w-md">
            <Modal.Header>
                Change Password
            </Modal.Header>

            <Modal.Body className="p-4 sm:p-6 lg:p-8">
                <form id="changePasswordForm" onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { label: "Old Password", key: "oldPassword" },
                        { label: "New Password", key: "newPassword" },
                        { label: "Repeat Password", key: "repeatPassword" },
                    ].map((field) => (
                        <div key={field.key} className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {field.label} <span className="text-red-500">*</span>
                            </label>
                            <PasswordInput
                                value={form[field.key]}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                className={validationErrors[field.key] ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
                            />
                            {validationErrors[field.key] && (
                                <p className="mt-1.5 text-sm text-red-600">{validationErrors[field.key]}</p>
                            )}
                        </div>
                    ))}
                </form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" form="changePasswordForm" variant="primary" disabled={loading} className="px-6">
                    {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            <span>Saving...</span>
                        </div>
                    ) : (
                        'Save'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ChangePasswordModal;