const { useState, useEffect } = React;
const { motion, AnimatePresence } = Motion;

const StaffSelector = ({ onStaffSelected, socket }) => {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Load available staff on component mount
  useEffect(() => {
    loadAvailableStaff();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleStaffListUpdate = (data) => {
      setStaffList(data.staff || []);
    };

    const handleSessionCreated = (data) => {
      console.log('Session created successfully:', data);
      setIsCreatingSession(false);
      if (onStaffSelected) {
        onStaffSelected({
          sessionId: data.sessionId,
          staffId: data.staffId,
          staffName: data.staffName,
          purpose: data.purpose
        });
      }
    };

    const handleSessionError = (data) => {
      console.error('Session creation error:', data);
      setError(data.message || 'Failed to create session');
      setIsCreatingSession(false);
    };

    socket.on('staff-list-updated', handleStaffListUpdate);
    socket.on('session_created', handleSessionCreated);
    socket.on('session_error', handleSessionError);

    return () => {
      socket.off('staff-list-updated', handleStaffListUpdate);
      socket.off('session_created', handleSessionCreated);
      socket.off('session_error', handleSessionError);
    };
  }, [socket, onStaffSelected]);

  const loadAvailableStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get staff list from socket event or API
      // For now, we'll use a mock list - in real implementation, this would come from the server
      const mockStaff = [
        { id: 'ACS', name: 'Prof. Anitha C S', department: 'Computer Science', isAvailable: true },
        { id: 'LDN', name: 'Prof. Lakshmi Durga N', department: 'Computer Science', isAvailable: true },
        { id: 'GD', name: 'Dr. G Dhivyasri', department: 'Computer Science', isAvailable: true },
        { id: 'NSK', name: 'Prof. Nisha S K', department: 'Computer Science', isAvailable: true },
        { id: 'NN', name: 'Dr. Nagashree N', department: 'Computer Science', isAvailable: true },
        { id: 'ABP', name: 'Prof. Amarnath B Patil', department: 'Computer Science', isAvailable: true }
      ];
      
      setStaffList(mockStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
      setError('Failed to load available staff');
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (staff) => {
    if (!staff || !purpose.trim()) {
      setError('Please select a staff member and enter a purpose');
      return;
    }

    try {
      setIsCreatingSession(true);
      setError(null);

      // Get client info from localStorage or context
      const clientId = localStorage.getItem('clientId') || 'demo-client-id';
      
      // Create session via API
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clientToken') || 'demo-token'}`
        },
        body: JSON.stringify({
          clientId,
          staffId: staff.id,
          purpose: purpose.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      
      // Emit socket event to join the session
      socket.emit('create_session', {
        sessionId: data.sessionId,
        clientId: data.clientId,
        staffId: data.staffId,
        purpose: purpose.trim()
      });

      setSelectedStaff(staff);
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error.message || 'Failed to create session');
      setIsCreatingSession(false);
    }
  };

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    setError(null);
  };

  const handleStartConversation = () => {
    if (selectedStaff) {
      createSession(selectedStaff);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading staff...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a Conversation</h3>
        <p className="text-gray-600">Select a staff member to begin a private session</p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Purpose Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What would you like to discuss?
        </label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Describe your inquiry or the help you need..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      {/* Staff List */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Staff Members</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {staffList.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No staff members available</p>
          ) : (
            staffList.map((staff) => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedStaff?.id === staff.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleStaffClick(staff)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    staff.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-sm text-gray-600">{staff.department}</p>
                  </div>
                  {selectedStaff?.id === staff.id && (
                    <div className="text-blue-500">✓</div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartConversation}
          disabled={!selectedStaff || !purpose.trim() || isCreatingSession}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedStaff && purpose.trim() && !isCreatingSession
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isCreatingSession ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Session...</span>
            </div>
          ) : (
            'Start Conversation'
          )}
        </motion.button>
      </div>

      {/* Selected Staff Info */}
      {selectedStaff && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedStaff.name} ({selectedStaff.department})
          </p>
          <p className="text-sm text-blue-600 mt-1">
            <strong>Purpose:</strong> {purpose}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Export for use in other components
window.StaffSelector = StaffSelector;
