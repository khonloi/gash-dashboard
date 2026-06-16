import React from "react";
import { getOrderStatusOptionDisabled } from "../../utils/orderUtils";
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const UpdateOrderStatusModal = ({
    isOpen,
    onClose,
    order,
    updateFormData,
    onFormChange,
    onUpdate,
    isUpdating,
    error
}) => {
    if (!isOpen) return null;

    // Order status options
    const orderStatusOptions = [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "shipping", label: "Shipping" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];

    // Order status options for Update Status modal (without cancelled)
    const updateOrderStatusOptions = orderStatusOptions.filter(opt => opt.value !== "cancelled");

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" zIndex="z-50">
            <Modal.Header>
                Update Order Status
            </Modal.Header>

            <Modal.Body className="p-4 sm:p-6 lg:p-8 flex-1">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="h-4 w-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs sm:text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-5 lg:space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Order Status
                        </label>
                        <select
                            value={updateFormData.order_status || ""}
                            onChange={(e) => onFormChange("order_status", e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:ring-2 bg-white text-sm lg:text-base border-gray-300 hover:border-gray-400 focus:border-[rgb(217 119 6)] focus:ring-[rgb(217 119 6)]"
                        >
                            {updateOrderStatusOptions.map((opt) => (
                                <option
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={getOrderStatusOptionDisabled(order?.order_status, opt.value)}
                                    className={getOrderStatusOptionDisabled(order?.order_status, opt.value) ? 'text-gray-400' : ''}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Workflow: Pending → Confirmed → Shipping → Delivered
                        </p>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={isUpdating}>
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={onUpdate} 
                    disabled={isUpdating}
                    className="px-6"
                >
                    {isUpdating ? (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            <span>Processing...</span>
                        </div>
                    ) : (
                        'Update'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateOrderStatusModal;

