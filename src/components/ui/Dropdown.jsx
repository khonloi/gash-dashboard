import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Dropdown - Reusable dropdown component with click-outside detection
 * @param {React.ReactNode} trigger - The element that triggers the dropdown on click
 * @param {React.ReactNode | Function} children - The content of the dropdown, can be a render function: ({ close }) => ReactNode
 * @param {string} align - Alignment of the dropdown content: 'left' or 'right' (default: 'right')
 * @param {string} className - Additional CSS classes for the container
 * @param {string} contentClassName - Additional CSS classes for the dropdown content wrapper
 */
export default function Dropdown({
  trigger,
  children,
  align = "right",
  className = "",
  contentClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger, {
            onClick: (e) => {
              if (trigger.props.onClick) trigger.props.onClick(e);
              setIsOpen((prev) => !prev);
            },
          })
        : trigger}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute ${
              align === "right" ? "right-0" : "left-0"
            } mt-2 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200 ${contentClassName}`}
          >
            {typeof children === "function"
              ? children({ close })
              : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
