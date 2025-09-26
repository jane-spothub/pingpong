document.addEventListener("DOMContentLoaded", () => {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const loader = document.getElementById("loader");
    const gameContainer = document.getElementById("gameContainer");
    const overlay = document.querySelector(".username-overlay");

    // ✅ Add a Continue button
    const continueBtn = document.createElement("button");
    continueBtn.textContent = "Tap to Start";
    continueBtn.id = "continueBtn";
    continueBtn.style.display = "none";
    continueBtn.style.marginTop = "20px";
    continueBtn.style.padding = "10px 20px";
    continueBtn.style.fontSize = "1.2rem";
    continueBtn.style.cursor = "pointer";
    continueBtn.style.borderRadius = "10px";
    continueBtn.style.border = "none";
    continueBtn.style.background = "linear-gradient(135deg, #00c6ff, #0072ff)";
    continueBtn.style.color = "#000";
    continueBtn.style.fontWeight = "bold";
    document.querySelector(".loader-content").appendChild(continueBtn);

    // 🔹 Assets to preload
    const assets = [
        "assets/img/ProplayerPaddle.png",
        "assets/img/ProBotPaddle.png",
        "assets/img/bot-paddle.png",
        "assets/img/pingpong-poster.png",
        "assets/audio/paddle-hit-ball.wav",
        "assets/audio/ball-hit-table.wav",
        "assets/audio/pinpon-bg-snd.mp3",
        "assets/audio/win-sound.wav",
        "assets/audio/lose.wav",
    ];

    let loaded = 0;

    function updateProgress() {
        loaded++;
        const percent = Math.round((loaded / assets.length) * 100);
        progressBar.style.width = percent + "%";
        progressText.textContent = "Loading " + percent + "%";

        if (loaded === assets.length) {
            continueBtn.style.display = "inline-block";
            progressText.textContent = "Loading complete!";
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

    Promise.all(
        assets.map(src =>
            src.endsWith(".png") ? preloadImage(src) : preloadAudio(src)
        )
    ).then(() => console.log("✅ All assets preloaded"));

    // 🔹 Continue button click
    continueBtn.addEventListener("click", () => {
        loader.classList.add("fade-out");
        setTimeout(() => {
            loader.style.display = "none";

            // 👉 First show username overlay
            overlay.classList.remove("hidden");

            // Hide the game container until username is entered
            gameContainer.style.display = "none";
        }, 300);
    });
});
