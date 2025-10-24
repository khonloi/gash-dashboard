import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Loading from '../../components/Loading';
import Api from '../../common/SummaryAPI';
import { FaShoppingCart, FaCheckCircle, FaClock, FaTimesCircle, FaDollarSign, FaHourglassHalf, FaUndo } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

// New components for different time periods
import OrdersByDay from './OrdersByDay';
import OrdersByWeek from './OrdersByWeek';
import OrdersByMonth from './OrdersByMonth';
import OrdersByYear from './OrdersByYear';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const OrderStatistics = () => {
    const { user, isAuthLoading } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('day'); // Default to daily view
    const [toast, setToast] = useState(null);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Handle authentication state
    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || !localStorage.getItem("token")) {
            setError("User not authenticated");
        } else if (user && (user.role !== 'admin' && user.role !== 'manager')) {
            setError("You do not have permission to view statistics");
        }
    }, [user, isAuthLoading]);

    if (isAuthLoading) {
        return (
            <Loading
                type="auth"
                size="large"
                message="Verifying authentication..."
                fullScreen={true}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium transition-all duration-300 ${
                        toast.type === "success"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : toast.type === "error"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                    role="alert"
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white">
                    <h1 className="text-3xl font-bold mb-2">Order Statistics</h1>
                    <p className="text-orange-100 text-base">Comprehensive order analytics and fulfillment insights</p>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-lg" role="alert" aria-live="true">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl">⚠</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-800 mb-1">Access Denied</h3>
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Analytics Tabs */}
            {!error && (
                <div className="space-y-4">
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setActiveTab('day')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                                    activeTab === 'day'
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setActiveTab('week')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                                    activeTab === 'week'
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setActiveTab('month')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                                    activeTab === 'month'
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setActiveTab('year')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                                    activeTab === 'year'
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                Year
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'day' && <OrdersByDay user={user} />}
                        {activeTab === 'week' && <OrdersByWeek user={user} />}
                        {activeTab === 'month' && <OrdersByMonth user={user} />}
                        {activeTab === 'year' && <OrdersByYear user={user} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderStatistics;