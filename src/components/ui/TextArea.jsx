import React from "react";

const TextArea = React.forwardRef(({
  label,
  error,
  required,
  className = "",
  id,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full py-3 px-4 bg-gray-50 border-2 rounded-xl transition-all outline-none resize-none
          ${error 
            ? "border-red-500 bg-red-50/30 focus:border-red-500" 
            : "border-gray-300 focus:border-amber-400 focus:bg-white"
          } 
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
});

TextArea.displayName = "TextArea";

export default TextArea;
