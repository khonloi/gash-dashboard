import React, { useEffect, useState, useContext, useCallback } from "react";
import { ToastContext } from "../../context/ToastContext";
import SummaryAPI from "../../common/SummaryAPI";
import VoucherModal from "./VoucherModal";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import Loading from "../../components/ui/Loading";
import Page, { usePagination, useFilters } from "../../components/ui/Page";
import usePageModals from "../../hooks/usePageModals";
import useErrorHandler from "../../hooks/useErrorHandler";

export default function Vouchers() {
  const { showToast } = useContext(ToastContext);
  const [vouchers, setVouchers] = useState([]);
  const [sortBy, setSortBy] = useState("code"); // 'startDate', 'endDate', 'code', 'discountValue', 'usageLimit'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  const {
      isMainModalOpen: showModal,
      mainModalMode: modalMode,
      selectedItem: editingVoucher,
      isDeleteModalOpen: showDeleteConfirm,
      itemToDelete: voucherToDelete,
      openCreateModal: handleCreate,
      openEditModal,
      closeMainModal: closeModal,
      openDeleteModal: handleDeleteClick,
      closeDeleteModal: handleCancelDelete
  } = usePageModals();
  const { handleApiError } = useErrorHandler();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      status: "all",
      type: "all"
  });



  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await SummaryAPI.vouchers.getAll();
      setVouchers(data.data);
    } catch (err) {
      console.error(err);
      const errorMessage = handleApiError(err, "Failed to fetch vouchers");
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Calculate voucher status
  const getVoucherStatus = (voucher) => {
    if (voucher.isDeleted) return "DISABLED";

    const now = new Date();
    const start = new Date(voucher.startDate);
    const end = new Date(voucher.endDate);

    if (now < start) return "UPCOMING";
    if (now > end) return "EXPIRED";
    if (voucher.usedCount >= voucher.usageLimit) return "USED UP";

    return "ACTIVE";
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Edit voucher
  const handleEdit = (voucher) => {
    if (voucher.isDeleted) return;
    openEditModal(voucher);
  };

  // Handle successful operation
  const handleSuccess = () => {
    fetchVouchers();
  };




  // Delete / Disable voucher
  const handleDelete = async () => {
    if (!voucherToDelete) return;

    const voucherId = voucherToDelete.id || voucherToDelete._id;
    if (!voucherId) {
      showToast("Voucher ID not found!", "error");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await SummaryAPI.vouchers.disable(voucherId);
      showToast("Voucher disabled successfully", "success");
      handleCancelDelete();
      fetchVouchers();
    } catch (err) {
      console.error(err);
      const errorMessage = handleApiError(err, "Failed to disable voucher");
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };


  // Get status priority for sorting (lower number = higher priority)
  // Priority: ACTIVE > UPCOMING > USED UP > EXPIRED > DISABLED
  // USED UP before EXPIRED because used-up vouchers indicate successful usage and may be more important for analysis
  const getStatusPriority = (status) => {
    const priorityMap = {
      'ACTIVE': 1,
      'UPCOMING': 2,
      'USED UP': 3,      // Used up (usage-based) - indicates successful voucher usage
      'EXPIRED': 4,      // Expired (time-based) - just ran out of time
      'DISABLED': 5
    };
    return priorityMap[status] || 99;
  };

  // Sort vouchers based on sortBy and sortOrder
  // Always sort by status first (ACTIVE > others > DISABLED), then by selected field
  const sortedVouchers = [...vouchers].sort((a, b) => {
    // First, sort by status (ACTIVE first, DISABLED last)
    const aStatus = getVoucherStatus(a);
    const bStatus = getVoucherStatus(b);
    const aStatusPriority = getStatusPriority(aStatus);
    const bStatusPriority = getStatusPriority(bStatus);

    // If statuses are different, sort by status priority
    if (aStatusPriority !== bStatusPriority) {
      return aStatusPriority - bStatusPriority;
    }

    // If statuses are the same, sort by the selected field
    let aValue, bValue;

    switch (sortBy) {
      case 'startDate':
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case 'endDate':
        aValue = new Date(a.endDate);
        bValue = new Date(b.endDate);
        break;
      case 'discountValue':
        aValue = a.discountValue;
        bValue = b.discountValue;
        break;
      case 'usageLimit':
        aValue = a.usageLimit;
        bValue = b.usageLimit;
        break;
      case 'code':
      default:
        // Default: sort by code
        aValue = a.code.toLowerCase();
        bValue = b.code.toLowerCase();
        break;
    }

    // Sort by selected field
    if (sortBy === 'code') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Filter vouchers by status, type and search term
  const filteredVouchers = sortedVouchers.filter((v) => {
    const matchesStatus =
      filters.status === "all" || getVoucherStatus(v) === filters.status;
    const matchesType =
      filters.type === "all" || v.discountType === filters.type;
    const matchesSearch =
      searchTerm === "" || v.code.includes(searchTerm);

    return matchesStatus && matchesType && matchesSearch;
  });

  const {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      currentData: currentVouchers,
      handlePageChange,
      setCurrentPage
  } = usePagination(filteredVouchers, 10);

  // Clear all filters with sorting reset
  const handleClearAllFilters = () => {
    clearFilters();
    setSortBy('code');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  return (
    <Page>
      {/* Unified Voucher Modal */}
      <VoucherModal
        isOpen={showModal}
        mode={modalMode}
        voucher={editingVoucher}
        onClose={closeModal}
        onSuccess={handleSuccess}
      />

      <Page.Header 
        title="Voucher Management"
        renderBadge={() => `${filteredVouchers.length} voucher${filteredVouchers.length !== 1 ? 's' : ''}`}
        renderActions={() => (
          <>
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
            <button
              className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs lg:text-sm font-semibold bg-gradient-to-r from-[rgb(245 158 11)] to-[rgb(217 119 6)] hover:from-[rgb(217 119 6)] hover:to-[rgb(180 83 9)] transform hover:scale-105"
              onClick={handleCreate}
            >
              <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add Voucher</span>
            </button>
          </>
        )}
      />

      <Page.Filters show={showFilters} onClear={handleClearAllFilters} hasActiveFilters={hasActiveFilters()}>
          <div className="mb-3 lg:mb-4">
            <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Search by Code</label>
            <input
              type="text"
              placeholder="Enter voucher code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="USED UP">Used Up</option>
                <option value="EXPIRED">Expired</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              >
                <option value="code">Voucher Code</option>
                <option value="startDate">Start Date</option>
                <option value="endDate">End Date</option>
                <option value="discountValue">Discount Value</option>
                <option value="usageLimit">Usage Limit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Order</label>
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
        isEmpty={filteredVouchers.length === 0}
        emptyTitle="No vouchers available"
        loadingMessage="Loading vouchers..."
        onRetry={fetchVouchers}
      >
        <Page.Table minWidth="900px">
              <thead className="border-b">
                <tr>
                  <th className="w-[4%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                    #
                  </th>
                  <th className="w-[13%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Code</th>
                  <th className="w-[8%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="w-[10%] px-2 lg:px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Discount</th>
                  <th className="w-[8%] pl-2 lg:pl-4 pr-3 lg:pr-5 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Min Order</th>
                  <th className="w-[8%] pl-3 lg:pl-5 pr-5 lg:pr-7 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Max Discount</th>
                  <th className="w-[10%] pl-5 lg:pl-7 pr-2 lg:pr-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Start Date</th>
                  <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">End Date</th>
                  <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Usage</th>
                  <th className="w-[9%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="w-[10%] px-2 lg:px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVouchers.map((v, index) => {
                  const status = getVoucherStatus(v);
                  const formattedStatus = formatStatus(status);
                  return (
                    <tr key={v.id || v._id} className={`hover:bg-gradient-to-r hover:from-yellow-50/50 hover:via-amber-50/50 hover:to-orange-50/50 transition-all duration-300 border-b-2 border-gray-200/40 ${v.isDeleted ? 'opacity-60' : ''}`}>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-2 lg:px-4 py-3">
                        <div className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                          {v.code}
                        </div>
                      </td>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                        {v.discountType === "percentage" ? "Percentage" : "Fixed"}
                      </td>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-xs lg:text-sm font-semibold text-gray-900">
                          {v.discountType === "percentage"
                            ? `${v.discountValue}%`
                            : `${v.discountValue.toLocaleString("vi-VN")}₫`}
                        </div>
                      </td>
                      <td className="pl-2 lg:pl-4 pr-3 lg:pr-5 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900 text-right">
                        {v.minOrderValue.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="pl-3 lg:pl-5 pr-5 lg:pr-7 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900 text-right">
                        {v.discountType === "percentage"
                          ? v.maxDiscount
                            ? `${v.maxDiscount.toLocaleString("vi-VN")}₫`
                            : "-"
                          : "-"}
                      </td>
                      <td className="pl-5 lg:pl-7 pr-2 lg:pr-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                        {new Date(v.startDate).toLocaleDateString("vi-VN", {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                        {new Date(v.endDate).toLocaleDateString("vi-VN", {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                        <div className="text-xs lg:text-sm text-gray-900">
                          <span className="font-medium">{v.usedCount}</span>
                          <span className="text-gray-500">/{v.usageLimit}</span>
                        </div>
                      </td>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${status === 'ACTIVE'
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          : status === 'UPCOMING'
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
                            : status === 'EXPIRED'
                              ? 'bg-red-600 text-white'
                              : status === 'USED UP'
                                ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}>
                          {formattedStatus}
                        </span>
                      </td>
                      <td className="px-2 lg:px-4 py-3">
                        <div className="flex justify-center items-center space-x-1">
                          <button
                            className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${v.isDeleted
                              ? 'text-gray-400 bg-gray-50/80 border-gray-300/60 cursor-not-allowed'
                              : 'border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm'
                              }`}
                            onClick={() => handleEdit(v)}
                            disabled={v.isDeleted}
                            aria-label={`Edit voucher ${v.code}`}
                            title="Edit Voucher"
                          >
                            <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${v.isDeleted
                              ? 'text-gray-400 bg-gray-50/80 border-gray-300/60 cursor-not-allowed'
                              : 'text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700'
                              }`}
                            onClick={() => handleDeleteClick(v)}
                            disabled={v.isDeleted}
                            aria-label={`Disable voucher ${v.code}`}
                            title="Disable Voucher"
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
              </tbody>
        </Page.Table>
      </Page.Content>

      <Page.Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredVouchers.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        itemName="vouchers"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm && voucherToDelete !== null}
        title="Disable Voucher"
        itemName={voucherToDelete?.code}
        message={
          voucherToDelete ? (
            <>
              Are you sure you want to disable voucher <span className="font-semibold text-gray-900">{voucherToDelete.code}</span>?
              <br />
              <span className="text-sm text-gray-500">This action cannot be undone.</span>
            </>
          ) : null
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
        isLoading={loading}
      />
    </Page>
  );
}