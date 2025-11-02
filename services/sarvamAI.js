const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

class SarvamAI {
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY;
        this.apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai';
        this.isEnabled = !!this.apiKey;
        
        // Log configuration for debugging
        console.log('🔧 Sarvam AI Configuration:');
        console.log('   API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
        console.log('   API URL:', this.apiUrl);
        console.log('   Enabled:', this.isEnabled);
        this.usageStats = {
            totalRequests: 0,
            totalMinutes: 0,
            lastReset: new Date()
        };
    }

    /**
     * Convert audio to text using Sarvam AI
     * @param {Buffer} audioBuffer - Audio data
     * @param {string} audioFormat - Audio format (wav, mp3, webm, etc.)
     * @param {string} language - Language code (optional, auto-detect if not provided)
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeAudio(audioBuffer, audioFormat = 'wav', language = null) {
        try {
            if (!this.isEnabled) {
                console.log('⚠️ Sarvam AI not configured - using fallback');
                return {
                    success: false,
                    error: 'Sarvam AI not configured',
                    fallback: 'browser_speech',
                    provider: 'sarvam'
                };
            }

            console.log('🎤 Sending audio to Sarvam AI...');
            console.log(`📊 Audio size: ${audioBuffer.length} bytes`);
            console.log(`🎵 Format: ${audioFormat}`);
            console.log(`🌐 Language: ${language || 'auto-detect'}`);

            // Create form data for Sarvam AI with correct parameters
            const formData = new FormData();
            
            // Add audio file with correct field name (Sarvam AI expects 'file')
            formData.append('file', audioBuffer, {
                filename: `audio.${audioFormat}`,
                contentType: this.getContentType(audioFormat)
            });

            // Add parameters for Sarvam AI with correct format
            formData.append('model', 'saarika:v2');
            // Use proper language code mapping
            const mappedLanguage = this.mapLanguageCode(language || 'en-IN');
            formData.append('language_code', mappedLanguage);
            formData.append('with_timestamps', 'false');
            formData.append('with_diarization', 'false');
            formData.append('num_speakers', '1');

            // Make API request to Sarvam AI with correct endpoint and headers
            const response = await axios.post(`${this.apiUrl}/speech-to-text`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'api-subscription-key': this.apiKey,
                    'User-Agent': 'Clara-AI-Reception-System/1.0'
                },
                timeout: 30000 // 30 second timeout
            });

            console.log('✅ Sarvam AI response received');

            // Update usage statistics
            this.updateUsageStats(audioBuffer.length);

            // Parse Sarvam AI response format
            let transcriptionText = '';
            let confidence = 0.95;
            let detectedLanguage = language || 'en-IN';

            if (response.data) {
                // Sarvam AI response format: { text: "...", confidence: 0.95 }
                if (response.data.text) {
                    transcriptionText = response.data.text;
                } else if (response.data.transcript) {
                    transcriptionText = response.data.transcript;
                } else if (response.data.transcription) {
                    transcriptionText = response.data.transcription;
                } else if (response.data.result && response.data.result.text) {
                    transcriptionText = response.data.result.text;
                }

                if (response.data.confidence) {
                    confidence = response.data.confidence;
                } else if (response.data.result && response.data.result.confidence) {
                    confidence = response.data.result.confidence;
                }

                if (response.data.language_code) {
                    detectedLanguage = response.data.language_code;
                } else if (response.data.language) {
                    detectedLanguage = response.data.language;
                }
            }

            console.log('✅ Sarvam AI transcription:', transcriptionText.substring(0, 100) + '...');

            return {
                success: true,
                text: transcriptionText.trim(),
                confidence: confidence,
                language: detectedLanguage,
                provider: 'sarvam',
                usage: this.getUsageStats()
            };

        } catch (error) {
            console.error('❌ Sarvam AI error:', error.response?.data || error.message);
            
            // Handle specific error types
            let errorMessage = 'Unknown error occurred';
            let shouldFallback = true;

            if (error.response?.status === 401) {
                errorMessage = 'Invalid API key';
                shouldFallback = false;
            } else if (error.response?.status === 429) {
                errorMessage = 'Rate limit exceeded';
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid audio format or parameters';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = 'Network connection failed';
            }

            return {
                success: false,
                error: errorMessage,
                fallback: shouldFallback ? 'browser_speech' : null,
                provider: 'sarvam',
                usage: this.getUsageStats()
            };
        }
    }

    /**
     * Real-time streaming transcription (for future use)
     * @param {Buffer} audioChunk - Audio chunk data
     * @returns {Promise<Object>} Partial transcription result
     */
    async streamTranscribe(audioChunk) {
        try {
            if (!this.isEnabled) {
                throw new Error('Sarvam AI not configured');
            }

            const response = await axios.post(`${this.apiUrl}/stream`, audioChunk, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Key': this.apiKey
                },
                timeout: 10000
            });

