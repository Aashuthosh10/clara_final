#!/usr/bin/env python3
"""
Microsoft Edge TTS Service for Clara AI
Provides multilingual text-to-speech using Microsoft Edge TTS
"""

import asyncio
import sys
import json
import os
import edge_tts  # pyright: ignore[reportMissingImports]
import io
import base64
import re
import json
import subprocess
import tempfile

# Fix Windows console encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

class EdgeTTSService:
    def __init__(self):
        self.voice_mapping = {
            # English voices (enhanced premium voices for Clara)
            'en': 'en-US-AvaNeural',  # Upgraded to premium voice
            'en-US': 'en-US-AvaNeural',  # Premium, natural, clear
            'en-GB': 'en-GB-SoniaNeural',  # British accent, professional
            'en-AU': 'en-AU-NatashaNeural',  # Australian accent
            'en-CA': 'en-CA-ClaraNeural',  # Perfect match for Clara name
            'en-IN': 'en-IN-NeerjaNeural',  # Indian English, optimized
            
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
        
        # Professional speech parameters for clear, consistent communication
        self.speech_parameters = {
            # English - slower, human-like pacing
            'en':   {'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'},
            'en-US':{'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'},
            'en-GB':{'rate': '-7%', 'pitch': '-1Hz', 'volume': '+0%'},
            'en-IN':{'rate': '-6%', 'pitch': '-1Hz', 'volume': '+0%'},

            # International Languages - slower, natural pacing
            'es': {'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'},
            'fr': {'rate': '-9%', 'pitch': '-2Hz', 'volume': '+0%'},
            'de': {'rate': '-7%', 'pitch': '-1Hz', 'volume': '+0%'},
            'it': {'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'},
            'pt': {'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'},
            'ja': {'rate': '-6%', 'pitch': '+0Hz', 'volume': '+0%'},
            'zh': {'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'},
            'ko': {'rate': '-6%', 'pitch': '-1Hz', 'volume': '+0%'},
            'ar': {'rate': '-7%', 'pitch': '-1Hz', 'volume': '+0%'},
            'ru': {'rate': '-7%', 'pitch': '-1Hz', 'volume': '+0%'}
        }

        # Professional emotional tone parameters for clear, consistent communication
        self.emotional_parameters = {
            'greeting':    {'rate': '-6%', 'pitch': '-1Hz', 'volume': '+0%'},
            'casual':      {'rate': '-6%', 'pitch': '-1Hz', 'volume': '+0%'},
            'professional':{'rate': '-4%', 'pitch': '-1Hz', 'volume': '+0%'},
            'helpful':     {'rate': '-6%', 'pitch': '-1Hz', 'volume': '+0%'},
            'excited':     {'rate': '-3%', 'pitch': '+0Hz', 'volume': '+0%'},
            'calm':        {'rate': '-8%', 'pitch': '-1Hz', 'volume': '+0%'}
        }
        
        # Enhanced pronunciation patterns for Indian names and technical terms
        # Load shared server lexicon (for simple English acronyms and local spell-outs)
        self.server_lexicon = self._load_server_lexicon()

        self.pronunciation_enhancements = {
            # Staff names and technical terms enhancement
            'staff_names': {
                'patterns': [
                    (r'\bProf\.?\s+Anitha\s+C\.?\s*S\.?\b', 'Professor Anitha C S'),
                    (r'\bDr\.?\s+G\s+Dhivyasri\b', 'Doctor G Dhivyasri'),
                    (r'\bProf\.?\s+Lakshmi\s+Durga\s*N\.?\b', 'Professor Lakshmi Durga N'),
                    (r'\bProf\.?\s+Bhavya\s+T\.?\s*N\.?\b', 'Professor Bhavya T N'),
                    (r'\bProf\.?\s+Nisha\s+S\.?\s*K\.?\b', 'Professor Nisha S K'),
                    (r'\bComputer\s+Science\b', 'Computer Science Engineering'),
                    (r'\bData\s+Structures\b', 'Data Structures and Algorithms'),
                    (r'\bSoftware\s+Engineering\b', 'Software Engineering and Project Management'),
                ]
            },
            'en': {
                'patterns': []
            },
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

    def _load_server_lexicon(self):
        try:
            base_dir = os.path.dirname(__file__)
            json_path = os.path.normpath(os.path.join(base_dir, '..', 'public', 'config', 'pronunciations.json'))
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('serverLexicon', {})
        except Exception:
            return {}

    def get_voice(self, language=None, text=None):
        """Get the best voice for the given language or detected from text"""
        if language:
            return self.voice_mapping.get(language, self.voice_mapping['en'])
        elif text:
            detected_lang = self.detect_language(text)
            return self.voice_mapping.get(detected_lang, self.voice_mapping['en'])
        else:
            return self.voice_mapping['en']

    async def text_to_speech(self, text, voice=None, language=None, rate='+0%', pitch='+0Hz', emotional_context='casual'):
        """Convert text to speech using Edge TTS with advanced fluency optimization"""
        try:
            # Clean text for better TTS
            cleaned_text = self.clean_text(text)

            # Apply server lexicon spell-outs (language-aware)
            try:
                lang = language or self.detect_language(cleaned_text)
                merged = {}
                if 'default' in self.server_lexicon:
                    merged.update(self.server_lexicon['default'])
                if lang in self.server_lexicon:
                    merged.update(self.server_lexicon[lang])
                for token, replacement in merged.items():
                    cleaned_text = re.sub(rf"\b{re.escape(token)}\b", replacement, cleaned_text)
            except Exception:
                pass
            
            # Get voice
            if not voice:
                voice = self.get_voice(language, cleaned_text)
            
            # Apply pronunciation enhancements for better clarity
            # First apply staff names enhancement (language independent)
            if 'staff_names' in self.pronunciation_enhancements:
                enhanced_text = cleaned_text
                for pattern, replacement in self.pronunciation_enhancements['staff_names']['patterns']:
                    enhanced_text = re.sub(pattern, replacement, enhanced_text, flags=re.IGNORECASE)
                cleaned_text = enhanced_text
            
            # Then apply language-specific enhancements
            if language and language in self.pronunciation_enhancements:
                enhanced_text = cleaned_text
                for pattern, replacement in self.pronunciation_enhancements[language]['patterns']:
                    enhanced_text = re.sub(pattern, replacement, enhanced_text, flags=re.IGNORECASE)
                cleaned_text = enhanced_text
            
            # Get base speech parameters for the language
            base_params = self.speech_parameters.get(language, {'rate': rate, 'pitch': pitch, 'volume': '+0%'})
            emotional_params = self.emotional_parameters.get(emotional_context, {'rate': '+0%', 'pitch': '+0Hz', 'volume': '+0%'})
            
            # Combine base and emotional parameters for human-like speech
            combined_params = {
                'rate': base_params['rate'],
                'pitch': base_params['pitch'],
                'volume': base_params['volume']
            }
            
            # Apply emotional adjustments
            if emotional_context != 'casual':
                combined_params['rate'] = emotional_params['rate']
                combined_params['pitch'] = emotional_params['pitch']
                combined_params['volume'] = emotional_params['volume']
            
            # Generate speech with plain text to avoid SSML version issues
            # Use plain text instead of SSML to prevent unwanted speech messages
            communicate = edge_tts.Communicate(cleaned_text, voice)
            
            # Convert to bytes
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            # Convert OGG/Opus to MP3 for iOS compatibility
            # iOS Safari doesn't support OGG/Opus, so we convert to MP3
            audio_data = self._convert_to_mp3(audio_data)
            
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

    def _convert_to_mp3(self, audio_data):
        """Convert OGG/Opus audio to MP3 for iOS compatibility"""
        try:
            # Check if ffmpeg is available
            result = subprocess.run(['ffmpeg', '-version'], 
                                  capture_output=True, 
                                  timeout=2)
            if result.returncode != 0:
                # ffmpeg not available, return original audio
                sys.stderr.write('⚠️ ffmpeg not available, skipping conversion (iOS may not support OGG)\n')
                return audio_data
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # ffmpeg not installed or not in PATH, return original audio
            sys.stderr.write('⚠️ ffmpeg not found, skipping conversion (iOS may not support OGG)\n')
            return audio_data
        
        try:
            # Create temporary files for input (OGG) and output (MP3)
            with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as input_file:
                input_file.write(audio_data)
                input_path = input_file.name
            
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as output_file:
                output_path = output_file.name
            
            # Convert OGG to MP3 using ffmpeg
            # -i: input file
            # -codec:a libmp3lame: use MP3 codec
            # -b:a 128k: bitrate 128kbps (good quality, reasonable file size)
            # -ar 24000: sample rate 24kHz (sufficient for speech)
            # -ac 1: mono channel (speech doesn't need stereo)
            # -y: overwrite output file
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-codec:a', 'libmp3lame',
                '-b:a', '128k',
                '-ar', '24000',
                '-ac', '1',
                '-y',  # Overwrite output file
                output_path
            ]
            
            result = subprocess.run(cmd, 
                                  capture_output=True, 
                                  timeout=10,
                                  check=True)
            
            # Read converted MP3 file
            with open(output_path, 'rb') as f:
                mp3_data = f.read()
            
            # Clean up temporary files
            try:
                os.unlink(input_path)
                os.unlink(output_path)
            except:
                pass
            
            sys.stderr.write(f'✅ Converted OGG to MP3: {len(audio_data)} bytes → {len(mp3_data)} bytes\n')
            return mp3_data
            
        except subprocess.CalledProcessError as e:
            sys.stderr.write(f'⚠️ ffmpeg conversion failed: {e.stderr.decode() if e.stderr else str(e)}\n')
            # Clean up on error
            try:
                if 'input_path' in locals():
                    os.unlink(input_path)
                if 'output_path' in locals():
                    os.unlink(output_path)
            except:
                pass
            # Return original audio if conversion fails
            return audio_data
        except Exception as e:
            sys.stderr.write(f'⚠️ Audio conversion error: {str(e)}\n')
            # Clean up on error
            try:
                if 'input_path' in locals():
                    os.unlink(input_path)
                if 'output_path' in locals():
                    os.unlink(output_path)
            except:
                pass
            # Return original audio if conversion fails
            return audio_data

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
    emotional_context = sys.argv[4] if len(sys.argv) > 4 else 'casual'
    
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
    result = await tts_service.text_to_speech(text, voice, language, emotional_context=emotional_context)
    
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())
