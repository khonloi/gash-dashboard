import React from "react";

const Input = React.forwardRef(({
  label,
  error,
  required,
  leftIcon,
  rightIcon,
  className = "",
  type = "text",
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full relative">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none 
            ${leftIcon ? "pl-11" : "pl-4"} 
            ${rightIcon ? "pr-11" : "pr-4"} 
            ${error
              ? "border-red-500 bg-red-50/30 focus:border-red-500"
              : "border-gray-300 focus:border-amber-400 focus:bg-white"
            } 
            ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