            return {
                success: true,
                text: response.data.text,
                isPartial: response.data.is_partial || false,
                confidence: response.data.confidence,
                provider: 'sarvam'
            };

        } catch (error) {
            console.error('❌ Sarvam AI streaming error:', error.message);
            return {
                success: false,
                error: error.message,
                fallback: 'browser_speech',
                provider: 'sarvam'
            };
        }
    }

    /**
     * Map language codes to Sarvam AI supported formats
     */
    mapLanguageCode(language) {
        const languageMap = {
            'auto-detect': 'unknown',
            'en': 'en-IN',
            'en-US': 'en-IN',
            'en-IN': 'en-IN',
            'hi': 'hi-IN',
            'hi-IN': 'hi-IN',
            'kn': 'kn-IN',
            'kn-IN': 'kn-IN',
            'te': 'te-IN',
            'te-IN': 'te-IN',
            'ta': 'ta-IN',
            'ta-IN': 'ta-IN',
            'ml': 'ml-IN',
            'ml-IN': 'ml-IN',
            'mr': 'mr-IN',
            'mr-IN': 'mr-IN',
            'gu': 'gu-IN',
            'gu-IN': 'gu-IN',
            'bn': 'bn-IN',
            'bn-IN': 'bn-IN',
            'pa': 'pa-IN',
            'pa-IN': 'pa-IN',
            'od': 'od-IN',
            'od-IN': 'od-IN'
        };
        
        return languageMap[language] || 'unknown';
    }

    /**
     * Get content type for audio format
     */
    getContentType(format) {
        const types = {
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg',
            'm4a': 'audio/mp4',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
            'aac': 'audio/aac',
            'wma': 'audio/x-ms-wma'
        };
        return types[format.toLowerCase()] || 'audio/wav';
    }

    /**
     * Update usage statistics
     */
    updateUsageStats(audioSizeBytes) {
        this.usageStats.totalRequests += 1;
        // Rough estimate: 1 minute = ~1MB of audio
        this.usageStats.totalMinutes += (audioSizeBytes / 1024 / 1024);
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            totalRequests: this.usageStats.totalRequests,
            totalMinutes: Math.round(this.usageStats.totalMinutes * 100) / 100,
            estimatedCost: (this.usageStats.totalMinutes * 0.5).toFixed(2) + ' ₹',
            lastReset: this.usageStats.lastReset
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsageStats() {
        this.usageStats = {
            totalRequests: 0,
            totalMinutes: 0,
            lastReset: new Date()
        };
    }

    /**
     * Check if Sarvam AI is available
     */
    isAvailable() {
        return this.isEnabled;
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            if (!this.isEnabled) {
                return { success: false, error: 'API key not configured' };
            }

            // Test connection by attempting a minimal speech-to-text request
            const testAudioBuffer = Buffer.from([
                0x52, 0x49, 0x46, 0x46, // "RIFF"
                0x24, 0x00, 0x00, 0x00, // File size - 8
                0x57, 0x41, 0x56, 0x45, // "WAVE"
                0x66, 0x6D, 0x74, 0x20, // "fmt "
                0x10, 0x00, 0x00, 0x00, // Format chunk size
                0x01, 0x00,             // Audio format (PCM)
                0x01, 0x00,             // Number of channels
                0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
                0x88, 0x58, 0x01, 0x00, // Byte rate
                0x02, 0x00,             // Block align
                0x10, 0x00,             // Bits per sample
                0x64, 0x61, 0x74, 0x61, // "data"
                0x00, 0x00, 0x00, 0x00  // Data size (0 for silence)
            ]);

            const FormData = require('form-data');
            const formData = new FormData();
            
            formData.append('file', testAudioBuffer, {
                filename: 'test.wav',
                contentType: 'audio/wav'
            });
            formData.append('model', 'saarika:v2');
            formData.append('language_code', 'en-IN');
            formData.append('with_timestamps', 'false');
            formData.append('with_diarization', 'false');
            formData.append('num_speakers', '1');

            const response = await axios.post(`${this.apiUrl}/speech-to-text`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'api-subscription-key': this.apiKey
                },
                timeout: 10000
            });

            return {
                success: true,
                message: 'Sarvam AI connection successful',
                testResponse: response.data
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = SarvamAI;
