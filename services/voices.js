// Language → Voice Routing Map
// Routes each language to native voice & locale using Sarvam's actual speaker names
// The target_language_code (like hi-IN, ta-IN) determines the native accent
// Using language-specific native speakers for authentic pronunciation (not generic multilingual)

const VoiceRoutes = {
    "en":   { lang: "en-IN", speaker: "anushka", model: "bulbul:v2", style: "neutral" }, // English - unchanged
    "hi":   { lang: "hi-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Hindi - manisha (Sarvam API)
    "kn":   { lang: "kn-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Kannada - manisha (Sarvam API)
    "ta":   { lang: "ta-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Tamil - manisha (Sarvam API)
    "te":   { lang: "te-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Telugu - manisha (Sarvam API)
    "ml":   { lang: "ml-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Malayalam - manisha (Sarvam API)
    "bn":   { lang: "bn-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Bengali - manisha (Sarvam API)
    "mr":   { lang: "mr-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Marathi - manisha (Sarvam API)
    "gu":   { lang: "gu-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Gujarati - manisha (Sarvam API)
    "pa":   { lang: "pa-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }, // Punjabi - manisha (Sarvam API)
    "od":   { lang: "od-IN", speaker: "manisha", model: "bulbul:v2", style: "native"  }  // Odia - manisha (Sarvam API)
};

// Hard fallback if detector returns variants like "hi" vs "hi-IN"
function routeVoice(langCode) {
    const key = (langCode || "").toLowerCase();
    
    if (key.startsWith("en")) return VoiceRoutes.en;
    if (key.startsWith("hi")) return VoiceRoutes.hi;
    if (key.startsWith("kn")) return VoiceRoutes.kn;
    if (key.startsWith("ta")) return VoiceRoutes.ta;
    if (key.startsWith("te")) return VoiceRoutes.te;
    if (key.startsWith("ml")) return VoiceRoutes.ml;
    if (key.startsWith("bn")) return VoiceRoutes.bn;
    if (key.startsWith("mr")) return VoiceRoutes.mr;
    if (key.startsWith("gu")) return VoiceRoutes.gu;
    if (key.startsWith("pa")) return VoiceRoutes.pa;
    if (key.startsWith("od")) return VoiceRoutes.od;
    
    // default: neutral English (never Indianize English)
    return VoiceRoutes.en;
}

module.exports = {
    VoiceRoutes,
    routeVoice
};

