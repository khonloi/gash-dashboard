import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from '../../../common/SummaryAPI';
import Loading from '../../../components/ui/Loading';
import Page from '../../../components/ui/Page';

const StreamsList = ({
    title,
    emptyMessage,
    currentPage: externalCurrentPage,
    itemsPerPage: externalItemsPerPage,
    searchTerm,
    statusFilter,
    onPageChange,
    onTotalItemsChange
}) => {
    const navigate = useNavigate();
    const [streams, setStreams] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    // Use external pagination props if provided, otherwise use internal state
    const currentPage = externalCurrentPage || pagination.currentPage;
    const itemsPerPage = externalItemsPerPage || pagination.itemsPerPage;


    // Load all livestreams with pagination
    const loadAllLivestreams = useCallback(async (page = 1, limit = 10, search = '', status = 'all') => {
        try {
            setIsLoading(true);

            // For client-side filtering, we need to load all data first
            // Then apply filters and pagination
            const response = await Api.livestream.getAll({ page: 1, limit: 1000 }); // Load more data for filtering

            if (response.success) {
                // Backend returns: { success: true, data: { livestreams: [...], count: N } }
                let allLivestreams = response.data?.livestreams || [];

                // Apply client-side filtering
                if (status !== 'all') {
                    allLivestreams = allLivestreams.filter(stream => {
                        if (status === 'live') {
                            return stream.status === 'live';
                        } else if (status === 'ended') {
                            return stream.status === 'ended';
                        }
                        return true;
                    });
                }

                // Apply client-side search
                if (search) {
                    allLivestreams = allLivestreams.filter(stream =>
                        stream.title?.toLowerCase().includes(search.toLowerCase()) ||
                        stream.description?.toLowerCase().includes(search.toLowerCase()) ||
                        stream.hostId?.name?.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Apply pagination to filtered results
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedLivestreams = allLivestreams.slice(startIndex, endIndex);

                // Calculate pagination info
                const totalItems = allLivestreams.length;
                const totalPages = Math.ceil(totalItems / limit);

                const paginationData = {
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalItems,
                    itemsPerPage: limit
                };

                setStreams(paginatedLivestreams);
                setPagination(paginationData);

                // Notify parent component of total items change
                if (onTotalItemsChange) {
                    onTotalItemsChange(totalItems);
                }
            } else {
                // console.error('Error loading livestreams:', response.message);
            }
        } catch (error) {
            // console.error('Error loading livestreams:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onTotalItemsChange]);

    // Handle page change for pagination
    const handlePageChange = (newPage) => {
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            loadAllLivestreams(newPage, itemsPerPage, searchTerm, statusFilter);
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadAllLivestreams(currentPage, itemsPerPage, searchTerm, statusFilter);
    }, [loadAllLivestreams, currentPage, itemsPerPage, searchTerm, statusFilter]);

    return (
        <div className="rounded-xl border overflow-hidden mb-4 lg:mb-6" style={{ borderColor: 'rgb(217 119 6)', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(233, 163, 25, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}>
            {isLoading ? (
                <div className="rounded-xl border p-6 mb-4 lg:mb-6" style={{ borderColor: 'rgb(217 119 6)', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(233, 163, 25, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }} role="status" aria-live="polite">
                    <Loading
                        type="page"
                        size="medium"
                        message="Loading livestreams..."
                    />
                </div>
            ) : streams.length > 0 ? (
                <div className="overflow-x-auto">
                    <Page.Table minWidth="900px">
                        {/* ---------- HEADER ---------- */}
                        <thead className="border-b">
                            <tr>
                                <Page.Th width="w-[5%]">#</Page.Th>
                                <Page.Th width="w-[18%]">Title</Page.Th>
                                <Page.Th width="w-[20%]">Description</Page.Th>
                                <Page.Th width="w-[8%]">Status</Page.Th>
                                <Page.Th width="w-[10%]">Host</Page.Th>
                                <Page.Th width="w-[8%]">Viewers</Page.Th>
                                <Page.Th width="w-[11%]">Start Time</Page.Th>
                                <Page.Th width="w-[11%]">End Time</Page.Th>
                                <Page.Th width="w-[9%]" align="center">Actions</Page.Th>
                            </tr>
                        </thead>

                        <tbody>
                            {streams.map((stream, index) => {
                                const startIndex = ((currentPage || 1) - 1) * (itemsPerPage || 10);
                                const itemNumber = startIndex + index + 1;
                                return (
                                    <Page.Tr key={stream._id || index}>
                                        {/* # */}
                                        <Page.Td nowrap>
                                            {itemNumber}
                                        </Page.Td>

                                        {/* Title */}
                                        <Page.Td>
                                            <div className="font-medium truncate">
                                                {stream.title || 'Untitled Stream'}
                                            </div>
                                        </Page.Td>

                                        {/* Description */}
                                        <Page.Td>
                                            <div className="truncate">
                                                {stream.description || 'No description'}
                                            </div>
                                        </Page.Td>

                                        {/* Status */}
                                        <Page.Td nowrap>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stream.status === 'live'
                                                ? 'bg-gradient-to-r from-red-400 to-red-600 text-white border border-red-500'
                                                : stream.status === 'ended'
                                                    ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border border-gray-500'
                                                    : 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white border border-yellow-500'
                                                }`}>
                                                {stream.status || 'unknown'}
                                            </span>
                                        </Page.Td>

                                        {/* Host */}
                                        <Page.Td>
                                            {stream.hostId?.name || stream.hostId || 'Unknown'}
                                        </Page.Td>

                                        {/* Viewers */}
                                        <Page.Td>
                                            {stream.peakViewers || stream.currentViewers || 0}
                                        </Page.Td>

                                        {/* Start Time */}
                                        <Page.Td>
                                            {stream.startTime ? new Date(stream.startTime).toLocaleString() : 'N/A'}
                                        </Page.Td>

                                        {/* End Time */}
                                        <Page.Td>
                                            {stream.endTime ? new Date(stream.endTime).toLocaleString() : 'N/A'}
                                        </Page.Td>

                                        {/* Actions */}
                                        <Page.Td>
                                            <div className="flex justify-center items-center">
                                                <Page.ActionButton
                                                    onClick={() => navigate(`/livestream/details/${stream._id}`)}
                                                    variant="primary"
                                                    title="View Details"
                                                >
                                                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Page.ActionButton>
                                            </div>
                                        </Page.Td>
                                    </Page.Tr>
                                );
                            })}
                        </tbody>
                    </Page.Table>
                </div>
            ) : (
                <div className="p-6 text-center">
                    <div className="flex flex-col items-center space-y-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-base font-medium text-gray-900">No livestreams found</h3>
                            <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreamsList;
