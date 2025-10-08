const axios = require('axios');

class DailyService {
    constructor() {
        this.apiKey = process.env.DAILY_API_KEY;
        this.domain = process.env.DAILY_DOMAIN || 'rexbot.daily.co';
        this.baseURL = 'https://api.daily.co/v1';
    }

    async createRoom(roomName = null) {
        try {
            const response = await axios.post(`${this.baseURL}/rooms`, {
                name: roomName || `room_${Date.now()}`,
                privacy: 'public',
                properties: {
                    max_participants: 2,
                    enable_screenshare: true,
                    enable_chat: true,
                    enable_recording: 'cloud',
                    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Daily room:', error);
            throw error;
        }
    }

    async getRoom(roomName) {
        try {
            const response = await axios.get(`${this.baseURL}/rooms/${roomName}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting Daily room:', error);
            throw error;
        }
    }

    async deleteRoom(roomName) {
        try {
            const response = await axios.delete(`${this.baseURL}/rooms/${roomName}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting Daily room:', error);
            throw error;
        }
    }

    async generateMeetingToken(roomName, userId, isOwner = false) {
        try {
            const response = await axios.post(`${this.baseURL}/meeting-tokens`, {
                properties: {
                    room_name: roomName,
                    user_name: userId,
                    is_owner: isOwner,
                    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.token;
        } catch (error) {
            console.error('Error generating meeting token:', error);
            throw error;
        }
    }

    async startRecording(roomUrl) {
        try {
            const response = await axios.post(`${this.baseURL}/recordings`, {
                room_url: roomUrl,
                recording_type: 'cloud'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    async stopRecording(recordingId) {
        try {
            const response = await axios.delete(`${this.baseURL}/recordings/${recordingId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error stopping recording:', error);
            throw error;
        }
    }

    async getRecordingStatus(recordingId) {
        try {
            const response = await axios.get(`${this.baseURL}/recordings/${recordingId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting recording status:', error);
            throw error;
        }
    }
}

module.exports = DailyService;
