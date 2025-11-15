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
        <div className="min-h-screen p-2 sm:p-3 lg:p-4 xl:p-6">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium transition-all duration-300 ${toast.type === "success"
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 mb-4 lg:mb-6 pt-2 lg:pt-3 pb-2 lg:pb-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2 leading-tight">Order Statistics</h1>
                </div>
            </div>

            {/* Order Analytics Tabs */}
            {!error && (
                <div className="space-y-4">
                    {/* Tab Navigation */}
                    <div className="backdrop-blur-xl rounded-xl border p-2" style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(251, 191, 36, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}>
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setActiveTab('day')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'day'
                                        ? 'bg-gradient-to-r from-[#E9A319] via-[#A86523] to-[#8B4E1A] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setActiveTab('week')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'week'
                                        ? 'bg-gradient-to-r from-[#E9A319] via-[#A86523] to-[#8B4E1A] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setActiveTab('month')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'month'
                                        ? 'bg-gradient-to-r from-[#E9A319] via-[#A86523] to-[#8B4E1A] text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setActiveTab('year')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'year'
                                        ? 'bg-gradient-to-r from-[#E9A319] via-[#A86523] to-[#8B4E1A] text-white shadow-md'
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

            {/* Error Display */}
            {error && (
                <div className="backdrop-blur-xl rounded-xl border p-6" style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(233, 163, 25, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }} role="alert" aria-live="true">
                    <div className="flex flex-col items-center justify-center space-y-4 min-h-[180px]">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-base font-semibold text-gray-900">Access Denied</h3>
                            <p className="text-sm text-gray-500 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderStatistics;