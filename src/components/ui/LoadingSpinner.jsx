import React from "react";

// Reusable loading spinner component with different variants
const LoadingSpinner = ({
    size = "md",
    color = "amber",
    text = "",
    fullScreen = false,
    className = ""
}) => {
    // Size variants
    const sizeClasses = {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
    };

    // Color variants
    const colorClasses = {
        amber: "border-amber-500",
        blue: "border-blue-500",
        green: "border-green-500",
        red: "border-red-500",
        yellow: "border-yellow-500",
        gray: "border-gray-500",
        white: "border-white"
    };

    const spinnerClasses = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`;

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 flex flex-col items-center gap-4">
                    <div className={spinnerClasses}></div>
                    {text && (
                        <p className="text-gray-600 font-medium">{text}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="flex flex-col items-center gap-2">
                <div className={spinnerClasses}></div>
                {text && (
                    <p className="text-sm text-gray-600">{text}</p>
                )}
            </div>
        </div>
    );
};

// Unified loading form component
export const LoadingForm = ({
    text = "Loading...",
    height = "h-20",
    className = "",
    showText = true,
    size = "md"
}) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8"
    };

    return (
        <div className={`bg-gray-50 border-2 border-gray-300 rounded-xl ${height} ${className}`}>
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <div className={`animate-spin rounded-full border-b-2 border-amber-400 ${sizeClasses[size]}`}></div>
                    {showText && (
                        <p className="text-sm text-gray-600 font-medium">{text}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Loading card component for content areas (deprecated - use LoadingForm instead)
export const LoadingCard = ({
    text = "Loading...",
    height = "h-32",
    className = ""
}) => {
    return <LoadingForm text={text} height={height} className={className} size="lg" />;
};

// Loading skeleton for order items
export const LoadingSkeleton = ({ count = 3, className = "" }) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {[...Array(count)].map((_, index) => (
                <article
                    key={index}
                    className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row gap-4 transition-shadow hover:shadow-sm focus-within:shadow-sm animate-pulse"
                    aria-label="Loading order"
                >
                    <div className="flex items-stretch gap-6 flex-1">
                        {/* Product Image skeleton */}
                        <div className="w-20 sm:w-24 aspect-square bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                        
                        {/* Order Details skeleton */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                            {/* Product name with badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                                <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
                            </div>
                            
                            {/* Order ID and Date */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-1" />
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                            </div>
                            
                            {/* Status badges */}
                            <div className="flex items-center gap-3 flex-wrap mt-1">
                                <div className="h-5 bg-gray-200 rounded animate-pulse w-20" />
                                <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
                            </div>
                            
                            {/* Total price */}
                            <div className="h-5 bg-gray-200 rounded animate-pulse w-28 mt-1" />
                        </div>
                    </div>
                    
                    {/* Action Buttons skeleton */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-center sm:justify-center gap-3 sm:gap-4">
                        <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse" />
                        <div className="w-28 h-9 bg-gray-200 rounded-md animate-pulse" />
                    </div>
                </article>
            ))}
        </div>
    );
};

// Loading overlay for buttons
export const LoadingButton = ({
    loading = false,
    children,
    className = "",
    disabled = false,
    ...props
}) => {
    return (
        <button
            {...props}
            disabled={loading || disabled}
            className={`relative flex items-center justify-center gap-2 transition ${loading || disabled
                ? 'opacity-50 cursor-not-allowed'
                : ''
                } ${className}`}
        >
            {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            )}
            {children}
        </button>
    );
};

// Loading dots animation
export const LoadingDots = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
    );
};

export default LoadingSpinner;
