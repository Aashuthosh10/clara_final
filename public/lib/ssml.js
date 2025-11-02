// SSML Helper for natural prosody, breathing pauses, and clarity
(function() {
    'use strict';

function ssmlify(input, lang) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    // Normalize whitespace & punctuation for clarity
    const text = input
        .replace(/\s+/g, ' ')
        .replace(/\s([,.;!?])/g, '$1')
        .trim();
    
    if (!text) {
        return '';
    }

    // Split into sentences using punctuation
    const sentences = [];
    const parts = text.split(/([.?!])\s*/);
    
    for (let i = 0; i < parts.length; i += 2) {
        const sentence = parts[i];
        const punctuation = parts[i + 1] || '';
        if (sentence && sentence.trim()) {
            sentences.push(sentence.trim() + punctuation);
        }
    }

    // If no sentences found, use the whole text
    if (sentences.length === 0) {
        sentences.push(text);
    }

    // Wrap each sentence with breaks
    const body = sentences.map(s => `<s>${escapeXml(s)}</s><break time="120ms"/>`).join('');

    // Slightly slower, clearer speech with a touch of warmth
    return `<speak xml:lang="${lang}">
    <prosody rate="0.95" pitch="+2st">
      ${body}
    </prosody>
  </speak>`.trim();
}

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Map language codes to SSML xml:lang format
 */
function getSSMLLanguage(lang) {
    const langMap = {
        'en': 'en-US',
        'en-US': 'en-US',
        'en-GB': 'en-GB',
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
        'pa-IN': 'pa-IN'
    };
    return langMap[lang] || lang || 'en-US';
}

// Export to global scope
window.ssmlify = ssmlify;
window.getSSMLLanguage = getSSMLLanguage;

})();

