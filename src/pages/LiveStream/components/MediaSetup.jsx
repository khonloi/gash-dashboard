import React, { useEffect, useRef } from 'react';
import { Videocam, Mic, MicOff, Settings } from '@mui/icons-material';

const MediaSetup = ({
    mediaDevices,
    selectedCamera,
    selectedMicrophone,
    isVideoPlaying,
    isAudioPlaying,
    videoDimensions,
    mediaError,
    isVideoEnabled,
    isAudioEnabled,
    onCameraChange,
    onMicrophoneChange,
    onToggleVideo,
    onToggleAudio,
    previewVideoRef
}) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thiết lập Media</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Camera
                    </label>
                    <select
                        value={selectedCamera}
                        onChange={(e) => onCameraChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {mediaDevices.cameras?.map((camera, index) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || `Camera ${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Microphone Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Microphone
                    </label>
                    <select
                        value={selectedMicrophone}
                        onChange={(e) => onMicrophoneChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {mediaDevices.microphones?.map((mic, index) => (
                            <option key={mic.deviceId} value={mic.deviceId}>
                                {mic.label || `Microphone ${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Media Preview */}
            <div className="mt-6 flex flex-col items-center w-full">
                <label className="block text-sm font-medium text-gray-700 mb-3 w-full text-center">
                    Preview
                </label>
                <div className="relative bg-black rounded-lg overflow-hidden mx-auto" style={{ width: '250px', aspectRatio: '9/16' }}>
                    <video
                        ref={previewVideoRef}
                        autoPlay
                        muted
                        playsInline
                        controls={false}
                        className="w-full h-full object-cover"
                        style={{ backgroundColor: '#000' }}
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        Preview
                    </div>

                    {/* Media Status Indicators */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <div className={`px-2 py-1 rounded text-xs ${isVideoPlaying ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                            {isVideoPlaying ? '📹 Video ON' : '📹 Video OFF'}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${isAudioPlaying ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                            {isAudioPlaying ? '🎤 Audio ON' : '🎤 Audio OFF'}
                        </div>
                    </div>

                    {/* Video Dimensions */}
                    {videoDimensions.width > 0 && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {videoDimensions.width}x{videoDimensions.height}
                        </div>
                    )}
                </div>

                {/* Media Error Display */}
                {/* {mediaError && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        <strong>Media Error:</strong> {mediaError}
                    </div>
                )} */}
            </div>

            {/* Media Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
                <button
                    onClick={onToggleVideo}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isVideoEnabled
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        } ${isVideoEnabled ? 'animate-pulse' : ''}`}
                >
                    <Videocam className="w-5 h-5" />
                    {isVideoEnabled ? 'Tắt Video' : 'Bật Video'}
                </button>

                <button
                    onClick={onToggleAudio}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isAudioEnabled
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        } ${isAudioEnabled ? 'animate-pulse' : ''}`}
                >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    {isAudioEnabled ? 'Tắt Mic' : 'Bật Mic'}
                </button>
            </div>
        </div>
    );
};

export default MediaSetup;
