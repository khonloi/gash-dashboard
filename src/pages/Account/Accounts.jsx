import React, { useEffect, useState, useContext, useCallback } from "react";
import { ToastContext } from "../../context/ToastContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';
import SummaryAPI from "../../common/SummaryAPI";
import AccountModal from "./AccountModal";
import Loading from "../../components/ui/Loading";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import Page, { usePagination, useFilters } from "../../components/ui/Page";

export default function Accounts() {
    const { showToast } = useContext(ToastContext);
    const { user, isAuthLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [accounts, setAccounts] = useState([]);
    const [sortBy, setSortBy] = useState("acc_status");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
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
        role: "all"
    });

    // Fetch accounts
    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await SummaryAPI.accounts.getAll();
            const accountData = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
            setAccounts(accountData);
        } catch (err) {
            let errorMessage = "Failed to fetch accounts";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 403) {
                errorMessage = "Access denied. Only admin can view accounts";
            } else if (err.response?.status === 401) {
                errorMessage = "You are not authorized to view accounts";
                navigate('/login', { replace: true });
            } else if (err.response?.status >= 500) {
                errorMessage = "Server error. Please try again later";
            } else if (err.message) {
                errorMessage = `Failed to fetch accounts: ${err.message}`;
            }
            setError(errorMessage);
            showToast(errorMessage, "error");
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    }, [showToast, navigate]);

    // Handle accountId from URL query parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const accountId = urlParams.get('accountId');

        if (accountId && accounts.length > 0) {
            const targetAccount = accounts.find(account =>
                account._id === accountId || account.id === accountId
            );

            if (targetAccount) {
                setEditingAccount(targetAccount);
                setIsViewMode(true);
                setShowModal(true);
                // Clear the URL parameter after opening modal
                navigate('/accounts', { replace: true });
            }
        }
    }, [accounts, location.search, navigate]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user && !localStorage.getItem('token')) {
            navigate('/login', { replace: true });
        } else if (user && user.role === 'admin') {
            fetchAccounts();
        } else {
            showToast("Access denied. Only admin can view accounts", "error");
            navigate('/dashboard', { replace: true });
        }
    }, [user, isAuthLoading, navigate, fetchAccounts, showToast]);

    // View account details
    const handleView = (account) => {
        setEditingAccount(account);
        setIsViewMode(true);
        setShowModal(true);
    };

    // Edit account
    const handleEdit = (account) => {
        if (account.acc_status === 'inactive') return;
        setEditingAccount(account);
        setIsViewMode(false);
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
        setIsViewMode(false);
    };

    // Handle successful operation
    const handleSuccess = (account = null, action = 'refresh') => {
        if (action === 'edit' && account) {
            // Switch to edit mode
            setEditingAccount(account);
            setIsViewMode(false);
            setShowModal(true);
        } else {
            // Refresh accounts list
            fetchAccounts();
        }
    };



    // Show delete confirmation
    const handleDeleteClick = (account) => {
        setAccountToDelete(account);
        setShowDeleteConfirm(true);
    };

    // Delete / Disable account
    const handleDelete = async () => {
        if (!accountToDelete) return;
        setIsDeleting(true);
        try {
            const accountId = accountToDelete.id || accountToDelete._id;
            if (!accountId) {
                showToast("Account ID not found!", "error");
                return;
            }
            await SummaryAPI.accounts.disable(accountId);
            showToast("Account disabled successfully", "success");
            fetchAccounts();
            setShowDeleteConfirm(false);
            setAccountToDelete(null);
        } catch (err) {
            let errorMessage = "Failed to disable account";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 403) {
                errorMessage = "Access denied. Only admin can disable accounts";
            } else if (err.response?.status === 404) {
                errorMessage = "Account not found";
            } else if (err.response?.status >= 500) {
                errorMessage = "Server error. Please try again later";
            } else if (err.message) {
                errorMessage = `Failed to disable account: ${err.message}`;
            }
            showToast(errorMessage, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setAccountToDelete(null);
    };

    // Get status priority: active = 0, suspended = 1, inactive = 2, others = 3
    const getStatusPriority = (status) => {
        switch (status) {
            case 'active': return 0;
            case 'suspended': return 1;
            case 'inactive': return 2;
            default: return 3;
        }
    };

    // Sort accounts - Priority: status (active -> suspended -> inactive), then username, then role
    const sortedAccounts = [...(accounts || [])].sort((a, b) => {
        // First sort by status priority
        const aStatusPriority = getStatusPriority(a.acc_status);
        const bStatusPriority = getStatusPriority(b.acc_status);
        const statusComparison = aStatusPriority - bStatusPriority;

        // If statuses are different, return the status comparison
        if (statusComparison !== 0) {
            return sortOrder === 'asc' ? statusComparison : -statusComparison;
        }

        // If statuses are the same, sort by username
        const aUsername = (a.username || '').toLowerCase();
        const bUsername = (b.username || '').toLowerCase();
        const usernameComparison = aUsername.localeCompare(bUsername);

        // If usernames are different, return the username comparison
        if (usernameComparison !== 0) {
            return sortOrder === 'asc' ? usernameComparison : -usernameComparison;
        }

        // If usernames are the same, sort by role
        const aRole = a.role || '';
        const bRole = b.role || '';
        const roleComparison = aRole.localeCompare(bRole);

        return sortOrder === 'asc' ? roleComparison : -roleComparison;
    });

    // Filter accounts
    const filteredAccounts = sortedAccounts.filter((a) => {
        const matchesStatus = filters.status === "all" || a.acc_status === filters.status || (filters.status === "inactive" && a.acc_status === 'inactive');
        const matchesRole = filters.role === "all" || a.role === filters.role;
        const matchesSearch = searchTerm === "" ||
            a.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (a.phone && a.phone.includes(searchTerm));
        return matchesStatus && matchesRole && matchesSearch;
    });

    const {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        currentData: currentAccounts,
        handlePageChange,
        setCurrentPage
    } = usePagination(filteredAccounts, 10);

    // Clear all filters with sorting and pagination reset
    const handleClearAllFilters = () => {
        clearFilters();
        setSortBy("acc_status");
        setSortOrder("asc");
        setCurrentPage(1);
    };

    // Retry fetching data
    const handleRetry = () => {
        fetchAccounts();
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-yellow-100 text-yellow-800';
            case 'inactive': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Check if account is inactive
    const isAccountInactive = (account) => {
        return account.acc_status === 'inactive';
    };

    // Format role name for display
    const formatRoleName = (role) => {
        if (role === 'manager') return 'staff';
        return role || 'user';
    };

    if (isAuthLoading) {
        return (
            <div className="products-container">
                <div className="products-loading" role="status" aria-live="polite">
                    <div className="products-progress-bar"></div>
                    <p>Verifying authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <Page>
            <Page.Header 
                title="Account Management" 
                renderBadge={() => `${filteredAccounts.length} account${filteredAccounts.length !== 1 ? 's' : ''}`}
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

            <Page.Filters show={showFilters} onClear={handleClearAllFilters} hasActiveFilters={hasActiveFilters()}>
                <div className="mb-3 lg:mb-4">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Search Accounts</label>
                    <input
                        type="text"
                        placeholder="Search by username, email, name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div>
                        <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterChange("role", e.target.value)}
                            className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">User</option>
                            <option value="manager">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </Page.Filters>

            <Page.Content
                loading={loading}
                error={error}
                onRetry={handleRetry}
                isEmpty={filteredAccounts.length === 0}
                emptyTitle="No accounts found"
                emptyMessage={accounts.length === 0 ? "Get started by creating your first account" : "Try adjusting your search or filter criteria"}
                loadingMessage="Loading accounts..."
            >
                <Page.Table minWidth="700px">
                    <thead className="border-b">
                        <tr>
                            <th className="w-[5%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">#</th>
                            <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Username</th>
                            <th className="w-[15%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Email</th>
                            <th className="w-[15%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Name</th>
                            <th className="w-[12%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Phone</th>
                            <th className="w-[10%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Role</th>
                            <th className="w-[8%] px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="w-[15%] px-2 lg:px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentAccounts.map((a, index) => {
                            const inactive = isAccountInactive(a);
                            return (
                                <tr
                                    key={a.id || a._id}
                                    className={`hover:bg-gradient-to-r hover:from-yellow-50/50 hover:via-amber-50/50 hover:to-orange-50/50 transition-all duration-300 border-b-2 border-gray-200/40 ${inactive ? 'opacity-60' : ''}`}
                                >
                                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm text-gray-900">{startIndex + index + 1}</td>
                                    <td className="px-2 lg:px-4 py-3">
                                        <div className="text-xs lg:text-sm font-medium text-gray-900 truncate">{a.username || 'N/A'}</div>
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">
                                        <div className="truncate">{a.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">{a.name || 'N/A'}</td>
                                    <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">{a.phone || 'N/A'}</td>
                                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${a.role === 'admin'
                                            ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                                            a.role === 'manager'
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {formatRoleName(a.role)}
                                        </span>
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${a.acc_status === 'active'
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                                : a.acc_status === 'suspended'
                                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white'
                                                    : a.acc_status === 'inactive'
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {a.acc_status || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-2 lg:px-4 py-3">
                                        <div className="flex justify-center items-center space-x-1">
                                            <button
                                                onClick={() => handleView(a)}
                                                className="p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm"
                                                aria-label={`View account details ${a._id || a.id}`}
                                                title="View Details"
                                            >
                                                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(a)}
                                                disabled={inactive}
                                                className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${inactive
                                                    ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                                                    : 'border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm'
                                                    }`}
                                                aria-label={`Edit account ${a._id || a.id}`}
                                                title="Edit Account"
                                            >
                                                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(a)}
                                                disabled={inactive}
                                                className={`p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 ${inactive
                                                    ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                                                    : 'text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700'
                                                    }`}
                                                aria-label={`Deactivate account ${a._id || a.id}`}
                                                title="Deactivate Account"
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
                totalItems={filteredAccounts.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
                itemName="accounts"
            />

            <AccountModal
                isOpen={showModal}
                account={editingAccount}
                onClose={closeModal}
                onSuccess={handleSuccess}
                viewOnly={isViewMode}
            />

            <DeleteConfirmModal
                isOpen={showDeleteConfirm}
                title="Deactivate Account"
                itemName={accountToDelete?.username}
                message={
                    <p>
                        Are you sure you want to deactivate account <span className="font-semibold text-gray-900">{accountToDelete?.username}</span>?
                        <br />
                        <span className="text-sm text-gray-500 mt-1 block">This action cannot be undone.</span>
                    </p>
                }
                onConfirm={handleDelete}
                onCancel={handleCancelDelete}
                confirmText="Deactivate Account"
                isLoading={isDeleting}
            />
        </Page>
    );
}