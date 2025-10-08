const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = Motion;

const SessionManager = ({ staffId, staffName, socket }) => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const messagesEndRef = useRef(null);
  const webrtcManagerRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages, selectedSession]);

  // Load active sessions on component mount
  useEffect(() => {
    loadActiveSessions();
  }, [staffId]);

  // Initialize WebRTC Manager
  useEffect(() => {
    if (selectedSession && socket) {
      webrtcManagerRef.current = new SessionWebRTCManager(selectedSession.sessionId, socket, handleCallStateChange);
    }
  }, [selectedSession, socket]);

  // Handle call state changes
  const handleCallStateChange = (callState) => {
    setActiveCall(callState);
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleSessionCreated = (data) => {
      console.log('Session created:', data);
      loadActiveSessions(); // Refresh sessions list
    };

    const handleSessionMessage = (data) => {
      console.log('Session message received:', data);
      setSessionMessages(prev => ({
        ...prev,
        [data.sessionId]: [
          ...(prev[data.sessionId] || []),
          {
            id: Date.now() + Math.random(),
            message: data.message,
            senderName: data.senderName,
            senderRole: data.senderRole,
            timestamp: new Date(data.timestamp),
            messageType: data.messageType || 'text'
          }
        ]
      }));
    };

    const handleSessionCallNotification = (data) => {
      console.log('Session call notification:', data);
      setIncomingCall(data);
    };

    const handleSessionCallAccepted = (data) => {
      console.log('Session call accepted:', data);
      setIncomingCall(null);
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.acceptCall();
      }
    };

    const handleSessionCallDeclined = (data) => {
      console.log('Session call declined:', data);
      setIncomingCall(null);
    };

    const handleSessionCallEnded = (data) => {
      console.log('Session call ended:', data);
      setIncomingCall(null);
      setActiveCall(null);
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.endCall();
      }
    };

    const handleSessionEnded = (data) => {
      console.log('Session ended:', data);
      setActiveSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
      if (selectedSession?.sessionId === data.sessionId) {
        setSelectedSession(null);
        setActiveCall(null);
        setIncomingCall(null);
      }
    };

    socket.on('session_created', handleSessionCreated);
    socket.on('session_message_received', handleSessionMessage);
    socket.on('session_call_notification', handleSessionCallNotification);
    socket.on('session_call_accepted', handleSessionCallAccepted);
    socket.on('session_call_declined', handleSessionCallDeclined);
    socket.on('session_call_ended', handleSessionCallEnded);
    socket.on('session_ended', handleSessionEnded);

    return () => {
      socket.off('session_created', handleSessionCreated);
      socket.off('session_message_received', handleSessionMessage);
      socket.off('session_call_notification', handleSessionCallNotification);
      socket.off('session_call_accepted', handleSessionCallAccepted);
      socket.off('session_call_declined', handleSessionCallDeclined);
      socket.off('session_call_ended', handleSessionCallEnded);
      socket.off('session_ended', handleSessionEnded);
    };
  }, [socket]);

  const loadActiveSessions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`/api/sessions/${staffId}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      setActiveSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async (sessionId) => {
    try {
      socket.emit('join_session', { sessionId });
      setSelectedSession(activeSessions.find(s => s.sessionId === sessionId));
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join session');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    try {
      socket.emit('session_message', {
        sessionId: selectedSession.sessionId,
        message: newMessage.trim(),
        messageType: 'text'
      });

      // Add message to local state immediately for better UX
      const message = {
        id: Date.now() + Math.random(),
        message: newMessage.trim(),
        senderName: staffName,
        senderRole: 'staff',
        timestamp: new Date(),
        messageType: 'text'
      };

      setSessionMessages(prev => ({
        ...prev,
        [selectedSession.sessionId]: [
          ...(prev[selectedSession.sessionId] || []),
          message
        ]
      }));

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const initiateCall = async (sessionId) => {
    try {
      socket.emit('session_call_initiated', {
        sessionId,
        callType: 'video'
      });
      
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.initiateCall();
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      setError('Failed to initiate call');
    }
  };

  const acceptCall = () => {
    if (incomingCall && webrtcManagerRef.current) {
      webrtcManagerRef.current.acceptCall();
      socket.emit('session_call_accepted', { sessionId: incomingCall.sessionId });
    }
  };

  const declineCall = () => {
    if (incomingCall) {
      socket.emit('session_call_declined', { sessionId: incomingCall.sessionId });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.endCall();
    }
    setActiveCall(null);
  };

  const endSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      socket.emit('session_ended', { sessionId });
      setActiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (selectedSession?.sessionId === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    }
  };

  const showCallNotification = (data) => {
    // This will integrate with the existing call notification system
    console.log('Call notification for session:', data);
    // TODO: Integrate with existing FloatingNotification component
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Call Notification */}
      {incomingCall && (
        <SessionCallNotification
          isVisible={true}
          callerName={incomingCall.callerName}
          callerRole={incomingCall.callerRole}
          sessionId={incomingCall.sessionId}
          callType={incomingCall.callType}
          onAccept={acceptCall}
          onDecline={declineCall}
          onDismiss={() => setIncomingCall(null)}
        />
      )}

      {/* Active Video Call */}
      {activeCall && activeCall.isActive && (
        <SessionVideoCall
          isActive={activeCall.isActive}
          sessionId={activeCall.sessionId}
          localStream={activeCall.localStream}
          remoteStream={activeCall.remoteStream}
          onEndCall={endCall}
          onMuteToggle={(isMuted) => webrtcManagerRef.current?.toggleMute()}
          onCameraToggle={(isCameraOff) => webrtcManagerRef.current?.toggleCamera()}
          onScreenShare={(isScreenSharing) => webrtcManagerRef.current?.toggleScreenShare()}
        />
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
        <p className="text-sm text-gray-600">Manage your private conversations</p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1 text-xs text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sessions List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">Sessions ({activeSessions.length})</h4>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeSessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No active sessions</p>
                <p className="text-xs mt-1">Clients will appear here when they start conversations</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {activeSessions.map((session) => (
                  <motion.div
                    key={session.sessionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSession?.sessionId === session.sessionId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => joinSession(session.sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.clientName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session.purpose}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {session.messageCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {session.messageCount}
                          </span>
                        )}
                        {session.callCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {session.callCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(session.lastActivity)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedSession.clientName}</h4>
                    <p className="text-sm text-gray-600">{selectedSession.purpose}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => initiateCall(selectedSession.sessionId)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={() => endSession(selectedSession.sessionId)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      End Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sessionMessages[selectedSession.sessionId]?.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.senderRole === 'staff' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.senderRole === 'staff'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderRole === 'staff' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg font-medium">Select a session to start chatting</p>
                <p className="text-sm">Choose a conversation from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export for use in other components
window.SessionManager = SessionManager;
