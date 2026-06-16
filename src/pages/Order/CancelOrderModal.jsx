import React, { useState, useContext } from "react";
import { ToastContext } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import TextArea from "../../components/ui/TextArea";

const CancelOrderModal = ({ isOpen, onClose, orderId, onConfirm }) => {
  const { showToast } = useContext(ToastContext);
  const [cancelFormData, setCancelFormData] = useState({
    cancelReason: "",
    customReason: ""
  });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!cancelFormData.cancelReason) {
      setError("Please select a cancel reason");
      showToast("Please select a cancel reason", "error");
      return;
    }

    if (cancelFormData.cancelReason === "other" && !cancelFormData.customReason.trim()) {
      setError("Please provide a custom reason");
      showToast("Please provide a custom reason", "error");
      return;
    }

    const reason = cancelFormData.cancelReason === "other" ? cancelFormData.customReason : cancelFormData.cancelReason;
    onConfirm(reason);
  };

  const handleClose = () => {
    setError("");
    setCancelFormData({ cancelReason: "", customReason: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md" zIndex="z-50">
      <Modal.Header>
        Cancel Order
      </Modal.Header>

      <Modal.Body className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">Select a reason for cancelling order {orderId}:</p>
            
            {['address', 'voucher', 'product', 'demand'].map((reason) => (
              <label key={reason} className="flex items-center space-x-2 cursor-pointer py-1">
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={cancelFormData.cancelReason === reason}
                  onChange={(e) => {
                    setError("");
                    setCancelFormData({ ...cancelFormData, cancelReason: e.target.value });
                  }}
                  className="h-4 w-4 text-[rgb(217 119 6)] focus:ring-[rgb(217 119 6)] border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </span>
              </label>
            ))}

            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="radio"
                name="cancelReason"
                value="other"
                checked={cancelFormData.cancelReason === "other"}
                onChange={(e) => {
                  setError("");
                  setCancelFormData({ ...cancelFormData, cancelReason: e.target.value, customReason: "" });
                }}
                className="h-4 w-4 text-[rgb(217 119 6)] focus:ring-[rgb(217 119 6)] border-gray-300"
              />
              <span className="text-sm text-gray-900">Other</span>
            </label>

            {cancelFormData.cancelReason === "other" && (
              <div className="pt-2">
                <TextArea
                  value={cancelFormData.customReason}
                  onChange={(e) => {
                    setError("");
                    setCancelFormData({ ...cancelFormData, customReason: e.target.value });
                  }}
                  placeholder="Enter custom reason"
                  rows={3}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} className="flex-1">
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!cancelFormData.cancelReason || (cancelFormData.cancelReason === "other" && !cancelFormData.customReason.trim())}
          className="flex-1"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Confirm Cancel</span>
          </div>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelOrderModal;