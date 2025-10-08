const { useState, useEffect } = React;
const { motion, AnimatePresence } = Motion;

const FloatingNotification = ({ call, onAccept, onDecline, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 30 seconds if not answered
    const timer = setTimeout(() => {
      handleDismiss();
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    onAccept(call);
    handleDismiss();
  };

  const handleDecline = () => {
    onDecline(call);
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(call.id);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 400, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className="fixed top-4 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Incoming Call</h3>
                  <p className="text-blue-100 text-xs">Tap to answer</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Caller Info */}
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold text-lg">
                  {call.callerName ? call.callerName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-base">
                  {call.callerName || 'Unknown Caller'}
                </h4>
                <p className="text-gray-500 text-sm">
                  {call.callType === 'video' ? 'Video Call' : 'Voice Call'}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date(call.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4">
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDecline}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Decline</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAccept}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Accept</span>
              </motion.button>
            </div>
          </div>

          {/* Pulse animation for incoming call */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Notification Manager Component
const NotificationManager = ({ notifications, onAccept, onDecline, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((call, index) => (
        <motion.div
          key={call.id}
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{ transform: `translateY(${index * 20}px)` }}
        >
          <FloatingNotification
            call={call}
            onAccept={onAccept}
            onDecline={onDecline}
            onDismiss={onDismiss}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Export components
window.FloatingNotification = FloatingNotification;
window.NotificationManager = NotificationManager;
