import {
    playerScore, botScore, ball, player, bot, setPlayerScore, setBotScore,
    incrementPlayerScore, incrementBotScore, setServerTurn,
    currentCategory, currentLevel, levelsPerCategory, scoreEl,
    width, height, setmatchStartTime, ballHeld, serveTurn, setBallHeld
} from "./globals.js";

import {
    updateProgressUI, recordMatchCompletion, initProgress, grantRewards,
    updateBotMovement, unlockNextLevel, saveProgress,resetBall,
} from "./helperFunction/asyncFunctions.js";

import {
    drawTable, drawBall, updateBall,
    worldToScreen, hitPaddle, drawPaddle
} from "./helperFunction/canvasDrawFunctions.js";

import {SoundHandler} from "./soundHandler.js";

if (!window.soundHandler) window.soundHandler = new SoundHandler();

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const homeEl = document.querySelector(".play-active-bar");
    const categories = 10;
    const categoryOverlay = document.getElementById("categoryOverlay");
    const categoryList = document.getElementById("categoryList");
    const categoryIcon = document.getElementById("categoryIcon");
    // Extract category and level from URL parameters

    let pointerActive, running, imagesLoaded = false; //boolean variables
    let lastPointerX, lastPointerY = 0;
    let last = performance.now();
    const levelList = document.getElementById("levelList");
    const skipCategoryBtn = document.getElementById("skipCategoryBtn");

    skipCategoryBtn.addEventListener("click", () => {
        categoryOverlay.classList.add("hidden");
        startLevel(); // start the game
    });

    // Add this function for keyboard movement
    function updatePlayerFromKeyboard(dt) {
        const moveSpeed = 0.04 * dt;
        const verticalMoveSpeed = 0.02 * dt;

        if (keys["ArrowLeft"]) player.u = Math.max(0, player.u - moveSpeed);
        if (keys["ArrowRight"]) player.u = Math.min(1, player.u + moveSpeed);
        if (keys["ArrowUp"]) player.v = Math.max(0.6, player.v - verticalMoveSpeed);
        if (keys["ArrowDown"]) player.v = Math.min(0.95, player.v + verticalMoveSpeed);
    }



    // === Paddle Controls ===
    function pointerToU(x) {
        const left = worldToScreen(0, player.v);
        const right = worldToScreen(1, player.v);
        return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
    }

    canvas.addEventListener("pointerdown", (e) => {
        if (e.clientY > window.innerHeight * 0.6) {
            pointerActive = true;
            player.u = pointerToU(e.clientX);
        }
    });

// Enhanced pointer movement detection for 2D control
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pointerActive = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        // Initial position setting
        const targetU = pointerToU(e.clientX);
        const targetV = pointerToV(e.clientY);
        player.u = targetU;
        player.v = targetV;
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!pointerActive) return;
        e.preventDefault();

        const deltaY = e.clientY - lastPointerY;
        // Update last position
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        const sensitivity = 0.002; // Calculate movement sensitivity
        const targetU = pointerToU(e.clientX);// Horizontal movement (left/right)

        player.u = lerp(player.u, targetU, 0.5);// Vertical movement (forward/backward) - only for player
        player.v += deltaY * sensitivity;// Constrain player vertical movement within bounds
        player.v = Math.max(0.6, Math.min(0.95, player.v));
    });

    canvas.addEventListener("pointerup", (e) => {
        e.preventDefault();
        pointerActive = false;
    });

    canvas.addEventListener("pointercancel", (e) => {
        e.preventDefault();
        pointerActive = false;
    });

