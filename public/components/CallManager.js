const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = Motion;

const CallManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();
    const socket = socketRef.current;

    // Listen for incoming calls
    socket.on('call_initiated', (callData) => {
      console.log('Incoming call:', callData);
      addNotification(callData);
    });

    // Listen for call accepted
    socket.on('call_accepted', (callData) => {
      console.log('Call accepted:', callData);
      removeNotification(callData.id);
      setActiveCall(callData);
      setIsInCall(true);
    });

    // Listen for call declined
    socket.on('call_declined', (callData) => {
      console.log('Call declined:', callData);
      removeNotification(callData.id);
    });

    // Listen for call ended
    socket.on('call_ended', (callData) => {
      console.log('Call ended:', callData);
      setActiveCall(null);
      setIsInCall(false);
      addToCallHistory(callData);
    });

    // Listen for call offer (WebRTC signaling)
    socket.on('call_offer', async (data) => {
      if (activeCall && data.callId === activeCall.id) {
        await handleCallOffer(data.offer);
      }
    });

    // Listen for ICE candidates
    socket.on('ice_candidate', async (data) => {
      if (activeCall && data.callId === activeCall.id && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    });

    // Load call history
    loadCallHistory();

    return () => {
      socket.disconnect();
    };
  }, [activeCall]);

  const addNotification = (callData) => {
    const notification = {
      id: callData.id || Date.now().toString(),
      callerName: callData.callerName || 'Unknown Caller',
      callType: callData.callType || 'video',
      timestamp: callData.timestamp || new Date().toISOString(),
      callerId: callData.callerId,
      ...callData
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (callId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== callId));
  };

  const addToCallHistory = (callData) => {
    const historyItem = {
      id: callData.id || Date.now().toString(),
      callerName: callData.callerName || 'Unknown Caller',
      callType: callData.callType || 'video',
      status: 'completed',
      duration: callData.duration || 0,
      timestamp: callData.timestamp || new Date().toISOString(),
      endTime: new Date().toISOString()
    };
    
    setCallHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 calls
  };

  const loadCallHistory = async () => {
    try {
      const response = await fetch('/api/calls', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.calls || []);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const handleAcceptCall = (call) => {
    console.log('Accepting call:', call);
    
    // Emit call accepted event
    socketRef.current.emit('call_accepted', {
      callId: call.id,
      receiverId: getCurrentUserId(),
      timestamp: new Date().toISOString()
    });

    // Update call status in database
    updateCallStatus(call.id, 'accepted');

    // Hide the no active call message
    const noActiveCall = document.getElementById('noActiveCall');
    if (noActiveCall) {
      noActiveCall.style.display = 'none';
    }

    // Render video call container
    renderVideoCallContainer(call);
  };

  const handleDeclineCall = (call) => {
    console.log('Declining call:', call);
    
    // Emit call declined event
    socketRef.current.emit('call_declined', {
      callId: call.id,
      receiverId: getCurrentUserId(),
      timestamp: new Date().toISOString()
    });

    // Update call status in database
    updateCallStatus(call.id, 'declined');
  };

  const handleDismissNotification = (callId) => {
    removeNotification(callId);
  };

  const handleEndCall = () => {
    if (activeCall) {
      // Emit call ended event
      socketRef.current.emit('call_ended', {
        callId: activeCall.id,
        timestamp: new Date().toISOString()
      });

      // Update call status in database
      updateCallStatus(activeCall.id, 'ended');
    }
    
    // Show the no active call message
    const noActiveCall = document.getElementById('noActiveCall');
    if (noActiveCall) {
      noActiveCall.style.display = 'block';
    }

    // Clear video call container
    const videoCallContainer = document.getElementById('videoCallContainer');
    if (videoCallContainer) {
      videoCallContainer.innerHTML = '';
    }
    
    setActiveCall(null);
    setIsInCall(false);
  };

  const renderVideoCallContainer = (call) => {
    const videoCallContainer = document.getElementById('videoCallContainer');
    if (videoCallContainer) {
      ReactDOM.render(
        React.createElement(VideoCallContainer, {
          call: call,
          onEndCall: handleEndCall,
          isActive: true
        }),
        videoCallContainer
      );
    }
  };

  const updateCallStatus = async (callId, status) => {
    try {
      await fetch(`/api/calls/${callId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  };

  const getCurrentUserId = () => {
    const userData = localStorage.getItem('staffData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.id || parsed._id;
    }
    return null;
  };

  const handleCallOffer = async (offer) => {
    // This would be implemented for WebRTC peer connection
    console.log('Handling call offer:', offer);
  };

  return (
    <>
      {/* Floating Notifications */}
      <NotificationManager
        notifications={notifications}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        onDismiss={handleDismissNotification}
      />

      {/* Video Call Container - will be rendered in Call Updates section */}
      {isInCall && activeCall && (
        <VideoCallContainer
          call={activeCall}
          onEndCall={handleEndCall}
          isActive={isInCall}
        />
      )}
    </>
  );
};

// Export component
window.CallManager = CallManager;
