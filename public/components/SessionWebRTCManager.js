const { useState, useEffect, useRef } = React;

const SessionWebRTCManager = ({ sessionId, socket, onCallStateChange }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
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

  // Initialize WebRTC when component mounts
  useEffect(() => {
    initializeWebRTC();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, [sessionId, socket]);

  // Update video streams when local/remote streams change
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
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(rtcConfig);

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            sessionId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('Remote stream received');
        setRemoteStream(event.streams[0]);
      };

      // Handle connection state changes
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

    // Handle incoming call offers
    socket.on('session_call_notification', handleIncomingCall);
    
    // Handle call acceptance
    socket.on('session_call_accepted', handleCallAccepted);
    
    // Handle call decline
    socket.on('session_call_declined', handleCallDeclined);
    
    // Handle call end
    socket.on('session_call_ended', handleCallEnded);
    
    // Handle WebRTC signaling
    socket.on('call_offer', handleCallOffer);
    socket.on('call_answer', handleCallAnswer);
    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('session_call_notification', handleIncomingCall);
      socket.off('session_call_accepted', handleCallAccepted);
      socket.off('session_call_declined', handleCallDeclined);
      socket.off('session_call_ended', handleCallEnded);
      socket.off('call_offer', handleCallOffer);
      socket.off('call_answer', handleCallAnswer);
      socket.off('ice_candidate', handleIceCandidate);
    };
  };

  const handleIncomingCall = (data) => {
    console.log('Incoming session call:', data);
    // This will be handled by the SessionCallNotification component
  };

  const handleCallAccepted = (data) => {
    console.log('Call accepted:', data);
    if (data.sessionId === sessionId) {
      startCall();
    }
  };

  const handleCallDeclined = (data) => {
    console.log('Call declined:', data);
    if (data.sessionId === sessionId) {
      endCall();
    }
  };

  const handleCallEnded = (data) => {
    console.log('Call ended:', data);
    if (data.sessionId === sessionId) {
      endCall();
    }
  };

  const handleCallOffer = async (data) => {
    if (data.sessionId !== sessionId) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit('call_answer', {
        sessionId,
        answer
      });
    } catch (error) {
      console.error('Error handling call offer:', error);
    }
  };

  const handleCallAnswer = async (data) => {
    if (data.sessionId !== sessionId) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('Error handling call answer:', error);
    }
  };

  const handleIceCandidate = async (data) => {
    if (data.sessionId !== sessionId) return;

    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const startCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit('call_offer', {
        sessionId,
        offer
      });

      setIsCallActive(true);
      setConnectionState('connecting');

      if (onCallStateChange) {
        onCallStateChange({
          isActive: true,
          localStream: stream,
          remoteStream: null,
          sessionId
        });
      }

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Reset state
      setIsCallActive(false);
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionState('disconnected');
      setCallDuration(0);

      // Emit call ended event
      socket.emit('session_call_ended', { sessionId });

      if (onCallStateChange) {
        onCallStateChange({
          isActive: false,
          localStream: null,
          remoteStream: null,
          sessionId
        });
      }

    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const initiateCall = () => {
    socket.emit('session_call_initiated', {
      sessionId,
      callType: 'video'
    });
  };

  const acceptCall = () => {
    socket.emit('session_call_accepted', { sessionId });
  };

  const declineCall = () => {
    socket.emit('session_call_declined', { sessionId });
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

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Get camera stream again
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        
        // Replace tracks in peer connection
        const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(stream.getVideoTracks()[0]);
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        
        // Replace video track in peer connection
        const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(stream.getVideoTracks()[0]);
        }
        
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
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

  return {
    // State
    isCallActive,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    connectionState,
    
    // Refs
    localVideoRef,
    remoteVideoRef,
    
    // Actions
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    formatDuration
  };
};

// Export for use in other components
window.SessionWebRTCManager = SessionWebRTCManager;
