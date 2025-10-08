const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = Motion;

const CallUpdatesContainer = ({ staffId, socket }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState('disconnected');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const localStreamRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize WebRTC
  useEffect(() => {
    initializeWebRTC();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, [staffId, socket]);

  // Update video streams
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

  const initializeWebRTC = async () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(rtcConfig);

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            sessionId: incomingCall?.sessionId,
            candidate: event.candidate
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        console.log('Remote stream received');
        setRemoteStream(event.streams[0]);
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        setConnectionState(peerConnectionRef.current.connectionState);
        console.log('Connection state:', peerConnectionRef.current.connectionState);
      };

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

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
        startCall();
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
      if (data.sessionId === activeCall?.sessionId) {
        endCall();
      }
    };

    const handleCallOffer = async (data) => {
      if (data.sessionId !== incomingCall?.sessionId) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(data.offer);
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('call_answer', {
          sessionId: data.sessionId,
          answer
        });
      } catch (error) {
        console.error('Error handling call offer:', error);
      }
    };

    const handleCallAnswer = async (data) => {
      if (data.sessionId !== activeCall?.sessionId) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
      } catch (error) {
        console.error('Error handling call answer:', error);
      }
    };

    const handleIceCandidate = async (data) => {
      if (data.sessionId !== activeCall?.sessionId) return;

      try {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    };

    socket.on('call_initiated', handleCallInitiated);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_declined', handleCallDeclined);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_offer', handleCallOffer);
    socket.on('call_answer', handleCallAnswer);
    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('call_initiated', handleCallInitiated);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_declined', handleCallDeclined);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_offer', handleCallOffer);
      socket.off('call_answer', handleCallAnswer);
      socket.off('ice_candidate', handleIceCandidate);
    };
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit('call_offer', {
        sessionId: incomingCall.sessionId,
        offer
      });

      setActiveCall(incomingCall);
      setIsCallActive(true);
      setConnectionState('connecting');

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setIsCallActive(false);
      setLocalStream(null);
      setRemoteStream(null);
      setActiveCall(null);
      setConnectionState('disconnected');
      setCallDuration(0);

      socket.emit('call_ended', { sessionId: activeCall?.sessionId });

    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      socket.emit('call_accepted', { sessionId: incomingCall.sessionId });
    }
  };

  const declineCall = () => {
    if (incomingCall) {
      socket.emit('call_declined', { sessionId: incomingCall.sessionId });
      setIncomingCall(null);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const cleanup = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Incoming Call Notification */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">📞</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Incoming Call
                </h3>
                <p className="text-gray-600">{incomingCall.clientName}</p>
                <p className="text-sm text-gray-500">Session Call</p>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={declineCall}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Decline
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={acceptCall}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Accept
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Updates Content */}
      <div className="flex-1 flex flex-col">
        {isCallActive ? (
          /* Active Call Interface */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col bg-gray-900 rounded-lg overflow-hidden"
          >
            {/* Call Header */}
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <h4 className="text-white font-medium">Video Call</h4>
                  <p className="text-gray-300 text-sm">{activeCall?.clientName}</p>
                </div>
              </div>
              <div className="text-white text-sm font-mono">
                {formatDuration(callDuration)}
              </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-black">
              {/* Remote Video */}
              <div className="absolute inset-0">
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
                      <p>Connecting...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Video */}
              <div className="absolute top-4 right-4 w-24 h-18 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isCameraOff && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-white text-lg">📷</div>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="bg-gray-800 p-4">
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  {isMuted ? '🔇' : '🎤'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isCameraOff 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  {isCameraOff ? '📷' : '📹'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={endCall}
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  📞
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* No Call State */
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📞</div>
              <p className="text-lg font-medium">No incoming requests</p>
              <p className="text-sm">Waiting for calls...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export for use in other components
window.CallUpdatesContainer = CallUpdatesContainer;
