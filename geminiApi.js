const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

async function queryGemini(prompt, conversationHistory = [], responseLanguage = 'en') {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured');
        }

        // Build conversation context with strong same-language policy and expanded language guidance
        const languageInstructions = {
            'en': 'Respond in English.',
            'en-US': 'Respond in English (US).',
            'en-GB': 'Respond in English (UK).',
            'hi': 'Respond in Hindi (हिंदी) using Devanagari.',
            'kn': 'Respond in Kannada (ಕನ್ನಡ) using Kannada script.',
            'ta': 'Respond in Tamil (தமிழ்) using Tamil script.',
            'te': 'Respond in Telugu (తెలుగు) using Telugu script.',
            'ml': 'Respond in Malayalam (മലയാളം) using Malayalam script.',
            'mr': 'Respond in Marathi (मराठी) using Devanagari.',
            'bn': 'Respond in Bengali (বাংলা) using Bengali script.',
            'gu': 'Respond in Gujarati (ગુજરાતી) using Gujarati script.',
            'pa': 'Respond in Punjabi (ਪੰਜਾਬੀ) using Gurmukhi.',
            'od': 'Respond in Odia (ଓଡ଼ିଆ) using Odia script.',
            'or': 'Respond in Odia (ଓଡ଼ିଆ) using Odia script.',
            'es': 'Responde en español.',
            'fr': 'Réponds en français.',
            'de': 'Antworte auf Deutsch.',
            'it': 'Rispondi in italiano.',
            'pt': 'Responda em português.',
            'ja': '日本語で回答してください（日本語の文字を使用）。',
            'ko': '한국어로 답변하세요 (한글 사용).',
            'zh': '请使用中文回答，并使用中文字符。'
        };

        const policyBlock = `You are Clara, a friendly and professional AI receptionist.\n\nOutput language policy:\n- Detect the user’s language and respond STRICTLY in that same language and native script.\n- Do NOT transliterate. Use the native script (e.g., Hindi → Devanagari, Kannada → Kannada).\n- Preserve named entities as-is (people, places, orgs), but inflect surrounding words naturally.\n- Keep tone warm, concise, and conversational. Avoid over-formality.\n- Never switch languages unless the user explicitly asks. If the user switches mid-conversation, mirror the new language immediately.\n- If the user’s message mixes languages, reply in the majority language; if unclear, continue in the last user language.\n\nFormatting & clarity:\n- Prefer short paragraphs and bullet points for steps or options.\n- Use numbers/dates/times in the format natural for the language.\n- If a term lacks a direct equivalent, explain briefly in the same language (avoid English unless the user used it).\n\nError handling:\n- If a query is ambiguous, ask one concise clarifying question in the same language before proceeding.\n\nPersona:\n- Be welcoming, helpful, and human-like. Make visitors feel comfortable and supported.\n\nCRITICAL: Your entire response MUST be in the same language and native script as the user’s latest message.`;

        const languageInstruction = languageInstructions[responseLanguage] || 'Respond in the user’s language and native script.';

        const systemPrompt = `${policyBlock}\n\nLANGUAGE-SPECIFIC: ${languageInstruction}`;

        // Format conversation history for Gemini
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            }
        ];

        // Add conversation history
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.sender === 'clara' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });

        // Add current prompt
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1000,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        // Enhanced response parsing with better error handling and fallbacks
        let responseText = null;
        
        // Log the response for debugging
        console.log('🔍 Gemini API Response:', JSON.stringify(response.data, null, 2));
        console.log('🔍 Response type:', typeof response.data);
        console.log('🔍 Response keys:', Object.keys(response.data || {}));
        
        // Try multiple response formats
        if (response.data) {
            // Format 1: Standard Gemini response
            if (response.data.candidates && response.data.candidates.length > 0) {
                const candidate = response.data.candidates[0];
                console.log('🔍 Candidate:', JSON.stringify(candidate, null, 2));
                
                // Check if the response was truncated due to MAX_TOKENS
                if (candidate.finishReason === 'MAX_TOKENS') {
                    console.warn('⚠️ Response truncated due to MAX_TOKENS limit');
                    // Try to extract partial response
                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        responseText = candidate.content.parts[0].text;
                        if (!responseText || responseText === '{"role":"model"}') {
                            // If we got a truncated response, use a fallback
                            responseText = "I'm here to help you with information about our institute, staff members, and any other questions you might have. How can I assist you today?";
                        }
                    }
                } else if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text;
                    console.log('🔍 Extracted from candidate:', responseText);
                }
            }
            
            // Format 2: Direct text response
            if (!responseText && response.data.text) {
                responseText = response.data.text;
            }
            
            // Format 3: Content field
            if (!responseText && response.data.content) {
                responseText = response.data.content;
            }
            
            // Format 4: Message field
            if (!responseText && response.data.message) {
                responseText = response.data.message;
            }
            
            // Format 5: Response field
            if (!responseText && response.data.response) {
                responseText = response.data.response;
            }
            
            // Format 6: Extract from any nested structure
            if (!responseText) {
                const extractText = (obj) => {
                    if (typeof obj === 'string') return obj;
                    if (typeof obj === 'object' && obj !== null) {
                        if (obj.text) return obj.text;
                        if (obj.content) return obj.content;
                        if (obj.message) return obj.message;
                        if (obj.response) return obj.response;
                        
                        // Recursively search nested objects
                        for (const key in obj) {
                            const result = extractText(obj[key]);
                            if (result) return result;
                        }
                    }
                    return null;
                };
                
                responseText = extractText(response.data);
            }
            
            // Ensure responseText is always a string and handle object responses
            if (responseText !== null && responseText !== undefined) {
                if (typeof responseText === 'object') {
                    // If responseText is still an object, try to extract text from it
                    if (responseText.text) {
                        responseText = responseText.text;
                    } else if (responseText.content) {
                        responseText = responseText.content;
                    } else if (responseText.message) {
                        responseText = responseText.message;
                    } else {
                        // Convert object to JSON string as last resort
                        responseText = JSON.stringify(responseText);
                    }
                }
                responseText = String(responseText).trim();
            }
        }
        
        // If we have a response, return it
        if (responseText) {
            console.log('🔍 Raw responseText:', responseText);
            console.log('🔍 ResponseText type:', typeof responseText);
            console.log('🔍 ResponseText length:', responseText.length);
            
            // Final safety check - ensure we never return "[object Object]"
            let finalResponse = String(responseText).trim();
            
            // If the response looks like an object, try to extract meaningful text
            if (finalResponse === '[object Object]' || finalResponse.startsWith('{') || finalResponse.startsWith('[')) {
                try {
                    const parsed = JSON.parse(finalResponse);
                    if (parsed.text) {
                        finalResponse = parsed.text;
                    } else if (parsed.content) {
                        finalResponse = parsed.content;
                    } else if (parsed.message) {
                        finalResponse = parsed.message;
                    } else {
                        // Extract any string values from the object
                        const extractStrings = (obj) => {
                            const strings = [];
                            if (typeof obj === 'string') strings.push(obj);
                            if (typeof obj === 'object' && obj !== null) {
                                for (const key in obj) {
                                    strings.push(...extractStrings(obj[key]));
                                }
                            }
                            return strings;
                        };
                        
                        const strings = extractStrings(parsed);
                        if (strings.length > 0) {
                            finalResponse = strings.join(' ');
                        } else {
                            finalResponse = "I'm here to help you! How can I assist you today?";
                        }
                    }
                } catch (e) {
                    finalResponse = "I'm here to help you! How can I assist you today?";
                }
            }
            
            console.log('✅ Successfully extracted response:', finalResponse.substring(0, 100) + '...');
            return finalResponse;
        }
        
        // Return a fallback response instead of throwing an error
        console.warn('⚠️  Could not parse Gemini API response, using fallback');
        return "I'm here to help you! How can I assist you today?";
    } catch (error) {
        console.error('Error querying Gemini AI:', error.response?.data || error.message);
        
        // Don't throw the error, return a fallback response instead
        // This prevents the system from falling back to demo mode
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('❌ Gemini API authentication failed. Please check your API key.');
            return "I'm experiencing some technical difficulties with my AI service. Please try again in a moment.";
        } else if (error.response?.status >= 500) {
            console.error('❌ Gemini API server error. Service temporarily unavailable.');
            return "I'm having trouble connecting to my AI service right now. Please try again later.";
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.error('❌ Gemini API request timeout.');
            return "I'm taking a bit longer to respond than usual. Please try again.";
        } else {
            console.error('❌ Gemini API unexpected error:', error.message);
            return "I'm here to help you! How can I assist you today?";
        }
    }
}

module.exports = { queryGemini };
