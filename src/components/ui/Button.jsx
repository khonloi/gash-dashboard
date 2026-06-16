import React from "react";

/**
 * Button - Reusable button component
 * @param {string} variant - Button variant: 'primary', 'secondary', 'danger', 'default'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {object} props - Other button props
 */
const Button = ({
  variant = "default",
  size = "md",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-3 py-2.5 sm:py-3 text-sm",
    lg: "px-4 py-3 text-base",
    xl: "px-6 py-4 text-lg",
  };

  // Variant classes
  const variantClasses = {
    primary: {
      base: "border-2 border-[#A86523] bg-[#E9A319] rounded-xl cursor-pointer font-semibold transition-colors text-gray-900 hover:opacity-90",
      disabled: "disabled:bg-[#C88A15] disabled:border-[#8B5420] disabled:text-gray-700 disabled:cursor-not-allowed disabled:opacity-70",
    },
    secondary: {
      base: "border-2 border-gray-300 rounded-xl cursor-pointer font-semibold transition-colors bg-gray-50 text-gray-900 hover:bg-gray-100 hover:border-amber-500",
      disabled: "disabled:bg-gray-400 disabled:border-gray-500 disabled:text-gray-600 disabled:cursor-not-allowed",
    },
    danger: {
      base: "border-2 border-gray-300 rounded-xl cursor-pointer font-semibold transition-colors text-red-600 hover:bg-gray-50 hover:border-red-600",
      disabled: "disabled:bg-gray-400 disabled:border-gray-500 disabled:text-red-800 disabled:cursor-not-allowed",
    },
    default: {
      base: "border-2 border-gray-300 rounded-xl cursor-pointer font-semibold transition-colors bg-white text-gray-900 hover:bg-gray-50 hover:border-amber-500",
      disabled: "disabled:bg-gray-400 disabled:border-gray-500 disabled:text-gray-600 disabled:cursor-not-allowed",
    },
  };

  const variantConfig = variantClasses[variant] || variantClasses.default;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const baseClasses = "focus:outline-none";

  return (
    <button
      className={`${sizeClass} ${variantConfig.base} ${variantConfig.disabled} ${baseClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

Button.displayName = "Button";

export default Button;
