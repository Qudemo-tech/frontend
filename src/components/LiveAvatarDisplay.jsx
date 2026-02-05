import React from 'react';
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  SignalIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

/**
 * LiveAvatarDisplay - UI wrapper for LiveAvatar with controls
 * 
 * Provides a polished UI around the LiveAvatarManager with:
 * - Quality indicator
 * - Connection status
 * - Mute/unmute controls (future)
 * - Reconnect button
 * - Speaking animations
 * 
 * @param {object} props
 * @param {string} props.qudemoId - QuDemo ID
 * @param {string} props.companyName - Company name
 * @param {string} props.avatarId - Avatar ID
 * @param {string} props.voiceId - Voice ID
 * @param {string} props.quality - Quality level
 * @param {function} props.onReady - Ready callback
 * @param {function} props.onStartTalking - Start talking callback
 * @param {function} props.onStopTalking - Stop talking callback
 * @param {function} props.onError - Error callback
 * @param {boolean} props.isMaximized - Whether widget is maximized
 */
const LiveAvatarDisplay = ({
  qudemoId,
  companyName,
  avatarId,
  voiceId,
  quality = 'medium',
  onReady,
  onStartTalking,
  onStopTalking,
  onError,
  isMaximized = false,
}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [showReconnect, setShowReconnect] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
    setShowReconnect(!connected);
  };
  
  const handleError = (err) => {
    setError(err.message || 'An error occurred');
    onError && onError(err);
  };
  
  const handleStartTalking = (e) => {
    setIsSpeaking(true);
    onStartTalking && onStartTalking(e);
  };
  
  const handleStopTalking = (e) => {
    setIsSpeaking(false);
    onStopTalking && onStopTalking(e);
  };
  
  const handleReconnect = () => {
    window.location.reload(); // Simple reconnect - reload page
  };
  
  return (
    <div className={`relative ${
      isMaximized ? 'w-full h-full' : 'w-full aspect-video'
    } rounded-lg overflow-hidden shadow-lg`}>
      
      {/* Top Bar - Quality & Status */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        {/* Quality Indicator */}
        <div className="bg-gray-900 bg-opacity-75 backdrop-blur-sm px-2 py-1 rounded-md flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            quality === 'high' ? 'bg-green-500' :
            quality === 'medium' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`}></div>
          <span className="text-white text-xs font-medium uppercase">{quality}</span>
        </div>
        
        {/* Connection Status */}
        <div className={`bg-gray-900 bg-opacity-75 backdrop-blur-sm px-2 py-1 rounded-md flex items-center space-x-1 ${
          isConnected ? 'text-green-400' : 'text-red-400'
        }`}>
          {isConnected ? (
            <>
              <SignalIcon className="w-3 h-3" />
              <span className="text-xs font-medium">Live</span>
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-3 h-3" />
              <span className="text-xs font-medium">Offline</span>
            </>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="absolute bottom-12 left-2 right-2 bg-red-500 bg-opacity-90 backdrop-blur-sm px-3 py-2 rounded-md">
          <p className="text-white text-xs">{error}</p>
        </div>
      )}
      
      {/* Reconnect Button */}
      {showReconnect && !isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm">
          <button
            onClick={handleReconnect}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Reconnect</span>
          </button>
        </div>
      )}
      
      {/* Speaking Animation - Waveform */}
      {isSpeaking && isConnected && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-blue-500 bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
            <SpeakerWaveIcon className="w-4 h-4 text-white" />
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 12 + 8}px`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '600ms'
                  }}
                ></div>
              ))}
            </div>
            <span className="text-white text-xs font-medium">Speaking...</span>
          </div>
        </div>
      )}
      
      {/* Idle State - Avatar Breathing Animation */}
      {!isSpeaking && isConnected && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-gray-800 bg-opacity-75 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-300 text-xs">Ready</span>
          </div>
        </div>
      )}
      
      {/* Live Badge */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
        <div className="bg-red-500 bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-xs font-bold uppercase tracking-wider">Live Avatar</span>
        </div>
      </div>
    </div>
  );
};

export default LiveAvatarDisplay;

