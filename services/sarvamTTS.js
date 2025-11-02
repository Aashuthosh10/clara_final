const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { routeVoice } = require('./voices');
require('dotenv').config();

class SarvamTTS {
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY;
        this.apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai';
        this.isEnabled = !!this.apiKey;
        
        // Log configuration for debugging
        console.log('🔊 Sarvam TTS Configuration:');
        console.log('   API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
        console.log('   API URL:', this.apiUrl);
        console.log('   Enabled:', this.isEnabled);
        
        this.usageStats = {
            totalRequests: 0,
            totalCharacters: 0,
            lastReset: new Date()
        };

        // Load shared server lexicon
        this.serverLexicon = this.loadServerLexicon();

        // Language-specific voice and model mapping
        this.voiceMapping = {
            'hi-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'hi-IN' },
            'kn-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'kn-IN' },
            'te-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'te-IN' },
            'ta-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'ta-IN' },
            'ml-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'ml-IN' },
            'mr-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'mr-IN' },
            'gu-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'gu-IN' },
            'bn-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'bn-IN' },
            'pa-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'pa-IN' },
            'od-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'od-IN' },
            'en-IN': { speaker: 'anushka', model: 'bulbul:v2', language: 'en-IN' }
        };

        // Prosody defaults per language
        // Indian languages: Reduced pace to 0.75 for slower, more understandable speech (was 0.8)
        // English: unchanged (pace=0.95, pitch=0.0)
        this.prosodyDefaults = (lang) => {
            if (lang.startsWith("en")) return { pace: 0.95, pitch: 0.0, loudness: 1.0 }; // English - UNCHANGED
            return { pace: 0.75, pitch: -0.3, loudness: 1.0 }; // Indian languages: pace=0.75 (slower for clarity), pitch=-0.3
        };

        // Professional emotional tone mapping - natural, human-like variations
        // Pace multipliers: Indian languages get slower pace, English stays normal
        // Note: Actual pace will be base pace * multiplier, then clamped to 0.82-0.92 for Indian, 0.92-0.98 for English
        this.emotionalTones = {
            'greeting': { pitch: 0.05, pace: 0.98, loudness: 1.0 },      // Warm (slightly faster for English, slower for Indian)
            'casual':   { pitch: 0.0, pace: 1.0, loudness: 1.0 },        // Natural, conversational (uses base pace)
            'professional': { pitch: 0.0, pace: 0.98, loudness: 1.0 },   // Clear, professional (slightly slower)
            'helpful':  { pitch: 0.02, pace: 0.96, loudness: 1.0 },        // Patient, clear (slower)
            'excited':  { pitch: 0.08, pace: 1.02, loudness: 1.02 },     // Bright, energetic (will clamp to max)
            'calm':     { pitch: -0.05, pace: 0.94, loudness: 0.98 }       // Gentle, slower
        };
    }

    loadServerLexicon() {
        try {
            const p = path.join(__dirname, '..', 'public', 'config', 'pronunciations.json');
            const raw = fs.readFileSync(p, 'utf8');
            const json = JSON.parse(raw);
            return (json && json.serverLexicon) || { default: {} };
        } catch (e) {
            console.warn('⚠️ Could not load server lexicon, proceeding without it');
            return { default: {} };
        }
    }

