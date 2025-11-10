import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import Api from '../common/SummaryAPI';

const ProductSpecifications = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('specifcations');
  const navigate = useNavigate();

  // Data states
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    searchQuery: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newForm, setNewForm] = useState({ name: '', type: 'color' });
  const [editForm, setEditForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle URL parameter for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['specifcations', 'colors', 'sizes', 'categories'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle authentication state
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user && !localStorage.getItem('token')) {
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch functions
  const fetchColors = useCallback(async () => {
    try {
      const response = await Api.colors.getAll();
      setColors(Array.isArray(response) ? response.map(item => ({ ...item, name: item.color_name, type: 'color' })) : []);
    } catch (err) {
      console.error('Fetch colors error:', err);
    }
  }, []);

  const fetchSizes = useCallback(async () => {
    try {
      const response = await Api.sizes.getAll();
      setSizes(Array.isArray(response) ? response.map(item => ({ ...item, name: item.size_name, type: 'size' })) : []);
    } catch (err) {
      console.error('Fetch sizes error:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await Api.categories.getAll();
      setCategories(Array.isArray(response) ? response.map(item => ({ ...item, name: item.cat_name, type: 'category' })) : []);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchColors(), fetchSizes(), fetchCategories()]);
    setLoading(false);
  }, [fetchColors, fetchSizes, fetchCategories]);

  useEffect(() => {
    if (user) {
      fetchAll();
    }
    setCurrentPage(1);
  }, [user, fetchAll]);

  // Helper functions
  const tabToLabel = {
    'specifcations': 'Specification',
    'colors': 'Color',
    'sizes': 'Size',
    'categories': 'Category'
  };

  const tabToType = {
    'colors': 'color',
    'sizes': 'size',
    'categories': 'category'
  };

  const getLabel = () => tabToLabel[activeTab];

  const getApiForType = (type) => {
    switch (type) {
      case 'color': return Api.colors;
      case 'size': return Api.sizes;
      case 'category': return Api.categories;
      default: return null;
    }
  };

  const getNameFieldForType = (type) => {
    switch (type) {
      case 'color': return 'color_name';
      case 'size': return 'size_name';
      case 'category': return 'cat_name';
      default: return '';
    }
  };

  const getCurrentItems = () => {
    if (activeTab === 'specifcations') {
      return [...colors, ...sizes, ...categories];
    } else if (activeTab === 'colors') {
      return colors;
    } else if (activeTab === 'sizes') {
      return sizes;
    } else if (activeTab === 'categories') {
      return categories;
    }
    return [];
  };

  // Apply filters
  const applyFilters = useCallback((itemsList) => {
    return itemsList.filter((item) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const name = item.name?.toLowerCase() || '';
        if (!name.includes(query)) return false;
      }
      return true;
    });
  }, [filters]);

  const filteredItems = applyFilters(getCurrentItems());

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Handle previous page
  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  // Handle next page
  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  // Handle filter changes
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
    });
  }, []);

  // Create item
  const createItem = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!newForm.name) {
      setError(`${getLabel()} name is required`);
      setLoading(false);
      return;
    }

    const type = activeTab === 'specifcations' ? newForm.type : tabToType[activeTab];
    if (!type) {
      setError('Invalid type');
      setLoading(false);
      return;
    }

    try {
      const payload = { [getNameFieldForType(type)]: newForm.name };
      const api = getApiForType(type);
      const response = await api.create(payload);
      const newItem = { ...response, name: newForm.name, type };
      const setFunc = {
        color: setColors,
        size: setSizes,
        category: setCategories
      }[type];
      setFunc((prev) => [...prev, newItem]);
      showToast(`${tabToLabel[activeTab === 'specifcations' ? type + 's' : activeTab]} created successfully!`, 'success');
      setNewForm({ name: '', type: 'color' });
      setShowCreateModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to create ${getLabel().toLowerCase()}`;
      setError(msg);
      showToast(msg, 'error');
      console.error('Add item error:', err);
    } finally {
      setLoading(false);
    }
  }, [newForm, activeTab, showToast]);

  // Update item
  const updateItem = useCallback(async () => {
    if (!editingItem) return;

    setLoading(true);
    setError('');

    if (!editForm.name) {
      setError(`${getLabel()} name is required`);
      setLoading(false);
      return;
    }

    const type = editingItem.type;
    try {
      const payload = { [getNameFieldForType(type)]: editForm.name };
      const api = getApiForType(type);
      const response = await api.update(editingItem._id, payload);
      const updatedItem = { ...response, name: editForm.name, type };
      const setFunc = {
        color: setColors,
        size: setSizes,
        category: setCategories
      }[type];
      setFunc((prev) => prev.map((item) => (item._id === editingItem._id ? updatedItem : item)));
      showToast(`${getLabel()} updated successfully!`, 'success');
      setShowEditModal(false);
      setEditingItem(null);
      setEditForm({ name: '' });
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to update ${getLabel().toLowerCase()}`;
      setError(msg);
      showToast(msg, 'error');
      console.error('Edit item error:', err);
    } finally {
      setLoading(false);
    }
  }, [editingItem, editForm, showToast]);

  // Delete item
  const deleteItem = useCallback(async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    setLoading(true);
    setError('');

    try {
      const api = getApiForType(type);
      await api.delete(id);
      const setFunc = {
        color: setColors,
        size: setSizes,
        category: setCategories
      }[type];
      setFunc((prev) => prev.filter((item) => item._id !== id));
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, 'success');
      if (editingItem && editingItem._id === id) {
        setEditingItem(null);
        setShowEditModal(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to delete ${type}`;
      setError(msg);
      showToast(msg, 'error');
      console.error('Delete item error:', err);
    } finally {
      setLoading(false);
    }
  }, [editingItem, showToast]);

  // Start editing
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
    });
    setShowEditModal(true);
  }, []);

  // Handle field change for new form
  const handleNewFieldChange = useCallback((field, value) => {
    setNewForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle field change for edit form
  const handleEditFieldChange = useCallback((field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Close create modal
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setNewForm({ name: '', type: 'color' });
    setError('');
  }, []);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditForm({ name: '' });
    setError('');
  }, []);

  // Show loading state while auth is being verified
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4 xl:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8" role="status" aria-live="polite">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4 xl:p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">Product Specifications</h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Manage colors, sizes, and categories</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-4 flex-shrink-0">
            <div className="relative w-full sm:w-auto">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
            <div className="bg-gray-50 px-2 lg:px-4 py-1 lg:py-2 rounded-lg border border-gray-200">
              <span className="text-xs lg:text-sm font-medium text-gray-700">
                {filteredItems.length} {activeTab === 'specifcations' ? 'items' : activeTab}
              </span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-xs lg:text-sm"
              aria-label={`Add new ${getLabel().toLowerCase()}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className='font-medium'>Add {getLabel()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 lg:mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'specifcations'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('specifcations')}
            aria-selected={activeTab === 'specifcations'}
            role="tab"
          >
            All
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'colors'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('colors')}
            aria-selected={activeTab === 'colors'}
            role="tab"
          >
            Colors
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'sizes'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('sizes')}
            aria-selected={activeTab === 'sizes'}
            role="tab"
          >
            Sizes
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('categories')}
            aria-selected={activeTab === 'categories'}
            role="tab"
          >
            Categories
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 lg:mb-6" role="alert" aria-live="assertive">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
            <button
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-all duration-200 font-medium"
              onClick={fetchAll}
              aria-label="Retry loading"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-4 lg:mb-6" role="status" aria-live="polite">
          <div className="flex flex-col items-center justify-center space-y-4 min-h-[180px]">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading {activeTab}...</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8" role="status">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
              <p className="text-gray-500 text-sm">Get started by adding a new {getLabel().toLowerCase()}.</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 lg:mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                  {activeTab === 'specifcations' && (
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  )}
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                    {activeTab === 'specifcations' && (
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-lg capitalize">
                          {item.type}
                        </span>
                      </td>
                    )}
                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                        {item.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg transition-all duration-200 border text-blue-600 hover:text-blue-800 hover:bg-blue-100 border-blue-200 hover:border-blue-300"
                          aria-label={`Edit ${item.type} ${item._id}`}
                          title={`Edit ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`}
                        >
                          <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteItem(item._id, item.type)}
                          className="p-1.5 rounded-lg transition-all duration-200 border text-red-600 hover:text-red-800 hover:bg-red-100 border-red-200 hover:border-red-300"
                          aria-label={`Delete ${item.type} ${item._id}`}
                          title={`Delete ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`}
                        >
                          <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mt-4 lg:mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredItems.length)}</span> of{' '}
              <span className="font-medium">{filteredItems.length}</span> items
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Previous page"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border border-blue-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New {getLabel()}</h2>
              <button
                onClick={handleCloseCreateModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activeTab === 'specifcations' && (
                  <div>
                    <label htmlFor="create-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      id="create-type"
                      value={newForm.type}
                      onChange={(e) => handleNewFieldChange('type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="color">Color</option>
                      <option value="size">Size</option>
                      <option value="category">Category</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    value={newForm.name}
                    onChange={(e) => handleNewFieldChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter name..."
                    required
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseCreateModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={createItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !newForm.name}
              >
                {loading ? 'Creating...' : `Create ${getLabel()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit {editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter name..."
                    required
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={updateItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !editForm.name}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;