// Enhanced keyboard controls for precise movement
    const keys = {};
    window.addEventListener("keydown", (e) => {
        keys[e.key] = true;
        // Prevent arrow keys from scrolling the page
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener("resize", resize);
    resize();

    // === Helpers ===
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function renderLevels(category) {
        levelList.innerHTML = "";
        for (let i = 1; i <= levelsPerCategory; i++) {
            const btn = document.createElement("button");
            btn.textContent = `Level ${i}`;
            btn.addEventListener("click", () => {
                currentLevel = i;
                saveProgress();
                categoryOverlay.classList.remove("active");
                startLevel();
            });
            levelList.appendChild(btn);
        }
    }

    function loop(now) {
        const dt = Math.min(40, now - last);
        last = now;
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#b28aff");
        bg.addColorStop(1, "#120017");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        drawTable();
        updatePlayerFromKeyboard(dt);
        updateBotMovement(dt);
        // const p = worldToScreen(player.u, player.v);
        // drawPaddleImage(ctx, PlayerImg, p.x, p.y, Math.min(width, height) * 0.08);
        //
        // const b = worldToScreen(bot.u, bot.v);
        // drawPaddleImage(ctx,BotImg, b.x, b.y, Math.min(width, height) * 0.08);

        const b = worldToScreen(bot.u, bot.v);
        drawPaddle(ctx, b.x, b.y, Math.min(width, height) * 0.05, "#3498db", true, true);

        drawBall();
        const p = worldToScreen(player.u, player.v);
        drawPaddle(ctx, p.x, p.y, Math.min(width, height) * 0.05, "#e74c3c", false, true); //player paddle

        if (!ballHeld) {
            updateBall(dt);
        } else {
            // Keep ball aligned with player’s paddle until serve
            ball.u = player.u;
            ball.v = player.v - 0.03; // just above paddle
            ball.z = player.z;        // same depth
        }


        if (ball.v < bot.v - 0.15) {         // player scores
            incrementPlayerScore(true);
            resetBall();   // ✅ bot serve
            setServerTurn("bot");
            updateProgressUI();
        } else if (ball.v > player.v + 0.15) { // bot scores
            incrementBotScore(true);
            setServerTurn("bot");
            resetBall();   // ✅ player still serves
            updateProgressUI();
        }

        if (playerScore >= 7) {// Check win/lose conditions
            const {earnedXP, earnedCoins} = grantRewards(true);
            endLevel();
            showEndOverlay("win", earnedXP, earnedCoins);
            return;
        }
        if (botScore >= 7) {
            const {earnedXP, earnedCoins} = grantRewards(false);
            endLevel();
            showEndOverlay("lose", earnedXP, earnedCoins);
            return;
        }

        if (hitPaddle(bot)) {
            ball.vv = Math.abs(ball.vv) + 0.00005;
            ball.vu += (ball.u - bot.u) * 0.015;
            ball.v = bot.v + 0.03;
            ball.vz = 0.002;
        }


        if (hitPaddle(player)) {
            if (ballHeld) {
                // Serve
                setBallHeld(false);
                ball.vv = -0.0012; // upward
                ball.vu = (Math.random() - 0.5) * 0.001;
            } else {
                // Rally return
                ball.vv = -Math.abs(ball.vv) - 0.00005;
                ball.vu += (ball.u - player.u) * 0.02;
                ball.v = player.v - 0.03;
                ball.vz = 0.002;
            }
        }


        requestAnimationFrame(loop);
    }

// Helper function for vertical pointer conversion
    function pointerToV(y) {
        const top = worldToScreen(0.5, -0.5).y;    // Top of playable area
        const bottom = worldToScreen(0.5, 1.0).y;  // Bottom of playable area
        const normalizedY = (y - top) / (bottom - top);
        return Math.max(-0.5, Math.min(1.0, normalizedY * 1.5 - 0.5));
    }

// Enhanced touch controls for mobile devices
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            pointerActive = true;
            lastPointerX = e.touches[0].clientX;
            lastPointerY = e.touches[0].clientY;
        }
    });

    canvas.addEventListener("touchmove", (e) => {
        if (!pointerActive || e.touches.length === 0) return;
        e.preventDefault();
        const touch = e.touches[0];
        const deltaY = touch.clientY - lastPointerY;
        lastPointerX = touch.clientX;
        lastPointerY = touch.clientY;
        const touchSensitivity = 0.003; // More sensitive touch controls
        const targetU = pointerToU(touch.clientX); // Horizontal movement
        player.u = lerp(player.u, targetU, 0.7);
        player.v += deltaY * touchSensitivity; // Vertical movement
        player.v = Math.max(0.6, Math.min(0.95, player.v));
    });

    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        pointerActive = false;
    });

    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault(); // stop page scroll/zoom
        pointerActive = true;
        player.u = pointerToU(e.clientX);
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!pointerActive) return;
        e.preventDefault();
        const targetU = pointerToU(e.clientX);
        player.u = lerp(player.u, targetU, 0.9);// Smooth follow for touch/mouse
    });

    canvas.addEventListener("pointerup", (e) => {
        e.preventDefault();
        pointerActive = false;
    });

    canvas.addEventListener("pointercancel", (e) => {
        e.preventDefault();
        pointerActive = false;
    });


    function showEndOverlay(mode, earnedXP = 0, earnedCoins = 0) {
        const endOverlay = document.getElementById("endOverlay");
        const title = document.getElementById("endTitle");
        const emoji = document.getElementById("endEmoji");
        const nextBtn = document.getElementById("nextBtn");
        const reviveBtn = document.getElementById("reviveBtn");
        const startBtn = document.getElementById("startBtn");
        const exitBtn = document.getElementById("exitBtn");

        // Hide everything first
        [nextBtn, reviveBtn, startBtn, exitBtn].forEach(btn => btn.classList.add("hidden"));

        if (mode === "start") {
            title.textContent = "🏓 Ping Pong Challenge";
            emoji.textContent = "";
            startBtn.classList.remove("hidden");
            exitBtn.classList.remove("hidden");

            startBtn.onclick = () => {
                endOverlay.classList.remove("active");
                startLevel(); // normal start
            };

            exitBtn.onclick = () => {
                window.location.href = "/";
            };

        } else if (mode === "win") {
            title.textContent = "🎉 You Win!";
            emoji.textContent = "😃";
            [nextBtn, exitBtn].forEach(btn => btn.classList.remove("hidden"));
            document.getElementById("earnedXP").textContent =`⭐ ${earnedXP}`;
            document.getElementById("earnedCoins").textContent =`🟡 ${earnedCoins}`;

            nextBtn.onclick = () => {
                unlockNextLevel();
                endOverlay.classList.remove("active");
                startLevel();
            };

        } else if (mode === "lose") {
            title.textContent = "Level Failed!";
            emoji.textContent = "😟";
            [reviveBtn, exitBtn].forEach(btn => btn.classList.remove("hidden"));
            document.getElementById("earnedXP").textContent =`⭐ ${earnedXP}`;
            document.getElementById("earnedCoins").textContent =`🟡 ${earnedCoins}`;

            reviveBtn.onclick = () => {
                endOverlay.classList.remove("active");
                startLevel();
            };
        }

        endOverlay.classList.add("active");
    }

    //
    // document.getElementById("home-Btn").addEventListener("click", () => {
    //     window.location.href = "/"; // go home
    // });


    // Modify the startLevel function to ensure player serves first
    function startLevel() {
        scoreEl.classList.add("active");
        homeEl.classList.add("active");
        // Player always serves first at the start of a level
        setPlayerScore(0)
        setBotScore(0)
        updateProgressUI();
        running = true;

        // setBallHeld(true);   // ✅ ball starts in player’s hand
        setServerTurn("bot");
        setBallHeld(true);
        resetBall();
        last = performance.now();
        setmatchStartTime(performance.now());
        loop(performance.now());
    }

    function endLevel() {
        running = false;
        const win = playerScore > botScore;
        recordMatchCompletion(win);
    }

// Build categories
    for (let i = 1; i <= categories; i++) {
        const btn = document.createElement("button");
        btn.textContent = `Category ${i}`;
        btn.addEventListener("click", () => {
            currentCategory = i;
            renderLevels(i);
        });
        categoryList.appendChild(btn);
    }


    categoryIcon.addEventListener("click", () => {
        categoryOverlay.classList.add("active"); // re-open overlay so user sees category & level
    });
    sessionStorage.getItem("xp");
    // resetBall();
    // Instead of starting immediately, show start overlay

// ✅ Instead of starting immediately, show start overlay
    initProgress();
    showEndOverlay("start");

});