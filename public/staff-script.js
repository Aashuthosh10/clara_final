// Staff Dashboard JavaScript
class StaffDashboard {
    constructor() {
        this.socket = io();
        this.currentUser = null;
        this.currentCall = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isMuted = false;
        this.isVideoOff = false;
        
        this.initializeElements();
        this.bindEvents();
        this.setupSocketListeners();
    }

    initializeElements() {
        // Login elements
        this.loginSection = document.getElementById('loginSection');
        this.dashboardSection = document.getElementById('dashboardSection');
        this.loginForm = document.getElementById('loginForm');
        this.loginError = document.getElementById('loginError');
        
        // Dashboard elements
        this.staffInfo = document.getElementById('staffInfo');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.waitingCount = document.getElementById('waitingCount');
        this.callQueue = document.getElementById('callQueue');
        this.callHistory = document.getElementById('callHistory');
        
        // Video elements
        this.videoContainer = document.getElementById('videoContainer');
        this.localVideo = document.getElementById('localVideo');
        this.remoteVideo = document.getElementById('remoteVideo');
        this.callControls = document.getElementById('callControls');
        this.callDecision = document.getElementById('callDecision');
        
        // Control buttons
        this.muteBtn = document.getElementById('muteBtn');
        this.videoBtn = document.getElementById('videoBtn');
        this.endCallBtn = document.getElementById('endCallBtn');
        this.acceptBtn = document.getElementById('acceptBtn');
        this.rejectBtn = document.getElementById('rejectBtn');
        this.callNotes = document.getElementById('callNotes');
        
        // Timetable elements
        this.addTimeSlotBtn = document.getElementById('addTimeSlotBtn');
        this.refreshTimetableBtn = document.getElementById('refreshTimetableBtn');
        this.timetableModal = document.getElementById('timetableModal');
        this.timeSlotForm = document.getElementById('timeSlotForm');
        this.weeklyTimetableContainer = document.getElementById('weeklyTimetableContainer');
        this.academicYear = document.getElementById('academicYear');
        this.semester = document.getElementById('semester');
    }

    bindEvents() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Call controls
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.videoBtn.addEventListener('click', () => this.toggleVideo());
        this.endCallBtn.addEventListener('click', () => this.endCall());
        
        // Decision buttons
        this.acceptBtn.addEventListener('click', () => this.makeDecision('accepted'));
        this.rejectBtn.addEventListener('click', () => this.makeDecision('rejected'));
        
        // Timetable controls
        this.addTimeSlotBtn.addEventListener('click', () => this.openTimetableModal());
        this.refreshTimetableBtn.addEventListener('click', () => this.refreshTimetable());
        this.timeSlotForm.addEventListener('submit', (e) => this.handleTimeSlotSubmit(e));
        
