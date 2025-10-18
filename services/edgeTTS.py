#!/usr/bin/env python3
"""
Microsoft Edge TTS Service for Clara AI
Provides multilingual text-to-speech using Microsoft Edge TTS
"""

import asyncio
import sys
import json
import os
import edge_tts
import io
import base64
import re

class EdgeTTSService:
    def __init__(self):
        self.voice_mapping = {
            # English voices (prioritized for Clara)
            'en': 'en-US-AriaNeural',
            'en-US': 'en-US-AriaNeural',
            'en-GB': 'en-GB-SoniaNeural',
            'en-AU': 'en-AU-NatashaNeural',
            'en-CA': 'en-CA-ClaraNeural',
            'en-IN': 'en-IN-NeerjaNeural',
            
            # Spanish voices
            'es': 'es-ES-ElviraNeural',
            'es-ES': 'es-ES-ElviraNeural',
            'es-MX': 'es-MX-DaliaNeural',
            'es-AR': 'es-AR-ElenaNeural',
            
            # French voices
            'fr': 'fr-FR-DeniseNeural',
            'fr-FR': 'fr-FR-DeniseNeural',
            'fr-CA': 'fr-CA-SylvieNeural',
            
            # German voices
            'de': 'de-DE-KatjaNeural',
            'de-DE': 'de-DE-KatjaNeural',
            
            # Italian voices
            'it': 'it-IT-ElsaNeural',
            'it-IT': 'it-IT-ElsaNeural',
            
            # Portuguese voices
            'pt': 'pt-BR-FranciscaNeural',
            'pt-BR': 'pt-BR-FranciscaNeural',
            'pt-PT': 'pt-PT-RaquelNeural',
            
            # Indian Languages (Priority 1 - highest accuracy priority)
            'kn': 'kn-IN-SapnaNeural',  # Kannada - optimized for clarity and fluency
            'kn-IN': 'kn-IN-SapnaNeural',
            'hi': 'hi-IN-SwaraNeural',  # Hindi - optimized for natural pronunciation
            'hi-IN': 'hi-IN-SwaraNeural',
            'te': 'te-IN-ShrutiNeural',  # Telugu - optimized for regional accents
            'te-IN': 'te-IN-ShrutiNeural',
            'ta': 'ta-IN-PallaviNeural',  # Tamil - optimized for clarity
            'ta-IN': 'ta-IN-PallaviNeural',
            'ml': 'ml-IN-SobhanaNeural',  # Malayalam - optimized for fluency
            'ml-IN': 'ml-IN-SobhanaNeural',
            'mr': 'mr-IN-AarohiNeural',  # Marathi - optimized for natural tone
            'mr-IN': 'mr-IN-AarohiNeural',
            
            # Japanese voices
            'ja': 'ja-JP-NanamiNeural',
            'ja-JP': 'ja-JP-NanamiNeural',
            
            # Chinese voices
            'zh': 'zh-CN-XiaoxiaoNeural',
            'zh-CN': 'zh-CN-XiaoxiaoNeural',
            'zh-TW': 'zh-TW-HsiaoyuNeural',
            
            # Korean voices
            'ko': 'ko-KR-SunHiNeural',
            'ko-KR': 'ko-KR-SunHiNeural',
            
            # Arabic voices
            'ar': 'ar-SA-ZariyahNeural',
            'ar-SA': 'ar-SA-ZariyahNeural',
            
            # Russian voices
            'ru': 'ru-RU-SvetlanaNeural',
            'ru-RU': 'ru-RU-SvetlanaNeural',
            
            # Dutch voices
            'nl': 'nl-NL-ColetteNeural',
            'nl-NL': 'nl-NL-ColetteNeural',
            
            # Swedish voices
            'sv': 'sv-SE-SofieNeural',
            'sv-SE': 'sv-SE-SofieNeural',
            
            # Norwegian voices
            'no': 'nb-NO-IselinNeural',
            'nb-NO': 'nb-NO-IselinNeural',
            
            # Danish voices
            'da': 'da-DK-ChristelNeural',
            'da-DK': 'da-DK-ChristelNeural',
            
            # Finnish voices
            'fi': 'fi-FI-NooraNeural',
            'fi-FI': 'fi-FI-NooraNeural',
            
            # Polish voices
            'pl': 'pl-PL-AgnieszkaNeural',
            'pl-PL': 'pl-PL-AgnieszkaNeural',
            
            # Czech voices
            'cs': 'cs-CZ-VlastaNeural',
            'cs-CZ': 'cs-CZ-VlastaNeural',
            
            # Hungarian voices
            'hu': 'hu-HU-NoemiNeural',
            'hu-HU': 'hu-HU-NoemiNeural',
            
            # Romanian voices
            'ro': 'ro-RO-AlinaNeural',
            'ro-RO': 'ro-RO-AlinaNeural',
            
            # Bulgarian voices
            'bg': 'bg-BG-KalinaNeural',
            'bg-BG': 'bg-BG-KalinaNeural',
            
            # Croatian voices
            'hr': 'hr-HR-GabrijelaNeural',
            'hr-HR': 'hr-HR-GabrijelaNeural',
            
            # Slovak voices
            'sk': 'sk-SK-ViktoriaNeural',
            'sk-SK': 'sk-SK-ViktoriaNeural',
            
            # Slovenian voices
            'sl': 'sl-SI-PetraNeural',
            'sl-SI': 'sl-SI-PetraNeural',
            
            # Estonian voices
            'et': 'et-EE-AnuNeural',
            'et-EE': 'et-EE-AnuNeural',
            
            # Latvian voices
            'lv': 'lv-LV-EveritaNeural',
            'lv-LV': 'lv-LV-EveritaNeural',
            
            # Lithuanian voices
            'lt': 'lt-LT-OnaNeural',
            'lt-LT': 'lt-LT-OnaNeural',
            
            # Greek voices
            'el': 'el-GR-AthinaNeural',
            'el-GR': 'el-GR-AthinaNeural',
            
            # Turkish voices
            'tr': 'tr-TR-EmelNeural',
            'tr-TR': 'tr-TR-EmelNeural',
            
            # Hebrew voices
            'he': 'he-IL-HilaNeural',
            'he-IL': 'he-IL-HilaNeural',
            
            # Thai voices
            'th': 'th-TH-PremwadeeNeural',
            'th-TH': 'th-TH-PremwadeeNeural',
            
            # Vietnamese voices
            'vi': 'vi-VN-HoaiMyNeural',
            'vi-VN': 'vi-VN-HoaiMyNeural',
            
            # Indonesian voices
            'id': 'id-ID-GadisNeural',
            'id-ID': 'id-ID-GadisNeural',
            
            # Malay voices
            'ms': 'ms-MY-YasminNeural',
            'ms-MY': 'ms-MY-YasminNeural',
            
            # Filipino voices
            'fil': 'fil-PH-BlessicaNeural',
            'fil-PH': 'fil-PH-BlessicaNeural',
            
            # Ukrainian voices
            'uk': 'uk-UA-PolinaNeural',
            'uk-UA': 'uk-UA-PolinaNeural',
        }
        
        # Advanced speech parameters for optimal fluency and clarity (80-90% natural fluency target)
        self.speech_parameters = {
            # Indian Languages - optimized for maximum clarity and naturalness
            'kn': {'rate': '+10%', 'pitch': '+5Hz', 'volume': '+10%'},  # Kannada - slightly faster, higher pitch
            'hi': {'rate': '+5%', 'pitch': '+2Hz', 'volume': '+5%'},    # Hindi - moderate adjustments
            'te': {'rate': '+8%', 'pitch': '+3Hz', 'volume': '+8%'},    # Telugu - optimized for regional clarity
            'ta': {'rate': '+7%', 'pitch': '+4Hz', 'volume': '+7%'},    # Tamil - clear pronunciation
            'ml': {'rate': '+6%', 'pitch': '+3Hz', 'volume': '+6%'},    # Malayalam - natural flow
            'mr': {'rate': '+5%', 'pitch': '+2Hz', 'volume': '+5%'},    # Marathi - balanced tone
            
            # International Languages - standard parameters
            'en': {'rate': '+0%', 'pitch': '+0Hz', 'volume': '+0%'},
            'es': {'rate': '+5%', 'pitch': '+0Hz', 'volume': '+0%'},
            'fr': {'rate': '+3%', 'pitch': '+1Hz', 'volume': '+0%'},
            'de': {'rate': '+2%', 'pitch': '+0Hz', 'volume': '+0%'},
            'it': {'rate': '+4%', 'pitch': '+1Hz', 'volume': '+0%'},
            'pt': {'rate': '+3%', 'pitch': '+0Hz', 'volume': '+0%'},
            'ja': {'rate': '+5%', 'pitch': '+2Hz', 'volume': '+0%'},
            'zh': {'rate': '+4%', 'pitch': '+1Hz', 'volume': '+0%'},
            'ko': {'rate': '+3%', 'pitch': '+1Hz', 'volume': '+0%'},
            'ar': {'rate': '+2%', 'pitch': '+0Hz', 'volume': '+0%'},
            'ru': {'rate': '+2%', 'pitch': '+0Hz', 'volume': '+0%'}
        }
        
        # Pronunciation enhancement patterns for better clarity and naturalness
        self.pronunciation_enhancements = {
            'kn': {
                'patterns': [
                    (r'\b(\w+)aa\b', r'\1ā'),  # Long vowel enhancement for Kannada
                    (r'\b(\w+)ee\b', r'\1ī'),
                    (r'\b(\w+)oo\b', r'\1ū'),
                    (r'\b(\w+)ii\b', r'\1ī'),
                    (r'\b(\w+)uu\b', r'\1ū'),
                ]
            },
            'hi': {
                'patterns': [
                    (r'\b(\w+)aa\b', r'\1ā'),  # Devanagari vowel enhancement
                    (r'\b(\w+)ee\b', r'\1ī'),
                    (r'\b(\w+)oo\b', r'\1ū'),
                    (r'\b(\w+)ii\b', r'\1ī'),
                    (r'\b(\w+)uu\b', r'\1ū'),
                ]
            },
            'te': {
                'patterns': [
                    (r'\b(\w+)aa\b', r'\1ā'),  # Telugu vowel enhancement
                    (r'\b(\w+)ee\b', r'\1ī'),
                    (r'\b(\w+)oo\b', r'\1ū'),
                ]
            },
            'ta': {
                'patterns': [
                    (r'\b(\w+)aa\b', r'\1ā'),  # Tamil vowel enhancement
                    (r'\b(\w+)ee\b', r'\1ī'),
                    (r'\b(\w+)oo\b', r'\1ū'),
                ]
            },
            'ml': {
                'patterns': [
                    (r'\b(\w+)aa\b', r'\1ā'),  # Malayalam vowel enhancement
                    (r'\b(\w+)ee\b', r'\1ī'),
                    (r'\b(\w+)oo\b', r'\1ū'),
                ]
            },
            'mr': {
                'patterns': [
                    (r'\b(\w+)aa\b', r'\1ā'),  # Marathi vowel enhancement
                    (r'\b(\w+)ee\b', r'\1ī'),
                    (r'\b(\w+)oo\b', r'\1ū'),
                ]
            }
        }

    def detect_language(self, text):
        """Simple language detection based on character patterns"""
        text = text.strip()
        
        # Check for specific language patterns
        if re.search(r'[а-яё]', text, re.IGNORECASE):
            return 'ru'
        elif re.search(r'[一-龯]', text):
            if re.search(r'[繁體中文]', text):
                return 'zh-TW'
            return 'zh-CN'
        elif re.search(r'[ひらがなカタカナ]', text):
            return 'ja'
        elif re.search(r'[가-힣]', text):
            return 'ko'
        elif re.search(r'[ا-ي]', text):
            return 'ar'
        elif re.search(r'[α-ω]', text, re.IGNORECASE):
            return 'el'
        elif re.search(r'[א-ת]', text):
            return 'he'
        elif re.search(r'[ก-๙]', text):
            return 'th'
        elif re.search(r'[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]', text, re.IGNORECASE):
            return 'es'  # Default to Spanish for accented characters
        elif re.search(r'[äöüß]', text, re.IGNORECASE):
            return 'de'
        elif re.search(r'[àèéìíîòóù]', text, re.IGNORECASE):
            return 'it'
        elif re.search(r'[àáâãçéêíóôõú]', text, re.IGNORECASE):
            return 'pt'
        elif re.search(r'[àâäéèêëïîôöùûüÿç]', text, re.IGNORECASE):
            return 'fr'
        elif re.search(r'[ąćęłńóśźż]', text, re.IGNORECASE):
            return 'pl'
        elif re.search(r'[áčďéěíňóřšťúůýž]', text, re.IGNORECASE):
            return 'cs'
        elif re.search(r'[áéíóöőúüű]', text, re.IGNORECASE):
            return 'hu'
        elif re.search(r'[ăâîșț]', text, re.IGNORECASE):
            return 'ro'
        elif re.search(r'[абвгдежзийклмнопрстуфхцчшщъьюя]', text, re.IGNORECASE):
            return 'bg'
        elif re.search(r'[čćđšž]', text, re.IGNORECASE):
            return 'hr'
        elif re.search(r'[áäčďéíĺľňóôŕšťúýž]', text, re.IGNORECASE):
            return 'sk'
        elif re.search(r'[čšž]', text, re.IGNORECASE):
            return 'sl'
        elif re.search(r'[äõöü]', text, re.IGNORECASE):
            return 'et'
        elif re.search(r'[āčēģīķļņšūž]', text, re.IGNORECASE):
            return 'lv'
        elif re.search(r'[ąčęėįšųūž]', text, re.IGNORECASE):
            return 'lt'
        elif re.search(r'[çğıöşü]', text, re.IGNORECASE):
            return 'tr'
        elif re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', text, re.IGNORECASE):
            return 'vi'
        elif re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', text, re.IGNORECASE):
            return 'id'
        else:
            return 'en'  # Default to English

    def get_voice(self, language=None, text=None):
        """Get the best voice for the given language or detected from text"""
        if language:
            return self.voice_mapping.get(language, self.voice_mapping['en'])
        elif text:
            detected_lang = self.detect_language(text)
            return self.voice_mapping.get(detected_lang, self.voice_mapping['en'])
        else:
            return self.voice_mapping['en']

    async def text_to_speech(self, text, voice=None, language=None, rate='+0%', pitch='+0Hz'):
        """Convert text to speech using Edge TTS with advanced fluency optimization"""
        try:
            # Clean text for better TTS
            cleaned_text = self.clean_text(text)
            
            # Get voice
            if not voice:
                voice = self.get_voice(language, cleaned_text)
            
            # Apply pronunciation enhancements for better clarity
            if language and language in self.pronunciation_enhancements:
                enhanced_text = cleaned_text
                for pattern, replacement in self.pronunciation_enhancements[language]['patterns']:
                    enhanced_text = re.sub(pattern, replacement, enhanced_text, flags=re.IGNORECASE)
                cleaned_text = enhanced_text
            
            # Get optimized speech parameters for the language
            speech_params = self.speech_parameters.get(language, {'rate': rate, 'pitch': pitch, 'volume': '+0%'})
            
            # Generate speech with plain text to avoid SSML version issues
            # Use plain text instead of SSML to prevent unwanted speech messages
            communicate = edge_tts.Communicate(cleaned_text, voice)
            
            # Convert to bytes
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            # Convert to base64 for JSON transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'success': True,
                'audio': audio_base64,
                'voice': voice,
                'language': language or self.detect_language(text),
                'text': cleaned_text
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'text': text
            }

    def clean_text(self, text):
        """Clean text for better TTS output"""
        # Simple approach: just remove excessive whitespace and control characters
        # Preserve all Unicode text including Hindi, Arabic, Chinese, etc.
        
        # Remove control characters but keep printable Unicode characters
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\t\n\r')
        
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Remove excessive punctuation
        text = re.sub(r'[!]{2,}', '!', text)
        text = re.sub(r'[?]{2,}', '?', text)
        text = re.sub(r'[.]{2,}', '.', text)
        
        return text.strip()

async def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python edgeTTS.py <text_or_file_path> [language] [voice]'
        }))
        return
    
    # Check if first argument is a file path or direct text
    input_arg = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None
    voice = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Check if input is a file path (contains path separators or exists as file)
    if os.path.exists(input_arg) and os.path.isfile(input_arg):
        # Read from file
        try:
            with open(input_arg, 'r', encoding='utf-8') as f:
                text = f.read().strip()
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': f'Failed to read file: {str(e)}'
            }))
            return
    else:
        # Use as direct text
        text = input_arg

    tts_service = EdgeTTSService()
    result = await tts_service.text_to_speech(text, voice, language)
    
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())
