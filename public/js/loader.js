document.addEventListener("DOMContentLoaded", () => {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");

    // 🔹 Assets to preload
    const assets = [
        "assets/img/player-paddle.png",
        "assets/img/bot-paddle.png",
        "assets/img/pingpong-poster.png",
        "assets/audio/paddle-hit-ball.wav",
        "assets/audio/ball-hit-table.wav",
        "assets/audio/score.wav",
        "assets/audio/win-sound.wav",
        "assets/audio/lose.wav"
    ];

    let loaded = 0;

    function updateProgress() {
        loaded++;
        const percent = Math.round((loaded / assets.length) * 100);
        progressBar.style.width = percent + "%";
        progressText.textContent = "Loading " + percent + "%";

        if (loaded === assets.length) {
            loader.classList.add("fade-out");
            setTimeout(() => {
                loader.style.display = "none";
                mainContent.style.display = "block";
            }, 800);
        }
    }

    function preloadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { updateProgress(); resolve(); };
            img.onerror = () => { updateProgress(); resolve(); };
            img.src = src;
        });
    }

    function preloadAudio(src) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => { updateProgress(); resolve(); };
            audio.onerror = () => { updateProgress(); resolve(); };
            audio.src = src;
            audio.load();
        });
    }

    // 🔹 Start preloading all
    Promise.all(
        assets.map(src =>
            src.endsWith(".png") ? preloadImage(src) : preloadAudio(src)
        )
    ).then(() => console.log("✅ All assets preloaded"));
});