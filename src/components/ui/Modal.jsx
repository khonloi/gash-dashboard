import React, { createContext, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ModalContext = createContext(null);

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("Modal compound components must be rendered within a Modal component");
  }
  return context;
};

/**
 * Modal Component
 * Handles the portal/overlay, key listeners, backdrop clicks, and entrance animations.
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-md",
  zIndex = "z-[110]",
  backdropClass = "bg-black/40 backdrop-blur-sm",
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalContext.Provider value={{ onClose }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 ${backdropClass} flex items-center justify-center ${zIndex} p-4`}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`bg-white rounded-xl shadow-2xl border-2 border-gray-300 w-full ${maxWidth} overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </motion.div>
        </ModalContext.Provider>
      )}
    </AnimatePresence>
  );
};

/**
 * Modal.Header Component
 */
const Header = ({ children, showClose = true, className = "" }) => {
  const { onClose } = useModal();

  return (
    <div className={`flex items-center justify-between px-6 py-4 border-b-2 border-gray-300 bg-gray-50 ${className}`}>
      {typeof children === "string" ? (
        <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
      ) : (
        children
      )}
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

/**
 * Modal.Body Component
 */
const Body = ({ children, className = "" }) => {
  return (
    <div className={`p-6 lg:p-8 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

/**
 * Modal.Footer Component
 */
const Footer = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 bg-gray-50 border-t-2 border-gray-300 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
};

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;

export default Modal;
