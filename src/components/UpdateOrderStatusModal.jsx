import React from "react";
import { getOrderStatusOptionDisabled } from "../utils/orderUtils";

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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border-2 w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b shrink-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Update Order Status</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ '--tw-ring-color': 'rgb(217 119 6)' }}
                        aria-label="Close modal"
                        disabled={isUpdating}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 border-t shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ '--tw-ring-color': 'rgb(217 119 6)' }}
                        disabled={isUpdating}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onUpdate}
                        disabled={isUpdating}
                        className="px-6 py-2.5 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:hover:shadow-md bg-gradient-to-r from-[rgb(245 158 11)] to-[rgb(217 119 6)] hover:from-[rgb(217 119 6)] hover:to-[rgb(180 83 9)] disabled:hover:from-[rgb(245 158 11)] disabled:hover:to-[rgb(217 119 6)]"
                        style={{
                            '--tw-ring-color': 'rgb(217 119 6)'
                        }}
                    >
                        {isUpdating ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateOrderStatusModal;

