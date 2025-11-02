// Mixed-language text splitter
// Splits text by script (Latin vs Indic) to preserve correct accents

function splitByScript(text) {
    // Very simple splitter: Latin vs Indic scripts
    const segments = [];
    let curr = "", currType = null;
    
    const typeOf = (ch) => {
        const code = ch.codePointAt(0);
        if ((code >= 0x0900 && code <= 0x097F) || // Devanagari (hi/mr/gu/etc)
            (code >= 0x0980 && code <= 0x09FF) || // Bengali
            (code >= 0x0B80 && code <= 0x0BFF) || // Tamil
            (code >= 0x0C80 && code <= 0x0CFF) || // Kannada
            (code >= 0x0C00 && code <= 0x0C7F) || // Telugu
            (code >= 0x0D00 && code <= 0x0D7F))   // Malayalam
            return "indic";
        return "latin";
    };
    
    for (const ch of text) {
        const t = typeOf(ch);
        if (currType === null || t === currType) {
            curr += ch;
            currType = t;
        } else {
            if (curr.trim()) {
                segments.push({ text: curr.trim(), type: currType });
            }
            curr = ch;
            currType = t;
        }
    }
    
    if (curr.trim()) {
        segments.push({ text: curr.trim(), type: currType });
    }
    
    return segments;
}

module.exports = {
    splitByScript
};