    /**
     * Convert text to speech using Sarvam AI TTS with human-like quality
     * @param {string} text - Text to convert to speech
     * @param {string} language - Language code (e.g., 'hi-IN', 'kn-IN', etc.)
     * @param {Object} options - Additional options for speech generation
     * @param {string} emotionalContext - Emotional context for natural tone
     * @returns {Promise<Object>} Audio generation result
     */
    async generateSpeech(text, language = 'hi-IN', options = {}, emotionalContext = 'casual') {
        try {
            if (!this.isEnabled) {
                console.log('⚠️ Sarvam TTS not configured - using fallback');
                return {
                    success: false,
                    error: 'Sarvam TTS not configured',
                    fallback: 'edge_tts',
                    provider: 'sarvam'
                };
            }

            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return {
                    success: false,
                    error: 'Text is required and must be a non-empty string',
                    fallback: 'edge_tts',
                    provider: 'sarvam'
                };
            }

            // Limit text length to prevent abuse
            if (text.length > 5000) {
                return {
                    success: false,
                    error: 'Text too long. Maximum 5000 characters allowed.',
                    fallback: 'edge_tts',
                    provider: 'sarvam'
                };
            }

            console.log('🔊 Generating speech with Sarvam TTS...');
            console.log(`📝 Text: ${text.substring(0, 100)}...`);
            console.log(`🌐 Language: ${language}`);

            // Route to native voice & locale using routeVoice
            const voiceRoute = routeVoice(language);
            const voiceConfig = {
                language: voiceRoute.lang,
                speaker: voiceRoute.speaker,
                model: voiceRoute.model,
                style: voiceRoute.style
            };
            
            // CRITICAL: Log voice routing for debugging native accent
            console.log(`🎤 Voice Routing: ${language} -> ${voiceConfig.language} (speaker: ${voiceConfig.speaker}, model: ${voiceConfig.model})`);

            // Get prosody defaults for the language
            const d = this.prosodyDefaults(voiceConfig.language);
            const emotionalParams = this.emotionalTones[emotionalContext] || this.emotionalTones['casual'];

            // Helper function to clamp values
            const clamp = (val, min, max, fallback) => {
                const v = (typeof val === "number") ? val : fallback;
                return Math.max(min, Math.min(max, v));
            };

            // For Indian languages: use EXACT Sarvam API values (pace=0.8, pitch=-0.3, loudness=1.0)
            // For English: use defaults with emotional context (unchanged behavior)
            const isIndianLang = !voiceConfig.language.startsWith('en');
            let pitch, pace, loudness;

            if (isIndianLang) {
                // Indian languages: EXACT Sarvam API settings (pace=0.8 is still too fast, reduce to 0.75 for better clarity)
                pitch = -0.3;
                pace = 0.75; // Reduced from 0.8 to 0.75 for slower, more understandable speech
                loudness = 1.0;
            } else {
                // English: use defaults with emotional context (unchanged behavior)
                const basePitch = d.pitch + (emotionalParams.pitch || 0);
                const basePace = d.pace * (emotionalParams.pace || 1.0);
                const baseLoudness = d.loudness * (emotionalParams.loudness || 1.0);
                
                pitch = clamp(options.pitch, -0.1, 0.1, basePitch);
                pace = clamp(options.pace, 0.92, 0.98, basePace);
                loudness = clamp(options.loudness, 0.95, 1.05, baseLoudness);
            }

            // CRITICAL: For native Indian languages, preserve raw text to maintain authentic pronunciation
            // Only apply minimal preprocessing for native languages; English gets full preprocessing
            const isNativeIndianLanguage = !voiceConfig.language.startsWith('en');
            
            let enhancedText = text;
            
            if (isNativeIndianLanguage) {
                // For Indian languages: minimal preprocessing to preserve native pronunciation
                // Only normalize whitespace and preserve native script intact
                enhancedText = text
                    .replace(/\s+/g, ' ') // normalize whitespace only
                    .trim();
                
                // Skip English-style preprocessing (dates, numbers, currency) for native languages
                // Native TTS models handle these naturally in their own language
            } else {
                // For English: apply full preprocessing for clarity
                const normalizedText = this.applyServerLexicon(text, voiceConfig.language);
                const preprocessedText = this.preprocessTextForClarity(normalizedText, voiceConfig.language);
                enhancedText = this.addNaturalPauses(preprocessedText);
            }

            // Build payload with correct voice routing
            // IMPORTANT: disable enable_preprocessing for native languages to prevent English-style processing
            const payload = {
                inputs: [enhancedText],
                target_language_code: voiceConfig.language, // e.g., "ta-IN", "en-US" - CRITICAL for native accent
                speaker: voiceConfig.speaker,             // native voice (e.g., manisha for Hindi, anushka for others)
                model: voiceConfig.model,
                pitch,
                pace,
                loudness,
                enable_preprocessing: true // Speech Enhance ON (as per Sarvam API settings)
            };
            
            // Log payload for debugging (hide sensitive text)
            console.log(`📤 Sarvam TTS Payload: target_language=${payload.target_language_code}, speaker=${payload.speaker}, model=${payload.model}, enable_preprocessing=${payload.enable_preprocessing}, pace=${payload.pace.toFixed(3)}, pitch=${payload.pitch.toFixed(3)}, sample_rate=${payload.sample_rate}`);

            // Request stable container format - use exact Sarvam API settings
            if (options.format) {
                payload.format = options.format; // 'mp3' or 'wav' or 'ogg'
            } else {
                payload.format = 'mp3'; // Default to MP3 for best compatibility
            }
            
            if (options.sample_rate) {
                payload.sample_rate = options.sample_rate;
            } else {
                // Indian languages: 16kHz as per Sarvam API, English: 48kHz for quality
                payload.sample_rate = isNativeIndianLanguage ? 16000 : 48000;
            }
            
            // Add bitrate for MP3 if specified
            if (options.bitrate_kbps) {
                payload.bitrate_kbps = options.bitrate_kbps;
            } else if (payload.format === 'mp3') {
                payload.bitrate_kbps = 192; // Default bitrate for MP3
            }

            console.log('📤 Sending request to Sarvam TTS...');

            // Make API request to Sarvam TTS
            const response = await axios.post(`${this.apiUrl}/text-to-speech`, payload, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey,
                    'User-Agent': 'Clara-AI-Reception-System/1.0'
                },
                timeout: 30000 // 30 second timeout
            });

            console.log('✅ Sarvam TTS response received');

            // Update usage statistics
            this.updateUsageStats(text.length);

            // Strict parsing: validate audio response format
            const audioB64 = response?.data?.audios?.[0];
            if (!audioB64 || typeof audioB64 !== 'string') {
                console.error('❌ No audio content from Sarvam - invalid response format');
                return {
                    success: false,
                    error: 'No audio content from Sarvam',
                    fallback: 'edge_tts',
                    provider: 'sarvam'
                };
            }

            // Optionally check MIME hint if API returns it
            const mime = response?.data?.format || 'audio/mpeg'; // guess mp3
            console.log('🎵 Sarvam audio format:', mime, '| Sample rate:', payload.sample_rate || 'unknown');
            console.log('✅ Sarvam TTS audio generated successfully');

            return {
                success: true,
                audio: audioB64,
                format: mime,
                provider: 'sarvam',
                voice: voiceConfig.speaker,
                model: voiceConfig.model,
                language: voiceConfig.language,
                usage: this.getUsageStats()
            };

        } catch (error) {
            console.error('❌ Sarvam TTS error:', error.response?.data || error.message);
            
            // Handle specific error types
            let errorMessage = 'Unknown error occurred';
            let shouldFallback = true;

            if (error.response?.status === 401) {
                errorMessage = 'Invalid API key';
                shouldFallback = false;
            } else if (error.response?.status === 429) {
                errorMessage = 'Rate limit exceeded';
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid parameters or text format';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = 'Network connection failed';
            }

            return {
                success: false,
                error: errorMessage,
                fallback: shouldFallback ? 'edge_tts' : null,
                provider: 'sarvam',
                usage: this.getUsageStats()
            };
        }
    }

    /**
     * Map of pronunciation-friendly spell-outs per language
     */
    applyServerLexicon(text, language) {
        // Global defaults (apply for all languages)
        const base = (this.serverLexicon && this.serverLexicon.default) || {};
        const langLex = (this.serverLexicon && this.serverLexicon[language]) || {};
        const map = { ...base, ...langLex };
        let out = text;
        for (const k of Object.keys(map)) {
            const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'g');
            out = out.replace(re, map[k]);
        }
        return out;
    }

    /**
     * Smart text preprocessor for clarity/pronunciation
     * Normalizes text, adds pauses, expands numerals, fixes proper nouns
     */
    preprocessTextForClarity(text, lang = 'en-IN') {
        let t = text
            .replace(/\s+/g, ' ') // normalize whitespace
            .replace(/([a-zA-Z0-9])([,!.?])/g, '$1$2') // fix spacing around punctuation
            .replace(/…/g, '...'); // normalize ellipsis

        // Light punctuation to help prosody - insert soft pauses after long tokens
        t = t.replace(/(\S)\s+(\S)/g, (m, a, b) => {
            // insert soft pauses after sentence endings
            return /[.!?]/.test(a) ? `${a} ${b}` : `${a} ${b}`;
        });

        // Numerals -> words/spelling for better clarity (language-aware)
        if (/en/i.test(lang)) {
            // Years as-is (1999, 2024)
            t = t.replace(/\b(\d{4})\b/g, '$1');
            // Small numbers: spell digits for clarity (123 -> "1 2 3" for IDs, but keep small numbers as-is)
            t = t.replace(/\b(\d{3,6})\b/g, (match) => {
                // Only spell out 3-6 digit numbers that look like IDs
                if (match.length >= 4) {
                    return match.split('').join(' ');
                }
                return match;
            });
        }

        // Dates: 12/10/2025 -> 12 October 2025
        t = t.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (match, day, month, year) => {
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
            return `${day} ${months[parseInt(month) - 1]} ${year}`;
        });

        // Times: 3:30 PM -> 3 30 PM (better pronunciation)
        t = t.replace(/\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/gi, '$1 $2 $3');

        // Currency: ₹100 -> rupees 100
        t = t.replace(/₹\s*(\d+)/g, 'rupees $1');
        t = t.replace(/\$\s*(\d+)/g, 'dollars $1');

        // Percentages: 50% -> 50 percent
        t = t.replace(/(\d+)%/g, '$1 percent');

        // Force tiny pauses at sentence boundaries
        t = t.replace(/([.!?])\s+/g, '$1, ');

        return t.trim();
    }

    /**
     * Optional: lightweight prosody wrapper (SSML-like)
     * If Sarvam accepts SSML-ish markup, wrap sentences to enforce pacing
     */
    toProsody(text) {
        const safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<speak><prosody rate="medium" pitch="+1st" volume="+1dB">${safe}</prosody></speak>`;
    }

    /**
     * Add natural pauses and rhythm to text for human-like speech
     */
    addNaturalPauses(text, useSSML = false) {
        // First apply enhanced preprocessing (lang passed from caller if needed)
        let enhancedText = this.preprocessTextForClarity(text, 'en-IN');

        // Add natural pauses after punctuation and conjunctions
        enhancedText = enhancedText
            .replace(/।/g, '। ') // Add space after Hindi full stop
            .replace(/!/g, '! ') // Add space after exclamation
            .replace(/\?/g, '? ') // Add space after question mark
            .replace(/,/g, ', ') // Add space after comma
            .replace(/:/g, ': ') // Add space after colon
            .replace(/;/g, '; ') // Add space after semicolon
            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
            .trim();

        // Add natural pauses for longer sentences
        const sentences = enhancedText.split(/[।!?]/);
        if (sentences.length > 1) {
            enhancedText = sentences
                .map((sentence, index) => {
                    if (index < sentences.length - 1) {
                        const punctuation = enhancedText.match(/[।!?]/g)?.[index] || '';
                        return sentence.trim() + punctuation + ' ';
                    }
                    return sentence.trim();
                })
                .join('');
        }

        // Apply optional SSML wrapper if requested (may not be supported by Sarvam)
        return useSSML ? this.toProsody(enhancedText) : enhancedText;
    }

    /**
     * Enhanced emotional context detection for ultra-natural tone
     */
    detectEmotionalContext(text) {
        const lowerText = text.toLowerCase();
        
        // Greeting patterns (more comprehensive)
        if (/(नमस्ते|नमस्कार|हेलो|हाय|hi|hello|hey|good morning|good afternoon|good evening|greetings|welcome|swagat)/i.test(lowerText)) {
            return 'greeting';
        }
        
        // Professional patterns (expanded)
        if (/(meeting|appointment|schedule|project|task|work|business|official|conference|presentation|report|deadline|urgent|important)/i.test(lowerText)) {
            return 'professional';
        }
        
        // Helpful patterns (enhanced)
        if (/(help|assist|support|guide|how|what|where|when|why|please|could you|would you|can you|need|require|looking for)/i.test(lowerText)) {
            return 'helpful';
        }
        
        // Excited patterns (more comprehensive)
        if (/(great|awesome|excellent|wonderful|amazing|fantastic|brilliant|perfect|love|excited|thrilled|happy|celebration)/i.test(lowerText)) {
            return 'excited';
        }
        
        // Calm patterns (expanded)
        if (/(calm|relax|peaceful|quiet|gentle|soft|slow|easy|don't worry|it's okay|everything will be fine)/i.test(lowerText)) {
            return 'calm';
        }
        
        // Question patterns (more conversational)
        if (/(\?|question|ask|wondering|curious|tell me|explain|describe)/i.test(lowerText)) {
            return 'helpful';
        }
        
        // Default to casual for natural conversation
        return 'casual';
    }

    /**
     * Get supported languages and voices
     */
    getSupportedLanguages() {
        return Object.keys(this.voiceMapping).map(lang => ({
            language: lang,
            speaker: this.voiceMapping[lang].speaker,
            model: this.voiceMapping[lang].model
        }));
    }

    /**
     * Check if a language is supported
     */
    isLanguageSupported(language) {
        return language in this.voiceMapping;
    }

    /**
     * Update usage statistics
     */
    updateUsageStats(textLength) {
        this.usageStats.totalRequests += 1;
        this.usageStats.totalCharacters += textLength;
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            totalRequests: this.usageStats.totalRequests,
            totalCharacters: this.usageStats.totalCharacters,
            estimatedCost: (this.usageStats.totalCharacters * 0.001).toFixed(2) + ' ₹',
            lastReset: this.usageStats.lastReset
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsageStats() {
        this.usageStats = {
            totalRequests: 0,
            totalCharacters: 0,
            lastReset: new Date()
        };
    }

    /**
     * Check if Sarvam TTS is available
     */
    isAvailable() {
        return this.isEnabled;
    }

    /**
     * Test TTS connection with a simple request
     */
    async testConnection() {
        try {
            if (!this.isEnabled) {
                return { success: false, error: 'API key not configured' };
            }

            // Test with a simple phrase
            const testText = 'नमस्ते';
            const result = await this.generateSpeech(testText, 'hi-IN');
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Sarvam TTS connection successful',
                    testResult: result
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = SarvamTTS;
