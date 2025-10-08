const { useState, useEffect, useRef, useCallback } = React;

const useWebRTC = (sessionId, socket) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(rtcConfig);

      peerConnectionRef.current.onicecandidate = (event) => {
        console.log('[WebRTC] onicecandidate', event.candidate);
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            sessionId: sessionId,
            candidate: event.candidate
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        console.log('[WebRTC] ontrack remote stream');
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const connectionState = peerConnectionRef.current.connectionState;
          console.log('[WebRTC] connection state =>', connectionState);
          setIsConnected(connectionState === 'connected');
        }
      };
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state =>', peerConnectionRef.current.iceConnectionState);
      };
      peerConnectionRef.current.onsignalingstatechange = () => {
        console.log('[WebRTC] signaling state =>', peerConnectionRef.current.signalingState);
      };

    } catch (error) {
      console.error('[WebRTC] Error initializing', error);
    }
  }, [sessionId, socket]);

  // Start local stream
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('[WebRTC] Error getUserMedia', error);
      throw error;
    }
  }, []);

  // Create offer
  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) return;

      const offer = await peerConnectionRef.current.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peerConnectionRef.current.setLocalDescription(offer);

      if (socket) {
        socket.emit('call_offer', {
          sessionId: sessionId,
          offer: offer
        });
      }

      return offer;
    } catch (error) {
      console.error('[WebRTC] Error createOffer', error);
    }
  }, [sessionId, socket]);

  // Accept offer
  const acceptOffer = useCallback(async (offer) => {
    try {
      if (!peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (socket) {
        socket.emit('call_answer', {
          sessionId: sessionId,
          answer: answer
        });
      }

      return answer;
    } catch (error) {
      console.error('[WebRTC] Error acceptOffer', error);
    }
  }, [sessionId, socket]);

  // Handle answer
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('[WebRTC] Error handleAnswer', error);
    }
  }, []);

  // Handle ICE candidate
  const addIceCandidate = useCallback(async (candidate) => {
    try {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('[WebRTC] Error addIceCandidate', error);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  }, [isCameraOff]);

  // End call
  const endCall = useCallback(() => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setIsMuted(false);
      setIsCameraOff(false);

      if (socket && sessionId) {
        socket.emit('call_ended', { sessionId: sessionId });
      }
    } catch (error) {
      console.error('[WebRTC] Error endCall', error);
    }
  }, [socket, sessionId]);

  // Update video refs when streams change
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    localVideoRef,
    remoteVideoRef,
    initializeWebRTC,
    startLocalStream,
    createOffer,
    acceptOffer,
    handleAnswer,
    addIceCandidate,
    toggleMute,
    toggleCamera,
    endCall
  };
};

// Export for use in other components
window.useWebRTC = useWebRTC;