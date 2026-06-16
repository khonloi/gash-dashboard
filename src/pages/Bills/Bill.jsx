import React, { useEffect, useState, useContext, useCallback } from "react";
import { ToastContext } from "../../context/ToastContext";
import SummaryAPI from "../../common/SummaryAPI";
import BillModal from "./BillModal";
import Loading from "../../components/ui/Loading";
import Page, { usePagination, useFilters } from "../../components/ui/Page";

export default function Bills() {
  const { showToast } = useContext(ToastContext);
  const [orders, setOrders] = useState([]);
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
      statusFilter: "all",
      paymentMethodFilter: "all",
      startDateFilter: "",
      endDateFilter: "",
  });
  
  const [dateFilterError, setDateFilterError] = useState("");
  const [sortBy, setSortBy] = useState("orderDate"); // 'orderDate', 'finalPrice', 'order_status', 'payment_method'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [showModal, setShowModal] = useState(false);
  const [selectedBillData, setSelectedBillData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function to extract error message
  const getErrorMessage = (err, defaultMessage) => {
    if (err.response?.data?.message) {
      return err.response.data.message;
    } else if (err.response?.status === 403) {
      return "Access denied. Only admin and manager can view bills";
    } else if (err.response?.status === 401) {
      return "You are not authorized to view bills";
    } else if (err.response?.status === 404) {
      return "Order not found";
    } else if (err.response?.status >= 500) {
      return "Server error. Please try again later";
    } else if (err.message) {
      return `${defaultMessage}: ${err.message}`;
    }
    return defaultMessage;
  };

  // Fetch all paid orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await SummaryAPI.orders.getAll(token);
      const paidOrders = data.data.filter(order => order.pay_status?.toLowerCase() === 'paid');
      setOrders(paidOrders);
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Failed to fetch orders");
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sort orders based on sortBy and sortOrder
  const sortedOrders = [...orders].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'orderDate':
        aValue = new Date(a.orderDate);
        bValue = new Date(b.orderDate);
        break;
      case 'finalPrice':
        aValue = a.finalPrice || 0;
        bValue = b.finalPrice || 0;
        break;
      case 'order_status':
        aValue = (a.order_status || '').toLowerCase();
        bValue = (b.order_status || '').toLowerCase();
        break;
      case 'payment_method':
        aValue = (a.payment_method || '').toLowerCase();
        bValue = (b.payment_method || '').toLowerCase();
        break;
      default:
        aValue = new Date(a.orderDate);
        bValue = new Date(b.orderDate);
    }

    if (sortBy === 'orderDate' || sortBy === 'finalPrice') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
  });

  // Filter orders by status, payment method, search term, and date range
  const filteredOrders = sortedOrders.filter((order) => {
    // Only show orders with Paid Status = 'paid'
    const matchesPaidStatus = order.pay_status?.toLowerCase() === 'paid';
    if (!matchesPaidStatus) return false;

    const matchesStatus =
      filters.statusFilter === "all" || (order.order_status && order.order_status.toLowerCase() === filters.statusFilter.toLowerCase());
    const matchesPaymentMethod =
      filters.paymentMethodFilter === "all" || (order.payment_method && order.payment_method.toLowerCase() === filters.paymentMethodFilter.toLowerCase());
    const matchesSearch =
      searchTerm === "" ||
      order._id.includes(searchTerm) ||
      (order.name && order.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date range filter
    const orderDate = new Date(order.orderDate);
    const matchesStartDate = !filters.startDateFilter || orderDate >= new Date(filters.startDateFilter);
    const matchesEndDate = !filters.endDateFilter || orderDate <= new Date(filters.endDateFilter + 'T23:59:59');

    return matchesStatus && matchesPaymentMethod && matchesSearch && matchesStartDate && matchesEndDate;
  });

  const {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      currentData: paginatedOrders,
      handlePageChange,
      setCurrentPage
  } = usePagination(filteredOrders, 10);

  // Handle view bill
  const handleViewBill = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const response = await SummaryAPI.bills.export(order._id, token);
      setSelectedBillData(response.data.data);
      setShowModal(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Failed to load bill");
      showToast(errorMessage, "error");
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedBillData(null);
  };

  const handleClearAllFilters = () => {
    clearFilters();
    setSortBy('orderDate');
    setSortOrder('desc');
    setDateFilterError('');
    setCurrentPage(1);
  };

  return (
    <Page>
      <BillModal
        isOpen={showModal}
        onClose={closeModal}
        billData={selectedBillData}
      />

      <Page.Header 
        title="Bill Management" 
        renderBadge={() => `${filteredOrders.length} bill${filteredOrders.length !== 1 ? 's' : ''}`}
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

      <Page.Filters show={showFilters} onClear={handleClearAllFilters} hasActiveFilters={hasActiveFilters() || sortBy !== 'orderDate' || sortOrder !== 'desc'}>
          <div className="mb-3 lg:mb-4">
            <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Order Status</label>
              <select
                value={filters.statusFilter}
                onChange={(e) => handleFilterChange("statusFilter", e.target.value)}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipping">Shipping</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.paymentMethodFilter}
                onChange={(e) => handleFilterChange("paymentMethodFilter", e.target.value)}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              >
                <option value="all">All Methods</option>
                <option value="cod">Cash on Delivery</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDateFilter}
                onChange={(e) => {
                  const newStart = e.target.value;
                  if (filters.endDateFilter && newStart && filters.endDateFilter < newStart) {
                    setDateFilterError('Start date cannot be later than end date');
                  } else {
                    setDateFilterError('');
                  }
                  handleFilterChange("startDateFilter", newStart);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              />
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDateFilter}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  if (filters.startDateFilter && newEnd && newEnd < filters.startDateFilter) {
                    setDateFilterError('End date cannot be earlier than start date');
                  } else {
                    setDateFilterError('');
                  }
                  handleFilterChange("endDateFilter", newEnd);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              />
            </div>
            {dateFilterError && (
              <div className="col-span-full text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2 mt-2">
                {dateFilterError}
              </div>
            )}
            <div>
              <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
              >
                <option value="orderDate">Order Date</option>
                <option value="finalPrice">Total Amount</option>
                <option value="order_status">Order Status</option>
                <option value="payment_method">Payment Method</option>
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
        isEmpty={filteredOrders.length === 0}
        emptyTitle="No bills available"
        loadingMessage="Loading bills..."
      >
        <Page.Table minWidth="1000px">
          <thead className="border-b">
                <tr>
                  <Page.Th width="w-[5%]">#</Page.Th>
                  <Page.Th width="w-[12%]">Order ID</Page.Th>
                  <Page.Th width="w-[18%]">Customer</Page.Th>
                  <Page.Th width="w-[11%]">Date</Page.Th>
                  <Page.Th width="w-[6%]">Payment Method</Page.Th>
                  <Page.Th width="w-[16%]" align="right">Total</Page.Th>
                  <Page.Th width="w-[10%]" align="center">Status</Page.Th>
                  <Page.Th width="w-[10%]" align="center">Paid Status</Page.Th>
                  <Page.Th width="w-[12%]" align="center">Actions</Page.Th>
                </tr>
          </thead>
          <tbody>
                {paginatedOrders.map((order, index) => (
                  <Page.Tr key={order._id}>
                    <Page.Td nowrap>
                      {startIndex + index + 1}
                    </Page.Td>
                    <Page.Td nowrap className="font-medium">#{order._id.slice(-6).toUpperCase()}</Page.Td>

                    <Page.Td>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }} title={order.name || 'N/A'}>
                        {order.name || 'N/A'}
                      </div>
                    </Page.Td>
                    <Page.Td nowrap>
                      {new Date(order.orderDate).toLocaleDateString("vi-VN", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </Page.Td>
                    <Page.Td nowrap className="pl-2 lg:pl-3 pr-3 lg:pr-4 capitalize">{order.payment_method || 'N/A'}</Page.Td>
                    <Page.Td nowrap className="pl-3 lg:pl-4 pr-2 lg:pr-4 text-right">{order.finalPrice ? `${order.finalPrice.toLocaleString('vi-VN')}đ` : 'N/A'}</Page.Td>
                    <Page.Td nowrap>
                      <div className="flex justify-center">
                        <Page.Badge color={order.order_status === 'delivered' ? 'green' : order.order_status === 'shipping' ? 'blue' : order.order_status === 'confirmed' ? 'purple' : order.order_status === 'pending' ? 'gray' : 'red'}>
                          {order.order_status ? order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1) : 'N/A'}
                        </Page.Badge>
                      </div>
                    </Page.Td>
                    <Page.Td nowrap>
                      <div className="flex justify-center">
                        <Page.Badge color={order.pay_status?.toLowerCase() === 'paid' ? 'green' : order.pay_status?.toLowerCase() === 'unpaid' ? 'yellow' : order.pay_status?.toLowerCase() === 'refunded' ? 'red' : 'gray'}>
                          {order.pay_status ? order.pay_status.charAt(0).toUpperCase() + order.pay_status.slice(1) : 'N/A'}
                        </Page.Badge>
                      </div>
                    </Page.Td>
                    <Page.Td>
                      <div className="flex justify-center items-center space-x-1">
                        <Page.ActionButton
                          onClick={() => handleViewBill(order)}
                          variant="primary"
                          title="View Bill"
                        >
                          <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Page.ActionButton>
                      </div>
                    </Page.Td>
                  </Page.Tr>
                ))}
          </tbody>
        </Page.Table>
      </Page.Content>

      <Page.Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        itemName="bills"
      />
    </Page>
  );
}