import React from 'react';

const StreamsList = ({ title, streams, emptyMessage }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            <div className="divide-y divide-gray-200">
                {streams.length > 0 ? (
                    streams.map((stream, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">{stream.title || 'Untitled Stream'}</h3>
                                    <p className="text-sm text-gray-600">{stream.description || 'No description'}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        <span>Status: {stream.status || 'unknown'}</span>
                                        {stream.roomName && <span>Room: {stream.roomName}</span>}
                                        {stream.hostId && <span>Host: {stream.hostId}</span>}
                                        {stream.currentViewers !== undefined && <span>Viewers: {stream.currentViewers || 0}</span>}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {stream.startTime ? new Date(stream.startTime).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamsList;
