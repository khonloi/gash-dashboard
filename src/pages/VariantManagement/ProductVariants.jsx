import React, { useEffect, useState, useContext, useCallback } from "react";
import { ToastContext } from "../../context/ToastContext";
import Api from "../../common/SummaryAPI";
import { FaEdit, FaTrash } from 'react-icons/fa';
import VariantModal from "../ProductManagement/VariantModal";
import Loading from "../../components/ui/Loading";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import Page, { usePagination, useFilters } from "../../components/ui/Page";
import usePageModals from "../../hooks/usePageModals";
import useErrorHandler from "../../hooks/useErrorHandler";

const ProductVariants = () => {
  const { showToast } = useContext(ToastContext);
  const [variants, setVariants] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [sortBy, setSortBy] = useState("color");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const {
      isMainModalOpen: showModal,
      selectedItem: editingVariant,
      isDeleteModalOpen: showDeleteConfirm,
      itemToDelete: variantToDelete,
      openEditModal: handleEdit,
      closeMainModal: closeModal,
      openDeleteModal: handleDeleteClick,
      closeDeleteModal: handleCancelDelete
  } = usePageModals();
  const { handleApiError } = useErrorHandler();
  
  const {
      filters,
      searchTerm,
      setSearchTerm,
      showFilters,
      toggleFilters,
      handleFilterChange,
      clearFilters,
      hasActiveFilters
  } = useFilters({
      status: "all"
  });
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variantsToShow, setVariantsToShow] = useState({}); // Track how many variants to show per product

  // Fetch variants
  const fetchVariants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await Api.newVariants.getAll();
      setVariants(data.data);
    } catch (err) {
      console.error(err);
      const errorMessage = handleApiError(err, "Failed to fetch variants");
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Helper functions for data extraction
  const toIdString = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'object') {
      if (value._id) return String(value._id);
      if (value.id) return String(value.id);
    }
    return String(value);
  }, []);

  const extractDataArray = useCallback((response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (response.success && Array.isArray(response.data)) return response.data;
    return [];
  }, []);

  // Fetch colors
  const fetchColors = useCallback(async () => {
    try {
      const response = await Api.colors.getAll();
      const rawColors = extractDataArray(response);
      const normalized = rawColors
        .map((color) => ({
          ...color,
          color_name: (color.color_name || '').trim(),
        }))
        .filter((color) => color.color_name);

      const uniqueMap = new Map();
      normalized.forEach((color) => {
        const key = toIdString(color._id || color.id);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, color);
        }
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        if (Boolean(a.isDeleted) !== Boolean(b.isDeleted)) {
          return a.isDeleted ? 1 : -1;
        }
        return (a.color_name || '').localeCompare(b.color_name || '');
      });

      setColors(sorted);
    } catch (err) {
      setColors([]);
    }
  }, [extractDataArray, toIdString]);

  // Fetch sizes
  const fetchSizes = useCallback(async () => {
    try {
      const response = await Api.sizes.getAll();
      const rawSizes = extractDataArray(response);
      const normalized = rawSizes
        .map((size) => ({
          ...size,
          size_name: (size.size_name || '').trim(),
        }))
        .filter((size) => size.size_name);

      const uniqueMap = new Map();
      normalized.forEach((size) => {
        const key = toIdString(size._id || size.id);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, size);
        }
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        if (Boolean(a.isDeleted) !== Boolean(b.isDeleted)) {
          return a.isDeleted ? 1 : -1;
        }
        return (a.size_name || '').localeCompare(b.size_name || '');
      });

      setSizes(sorted);
    } catch (err) {
      setSizes([]);
    }
  }, [extractDataArray, toIdString]);

  useEffect(() => {
    fetchVariants();
    fetchColors();
    fetchSizes();
  }, [fetchVariants, fetchColors, fetchSizes]);

  // Handle variant updated
  const handleVariantUpdated = useCallback(() => {
    fetchVariants();
    closeModal();
  }, [fetchVariants, closeModal]);




  // Deactivate variant (soft delete)
  const handleDelete = async () => {
    if (!variantToDelete) return;

    try {
      await Api.newVariants.update(variantToDelete._id, { variantStatus: 'inactive' });
      showToast("Variant deactivated successfully", "success");
      fetchVariants();
    } catch (err) {
      console.error(err);
      let errorMessage = handleApiError(err, "Failed to deactivate variant");

      // Improve error message for active orders
      if (errorMessage.includes('active orders') || errorMessage.includes('pending, confirmed, or shipping')) {
        errorMessage = "Cannot delete variant because it still contains active orders.";
      }

      // Only show toast, don't set error state (error state is for fetch operations)
      showToast(errorMessage, "error");
    } finally {
      handleCancelDelete();
      // Note: No error state to clear here as we don't use error state for delete operations
    }
  };



  // Sort variants
  const sortedVariants = [...variants].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'color':
        aValue = a.productColorId?.color_name?.toLowerCase() || '';
        bValue = b.productColorId?.color_name?.toLowerCase() || '';
        break;
      case 'size':
        aValue = a.productSizeId?.size_name?.toLowerCase() || '';
        bValue = b.productSizeId?.size_name?.toLowerCase() || '';
        break;
      case 'price':
        aValue = a.variantPrice || 0;
        bValue = b.variantPrice || 0;
        break;
      case 'stock':
        aValue = a.stockQuantity || 0;
        bValue = b.stockQuantity || 0;
        break;
      case 'product':
        aValue = a.productId?.productName?.toLowerCase() || '';
        bValue = b.productId?.productName?.toLowerCase() || '';
        break;
      default:
        aValue = a.productColorId?.color_name?.toLowerCase() || '';
        bValue = b.productColorId?.color_name?.toLowerCase() || '';
    }

    if (sortBy === 'color' || sortBy === 'size' || sortBy === 'product') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Get unique products from variants for filter dropdown (only active products)
  const uniqueProducts = React.useMemo(() => {
    const productMap = new Map();
    variants.forEach((variant) => {
      const productId = variant.productId?._id || variant.productId?.id || variant.productId;
      const productName = variant.productId?.productName || 'Unknown Product';
      const productStatus = variant.productId?.productStatus || variant.product?.productStatus;
      // Only include active products
      if (productId && productStatus === 'active' && !productMap.has(toIdString(productId))) {
        productMap.set(toIdString(productId), {
          id: toIdString(productId),
          name: productName
        });
      }
    });
    return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [variants, toIdString]);

  // Filter variants
  const filteredVariants = sortedVariants.filter((v) => {
    const matchesStatus = filters.status === "all" || v.variantStatus === filters.status;
    const matchesProduct = productFilter === "" || toIdString(v.productId?._id || v.productId?.id || v.productId) === productFilter;
    const matchesSearch =
      searchTerm === "" ||
      v.productColorId?.color_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productSizeId?.size_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productId?.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesProduct && matchesSearch;
  });

  // Check if variant is discontinued
  const isVariantDiscontinued = (variant) => {
    return variant.variantStatus === 'discontinued';
  };

  // Group variants by product
  const groupedVariants = filteredVariants.reduce((acc, variant) => {
    const productName = variant.productId?.productName || 'Unknown Product';
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(variant);
    return acc;
  }, {});

  // Sort variants within each product group: active first, discontinued last
  Object.keys(groupedVariants).forEach((productName) => {
    groupedVariants[productName].sort((a, b) => {
      const aDiscontinued = isVariantDiscontinued(a);
      const bDiscontinued = isVariantDiscontinued(b);

      // Active variants come first
      if (aDiscontinued !== bDiscontinued) {
        return aDiscontinued ? 1 : -1;
      }

      // If both have same status, maintain original sort order
      return 0;
    });
  });

  // Sort products (keys) for consistent display
  const sortedProductNames = Object.keys(groupedVariants).sort((a, b) =>
    sortBy === 'product'
      ? sortOrder === 'asc'
        ? a.localeCompare(b)
        : b.localeCompare(a)
      : a.localeCompare(b)
  );

  const {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      currentData: paginatedProductNames,
      handlePageChange,
      setCurrentPage
  } = usePagination(sortedProductNames, 3);

  // Handle retry
  const handleRetry = () => {
    fetchVariants();
  };

  // Clear filters
  const handleClearAllFilters = () => {
    clearFilters();
    setProductFilter("");
    setSortBy("color");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  // Show more variants for a product (show all)
  const showMoreVariants = (productName, currentLimit, totalVariants) => {
    setVariantsToShow(prev => ({
      ...prev,
      [productName]: totalVariants
    }));
  };

  // Show less variants for a product (reset to 5)
  const showLessVariants = (productName) => {
    setVariantsToShow(prev => ({
      ...prev,
      [productName]: 5
    }));
  };

  // Get variants to display for a product
  const getVariantsToDisplay = (productName, allVariants) => {
    const limit = variantsToShow[productName] || 5;
    return allVariants.slice(0, limit);
  };

  return (
    <Page>
      {/* Edit Variant Modal */}
      {editingVariant && (
        <VariantModal
          isOpen={showModal}
          onClose={closeModal}
          variant={editingVariant}
          product={editingVariant.productId || editingVariant.product}
          colors={colors}
          sizes={sizes}
          onVariantUpdated={handleVariantUpdated}
        />
      )}

      <Page.Header 
        title="Product Variant Management"
        renderBadge={() => `${filteredVariants.length} variant${filteredVariants.length !== 1 ? 's' : ''} in ${sortedProductNames.length} product${sortedProductNames.length !== 1 ? 's' : ''}`}
        renderActions={() => (
          <button
            className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs lg:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transform hover:scale-105"
            onClick={toggleFilters}
            aria-label="Toggle filters"
          >
            <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span className="font-medium hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            <span className="font-medium sm:hidden">Filters</span>
          </button>
        )}
      />

      <Page.Filters show={showFilters} onClear={handleClearAllFilters} hasActiveFilters={hasActiveFilters() || productFilter !== "" || sortBy !== "color" || sortOrder !== "asc"}>
        <div className="mb-3 lg:mb-4">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Search by Color/Size/Product</label>
          <input
            type="text"
            placeholder="Enter color, size, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3 lg:gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Product</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            >
              <option value="">All Products</option>
              {uniqueProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
                <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            >
              <option value="color">Color</option>
              <option value="size">Size</option>
              <option value="product">Product</option>
              <option value="price">Price</option>
              <option value="stock">Stock Quantity</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </Page.Filters>

      <Page.Content
        loading={loading}
        error={error}
        isEmpty={paginatedProductNames.length === 0}
        emptyTitle="No variants found"
        emptyMessage={searchTerm || filters.status !== "all" ? "Try adjusting your search or filter criteria" : "No variants available"}
        loadingMessage="Loading variants..."
        onRetry={handleRetry}
      >
        <Page.Table minWidth="900px">
                    <thead className="border-b">
                      <tr>
                        <th className="w-[5%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">#</th>
                        <th className="w-[20%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Product</th>
                        <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Color</th>
                        <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Size</th>
                        <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Price</th>
                        <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Stock</th>
                        <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Image</th>
                        <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="w-[15%] px-2 lg:px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProductNames.map((productName, index) => {
                        const variants = groupedVariants[productName];
                        const variantsToDisplay = getVariantsToDisplay(productName, variants);
                        const totalVariants = variants.length;
                        const currentLimit = variantsToShow[productName] || 5;
                        const hasMore = currentLimit < totalVariants;

                        return (
                          <React.Fragment key={productName}>
                            <tr className="bg-gray-100">
                              <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm font-medium text-gray-900" colSpan="9">
                                {productName} ({totalVariants} variant{totalVariants !== 1 ? 's' : ''})
                              </td>
                            </tr>
                            {variantsToDisplay.map((variant, vIdx) => {
                              const inactive = isVariantDiscontinued(variant);
                              return (
                                <tr
                                  key={variant._id}
                                  className={`hover:bg-gradient-to-r hover:from-yellow-50/50 hover:via-amber-50/50 hover:to-orange-50/50 transition-all duration-300 border-b-2 border-gray-200/40 ${inactive ? 'opacity-60' : ''}`}
                                >
                                  <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">{startIndex + index + 1}.{vIdx + 1}</td>
                                  <td className="px-2 lg:px-4 py-3">
                                    <div className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                                      {variant.productId?.productName || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-2 lg:px-4 py-3">
                                    <div className="text-xs lg:text-sm text-gray-900 truncate">
                                      {variant.productColorId?.color_name || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-2 lg:px-4 py-3">
                                    <div className="text-xs lg:text-sm text-gray-900 truncate">
                                      {variant.productSizeId?.size_name || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900 font-medium">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(variant.variantPrice || 0)}
                                  </td>
                                  <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">{variant.stockQuantity || 0}</td>
                                  <td className="px-2 lg:px-4 py-3">
                                    {variant.variantImage ? (
                                      <img
                                        src={variant.variantImage}
                                        alt="Variant"
                                        className="mx-auto w-12 h-12 lg:w-14 lg:h-14 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105"
                                        title="Variant image"
                                        onError={(e) => {
                                          e.target.style.opacity = '0.5';
                                          e.target.alt = 'Image not available';
                                        }}
                                      />
                                    ) : (
                                      <div className="mx-auto w-12 h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${variant.variantStatus === 'active'
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                        : variant.variantStatus === 'inactive'
                                          ? 'bg-red-600 text-white'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {variant.variantStatus || 'unknown'}
                                    </span>
                                  </td>
                                  <td className="px-2 lg:px-4 py-3">
                                    <div className="flex justify-center items-center space-x-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(variant);
                                        }}
                                        disabled={inactive}
                                        className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${inactive
                                          ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                                          : 'border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm'
                                          }`}
                                        title="Edit Variant"
                                      >
                                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteClick(variant);
                                        }}
                                        disabled={inactive}
                                        className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${inactive
                                          ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                                          : 'text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700'
                                          }`}
                                        title="Deactivate Variant"
                                      >
                                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {hasMore && (
                              <tr>
                                <td colSpan="9" className="px-2 lg:px-4 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => showMoreVariants(productName, currentLimit, totalVariants)}
                                      className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-all duration-200"
                                      title={`Show All (${totalVariants - currentLimit} more variant${totalVariants - currentLimit !== 1 ? 's' : ''})`}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                    {currentLimit > 5 && (
                                      <button
                                        onClick={() => showLessVariants(productName)}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200"
                                        title="Rút ngắn"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                            {!hasMore && totalVariants > 5 && (
                              <tr>
                                <td colSpan="9" className="px-2 lg:px-4 py-2 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      Showing all {totalVariants} variants
                                    </span>
                                    <button
                                      onClick={() => showLessVariants(productName)}
                                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200"
                                      title="Rút ngắn"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
        </Page.Table>
      </Page.Content>

      <Page.Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedProductNames.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        itemName="products"
      />

        {/* Deactivate Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteConfirm && !!variantToDelete}
          title="Deactivate Variant"
          message={
            variantToDelete ? (
              <>
                Are you sure you want to deactivate variant{" "}
                <span className="font-semibold text-gray-900">
                  {variantToDelete.productColorId?.color_name} - {variantToDelete.productSizeId?.size_name}
                </span>{" "}
                for <span className="font-semibold text-gray-900">{variantToDelete.productId?.productName}</span>?
                <br />
                <span className="text-sm text-gray-500 mt-1 block">This action can be undone by editing the variant.</span>
              </>
            ) : null
          }
          confirmText="Deactivate Variant"
          onConfirm={handleDelete}
          onCancel={handleCancelDelete}
        />
    </Page>
  );
};

export default ProductVariants;