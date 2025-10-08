const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = Motion;

const CallUpdatesWidget = ({ staffId, jwtToken }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // { sessionId, callerName, callType }
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const callTimerRef = useRef(null);

  // Use the useWebRTC hook with the accepted/active sessionId
  const webrtc = useWebRTC(activeCall?.sessionId, socket);

  // Initialize socket connection
  useEffect(() => {
    if (!staffId) return;

    const socketInstance = io();
    setSocket(socketInstance);

    // Set up call event listeners
    const handleCallInitiated = (data) => {
      console.log('Call initiated for staff:', data);
      if (data.staffId === staffId) {
        setIncomingCall(data);
      }
    };

    const handleCallAccepted = (data) => {
      console.log('Call accepted:', data);
      if (data.sessionId === incomingCall?.sessionId) {
        setIncomingCall(null);
        setActiveCall({
          sessionId: data.sessionId,
          callerName: incomingCall.callerName || 'Caller',
          callType: incomingCall.callType || 'video'
        });
        startCall(data);
      }
    };

    const handleCallDeclined = (data) => {
      console.log('Call declined:', data);
      if (data.sessionId === incomingCall?.sessionId) {
        setIncomingCall(null);
      }
    };

    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      endCall();
    };

    // WebRTC signaling events
    const handleCallOffer = (data) => {
      if (data.sessionId === incomingCall?.sessionId) {
        webrtc.acceptOffer(data.offer);
      }
    };

    const handleCallAnswer = (data) => {
      webrtc.handleAnswer(data.answer);
    };

    const handleIceCandidate = (data) => {
      webrtc.addIceCandidate(data.candidate);
    };

    // Register event listeners
    socketInstance.on('call_initiated', handleCallInitiated);
    socketInstance.on('call_accepted', handleCallAccepted);
    socketInstance.on('call_declined', handleCallDeclined);
    socketInstance.on('call_ended', handleCallEnded);
    socketInstance.on('call_offer', handleCallOffer);
    socketInstance.on('call_answer', handleCallAnswer);
    socketInstance.on('ice_candidate', handleIceCandidate);

    return () => {
      socketInstance.off('call_initiated', handleCallInitiated);
      socketInstance.off('call_accepted', handleCallAccepted);
      socketInstance.off('call_declined', handleCallDeclined);
      socketInstance.off('call_ended', handleCallEnded);
      socketInstance.off('call_offer', handleCallOffer);
      socketInstance.off('call_answer', handleCallAnswer);
      socketInstance.off('ice_candidate', handleIceCandidate);
    };
  }, [staffId, jwtToken, incomingCall?.sessionId, webrtc]);

  // Call timer
  useEffect(() => {
    if (isCallActive) {
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
  }, [isCallActive]);

  const startCall = async (callData) => {
    try {
      await webrtc.initializeWebRTC();
      await webrtc.startLocalStream();
      await webrtc.createOffer();
      setIsCallActive(true);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    webrtc.endCall();
    setIsCallActive(false);
    setCallDuration(0);
    setActiveCall(null);
  };

  const acceptCall = () => {
    if (incomingCall && socket) {
      socket.emit('call_accepted', { 
        sessionId: incomingCall.sessionId,
        staffId: staffId
      });
      setIncomingCall(null);
      setActiveCall({
        sessionId: incomingCall.sessionId,
        callerName: incomingCall.callerName || 'Caller',
        callType: incomingCall.callType || 'video'
      });
      startCall(incomingCall);
    }
  };

  const declineCall = () => {
    if (incomingCall && socket) {
      socket.emit('call_declined', { sessionId: incomingCall.sessionId });
      setIncomingCall(null);
    }
  };

  const toggleMute = () => {
    webrtc.toggleMute();
  };

  const toggleCamera = () => {
    webrtc.toggleCamera();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update call active state when WebRTC connects
  useEffect(() => {
    if (webrtc.isConnected && !isCallActive) {
      setIsCallActive(true);
    }
  }, [webrtc.isConnected, isCallActive]);

  return (
    <div className="h-full w-full relative" style={{ background: 'transparent' }}>
      {/* Incoming Call Notification - Perfect iOS 18 Style */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.4
            }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          >
            <div className="w-full max-w-sm">
              {/* iOS 18 Widget Container */}
              <div className="relative">
                {/* Frosted Glass Background */}
                <div 
                  className="absolute inset-0 rounded-3xl border-2 shadow-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                ></div>
                
                {/* Inner Glow Ring */}
                <div 
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                ></div>
                
                {/* Content */}
                <div className="relative p-8 text-center">
                  {/* Call Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    <span className="text-3xl text-white">
                      {incomingCall.callType === 'video' ? '📹' : '📞'}
                    </span>
                  </motion.div>

                  {/* Caller Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                  >
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {incomingCall.callerName}
                    </h3>
                    <p className="text-white/80 text-lg mb-1">
                      {incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call'}
                    </p>
                    <p className="text-white/60 text-sm">
                      Session: {incomingCall.sessionId?.slice(0, 8)}...
                    </p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex space-x-4"
                  >
                    {/* Decline Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={declineCall}
                      className="flex-1 py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span className="text-xl">❌</span>
                        <span>Decline</span>
                      </span>
                    </motion.button>

                    {/* Accept Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={acceptCall}
                      className="flex-1 py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span className="text-xl">✅</span>
                        <span>Accept</span>
                      </span>
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Interface - iOS 18 Style */}
      <AnimatePresence>
        {isCallActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full flex flex-col rounded-xl overflow-hidden"
            style={{ background: '#0f172a' }}
          >
            {/* Call Header - iOS 18 Widget Style */}
            <div 
              className="relative p-4 flex items-center justify-between text-white"
              style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}
            >
              {/* Frosted Glass Effect */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              ></div>
              
              <div className="relative flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="font-semibold text-lg">Video Call</h4>
                  <p className="text-gray-300 text-sm">{incomingCall?.callerName}</p>
                </div>
              </div>
              <div className="text-white/80 font-mono text-sm font-medium">
                {formatDuration(callDuration)}
              </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-black overflow-hidden">
              {/* Remote Video */}
              <div className="absolute inset-0">
                <video
                  ref={webrtc.remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!webrtc.remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-6xl mb-4"
                      >
                        👤
                      </motion.div>
                      <p className="text-lg">Connecting...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Video - Draggable Bubble */}
              <motion.div
                drag
                dragConstraints={{ 
                  left: 0, 
                  right: 200, 
                  top: 0, 
                  bottom: 150 
                }}
                className="absolute top-4 right-4 w-32 h-24 rounded-2xl overflow-hidden shadow-2xl border-2"
                style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <video
                  ref={webrtc.localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {webrtc.isCameraOff && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-white text-2xl">📷</div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Call Controls - iOS 18 Style */}
            <div 
              className="relative p-4"
              style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}
            >
              {/* Frosted Glass Effect */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              ></div>
              
              <div className="relative flex items-center justify-center space-x-8">
                {/* Mute Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    webrtc.isMuted 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  style={{
                    boxShadow: webrtc.isMuted 
                      ? '0 8px 20px rgba(239, 68, 68, 0.4)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="text-2xl">
                    {webrtc.isMuted ? '🔇' : '🎤'}
                  </span>
                </motion.button>

                {/* Camera Toggle */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleCamera}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    webrtc.isCameraOff 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  style={{
                    boxShadow: webrtc.isCameraOff 
                      ? '0 8px 20px rgba(239, 68, 68, 0.4)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="text-2xl">
                    {webrtc.isCameraOff ? '📷' : '📹'}
                  </span>
                </motion.button>

                {/* End Call Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={endCall}
                  className="w-18 h-18 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
                  style={{
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <span className="text-3xl">📞</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default State - No Call */}
      {!incomingCall && !isCallActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex items-center justify-center text-gray-400"
        >
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut"
              }}
              className="text-6xl mb-4"
            >
              📞
            </motion.div>
            <p className="text-xl font-medium text-gray-300 mb-2">
              No incoming requests
            </p>
            <p className="text-sm text-gray-500">
              Waiting for calls...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Export for use in other components
window.CallUpdatesWidget = CallUpdatesWidget;