// Test script to verify Gemini API key
require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

console.log('🔍 Testing Gemini API Connection...');
console.log('🔑 API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('🌐 API URL:', GEMINI_API_URL);

async function testGeminiAPI() {
    try {
        if (!GEMINI_API_KEY) {
            console.error('❌ No API key found in .env file');
            console.error('📝 Make sure you have a .env file with GEMINI_API_KEY=your_key');
            return;
        }

        if (GEMINI_API_KEY === 'your_new_gemini_api_key_here' || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.error('❌ API key not replaced - still using placeholder');
            console.error('📝 Replace the placeholder with your actual API key');
            return;
        }

        if (!GEMINI_API_KEY.startsWith('AIza')) {
            console.error('❌ Invalid API key format');
            console.error('📝 Gemini API keys should start with "AIza"');
            return;
        }

        console.log('🚀 Making test request to Gemini API...');

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [{
                role: 'user',
                parts: [{ text: 'Hello, this is a test message. Please respond with "API connection successful"' }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ API Response Status:', response.status);
        
        if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
            const text = response.data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini Response:', text);
            console.log('🎉 API connection successful!');
        } else {
            console.log('⚠️ Unexpected response format:', JSON.stringify(response.data, null, 2));
        }

    } catch (error) {
        console.error('❌ API Test Failed:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Data:', error.response?.data);
        console.error('Error Message:', error.message);
        
        if (error.response?.status === 400) {
            console.error('🔍 Possible issues:');
            console.error('- Invalid API key format');
            console.error('- API key doesn\'t have proper permissions');
            console.error('- Model name is incorrect');
            console.error('- Request format is wrong');
        } else if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('🔍 Authentication issue:');
            console.error('- API key is invalid or expired');
            console.error('- API key doesn\'t have access to Gemini API');
            console.error('- Get a new API key from: https://makersuite.google.com/app/apikey');
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.error('🔍 Network issue:');
            console.error('- Check your internet connection');
            console.error('- Firewall might be blocking the request');
            console.error('- Try again in a few moments');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('🔍 Connection issue:');
            console.error('- Cannot reach Google servers');
            console.error('- Check your internet connection');
        }
    }
}

testGeminiAPI();
