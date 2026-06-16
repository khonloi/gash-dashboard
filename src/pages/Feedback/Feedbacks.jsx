import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ToastContext } from "../../context/ToastContext";
import Api from "../../common/SummaryAPI";
import FeedbackDetail from "./FeedbackDetail";
import Loading from "../../components/ui/Loading";
import Page, { usePagination, useFilters } from "../../components/ui/Page";
import usePageModals from "../../hooks/usePageModals";
import useErrorHandler from "../../hooks/useErrorHandler";

const Feedbacks = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [uniqueProductNames, setUniqueProductNames] = useState([]);

  const {
      isMainModalOpen: showDetailsModal,
      selectedItem: selectedFeedbackId,
      openViewModal: handleShowDetailsInner,
      closeMainModal: handleCloseDetailsModal
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
    startDate: "",
    endDate: "",
    productName: "",
    ratingFilter: "",
    statusFilter: "",
  });

  const {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      currentData: currentFeedbacks,
      handlePageChange,
      setCurrentPage
  } = usePagination(filteredFeedbacks, 10);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch feedbacks without parameters
  const fetchFeedbacks = useCallback(async () => {
    if (!user?._id) {
      setError("User not authenticated");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await Api.feedback.getAll();

      let feedbacksData = [];
      if (Array.isArray(response)) {
        feedbacksData = response;
      } else if (response?.data?.feedbacks) {
        feedbacksData = response.data.feedbacks;
      } else {
        throw new Error("Unexpected response format");
      }

      // Filter out invalid feedback entries and feedbacks with no rating and no content
      feedbacksData = feedbacksData.filter(
        (feedback) =>
          feedback.order?._id &&
          feedback.variant?.variant_id &&
          feedback.customer?._id &&
          feedback.feedback?.rating != null &&
          feedback.feedback.rating >= 1 &&
          feedback.feedback.rating <= 5
      );

      const sortedFeedbacks = feedbacksData.sort((a, b) => {
        const dateA = a.feedback?.created_at
          ? new Date(a.feedback.created_at)
          : new Date(0);
        const dateB = b.feedback?.created_at
          ? new Date(b.feedback.created_at)
          : new Date(0);
        return dateB - dateA;
      });

      setFeedbacks(sortedFeedbacks);
      setFilteredFeedbacks(sortedFeedbacks);

      if (sortedFeedbacks.length === 0) {
        showToast("No feedback found for the given criteria", "info");
      }
    } catch (err) {
      console.error("Fetch feedbacks error:", err);
      const errorMessage = handleApiError(err, "Failed to fetch feedbacks");
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Fetch data
  const fetchData = useCallback(async () => {
    await fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Handle authentication state and fetch data
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!user && !localStorage.getItem("token")) {
      navigate("/login", { replace: true });
    } else if (user) {
      fetchData();
    }
  }, [user, isAuthLoading, navigate, fetchData]);

  useEffect(() => {
    // Only show products that have feedback (all products in feedbacks list have feedback)
    const productMap = new Map();

    feedbacks.forEach((fb) => {
      const productName = fb.product?.product_name || fb.product?.productName;

      if (productName) {
        // All products in feedbacks list have feedback, so include them all
        if (!productMap.has(productName)) {
          productMap.set(productName, productName);
        }
      }
    });

    const names = Array.from(productMap.values()).sort();

    setUniqueProductNames(names);
  }, [feedbacks]);

  // Apply filters to feedbacks
  const applyFilters = useCallback((feedbacksList, filterSettings) => {
    return feedbacksList.filter((feedback) => {
      // Product name filter (string match)
      if (filterSettings.productName) {
        const feedbackName = (
          feedback.product?.product_name ||
          feedback.product?.productName ||
          ""
        ).toLowerCase();
        if (!feedbackName.includes(filterSettings.productName.toLowerCase())) {
          return false;
        }
      }

      // Rating filter
      if (
        filterSettings.ratingFilter &&
        feedback.feedback?.rating !== parseInt(filterSettings.ratingFilter)
      ) {
        return false;
      }

      // Status filter
      if (filterSettings.statusFilter) {
        const isDeleted = feedback.feedback?.is_deleted || false;
        if (
          (filterSettings.statusFilter === "active" && isDeleted) ||
          (filterSettings.statusFilter === "deleted" && !isDeleted)
        ) {
          return false;
        }
      }

      // Date filters
      const feedbackDate = feedback.feedback?.created_at
        ? new Date(feedback.feedback.created_at)
        : null;
      if (feedbackDate) {
        if (
          filterSettings.startDate &&
          feedbackDate < new Date(filterSettings.startDate)
        )
          return false;
        if (
          filterSettings.endDate &&
          feedbackDate > new Date(filterSettings.endDate)
        )
          return false;
      } else if (filterSettings.startDate || filterSettings.endDate) {
        return false;
      }

      return true;
    });
  }, []);

  // Update filtered feedbacks when feedbacks or filters change
  useEffect(() => {
    setFilteredFeedbacks(applyFilters(feedbacks, filters));
    setCurrentPage(1);
  }, [feedbacks, filters, applyFilters]);

  // Clear filters
  const handleClearAllFilters = () => {
    clearFilters();
    setCurrentPage(1);
  };

  // Toggle delete feedback — OPTIMIZED (no full reload)
  const toggleDeleteFeedback = async (feedbackId, currentDeletedState) => {
    const newDeletedState = !currentDeletedState;

    // Optimistically update UI
    setFilteredFeedbacks((prev) =>
      prev.map((fb) =>
        fb._id === feedbackId
          ? {
            ...fb,
            feedback: {
              ...fb.feedback,
              is_deleted: newDeletedState,
            },
          }
          : fb
      )
    );

    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb._id === feedbackId
          ? {
            ...fb,
            feedback: {
              ...fb.feedback,
              is_deleted: newDeletedState,
            },
          }
          : fb
      )
    );

    try {
      if (newDeletedState) {
        await Api.feedback.delete(feedbackId);
        showToast("Feedback deleted successfully", "success");
      } else {
        await Api.feedback.restore(feedbackId);
        showToast("Feedback restored successfully", "success");
      }
    } catch (err) {
      // Revert on error
      setFilteredFeedbacks((prev) =>
        prev.map((fb) =>
          fb._id === feedbackId
            ? {
              ...fb,
              feedback: {
                ...fb.feedback,
                is_deleted: currentDeletedState,
              },
            }
            : fb
        )
      );

      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb._id === feedbackId
            ? {
              ...fb,
              feedback: {
                ...fb.feedback,
                is_deleted: currentDeletedState,
              },
            }
            : fb
        )
      );

      const defaultMessage = newDeletedState
        ? "Failed to delete feedback"
        : "Failed to restore feedback";
      const errorMessage = handleApiError(err, defaultMessage);
      showToast(errorMessage, "error");
    }
  };

  // Retry fetching data
  const handleRetry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Show feedback details in popup
  const handleShowDetails = useCallback((feedback) => {
    handleShowDetailsInner(feedback._id);
  }, [handleShowDetailsInner]);

  // Check if feedback is deleted
  const isFeedbackDeleted = useCallback((feedback) => {
    return feedback.feedback?.is_deleted || false;
  }, []);

  return (
    <Page>
      <Page.Header 
        title="Feedback Management"
        renderBadge={() => `${filteredFeedbacks.length} feedback${filteredFeedbacks.length !== 1 ? "s" : ""}`}
        renderActions={() => (
          <button
            className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs lg:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transform hover:scale-105"
            onClick={toggleFilters}
            aria-label="Toggle filters"
          >
            <svg
              className="w-3 h-3 lg:w-4 lg:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
              />
            </svg>
            <span className="font-medium hidden sm:inline">
              {showFilters ? "Hide Filters" : "Show Filters"}
            </span>
            <span className="font-medium sm:hidden">Filters</span>
          </button>
        )}
      />
      <Page.Filters show={showFilters} onClear={handleClearAllFilters} hasActiveFilters={hasActiveFilters()}>
        <div className="mb-3 lg:mb-4">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Search by Product Name</label>
          <input
            type="text"
            placeholder="Type to search..."
            value={filters.productName}
            onChange={(e) => handleFilterChange("productName", e.target.value)}
            className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Rating</label>
            <select
              value={filters.ratingFilter}
              onChange={(e) => handleFilterChange("ratingFilter", e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} {rating === 1 ? "Star" : "Stars"}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.statusFilter}
              onChange={(e) => handleFilterChange("statusFilter", e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </Page.Filters>

      <Page.Content
        loading={loading}
        error={error}
        isEmpty={filteredFeedbacks.length === 0}
        emptyTitle="No feedbacks available"
        loadingMessage="Loading feedbacks..."
        onRetry={handleRetry}
      >
        <Page.Table minWidth="1200px">
                {/* ---------- HEADER ---------- */}
                <thead className="border-b">
                  <tr>
                    <th className="w-[5%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      #
                    </th>
                    <th className="w-[15%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Customer
                    </th>
                    <th className="w-[20%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Product Name
                    </th>
                    <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Feedback Date
                    </th>
                    <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Rating
                    </th>
                    <th className="w-[20%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Content
                    </th>
                    <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="w-[10%] px-2 lg:px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentFeedbacks.map((feedback, index) => {
                    const deleted = isFeedbackDeleted(feedback);
                    return (
                      <tr
                        key={feedback._id}
                        className={`hover:bg-gradient-to-r hover:from-yellow-50/50 hover:via-amber-50/50 hover:to-orange-50/50 transition-all duration-300 border-b-2 border-gray-200/40`}
                      >
                        {/* # */}
                        <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                          {startIndex + index + 1}
                        </td>

                        {/* Customer */}
                        <td className="px-2 lg:px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <img
                              src={feedback.customer?.image || ""}
                              alt={feedback.customer?.name || "Customer"}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-xs lg:text-sm font-medium text-gray-900">
                                {feedback.customer?.name || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                @{feedback.customer?.username || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Product Name */}
                        <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900 truncate">
                          {feedback.product?.product_name || "N/A"}
                        </td>

                        {/* Feedback Date */}
                        <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                          {feedback.feedback?.created_at
                            ? new Date(feedback.feedback.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>

                        {/* Rating */}
                        <td className="px-2 lg:px-4 py-3">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= (feedback.feedback?.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                                  }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </td>

                        {/* Content */}
                        <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">
                          <div className="truncate">
                            {feedback.feedback?.content
                              ? `${feedback.feedback.content.substring(0, 80)}${feedback.feedback.content.length > 80
                                ? "..."
                                : ""
                              }`
                              : "N/A"}
                          </div>
                        </td>

                        <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                          <Page.Badge color={deleted ? 'red' : 'green'}>
                            {deleted ? "deleted" : "active"}
                          </Page.Badge>
                        </td>

                        <td className="px-2 lg:px-4 py-3">
                          <div className="flex justify-center items-center space-x-1">
                            {/* View Button */}
                            <Page.ActionButton
                              onClick={() => handleShowDetails(feedback)}
                              variant="primary"
                              title="View Details"
                            >
                              <svg
                                className="w-3 h-3 lg:w-4 lg:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Page.ActionButton>

                            {/* Delete/Restore Button */}
                            <Page.ActionButton
                              onClick={() =>
                                toggleDeleteFeedback(feedback._id, deleted)
                              }
                              variant={deleted ? "success" : "danger"}
                              title={`${deleted ? "Restore" : "Delete"} Feedback`}
                            >
                              <svg
                                className="w-3 h-3 lg:w-4 lg:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                {deleted ? (
                                  // Restore icon
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                ) : (
                                  // Delete icon
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                )}
                              </svg>
                            </Page.ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
        </Page.Table>
      </Page.Content>

      <Page.Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredFeedbacks.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        itemName="feedbacks"
      />

      {/* Feedback Details Modal */}
      <FeedbackDetail
        feedbackId={selectedFeedbackId}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
      />
    </Page>
  );
};

export default Feedbacks;
