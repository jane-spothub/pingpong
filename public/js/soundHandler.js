export class SoundHandler {
    constructor() {
        this.sounds = {
            hitPaddle: new Audio("assets/audio/paddle-hit-ball.wav"),
            // hitTable: new Audio("assets/audio/ball-hit-table.wav"),
            score: new Audio("assets/audio/score.wav"),
            win: new Audio("assets/audio/win-sound.wav"),
            lose: new Audio("assets/audio/lose.wav"),
        };

        // Preload all sounds
        Object.values(this.sounds).forEach(audio => {
            audio.load();
        });

        this.muted = false;
    }

    play(name, volume = 0.8) {
        if (this.muted) return;
        const audio = this.sounds[name];
        if (!audio) return;

        // clone so overlapping sounds don’t cut off
        const clone = audio.cloneNode();
        clone.volume = volume;
        clone.play().catch(err => console.warn("Sound error:", err));
    }

    mute() {
        this.muted = true;
    }

    unmute() {
        this.muted = false;
    }

    toggleMute() {
        this.muted = !this.muted;
    }
}
