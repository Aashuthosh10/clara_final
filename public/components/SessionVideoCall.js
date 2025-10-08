const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = Motion;

const SessionVideoCall = ({ 
  isActive, 
  sessionId, 
  localStream, 
  remoteStream, 
  onEndCall, 
  onMuteToggle, 
  onCameraToggle,
  onScreenShare 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);

  // Update video streams when props change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Start call timer
  useEffect(() => {
    if (isActive) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isActive]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (onMuteToggle) onMuteToggle(newMuted);
  };

  const handleCameraToggle = () => {
    const newCameraOff = !isCameraOff;
    setIsCameraOff(newCameraOff);
    if (onCameraToggle) onCameraToggle(newCameraOff);
  };

  const handleScreenShare = () => {
    const newScreenSharing = !isScreenSharing;
    setIsScreenSharing(newScreenSharing);
    if (onScreenShare) onScreenShare(newScreenSharing);
  };

  const handleEndCall = () => {
    if (onEndCall) onEndCall();
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center ${
            isMinimized ? 'pointer-events-none' : ''
          }`}
        >
          <div className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized 
              ? 'w-80 h-48 absolute top-4 right-4' 
              : 'w-full max-w-4xl h-full max-h-[80vh]'
          }`}>
            {/* Header */}
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <h3 className="font-semibold">Session Video Call</h3>
                  <p className="text-sm text-gray-300">Session: {sessionId?.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {isMinimized ? '⛶' : '⊟'}
                </button>
              </div>
            </div>

            {/* Video Area */}
            <div className="relative bg-gray-900 h-96 flex">
              {/* Remote Video */}
              <div className="flex-1 relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">👤</div>
                      <p>Waiting for remote video...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Video */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isCameraOff && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-white text-2xl">📷</div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-100 p-4">
              <div className="flex items-center justify-center space-x-4">
                {/* Mute Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMuteToggle}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {isMuted ? '🔇' : '🎤'}
                </motion.button>

                {/* Camera Toggle */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCameraToggle}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isCameraOff 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {isCameraOff ? '📷' : '📹'}
                </motion.button>

                {/* Screen Share */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleScreenShare}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isScreenSharing 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  🖥️
                </motion.button>

                {/* End Call */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleEndCall}
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  📞
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export for use in other components
window.SessionVideoCall = SessionVideoCall;
