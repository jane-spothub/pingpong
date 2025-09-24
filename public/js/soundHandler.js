export class SoundHandler {
    constructor({ isMuted = false, loop = true } = {}) {
        this.muted = isMuted;

        // Flags for settings
        this.disableBall = false;   // ⬅️ Add this
        this.disableVictory = false;

        // 🎵 Sound effects
        this.sounds = {
            hitPaddle: new Audio("assets/audio/paddle-hit-ball.wav"),
            hitTable: new Audio("assets/audio/ball-hit-table.wav"),
            win: new Audio("assets/audio/win-sound.wav"),
            lose: new Audio("assets/audio/lose.wav"),
        };

        // 🎶 Background music
        this.background = new Audio("assets/audio/pinpon-bg-snd.mp3");
        this.background.loop = loop;

        // Preload everything
        Object.values(this.sounds).forEach(a => a.load());
        this.background.load();

        // Try autoplay
        this.tryPlayBackground();
    }

    tryPlayBackground() {
        this.background.volume = this.muted ? 0 : 0.5;
        this.background.play().catch(err => {
            if (err.name === "NotAllowedError") {
                console.warn("Waiting for user interaction to start music.");
                const resume = () => {
                    this.background.play().then(() => {
                        this.background.volume = this.muted ? 0 : 0.5;
                    });
                    document.removeEventListener("click", resume);
                    document.removeEventListener("keydown", resume);
                };
                document.addEventListener("click", resume);
                document.addEventListener("keydown", resume);
            }
        });
    }

    // 🔊 Play sound effect (with clone so multiple can overlap)
    play(name, volume = 0.8) {
        if (this.muted) return;

        // ⬅️ Check for toggles
        if (this.disableBall && (name === "hitPaddle" || name === "hitTable")) return;
        if (this.disableVictory && (name === "win" || name === "lose")) return;

        const audio = this.sounds[name];
        if (!audio) return;

        const clone = audio.cloneNode();
        clone.volume = volume;
        clone.play().catch(err => console.warn("Sound error:", err));
    }

    // 🎶 Background controls
    playBackground() {
        if (this.muted) return;
        this.background.currentTime = 0;
        this.background.play();
    }

    stopBackground() {
        this.background.pause();
        this.background.currentTime = 0;
    }

    // 🔇 Mute / Unmute
    mute() {
        this.muted = true;
        this.background.volume = 0;
    }

    unmute() {
        this.muted = false;
        this.background.volume = 0.5;
    }

    toggleMute() {
        this.muted ? this.unmute() : this.mute();
    }
}

window.SoundHandler = SoundHandler;
