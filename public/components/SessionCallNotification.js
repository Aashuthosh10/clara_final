const { useState, useEffect } = React;
const { motion, AnimatePresence } = Motion;

const SessionCallNotification = ({ 
  isVisible, 
  callerName, 
  callerRole, 
  sessionId, 
  callType = 'video',
  onAccept, 
  onDecline,
  onDismiss 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-dismiss after 30 seconds if not answered
      const timer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  const handleAccept = () => {
    setIsAnimating(false);
    if (onAccept) onAccept();
  };

  const handleDecline = () => {
    setIsAnimating(false);
    if (onDecline) onDecline();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">
                    {callType === 'video' ? '📹' : '📞'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
                  <p className="text-blue-100 text-sm">Session Call</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-center mb-4">
                <p className="text-gray-900 font-medium">{callerName}</p>
                <p className="text-sm text-gray-600 capitalize">{callerRole} • Session Call</p>
                <p className="text-xs text-gray-500 mt-1">Session ID: {sessionId?.slice(0, 8)}...</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDecline}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <span>❌</span>
                  <span>Decline</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAccept}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <span>✅</span>
                  <span>Accept</span>
                </motion.button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 30, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export for use in other components
window.SessionCallNotification = SessionCallNotification;
