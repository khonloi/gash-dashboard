import React from 'react';
import Modal from './Modal';
import Button from './Button';

const DeleteConfirmModal = ({
    isOpen,
    title = "Confirm Delete",
    message,
    itemName,
    onConfirm,
    onCancel,
    confirmText = "Delete",
    cancelText = "Cancel",
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md">
            <Modal.Header>{title}</Modal.Header>
            <Modal.Body className="text-center">
                <div className="flex items-center mb-4">
                    <div className="shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                </div>
                <div className="text-gray-600 mb-2">
                    {message ? (
                        typeof message === 'string' ? <p>{message}</p> : message
                    ) : (
                        <p>
                            Are you sure you want to delete <span className="font-semibold text-gray-900">{itemName}</span>?
                            <br />
                            <span className="text-sm text-gray-500 mt-1 block">This action cannot be undone.</span>
                        </p>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={onCancel} 
                    disabled={isLoading} 
                    className="flex-1"
                >
                    {cancelText}
                </Button>
                <Button 
                    variant="danger" 
                    onClick={onConfirm} 
                    disabled={isLoading} 
                    className="flex-1"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            <span>Processing...</span>
                        </div>
                    ) : (
                        confirmText
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteConfirmModal;

