// Socket.IO utility for managing connections and events
class SocketManager {
  constructor() {
    this.socket = null;
    this.eventListeners = new Map();
    this.isConnected = false;
  }

  // Initialize socket connection with JWT authentication
  connect(jwtToken = null) {
    if (this.socket) {
      this.disconnect();
    }

    // Connect to Socket.IO server
    this.socket = io({
      auth: {
        token: jwtToken
      }
    });

    // Set up connection event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connection', { status: 'error', error });
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Listen for server events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.eventListeners.delete(event);
    }
  }

  // Clean up all listeners
  cleanup() {
    if (this.socket) {
      this.eventListeners.forEach((listeners, event) => {
        listeners.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.eventListeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  // Join a room (for session-based events)
  joinRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', { roomId });
    }
  }

  // Leave a room
  leaveRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', { roomId });
    }
  }
}

// Create singleton instance
const socketManager = new SocketManager();

// Export for use in components
window.SocketManager = SocketManager;
window.socketManager = socketManager;