        // Modal close events
        const closeBtn = this.timetableModal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelSlotBtn');
        closeBtn.addEventListener('click', () => this.closeTimetableModal());
        cancelBtn.addEventListener('click', () => this.closeTimetableModal());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.timetableModal) {
                this.closeTimetableModal();
            }
        });
        
        // Timetable tab functionality
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTimetableTab(btn));
        });
    }

    setupSocketListeners() {
        // Login responses
        this.socket.on('staff-login-success', (data) => this.handleLoginSuccess(data));
        this.socket.on('login-error', (data) => this.handleLoginError(data));
        
        // Call management
        this.socket.on('new-call-request', (data) => this.handleNewCall(data));
        this.socket.on('call-started', (data) => this.handleCallStarted(data));
        this.socket.on('call-completed', (data) => this.handleCallCompleted(data));
        
        // Video call signaling
        this.socket.on('offer', (data) => this.handleOffer(data));
        this.socket.on('answer', (data) => this.handleAnswer(data));
        this.socket.on('ice-candidate', (data) => this.handleIceCandidate(data));
        
        // WebRTC signaling events
        this.socket.on('call_offer', (data) => this.handleOffer(data));
        this.socket.on('call_answer', (data) => this.handleAnswer(data));
        this.socket.on('ice_candidate', (data) => this.handleIceCandidate(data));
        
        // Decision responses
        this.socket.on('decision-saved', (data) => this.handleDecisionSaved(data));
        
        // Initial waiting calls count
        this.socket.on('waiting-calls', (data) => {
            if (this.waitingCount) {
                this.waitingCount.textContent = data.count ?? 0;
            }
        });

        // Error handling
        this.socket.on('error', (data) => this.showNotification(data.message, 'error'));

        // Targeted video call request for this staff
        this.socket.on('video-call-request', (req) => {
            // Show ringing alert and push to queue
            try {
                const audio = new Audio('/ringtone.mp3');
                audio.play().catch(() => {});
            } catch (_) {}
            this.showNotification(req.message || `Incoming video call from ${req.clientName}`, 'success');
            this.addCallToQueue({
                callId: req.requestId,
                clientName: req.clientName || 'Client',
                purpose: `Video call request for you`,
                timestamp: req.requestTime || Date.now()
            });
            this.addLiveCallRequest(req);
            this.updateWaitingCount();
        });

        // Staff accepts targeted video call request
        this.socket.on('call-started', (data) => this.handleCallStarted(data));

        // Handle call ended by client
        this.socket.on('call-ended-by-client', (data) => {
            console.log('📞 Call ended by client:', data);
            this.showNotification(`📞 ${data.message}`, 'info');
            this.endVideoCall();
        });

        // Handle call ended by staff
        this.socket.on('call-ended-by-staff', (data) => {
            console.log('📞 Call ended by staff:', data);
            this.showNotification(`📞 ${data.message}`, 'info');
            this.endVideoCall();
        });

        // Handle WebRTC call offer from client
        this.socket.on('call_offer', (data) => {
            console.log('📞 Received call offer from client:', data);
            if (data.callId === this.currentCall?.id) {
                this.handleOffer(data);
            }
        });

        // Handle WebRTC call answer from client
        this.socket.on('call_answer', (data) => {
            console.log('📞 Received call answer from client:', data);
            if (data.callId === this.currentCall?.id) {
                this.handleAnswer(data);
            }
        });

        // Handle ICE candidates from client
        this.socket.on('ice_candidate', (data) => {
            console.log('📞 Received ICE candidate from client:', data);
            if (data.callId === this.currentCall?.id) {
                this.handleIceCandidate(data);
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(this.loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        this.socket.emit('staff-login', { email, password });
    }

    handleLoginSuccess(data) {
        // Support both previous { user } and current { staff } payloads
        this.currentUser = data.user || data.staff || null;
        if (data.token) {
            try {
                localStorage.setItem('token', data.token);
            } catch (_) {}
        }
        this.loginSection.style.display = 'none';
        this.dashboardSection.style.display = 'block';
        if (this.currentUser) {
            this.staffInfo.textContent = `${this.currentUser.name} - ${this.currentUser.department || ''}`;
        }
        
        this.showNotification('Login successful!', 'success');
        this.loadCallHistory();
    }

    handleLoginError(data) {
        this.loginError.textContent = data.message;
        this.loginError.style.display = 'block';
    }

    handleLogout() {
        this.currentUser = null;
        try {
            localStorage.removeItem('token');
        } catch (_) {}
        this.dashboardSection.style.display = 'none';
        this.loginSection.style.display = 'flex';
        this.loginForm.reset();
        this.loginError.style.display = 'none';
        
        if (this.currentCall) {
            this.endCall();
        }
    }

    handleNewCall(data) {
        this.showNotification(`New call from ${data.clientName}`, 'success');
        this.addCallToQueue(data);
        this.updateWaitingCount();
    }

    addCallToQueue(callData) {
        const callItem = document.createElement('div');
        callItem.className = 'call-item';
        callItem.innerHTML = `
            <h3>${callData.clientName}</h3>
            <p>${callData.purpose}</p>
            <div class="time">${new Date(callData.timestamp).toLocaleTimeString()}</div>
            <button class="accept-call-btn" onclick="staffDashboard.acceptCall('${callData.callId}')">
                Accept Call
            </button>
        `;
        
        this.callQueue.appendChild(callItem);
    }

    addLiveCallRequest(req) {
        const panel = document.getElementById('callsRequestList');
        if (!panel) return;
        // Clear empty state
        const empty = panel.querySelector('.empty-state');
        if (empty) empty.remove();
        
        const item = document.createElement('div');
        item.className = 'call-item live';
        item.innerHTML = `
            <h3>${req.clientName || 'Client'}</h3>
            <p>${req.message || 'Incoming video call request'}</p>
            <div class="time">${new Date(req.requestTime || Date.now()).toLocaleTimeString()}</div>
            <button class="accept-call-btn" onclick="staffDashboard.acceptCall('${req.requestId}')">Answer</button>
        `;
        panel.prepend(item);
    }

    async acceptCall(callId) {
        try {
            console.log('🎥 Staff accepting call:', callId);
            
            // If this is a targeted video call request id, respond accordingly
            if (String(callId).startsWith('vcr_')) {
                this.socket.emit('webrtc-call-response', { 
                    callId: callId, 
                    accepted: true, 
                    staffEmail: this.currentUser?.email || this.currentUser?.name 
                });
            } else {
                this.socket.emit('accept-call', { callId });
            }
            this.currentCall = { id: callId };
            
            // Initialize video call immediately
            await this.initializeVideoCall();
            
            this.showNotification('Call accepted!', 'success');
        } catch (error) {
            console.error('❌ Error accepting call:', error);
            this.showNotification('Failed to accept call', 'error');
        }
    }

    async initializeVideoCall() {
        try {
            console.log('🎥 Initializing GMeet-style video call for staff');
            
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }
            
            // Get user media with enhanced constraints
            console.log('🎥 Requesting camera and microphone access...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            console.log('✅ Got local stream:', this.localStream);
            console.log('🎥 Video tracks:', this.localStream.getVideoTracks().length);
            console.log('🎤 Audio tracks:', this.localStream.getAudioTracks().length);
            
            // Show video call interface
            this.showVideoCallInterface();
            
            // Configure video elements
            this.configureVideoElements();
            
            // Update local video
            this.updateLocalVideo();
            
            // Setup peer connection
            this.initializePeerConnection(this.localStream);
            
            // Initialize call controls
            this.initializeCallControls();
            
            // Hide connecting overlay after a delay
            setTimeout(() => {
                const overlay = document.getElementById('connectingOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error initializing video call:', error);
            this.showNotification(`Failed to initialize video call: ${error.message}`, 'error');
        }
    }

    // Show GMeet-style video call interface
    showVideoCallInterface() {
        console.log('🎥 Showing GMeet-style video call interface for staff');
        
        // Hide any old video call interfaces
        const oldVideoDisplay = document.getElementById('videoCallDisplay');
        if (oldVideoDisplay) {
            oldVideoDisplay.style.display = 'none';
            console.log('🛑 Hidden old video call interface');
        }
        
        // Show the GMeet-style interface
        const videoInterface = document.getElementById('videoCallInterface');
        if (videoInterface) {
            videoInterface.style.display = 'block';
            console.log('✅ Showing GMeet-style video call interface');
        } else {
            console.error('❌ GMeet-style video call interface not found');
        }
    }

    // Configure video elements for optimal rendering
    configureVideoElements() {
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        
        if (localVideo) {
            localVideo.setAttribute('playsinline', 'true');
            localVideo.setAttribute('autoplay', 'true');
            localVideo.setAttribute('muted', 'true');
            localVideo.style.objectFit = 'cover';
            console.log('✅ Local video element configured');
        }
        
        if (remoteVideo) {
            remoteVideo.setAttribute('playsinline', 'true');
            remoteVideo.setAttribute('autoplay', 'true');
            remoteVideo.style.objectFit = 'cover';
            console.log('✅ Remote video element configured');
        }
    }

    // Update local video stream
    updateLocalVideo() {
        const localVideo = document.getElementById('localVideo');
        
        if (localVideo && this.localStream) {
            console.log('🎥 Updating local video stream for staff');
            console.log('🎥 Local stream tracks:', this.localStream.getTracks());
            
            localVideo.srcObject = this.localStream;
            
            // Ensure video plays
            localVideo.play().then(() => {
                console.log('✅ Local video playing for staff');
                
                // Hide local placeholder when video starts
                const localPlaceholder = document.getElementById('localPlaceholder');
                if (localPlaceholder) {
                    localPlaceholder.style.display = 'none';
                    console.log('✅ Local placeholder hidden');
                }
                
                // Update call status
                this.updateCallStatus('Local video active');
            }).catch(error => {
                console.warn('⚠️ Local video play failed:', error);
                this.updateCallStatus('Local video failed to play');
            });
        } else {
            console.warn('⚠️ Local video element or stream not available');
            console.log('🎥 Local video element:', localVideo);
            console.log('🎥 Local stream:', this.localStream);
        }
    }

    // Update remote video stream
    updateRemoteVideo() {
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo && this.remoteStream) {
            console.log('🎥 Updating remote video stream for staff');
            remoteVideo.srcObject = this.remoteStream;
            remoteVideo.play().then(() => {
                console.log('✅ Remote video playing for staff');
                this.updateCallStatus('Connected - Video call active');
                
                // Hide remote placeholder
                const remotePlaceholder = document.getElementById('remotePlaceholder');
                if (remotePlaceholder) {
                    remotePlaceholder.style.display = 'none';
                }
                
                // Hide connecting overlay
                const connectingOverlay = document.getElementById('connectingOverlay');
                if (connectingOverlay) {
                    connectingOverlay.style.display = 'none';
                }
            }).catch(error => {
                console.warn('⚠️ Remote video play failed:', error);
                this.updateCallStatus('Video connection issue');
            });
        }
    }

    // Initialize peer connection with enhanced WebRTC handling
    initializePeerConnection(localStream) {
        try {
            console.log('🔗 Initializing WebRTC peer connection for staff...');
            
            // Create peer connection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            // Add local stream
            localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, localStream);
            });
            
            // Handle remote stream - ENHANCED for two-way video
            this.peerConnection.ontrack = (event) => {
                console.log('📺 Remote stream received by staff:', event);
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo && event.streams[0]) {
                    this.remoteStream = event.streams[0];
                    remoteVideo.srcObject = this.remoteStream;
                    
                    // Ensure remote video plays
                    remoteVideo.play().then(() => {
                        console.log('✅ Remote video playing successfully for staff');
                        this.updateCallStatus('Connected - Video call active');
                        this.updateRemoteVideo();
                        
                        // Hide remote placeholder
                        const remotePlaceholder = document.getElementById('remotePlaceholder');
                        if (remotePlaceholder) {
                            remotePlaceholder.style.display = 'none';
                        }
                        
                        // Hide connecting overlay
                        const connectingOverlay = document.getElementById('connectingOverlay');
                        if (connectingOverlay) {
                            connectingOverlay.style.display = 'none';
                        }
                    }).catch(error => {
                        console.warn('⚠️ Remote video play failed for staff:', error);
                        this.updateCallStatus('Video connection issue');
                    });
                }
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice_candidate', {
                        callId: this.currentCall?.id || `call_${Date.now()}`,
                        candidate: event.candidate
                    });
                }
            };
            
            console.log('✅ Peer connection initialized for staff');
            
        } catch (error) {
            console.error('❌ Error initializing peer connection for staff:', error);
        }
    }

    // Update call status display
    updateCallStatus(status) {
        const statusElement = document.getElementById('callStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
        console.log('📞 Call status (staff):', status);
    }

    // Initialize call controls
    initializeCallControls() {
        console.log('🎛️ Initializing call controls for staff');
        
        // Set initial states
        this.isMuted = false;
        this.isVideoEnabled = true;
        
        // Update button states
        this.updateControlButtons();
    }

    // Update control button states
    updateControlButtons() {
        const muteBtn = document.getElementById('muteBtn');
        const videoBtn = document.getElementById('videoBtn');
        
        if (muteBtn) {
            muteBtn.innerHTML = this.isMuted ? 
                '<span class="btn-icon">🔇</span><span class="btn-label">Unmute</span>' :
                '<span class="btn-icon">🎤</span><span class="btn-label">Mute</span>';
            muteBtn.className = `control-btn mute-btn ${this.isMuted ? 'muted' : ''}`;
        }
        
        if (videoBtn) {
            videoBtn.innerHTML = this.isVideoEnabled ? 
                '<span class="btn-icon">🎥</span><span class="btn-label">Video</span>' :
                '<span class="btn-icon">📹</span><span class="btn-label">Enable</span>';
            videoBtn.className = `control-btn video-btn ${!this.isVideoEnabled ? 'disabled' : ''}`;
        }
    }

    // Create and send offer to client
    async createOffer() {
        try {
            console.log('🎥 Creating offer from staff side...');
            if (this.peerConnection) {
                const offer = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(offer);
                
                console.log('✅ Offer created, sending to client...');
                this.socket.emit('call_offer', {
                    callId: this.currentCall?.id || `call_${Date.now()}`,
                    offer: offer
                });
            }
        } catch (error) {
            console.error('❌ Error creating offer:', error);
        }
    }

    handleCallStarted(data) {
        this.currentCall = data;
        this.showNotification('Call started!', 'success');
    }

    handleOffer(data) {
        console.log('🎥 Handling WebRTC offer:', data);
        if (this.peerConnection) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => {
                    console.log('✅ Remote description set, creating answer...');
                    return this.peerConnection.createAnswer();
                })
                .then(answer => {
                    console.log('✅ Answer created, setting local description...');
                    return this.peerConnection.setLocalDescription(answer);
                })
                .then(() => {
                    console.log('✅ Local description set, sending answer to client...');
                    this.socket.emit('call_answer', {
                        callId: data.callId || (this.currentCall && this.currentCall.id),
                        answer: this.peerConnection.localDescription
                    });
                })
                .catch(error => {
                    console.error('❌ Error handling offer:', error);
                });
        } else {
            console.warn('⚠️ No peer connection available to handle offer');
        }
    }

    handleAnswer(data) {
        console.log('🎥 Handling WebRTC answer:', data);
        if (this.peerConnection) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
                .then(() => {
                    console.log('✅ Remote description set from answer');
                })
                .catch(error => {
                    console.error('❌ Error handling answer:', error);
                });
        } else {
            console.warn('⚠️ No peer connection available to handle answer');
        }
    }

    handleIceCandidate(data) {
        console.log('🎥 Handling ICE candidate:', data);
        if (this.peerConnection && data.candidate) {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                .then(() => {
                    console.log('✅ ICE candidate added successfully');
                })
                .catch(error => {
                    console.error('❌ Error adding ICE candidate:', error);
                });
        } else {
            console.warn('⚠️ No peer connection available to handle ICE candidate');
        }
    }

    toggleMute() {
        console.log('🎤 Staff toggling mute');
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isMuted = !audioTrack.enabled;
                this.updateControlButtons();
                console.log(this.isMuted ? '🔇 Staff audio muted' : '🎤 Staff audio unmuted');
            } else {
                console.warn('⚠️ No audio track found in local stream');
            }
        } else {
            console.warn('⚠️ No local stream available for mute toggle');
        }
    }

    toggleVideo() {
        console.log('🎥 Staff toggling video');
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoEnabled = videoTrack.enabled;
                this.updateControlButtons();
                console.log(this.isVideoEnabled ? '🎥 Staff video enabled' : '📹 Staff video disabled');
            } else {
                console.warn('⚠️ No video track found in local stream');
            }
        } else {
            console.warn('⚠️ No local stream available for video toggle');
        }
    }

    endCall() {
        if (this.currentCall) {
            this.socket.emit('end-call', { callId: this.currentCall.id });
            this.cleanupCall();
        }
    }

    // End video call with synchronized termination
    endVideoCall() {
        console.log('📞 Ending video call (staff)');
        
        // Stop local stream
        if (this.localStream) {
            console.log('🛑 Stopping local stream tracks');
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`🛑 Stopped track: ${track.kind}`);
            });
        }
        
        // Close peer connection
        if (this.peerConnection) {
            console.log('🛑 Closing peer connection');
            this.peerConnection.close();
        }
        
        // Remove video interface
        const videoInterface = document.getElementById('videoCallInterface');
        if (videoInterface) {
            videoInterface.style.display = 'none';
            console.log('🛑 Video interface hidden');
        }
        
        // Also hide old video call interface
        const oldVideoDisplay = document.getElementById('videoCallDisplay');
        if (oldVideoDisplay) {
            oldVideoDisplay.style.display = 'none';
            console.log('🛑 Old video call interface hidden');
        }
        
        // Reset states
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        
        // Notify server about call end
        if (this.socket && this.currentCall?.id) {
            this.socket.emit('call-ended-by-staff', {
                callId: this.currentCall.id
            });
            console.log('📡 Notified server about call end');
        }
        
        // Reset current call
        this.currentCall = null;
        
        this.showNotification('Video call ended', 'info');
        console.log('✅ Video call ended successfully (staff)');
    }

    cleanupCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        // Hide video interface
        const videoInterface = document.getElementById('videoCallInterface');
        if (videoInterface) {
            videoInterface.style.display = 'none';
        }
        
        // Also hide old video call interface
        const oldVideoDisplay = document.getElementById('videoCallDisplay');
        if (oldVideoDisplay) {
            oldVideoDisplay.style.display = 'none';
        }
        
        // Clear current call
        this.currentCall = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
    }

    makeDecision(decision) {
        if (!this.currentCall) return;
        
        const notes = this.callNotes.value;
        this.socket.emit('call-decision', {
            callId: this.currentCall.id,
            decision,
            notes
        });
        
        this.showNotification(`Decision: ${decision}`, 'success');
        this.cleanupCall();
    }

    handleDecisionSaved(data) {
        this.showNotification(`Call decision saved: ${data.decision}`, 'success');
        this.loadCallHistory();
    }

    handleCallCompleted(data) {
        this.showNotification(`Call completed. Decision: ${data.decision}`, 'success');
        this.cleanupCall();
    }

    async loadCallHistory() {
        try {
            // Check if callHistory element exists
            if (!this.callHistory) {
                console.warn('Call history element not found, skipping call history load');
                return;
            }

            const response = await fetch('/api/calls/my-calls', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const calls = await response.json();
                this.displayCallHistory(calls);
            }
        } catch (error) {
            console.error('Error loading call history:', error);
        }
    }

    displayCallHistory(calls) {
        // Check if callHistory element exists
        if (!this.callHistory) {
            console.warn('Call history element not found, cannot display call history');
            return;
        }

        this.callHistory.innerHTML = '';
        
        if (calls.length === 0) {
            this.callHistory.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No call history</p>
                </div>
            `;
            return;
        }
        
        calls.forEach(call => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${call.decision === 'rejected' ? 'rejected' : ''}`;
            historyItem.innerHTML = `
                <h3>${call.clientId.name}</h3>
                <p>${call.purpose}</p>
                <div class="meta">
                    <span>${new Date(call.createdAt).toLocaleDateString()}</span>
                    <span class="decision-badge ${call.decision}">${call.decision}</span>
                </div>
            `;
            this.callHistory.appendChild(historyItem);
        });
    }

    updateWaitingCount() {
        const count = this.callQueue.children.length;
        this.waitingCount.textContent = count;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notificationContainer');
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // ===== TIMETABLE MANAGEMENT METHODS =====

    /**
     * Open the timetable modal
     */
    openTimetableModal() {
        this.timetableModal.style.display = 'block';
        this.loadCurrentTimetable();
    }

    /**
     * Close the timetable modal
     */
    closeTimetableModal() {
        this.timetableModal.style.display = 'none';
        this.timeSlotForm.reset();
    }

    /**
     * Handle time slot form submission
     */
    async handleTimeSlotSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.timeSlotForm);
        const slotData = {
            day: formData.get('day'),
            type: formData.get('type'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            subject: formData.get('subject'),
            room: formData.get('room'),
            class: formData.get('class')
        };

        try {
            await this.addTimeSlot(slotData);
            this.closeTimetableModal();
            this.showNotification('Time slot added successfully!', 'success');
        } catch (error) {
            this.showNotification(`Failed to add time slot: ${error.message}`, 'error');
        }
    }

    /**
     * Add a new time slot to the timetable
     */
    async addTimeSlot(slotData) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        // Get current timetable
        const currentTimetable = await this.getCurrentTimetable();
        
        // Add new slot to the appropriate day
        let daySchedule = currentTimetable.schedule.find(s => s.day === slotData.day);
        if (!daySchedule) {
            daySchedule = { day: slotData.day, timeSlots: [] };
            currentTimetable.schedule.push(daySchedule);
        }

        // Add the new time slot
        daySchedule.timeSlots.push({
            startTime: slotData.startTime,
            endTime: slotData.endTime,
            subject: slotData.subject,
            room: slotData.room,
            class: slotData.class,
            type: slotData.type
        });

        // Sort time slots by start time
        daySchedule.timeSlots.sort((a, b) => {
            return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
        });

        // Update timetable in database
        await this.updateTimetable(currentTimetable);
        
        // Refresh display
        this.displayTimetable(currentTimetable);
    }

    /**
     * Get current user's timetable
     */
    async getCurrentTimetable() {
        const token = localStorage.getItem('token');
        if (!token) {
            return this.getEmptyTimetable();
        }

        try {
            const response = await fetch('/api/timetable/my-timetable', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.hasTimetable) {
                    return data.timetable;
                }
            }
        } catch (error) {
            console.error('Error fetching timetable:', error);
        }

        return this.getEmptyTimetable();
    }

    /**
     * Get empty timetable structure
     */
    getEmptyTimetable() {
        return {
            schedule: this.days.map(day => ({ day, timeSlots: [] })),
            officeHours: []
        };
    }

    /**
     * Update timetable in database
     */
    async updateTimetable(timetableData) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch('/api/timetable/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(timetableData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update timetable');
        }

        return await response.json();
    }

    /**
     * Load and display current timetable
     */
    async loadCurrentTimetable() {
        try {
            const timetable = await this.getCurrentTimetable();
            this.displayTimetable(timetable);
            
            // Highlight current day by default
            const currentDay = this.getCurrentDay();
            this.highlightSelectedDay(currentDay);
        } catch (error) {
            console.error('Error loading timetable:', error);
            this.showNotification('Failed to load timetable', 'error');
        }
    }

    /**
     * Display timetable in the UI
     */
    displayTimetable(timetable) {
        if (!timetable || !timetable.schedule) {
            this.weeklyTimetableContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No timetable entries yet</p>
                    <p>Click "Add Slot" to create your schedule</p>
                </div>
            `;
            return;
        }

        // Display complete weekly timetable
        this.displayWeeklyTimetable(timetable);
    }

    /**
     * Display complete weekly timetable in tabular format
     */
    displayWeeklyTimetable(timetable) {
        let html = '<div class="weekly-timetable">';
        html += '<h3>Weekly Timetable</h3>';
        html += '<div class="timetable-table">';
        
        // Table header
        html += '<div class="table-header">';
        html += '<div class="time-column">Time</div>';
        this.days.forEach(day => {
            html += `<div class="day-column">${this.capitalizeFirst(day)}</div>`;
        });
        html += '</div>';
        
        // Get all unique time slots across the week
        const allTimeSlots = this.getAllTimeSlots(timetable);
        
        // Create rows for each time slot
        allTimeSlots.forEach(timeSlot => {
            html += '<div class="table-row">';
            html += `<div class="time-column">${timeSlot.startTime} - ${timeSlot.endTime}</div>`;
            
            // For each day, show what's scheduled at this time
            this.days.forEach(day => {
                const daySchedule = timetable.schedule.find(s => s.day === day);
                const slotAtThisTime = daySchedule ? 
                    daySchedule.timeSlots.find(slot => 
                        slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
                    ) : null;
                
                if (slotAtThisTime) {
                    html += `
                        <div class="day-column has-class ${slotAtThisTime.type}">
                            <div class="class-info">
                                <div class="subject">${slotAtThisTime.subject}</div>
                                <div class="room">${slotAtThisTime.room}</div>
                                <div class="class-name">${slotAtThisTime.class}</div>
                                ${slotAtThisTime.note ? `<div class="note">${slotAtThisTime.note}</div>` : ''}
                            </div>
                            <button class="delete-slot-btn" onclick="staffDashboard.deleteTimeSlot('${day}', ${daySchedule.timeSlots.indexOf(slotAtThisTime)})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                } else {
                    html += '<div class="day-column empty-slot">-</div>';
                }
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
        
        this.weeklyTimetableContainer.innerHTML = html;
    }

    /**
     * Get all unique time slots across the week
     */
    getAllTimeSlots(timetable) {
        const timeSlots = new Set();
        
        timetable.schedule.forEach(daySchedule => {
            daySchedule.timeSlots.forEach(slot => {
                timeSlots.add(`${slot.startTime}-${slot.endTime}`);
            });
        });
        
        // Convert to array and sort by start time
        return Array.from(timeSlots)
            .map(timeRange => {
                const [startTime, endTime] = timeRange.split('-');
                return { startTime, endTime };
            })
            .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));
    }

    /**
     * Display schedule for a specific day (kept for backward compatibility)
     */
    displayDaySchedule(timetable, day) {
        const daySchedule = timetable.schedule.find(s => s.day === day);
        
        if (!daySchedule || daySchedule.timeSlots.length === 0) {
            this.timetableContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <p>No classes scheduled for ${this.capitalizeFirst(day)}</p>
                </p>
            `;
            return;
        }

        let html = `<div class="day-schedule">`;
        html += `<h3>${this.capitalizeFirst(day)} Schedule</h3>`;
        
        daySchedule.timeSlots.forEach((slot, index) => {
            html += `
                <div class="time-slot ${slot.type}">
                    <div class="slot-header">
                        <span class="time">${slot.startTime} - ${slot.endTime}</span>
                        <span class="type-badge ${slot.type}">${slot.type}</span>
                    </div>
                    <div class="slot-details">
                        <div class="subject">${slot.subject}</div>
                        <div class="class-room">
                            <span class="class">${slot.class}</span>
                            <span class="room">${slot.room}</span>
                        </div>
                    </div>
                    <button class="delete-slot-btn" onclick="staffDashboard.deleteTimeSlot('${day}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        html += `</div>`;
        this.timetableContent.innerHTML = html;
    }

    /**
     * Display office hours
     */
    displayOfficeHours(officeHours) {
        if (!officeHours || officeHours.length === 0) {
            this.officeHoursList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No office hours set</p>
                </div>
            `;
            return;
        }

        let html = '';
        officeHours.forEach((oh, index) => {
            html += `
                <div class="office-hour-item">
                    <div class="oh-day">${this.capitalizeFirst(oh.day)}</div>
                    <div class="oh-time">${oh.startTime} - ${oh.endTime}</div>
                    <div class="oh-location">${oh.location}</div>
                    <button class="delete-oh-btn" onclick="staffDashboard.deleteOfficeHour(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        this.officeHoursList.innerHTML = html;
    }

    /**
     * Delete a time slot
     */
    async deleteTimeSlot(day, index) {
        if (!confirm('Are you sure you want to delete this time slot?')) {
            return;
        }

        try {
            const timetable = await this.getCurrentTimetable();
            const daySchedule = timetable.schedule.find(s => s.day === day);
            
            if (daySchedule && daySchedule.timeSlots[index]) {
                daySchedule.timeSlots.splice(index, 1);
                await this.updateTimetable(timetable);
                this.displayTimetable(timetable);
                this.showNotification('Time slot deleted successfully!', 'success');
            }
        } catch (error) {
            this.showNotification(`Failed to delete time slot: ${error.message}`, 'error');
        }
    }

    /**
     * Delete office hour
     */
    async deleteOfficeHour(index) {
        if (!confirm('Are you sure you want to delete this office hour?')) {
            return;
        }

        try {
            const timetable = await this.getCurrentTimetable();
            if (timetable.officeHours[index]) {
                timetable.officeHours.splice(index, 1);
                await this.updateTimetable(timetable);
                this.displayTimetable(timetable);
                this.showNotification('Office hour deleted successfully!', 'success');
            }
        } catch (error) {
            this.showNotification(`Failed to delete office hour: ${error.message}`, 'error');
        }
    }

    /**
     * Get current day name
     */
    getCurrentDay() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date().getDay();
        return days[today];
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Convert time to minutes for sorting
     */
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Add days array property
    get days() {
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    }

    /**
     * Switch between timetable tabs
     */
    async switchTimetableTab(clickedTab) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedTab.classList.add('active');
        
        // Get the selected day
        const selectedDay = clickedTab.dataset.day;
        
        // Load and display complete weekly timetable
        try {
            const timetable = await this.getCurrentTimetable();
            this.displayWeeklyTimetable(timetable);
            
            // Highlight the selected day in the table
            this.highlightSelectedDay(selectedDay);
        } catch (error) {
            console.error('Error switching timetable tab:', error);
            this.showNotification('Failed to load timetable for selected day', 'error');
        }
    }

    /**
     * Highlight the selected day in the weekly timetable
     */
    highlightSelectedDay(selectedDay) {
        // Remove previous highlights
        document.querySelectorAll('.day-column').forEach(col => {
            col.classList.remove('selected-day');
        });
        
        // Add highlight to the selected day column
        const dayIndex = this.days.indexOf(selectedDay);
        if (dayIndex !== -1) {
            const dayColumns = document.querySelectorAll(`.table-row .day-column:nth-child(${dayIndex + 2})`);
            dayColumns.forEach(col => {
                col.classList.add('selected-day');
            });
        }
        

    }

    // ===== NEW MANAGEMENT PANEL METHODS =====



    /**
     * Refresh timetable
     */
    async refreshTimetable() {
        try {
            await this.loadCurrentTimetable();
            this.showNotification('Timetable refreshed successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to refresh timetable', 'error');
        }
    }


}

// Initialize the dashboard when the page loads
let staffDashboard;
document.addEventListener('DOMContentLoaded', () => {
    staffDashboard = new StaffDashboard();
});
