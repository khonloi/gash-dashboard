import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
} from 'chart.js';
import { FaShoppingCart, FaCheckCircle, FaClock, FaTimesCircle, FaDollarSign, FaHourglassHalf, FaUndo } from 'react-icons/fa';
import Api from '../../common/SummaryAPI';
import Loading from '../../components/Loading';

// Register Chart.js components
ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

const OrdersByWeek = ({ user }) => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
        averageProcessingTime: 0,
        refundRate: 0,
        ordersPerWeek: [],
        topPaymentMethods: [],
        cartAbandonmentRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async () => {
        if (!user?._id) {
            setError('User not authenticated');
            return;
        }
        try {
            setLoading(true);
            const response = await Api.statistics.getOrderStatistics({ period: 'week' });
            setStats({
                ...response,
                ordersPerWeek: response.ordersPerWeek || [],
                topPaymentMethods: response.topPaymentMethods || [],
            });
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch weekly order statistics');
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user?._id) {
            fetchStats();
        }
    }, [user, fetchStats]);

    const orderStatusData = useMemo(() => ({
        labels: ['Pending', 'Completed', 'Cancelled'],
        datasets: [
            {
                data: [stats.pendingOrders, stats.completedOrders, stats.cancelledOrders],
                backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 0,
            },
        ],
    }), [stats]);

    const ordersTrendData = useMemo(() => ({
        labels: Array.isArray(stats.ordersPerWeek) ? stats.ordersPerWeek.map(item => item._id || 'Unknown').slice(-12) : [],
        datasets: [
            {
                label: 'Orders per Week',
                data: Array.isArray(stats.ordersPerWeek) ? stats.ordersPerWeek.map(item => item.count || 0).slice(-12) : [],
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
            },
        ],
    }), [stats]);

    const paymentMethodsData = useMemo(() => ({
        labels: Array.isArray(stats.topPaymentMethods) ? stats.topPaymentMethods.map(method => method._id || 'Unknown') : [],
        datasets: [
            {
                label: 'Orders by Payment Method',
                data: Array.isArray(stats.topPaymentMethods) ? stats.topPaymentMethods.map(method => method.count || 0) : [],
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            },
        ],
    }), [stats]);

    const cartAbandonmentData = useMemo(() => ({
        labels: ['Abandoned Carts', 'Converted Carts'],
        datasets: [
            {
                data: [stats.cartAbandonmentRate, 100 - stats.cartAbandonmentRate],
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 0,
            },
        ],
    }), [stats]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                bodyFont: {
                    size: 12,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: 10,
                    },
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                ticks: {
                    font: {
                        size: 10,
                    },
                },
            },
        },
    }), []);

    const pieChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'left',
                labels: {
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                bodyFont: {
                    size: 12,
                },
            },
        },
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            },
        },
    }), []);

    if (loading) {
        return (
            <Loading
                type="auth"
                size="large"
                message="Fetching weekly statistics..."
                fullScreen={false}
            />
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FaShoppingCart className="text-orange-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.totalOrders.toLocaleString()}</h3>
                    <p className="text-gray-600 text-sm">Total Orders</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FaCheckCircle className="text-green-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.completedOrders}</h3>
                    <p className="text-gray-600 text-sm">Completed Orders</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FaClock className="text-blue-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.pendingOrders}</h3>
                    <p className="text-gray-600 text-sm">Pending Orders</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FaTimesCircle className="text-red-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.cancelledOrders}</h3>
                    <p className="text-gray-600 text-sm">Cancelled Orders</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FaDollarSign className="text-yellow-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.averageOrderValue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</h3>
                    <p className="text-gray-600 text-sm">Average Order Value</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FaHourglassHalf className="text-purple-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.averageProcessingTime.toFixed(2)} hrs</h3>
                    <p className="text-gray-600 text-sm">Avg. Processing Time</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                            <FaUndo className="text-pink-600 text-lg" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.refundRate.toFixed(2)}%</h3>
                    <p className="text-gray-600 text-sm">Refund Rate</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Orders Trend</h3>
                    <div className="h-64">
                        <Bar data={ordersTrendData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h3>
                    <div className="h-64">
                        <Pie data={orderStatusData} options={pieChartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Payment Methods</h3>
                    <div className="h-64">
                        <Bar data={paymentMethodsData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Abandonment Rate</h3>
                    <div className="h-64">
                        <Doughnut data={cartAbandonmentData} options={pieChartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdersByWeek;