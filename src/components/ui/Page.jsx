import React from 'react';
import Loading from './Loading';

const Page = ({ children }) => {
    return (
        <div className="min-h-screen p-2 sm:p-3 lg:p-4 xl:p-6">
            {children}
        </div>
    );
};

const Header = ({ title, renderBadge, renderActions }) => {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 mb-4 lg:mb-6 pt-2 lg:pt-3 pb-2 lg:pb-3">
            <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2 leading-tight">{title}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-4 shrink-0">
                {renderBadge && (
                    <div className="bg-gradient-to-r from-yellow-400/20 via-amber-400/20 to-orange-400/20 backdrop-blur-md px-2 lg:px-4 py-1 lg:py-2 rounded-xl border-2 border-yellow-400/50 shadow-md">
                        <span className="text-xs lg:text-sm font-semibold text-gray-700">
                            {renderBadge()}
                        </span>
                    </div>
                )}
                {renderActions && renderActions()}
            </div>
        </div>
    );
};

const Filters = ({ show, onClear, hasActiveFilters, children }) => {
    if (!show) return null;
    return (
        <div className="rounded-xl border p-3 sm:p-4 lg:p-6 mb-4 lg:mb-6">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h2 className="text-base lg:text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Search & Filter</h2>
                {onClear && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClear}
                            disabled={!hasActiveFilters}
                            className="px-2 py-1.5 lg:px-3 lg:py-2 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-pink-500 hover:to-rose-500 rounded-xl transition-all duration-300 border-2 border-gray-300/60 hover:border-transparent font-medium text-xs lg:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 shadow-md hover:shadow-lg"
                            aria-label="Clear all filters"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
            {children}
        </div>
    );
};

const Content = ({ loading, error, onRetry, isEmpty, emptyTitle, emptyMessage, emptyIcon, loadingMessage, children }) => {
    if (loading || error || isEmpty) {
        return (
            <div className="rounded-xl border p-6" style={{ borderColor: 'rgb(217 119 6)', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(233, 163, 25, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }} role="status">
                <div className="flex flex-col items-center justify-center space-y-4 min-h-[180px]">
                    {loading ? (
                        <Loading type="page" size="medium" message={loadingMessage || "Loading..."} />
                    ) : error ? (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-semibold text-gray-900">Error</h3>
                                <p className="text-sm text-gray-500 mt-1">{error}</p>
                            </div>
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-[rgb(245 158 11)] to-[rgb(217 119 6)] hover:from-[rgb(217 119 6)] hover:to-[rgb(180 83 9)] transform hover:scale-105"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                                {emptyIcon ? emptyIcon : (
                                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                )}
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-medium text-gray-900">{emptyTitle || "No data found"}</h3>
                                <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return children;
};

const TableWrapper = ({ children, minWidth = "700px" }) => {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgb(217 119 6)', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(233, 163, 25, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}>
            <div className="overflow-x-auto">
                <table className="w-full table-fixed" style={{ minWidth }}>
                    {children}
                </table>
            </div>
        </div>
    );
};

const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    startIndex, 
    endIndex, 
    onPageChange,
    itemName = "items"
}) => {
    if (totalItems === 0) return null;

    // Calculate which pages to show (max 5 pages)
    const getVisiblePages = () => {
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="rounded-xl border p-4 lg:p-6 mt-4 lg:mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                        {Math.min(endIndex, totalItems)}
                    </span>{" "}
                    of <span className="font-medium">{totalItems}</span>{" "}
                    {itemName}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200"
                        aria-label="First page"
                        title="First page"
                    >
                        First
                    </button>
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>

                    <div className="flex items-center space-x-1">
                        {totalPages > 5 && visiblePages[0] > 1 && (
                            <>
                                <button
                                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 transition-all duration-200"
                                    onClick={() => onPageChange(1)}
                                    aria-label="Page 1"
                                >
                                    1
                                </button>
                                {visiblePages[0] > 2 && (
                                    <span className="px-2 text-gray-500">...</span>
                                )}
                            </>
                        )}
                        {visiblePages.map(page => (
                            <button
                                key={page}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    currentPage === page
                                        ? 'text-white border-transparent bg-gradient-to-r from-[rgb(245 158 11)] via-[rgb(217 119 6)] to-[rgb(180 83 9)] hover:from-[rgb(217 119 6)] hover:via-[rgb(180 83 9)] hover:to-[rgb(146 64 14)]'
                                        : 'text-gray-600 bg-white border border-gray-300 hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300'
                                }`}
                                onClick={() => onPageChange(page)}
                                aria-label={`Page ${page}`}
                            >
                                {page}
                            </button>
                        ))}
                        {totalPages > 5 && visiblePages[visiblePages.length - 1] < totalPages && (
                            <>
                                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                                    <span className="px-2 text-gray-500">...</span>
                                )}
                                <button
                                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 transition-all duration-200"
                                    onClick={() => onPageChange(totalPages)}
                                    aria-label={`Page ${totalPages}`}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200"
                        aria-label="Last page"
                        title="Last page"
                    >
                        Last
                    </button>
                </div>
            </div>
        </div>
    );
};

const Badge = ({ children, color = 'gray' }) => {
    const colorClasses = {
        green: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
        yellow: 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white',
        red: 'bg-red-600 text-white',
        blue: 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
        orange: 'bg-orange-100 text-orange-800',
        purple: 'bg-purple-100 text-purple-800',
        gray: 'bg-gray-100 text-gray-800'
    };
    
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${colorClasses[color] || colorClasses.gray}`}>
            {children}
        </span>
    );
};

const ActionButton = ({ onClick, disabled, variant = 'primary', title, children }) => {
    const variantClasses = {
        primary: 'border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm',
        danger: 'text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700',
        success: 'text-white bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700',
        warning: 'border-orange-400/60 bg-gradient-to-br from-orange-100/80 via-amber-100/80 to-yellow-100/80 hover:from-orange-200 hover:via-amber-200 hover:to-yellow-200 text-orange-700 hover:text-orange-800 backdrop-blur-sm',
        disabled: 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
    };
    
    const activeClass = disabled ? variantClasses.disabled : (variantClasses[variant] || variantClasses.primary);
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${activeClass}`}
            title={title}
            aria-label={title}
        >
            {children}
        </button>
    );
};

Page.Header = Header;
Page.Filters = Filters;
Page.Content = Content;
Page.Table = TableWrapper;
Page.Pagination = Pagination;
Page.Badge = Badge;
Page.ActionButton = ActionButton;

export const usePagination = (data, itemsPerPage = 10) => {
    const [currentPage, ReactSetCurrentPage] = React.useState(1);
    const totalItems = data?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    // Ensure currentPage is valid when data changes
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            ReactSetCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data ? data.slice(startIndex, endIndex) : [];

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            ReactSetCurrentPage(page);
        }
    };

    return {
        currentPage,
        totalPages,
        totalItems,
        startIndex,
        endIndex,
        currentData,
        handlePageChange,
        setCurrentPage: ReactSetCurrentPage
    };
};

export const useFilters = (initialFilters = {}, initialSort = { by: '', order: 'asc' }) => {
    const [filters, setFilters] = React.useState(initialFilters);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showFilters, setShowFilters] = React.useState(true);
    const [sortBy, setSortBy] = React.useState(initialSort.by);
    const [sortOrder, setSortOrder] = React.useState(initialSort.order);

    const toggleFilters = () => setShowFilters(!showFilters);
    
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSortChange = (by) => {
        if (sortBy === by) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(by);
            setSortOrder('asc');
        }
    };

    const clearFilters = () => {
        setFilters(initialFilters);
        setSearchTerm('');
        setSortBy(initialSort.by);
        setSortOrder(initialSort.order);
    };

    const hasActiveFilters = () => {
        return searchTerm !== '' || 
               Object.values(filters).some(val => val !== 'all' && val !== '') ||
               sortBy !== initialSort.by ||
               sortOrder !== initialSort.order;
    };

    return {
        filters,
        searchTerm,
        setSearchTerm,
        showFilters,
        toggleFilters,
        handleFilterChange,
        clearFilters,
        hasActiveFilters,
        setFilters,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        handleSortChange
    };
};

export default Page;
