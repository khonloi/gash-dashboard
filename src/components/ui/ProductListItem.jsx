import React from "react";

const ProductListItem = ({
  image,
  title,
  subtitle,
  price,
  stock,
  totalPrice,
  isInactive = false,
  inactiveMessage = "",
  checkboxProps = null, // { checked, onChange, disabled, ariaLabel }
  rightActions = null, // React element(s) for controls on the right (like input quantity / remove button, or view buttons)
  ariaLabel = "",
  onClick = null,
}) => {
  return (
    <article
      className={`bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm ${
        isInactive ? "opacity-60 grayscale" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 sm:gap-6 flex-1 w-full">
        {checkboxProps && (
          <input
            type="checkbox"
            checked={checkboxProps.checked || false}
            onChange={checkboxProps.onChange}
            className="w-5 h-5 accent-amber-400 cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={checkboxProps.ariaLabel}
            disabled={checkboxProps.disabled}
          />
        )}

        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl flex items-center justify-center">
          <img
            src={image || "/placeholder-image.png"}
            alt={typeof title === "string" ? title : "Product"}
            className="w-full h-full object-contain rounded-lg"
            onError={(e) => {
              e.target.src = "/placeholder-image.png";
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 sm:gap-1.5">
          {typeof title === "string" ? (
            <p className="text-base sm:text-lg font-semibold text-gray-900 m-0 line-clamp-2 leading-tight">
              {title}
            </p>
          ) : (
            title
          )}

          {subtitle && (
            typeof subtitle === "string" ? (
              <p className="text-xs sm:text-sm text-gray-600 m-0">
                {subtitle}
              </p>
            ) : (
              subtitle
            )
          )}

          {price !== undefined && (
            <p className="text-xs sm:text-sm text-gray-600 m-0">
              Price: {price}
            </p>
          )}

          {stock !== undefined && (
            <p className="text-xs sm:text-sm text-gray-600 m-0">
              Stock: {stock}
            </p>
          )}

          {isInactive && inactiveMessage && (
            <p className="text-xs sm:text-sm font-semibold text-red-600 m-0">
              {inactiveMessage}
            </p>
          )}

          {totalPrice !== undefined && (
            <p className="text-sm sm:text-base font-bold text-red-600 m-0 mt-1">
              Total: {totalPrice}
            </p>
          )}
        </div>
      </div>

      {rightActions && (
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-4 shrink-0 self-start sm:self-center pl-9 sm:pl-0">
          {rightActions}
        </div>
      )}
    </article>
  );
};

export default ProductListItem;
