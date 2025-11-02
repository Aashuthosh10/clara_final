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
        this.ready = false; // Track if audio is unlocked
        this.suspendedQueue = []; // Queue for suspended state

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
        
        // iOS FIX: Auto-resume when iOS suspends on background/return
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && this.ac && this.ac.state !== 'running') {
                try { 
                    await this.ac.resume(); 
                    console.log('✅ AudioContext resumed after visibility change');
                    this.flushSuspendedQueue();
                } catch (e) {
                    console.warn('Failed to resume AudioContext:', e);
                }
            }
        });

        // iOS FIX: Handle state changes to flush queue when resumed
        this.ac.onstatechange = async () => {
            if (this.ac.state === 'suspended') {
                console.log('⚠️ AudioContext suspended');
                // wait for next user gesture; queued items will play after unlock
            } else if (this.ac.state === 'running' && this.suspendedQueue.length) {
                console.log('✅ AudioContext resumed, flushing queue');
                this.flushSuspendedQueue();
            }
        };
    }

    // iOS FIX: Call once on user gesture (tap/click) for iOS Safari
    async unlock() {
        if (this.ac.state !== 'running') {
            try {
                await this.ac.resume();
                console.log('✅ AudioContext resumed');
            } catch (e) {
                console.warn('Failed to resume AudioContext:', e);
            }
        }
        
        // iOS CRITICAL: Play a 1-frame silent buffer to "unlock" on iOS
        try {
            const buf = this.ac.createBuffer(1, 1, this.ac.sampleRate);
            const src = this.ac.createBufferSource();
            src.buffer = buf;
            src.connect(this.ac.destination);
            src.start(0);
            console.log('✅ Silent buffer played to unlock iOS audio');
        } catch (e) {
            console.warn('Failed to play silent buffer:', e);
        }
        
        if (this.ac.state === 'running') {
            this.ready = true;
            this.flushSuspendedQueue();
        }
    }
    
    // Flush any audio queued while suspended
    flushSuspendedQueue() {
        if (!this.suspendedQueue.length || !this.ready || this.ac.state !== 'running') {
            return;
        }
        
        const items = [...this.suspendedQueue];
        this.suspendedQueue = [];
        
        console.log(`🔄 Flushing ${items.length} queued audio items`);
        for (const item of items) {
            this.enqueue(item.buffer);
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
        // If not unlocked or suspended, queue for later
        if (!this.ready || this.ac.state !== 'running') {
            console.log('⏸️ Audio not ready, queuing for later');
            this.suspendedQueue.push({ buffer });
            return;
        }
        
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

