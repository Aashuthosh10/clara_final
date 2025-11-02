// Clara Audio Engine - Robust queue + jitter buffer for smooth, gapless playback
(function() {
    'use strict';

let _ac = null;

function getAudioContext() {
    if (!_ac) {
        // Use 48 kHz sample rate for stutter-free, high-quality playback
        // This fixes robotic/stutter issues caused by sample rate mismatches
        try {
            _ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
        } catch (e) {
            // Fallback if 48kHz not supported (older browsers)
            _ac = new (window.AudioContext || window.webkitAudioContext)();
            console.warn('48kHz sample rate not supported, using default:', _ac.sampleRate);
        }
    }
    return _ac;
}

class ClaraAudioEngine {
    constructor() {
        this.ac = getAudioContext();
        this.comp = this.ac.createDynamicsCompressor();
        this.eqHi = this.ac.createBiquadFilter();
        this.gain = this.ac.createGain();
        this.startAt = this.ac.currentTime; // running scheduler time
        this.queue = [];
        this.targetBufferSec = 0.35; // jitter buffer target (250-400ms range)
        this.crossfadeSec = 0.008; // ~8 ms crossfade

        // Gentle mastering: tighter dynamics, slight presence boost
        Object.assign(this.comp, {
            threshold: -24,
            knee: 30,
            ratio: 3,
            attack: 0.003,
            release: 0.25
        });

        this.eqHi.type = 'highshelf';
        this.eqHi.frequency.value = 6000;
        this.eqHi.gain.value = 2; // +2 dB presence

        this.gain.gain.value = 1.0;

        this.comp.connect(this.eqHi);
        this.eqHi.connect(this.gain);
        this.gain.connect(this.ac.destination);
    }

    // Call once on user gesture (tap/click) for iOS Safari
    async unlock() {
        if (this.ac.state !== 'running') {
            try {
                await this.ac.resume();
            } catch (e) {
                // Silently handle errors
            }
        }
    }

    // Optional: RMS-based autogain toward ~-18 dBFS
    autoGain(buf) {
        const ch = buf.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < ch.length; i += 256) {
            sum += ch[i] * ch[i];
        }
        const rms = Math.sqrt(sum / (ch.length / 256));
        const target = 0.125; // ~-18 dBFS
        const g = Math.min(2.5, Math.max(0.5, target / Math.max(1e-6, rms)));
        this.gain.gain.setTargetAtTime(g, this.ac.currentTime, 0.03);
    }

    schedule(buffer) {
        const now = this.ac.currentTime;
        if (this.startAt < now + 0.01) {
            this.startAt = now + 0.02; // guard against drift
        }

        const src = this.ac.createBufferSource();
        src.buffer = buffer;

        // Crossfade with tiny gain ramps to avoid clicks
        const nodeGain = this.ac.createGain();
        nodeGain.gain.setValueAtTime(0.0, this.startAt);
        nodeGain.gain.linearRampToValueAtTime(1.0, this.startAt + this.crossfadeSec);

        const end = this.startAt + buffer.duration;
        nodeGain.gain.setValueAtTime(1.0, end - this.crossfadeSec);
        nodeGain.gain.linearRampToValueAtTime(0.0, end);

        src.connect(nodeGain);
        nodeGain.connect(this.comp);

        src.start(this.startAt);

        this.startAt += buffer.duration - this.crossfadeSec; // slight overlap
        this.autoGain(buffer);
    }

    /** Enqueue decoded AudioBuffer; will keep ~targetBufferSec ahead of now */
    enqueue(buffer) {
        this.queue.push({ buffer });
        this.drain();
    }

    drain() {
        const ahead = this.startAt - this.ac.currentTime;
        if (ahead >= this.targetBufferSec) {
            return;
        }

        const next = this.queue.shift();
        if (!next) {
            return;
        }

        this.schedule(next.buffer);

        // If still below target, schedule more
        this.drain();
    }

    /** For network stalls, call tick() periodically (e.g., requestAnimationFrame) */
    tick() {
        this.drain();
    }

    /** Optional: set buffer size for harsher networks (0.25–0.5s) */
    setTargetBuffer(sec) {
        this.targetBufferSec = Math.max(0.2, Math.min(0.6, sec));
    }

    /** Stop all scheduled audio */
    stop() {
        // Clear queue
        this.queue = [];
        // Reset scheduler time
        this.startAt = this.ac.currentTime + 0.02;
    }
}

let _engine = null;

function getClaraAudioEngine() {
    if (!_engine) {
        _engine = new ClaraAudioEngine();
    }
    return _engine;
}

// Export to global scope
window.getAudioContext = getAudioContext;
window.getClaraAudioEngine = getClaraAudioEngine;
window.ClaraAudioEngine = ClaraAudioEngine;

})();

