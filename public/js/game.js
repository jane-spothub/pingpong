import {SoundHandler} from "./soundHandler.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const soundHandler = new SoundHandler();
    const scoreEl = document.getElementById("score-display");

    // const startBtn = document.getElementById("startBtn");
    // const btnBack = document.getElementById("btn-back");
    // const btnExit = document.getElementById("btn-exit");
    // const btnMute = document.getElementById("btn-mute");
    // endOverlay.classList.remove("hidden");
    let playerScore = 0;
    let botScore = 0;

    let botSpeed = 0.00025; // default
    // btnMute.textContent = "🔊";
    let width = 800,
        height = 800;

    const playerImg = new Image();
    playerImg.src = "assets/img/player-paddle.png";

    const botImg = new Image();
    botImg.src = "assets/img/bot-paddle.png"; // fixed typo
    let imagesLoaded = 0;

    // function showOverlay() {
    //     overlay.classList.add("active");
    // }
    //
    // function hideOverlay() {
    //     overlay.classList.remove("active");
    // }

    // showOverlay(); // show the difficulty overlay immediately

    // [playerImg, botImg].forEach(img => {
    //     img.onload = () => {
    //         imagesLoaded++;
    //         if (imagesLoaded === 2) {
    //             console.log("✅ Both paddles ready");
    //             // Only now allow the game to start
    //             resetBall("bot");
    //             // startGame();
    //             startLevel();
    //         }
    //         // if (imagesLoaded === 2) {
    //         //     console.log("✅ Both paddles ready");
    //         //     drawScene();  // show frozen preview
    //         //     updateScore();
    //         // }
    //     };
    //     img.onerror = () => console.error("❌ Failed to load", img.src);
    // });
    Promise.all([
        new Promise(res => playerImg.onload = res),
        new Promise(res => botImg.onload = res)
    ]).then(() => {
        console.log("✅ Images ready, starting level");
        resetBall("bot");
        startLevel();
    }).catch(() => {
        console.warn("⚠️ Images failed, starting anyway");
        resetBall("bot");
        startLevel();
    });


    // btnMute.addEventListener("click", () => {
    //     soundHandler.toggleMute();
    //     btnMute.textContent = soundHandler.muted ? "🔇" : "🔊";
    //     // for img
    //     // btnMute.style.backgroundImage = soundHandler.muted
    //     //     ? `url(${muteIcon})`
    //     //     : `url(${unmuteIcon})`;
    // });


    let difficulty = window.difficulty || "easy";

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        canvas.style.width = "100%";
        canvas.style.height = "100%";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }


    window.addEventListener("resize", resize);
    resize();


    // === Helpers ===
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function tableCorners() {
        const w = width;
        const h = height;

        const topScale = 1.0;          // perspective
        const tableHeight = h * 0.65;  // % of screen height
        const tableWidthBottom = w * 0.9;
        const tableWidthTop = tableWidthBottom * topScale;

        const bottomY = h * 0.88;
        const topY = bottomY - tableHeight;

        return {
            lt: {x: (w - tableWidthTop) / 2, y: topY},   // left top
            rt: {x: (w + tableWidthTop) / 2, y: topY},   // right top
            rb: {x: (w + tableWidthBottom) / 2, y: bottomY}, // right bottom
            lb: {x: (w - tableWidthBottom) / 2, y: bottomY}, // left bottom
        };
    }


    function worldToScreen(u, v) {
        const c = tableCorners();
        const topX = lerp(c.lt.x, c.rt.x, u);
        const topY = lerp(c.lt.y, c.rt.y, u);
        const bottomX = lerp(c.lb.x, c.rb.x, u);
        const bottomY = lerp(c.lb.y, c.rb.y, u);
        return {
            x: lerp(topX, bottomX, v),
            y: lerp(topY, bottomY, v),
            scale: lerp(0.6, 1.0, v), // perspective scale
        };
    }


    const player = {u: 0.5, v: 0.83, w: 0.25}; // below bottom edge
    const bot = {u: 0.5, v: -0.02, w: 0.25}; // above top edge

    const ball = {
        u: 0.5, v: 0.5,
        vu: 0.004, vv: 0.004,
        z: 0, vz: 0,       // height above table, vertical velocity
        radius: 0.03
    };


    let running = false;
    let last = performance.now();
    let pointerDown = false;
    let lastPointerU = player.u;
    let spinBoost = 0;

    // === Drawing Functions ===
    function drawTable() {
        ctx.save();

        const w = width;
        const h = height;

        const tableHeight = h * 0.65;
        const tableWidth = w * 0.9;

        const topY = (h - tableHeight) / 2;
        const bottomY = topY + tableHeight;

        const left = (w - tableWidth) / 2;
        const right = left + tableWidth;

        const leftTop = {x: left, y: topY};
        const rightTop = {x: right, y: topY};
        const leftBottom = {x: left, y: bottomY};
        const rightBottom = {x: right, y: bottomY};


        // === Shadow around the table ===
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 30;       // softness of shadow
        ctx.shadowOffsetX = 0;     // equal all sides
        ctx.shadowOffsetY = 0;

        // === table top ===
        const grd = ctx.createLinearGradient(leftTop.x, topY, leftBottom.x, bottomY);
        grd.addColorStop(0, "#75c93f");
        grd.addColorStop(1, "#75c93f");

        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(leftTop.x, leftTop.y);
        ctx.lineTo(rightTop.x, rightTop.y);
        ctx.lineTo(rightBottom.x, rightBottom.y);
        ctx.lineTo(leftBottom.x, leftBottom.y);
        ctx.closePath();
        ctx.fill();

        // outline
        ctx.lineWidth = 12;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        // midline
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        const midTopX = (leftTop.x + rightTop.x) / 2;
        const midBottomX = (leftBottom.x + rightBottom.x) / 2;
        ctx.beginPath();
        ctx.moveTo(midTopX, topY);
        ctx.lineTo(midBottomX, bottomY);
        ctx.stroke();

        ctx.restore();
    }

    function drawNet() {
        ctx.save();

        const w = width;
        const h = height;

        const tableHeight = h * 0.65;
        const tableWidth = w * 0.9;

        const topY = (h - tableHeight) / 2;
        const bottomY = topY + tableHeight;
        const left = (w - tableWidth) / 2;
        const right = left + tableWidth;

        // Middle Y (center of the table)
        const midY = (topY + bottomY) / 2;

        const netThickness = 8;   // thickness of the white part
        const borderThickness = 2; // thickness of black borders

        // --- Draw white net (center band) ---
        ctx.beginPath();
        ctx.moveTo(left, midY);
        ctx.lineTo(right, midY);
        ctx.lineWidth = netThickness;
        ctx.strokeStyle = "white";
        ctx.stroke();

        // --- Draw black top border ---
        ctx.beginPath();
        ctx.moveTo(left, midY - netThickness / 2);
        ctx.lineTo(right, midY - netThickness / 2);
        ctx.lineWidth = borderThickness;
        ctx.strokeStyle = "black";
        ctx.stroke();

        // --- Draw black bottom border ---
        ctx.beginPath();
        ctx.moveTo(left, midY + netThickness / 2);
        ctx.lineTo(right, midY + netThickness / 2);
        ctx.lineWidth = borderThickness;
        ctx.strokeStyle = "black";
        ctx.stroke();

        ctx.restore();
    }

    function updateBall(dt) {
        // move in table plane
        ball.u += ball.vu * dt;
        ball.v += ball.vv * dt;

        // apply gravity
        ball.vz += gravity * dt;
        ball.z += ball.vz * dt;

        // bounce off table
        if (ball.z <= 0) {
            ball.z = 0;
            ball.vz *= -bounceFactor;
            soundHandler.play("hitTable");
        }

        // bounce off side walls
        if (ball.u < 0 || ball.u > 1) {
            ball.vu *= -1;

            soundHandler.play("hitTable");

        }
    }

    // physics constants
    const gravity = -0.00005; // pull ball down
    const bounceFactor = 0.7; // how much energy is kept after bounce

    function drawBall() {
        const p = worldToScreen(ball.u, ball.v);
        const r = ball.radius * Math.min(width, height) * p.scale;

        ctx.save();

        // shadow
        const shadowScale = 1 - Math.min(0.8, ball.z * 4);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + r + 5, r * 1.3 * shadowScale, r * 0.5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.filter = "blur(4px)";
        ctx.fill();
        ctx.filter = "none";

        // ball body (lifted by z height)
        ctx.beginPath();
        ctx.arc(p.x, p.y - ball.z * 300, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
            p.x - r / 3, p.y - ball.z * 300 - r / 3, r * 0.2,
            p.x, p.y - ball.z * 300, r
        );
        grad.addColorStop(0, "#fff");
        grad.addColorStop(1, "#ccc");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

//     function drawPaddle(ctx, x, y, radius, color, isBot = false, useRound = false) {
//         ctx.save();
//
//         // === Shadow below paddle ===
//         ctx.beginPath();
//         ctx.ellipse(x + radius * 0.2, y + radius * 0.3, radius * 1.1, radius * 0.4, 0, 0, Math.PI * 2);
//         ctx.fillStyle = "rgba(0,0,0,0.35)";
//         ctx.filter = "blur(6px)";
//         ctx.fill();
//         ctx.filter = "none";
//
//         if (useRound) {
//             // --- 🏓 Paddle head (round, glossy) ---
//             const grad = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, radius * 0.2, x, y, radius);
//             grad.addColorStop(0, color === "#e74c3c" ? "#ff6f61" : "#61a5ff"); // brighter center (red or blue)
//             grad.addColorStop(0.6, color);
//             grad.addColorStop(1, "#222"); // dark edge
//
//             ctx.fillStyle = grad;
//             ctx.beginPath();
//             ctx.arc(x, y, radius, 0, Math.PI * 2);
//             ctx.fill();
//
//             // --- Shine ---
//             const shine = ctx.createRadialGradient(x - radius * 0.5, y - radius * 0.5, radius * 0.1, x, y, radius);
//             shine.addColorStop(0, "rgba(255,255,255,0.5)");
//             shine.addColorStop(1, "rgba(255,255,255,0)");
//             ctx.fillStyle = shine;
//             ctx.beginPath();
//             ctx.arc(x, y, radius, 0, Math.PI * 2);
//             ctx.fill();
//
//             // --- 🪵 Handle ---
//             const handleWidth = radius * 0.45;
//             const handleHeight = radius * 1.2;
//             const handleY = isBot ? y - radius - handleHeight + 10 : y + radius - 10;
//
//             // wood base
//             ctx.fillStyle = "#8B5A2B";
//             ctx.beginPath();
//             ctx.roundRect(x - handleWidth / 2, handleY, handleWidth, handleHeight, 10);
//             ctx.fill();
//
//             // wood shading
//             const woodGrad = ctx.createLinearGradient(x - handleWidth / 2, handleY, x + handleWidth / 2, handleY + handleHeight);
//             woodGrad.addColorStop(0, "rgba(0,0,0,0.2)");
//             woodGrad.addColorStop(1, "rgba(255,255,255,0.1)");
//             ctx.fillStyle = woodGrad;
//             ctx.beginPath();
//             ctx.roundRect(x - handleWidth / 2, handleY, handleWidth, handleHeight, 10);
//             ctx.fill();
//
//             // outline
//             ctx.lineWidth = 3;
//             ctx.strokeStyle = "#000";
//             ctx.stroke();
//         } else {
//             // fallback (old style rectangular paddle)
//             ctx.fillStyle = color;
//             ctx.fillRect(x - radius / 2, y - radius / 2, radius, radius * 0.25);
//         }
//
//         ctx.restore();
//     }

    function drawPaddle(ctx, x, y, radius, color, isBot = false, useRound = true) {
        ctx.save();

        // === Shadow below paddle ===
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.2, y + radius * 0.3, radius * 1.1, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.filter = "blur(6px)";
        ctx.fill();
        ctx.filter = "none";

        if (useRound) {
            // --- 🏓 Paddle head (round glossy gradient) ---
            const grad = ctx.createRadialGradient(
                x - radius * 0.4, y - radius * 0.4, radius * 0.2,
                x, y, radius
            );
            grad.addColorStop(0, color === "#e74c3c" ? "#ff6f61" : "#61a5ff"); // brighter inner glow
            grad.addColorStop(0.6, color);
            grad.addColorStop(1, "#222"); // darker outer edge

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // --- Shine reflection ---
            const shine = ctx.createRadialGradient(
                x - radius * 0.5, y - radius * 0.5, radius * 0.1,
                x, y, radius
            );
            shine.addColorStop(0, "rgba(255,255,255,0.5)");
            shine.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // --- 🪵 Handle (wood look) ---
            const handleWidth = radius * 0.45;
            const handleHeight = radius * 1.2;
            const handleY = isBot ? y - radius - handleHeight + 10 : y + radius - 10;

            // Wood base
            ctx.fillStyle = "#8B5A2B";
            ctx.beginPath();
            ctx.roundRect(x - handleWidth / 2, handleY, handleWidth, handleHeight, 10);
            ctx.fill();

            // Wood shading overlay
            const woodGrad = ctx.createLinearGradient(
                x - handleWidth / 2, handleY,
                x + handleWidth / 2, handleY + handleHeight
            );
            woodGrad.addColorStop(0, "rgba(0,0,0,0.25)");
            woodGrad.addColorStop(1, "rgba(255,255,255,0.15)");
            ctx.fillStyle = woodGrad;
            ctx.beginPath();
            ctx.roundRect(x - handleWidth / 2, handleY, handleWidth, handleHeight, 10);
            ctx.fill();

            // Handle outline
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#000";
            ctx.stroke();
        } else {
            // --- fallback old rectangle paddle ---
            ctx.fillStyle = color;
            ctx.fillRect(x - radius / 2, y - radius / 2, radius, radius * 0.25);
        }

        ctx.restore();
    }


    // === Logic ===
    function resetBall(to = "player") {
        if (to === "bot") {
            ball.u = bot.u;
            ball.v = bot.v + 0.06;
        } else {
            ball.u = player.u;
            ball.v = player.v - 0.06;
        }

        let speedFactor = 0.7; // easy
        botSpeed = 0.00020;    // default bot speed

        if (difficulty === "medium") {
            speedFactor = 1.4;
            botSpeed = 0.00035;
        }
        if (difficulty === "hard") {
            speedFactor = 2.0;
            botSpeed = 0.00055;
        }

        // random horizontal push
        ball.vu = (Math.random() - 0.5) * 0.0012 * speedFactor;
        // vertical push depending on server
        ball.vv = (to === "bot" ? 0.0011 : -0.0011) * speedFactor;
    }

    // === Input ===

    function pointerToU(x) {
        const left = worldToScreen(0, player.v);
        const right = worldToScreen(1, player.v);
        let u = (x - left.x) / (right.x - left.x);
        return Math.max(0, Math.min(1, u * 1.1 - 0.05)); // faster response
    }

    // function pointerToU(x) {
    //     const left = worldToScreen(0, player.v);
    //     const right = worldToScreen(1, player.v);
    //     return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
    // }
    //
    // canvas.addEventListener("pointerdown", (e) => {
    //     pointerDown = true;
    //     player.u = lastPointerU = pointerToU(e.clientX);
    // });
    // canvas.addEventListener("pointermove", (e) => {
    //     if (!pointerDown) return;
    //     const u = pointerToU(e.clientX);
    //     spinBoost = (u - lastPointerU) * 0.075;
    //     lastPointerU = u;
    //     player.u = u;
    // });
    canvas.addEventListener("pointermove", (e) => {
        if (e.clientY > window.innerHeight * 0.6) {
            player.u = pointerToU(e.clientX);

        }
    });
    canvas.addEventListener("pointermove", (e) => {
        const targetU = pointerToU(e.clientX);
        player.u = lerp(player.u, targetU, 0.25); // smooth follow
    });


    canvas.addEventListener("pointerup", () => (pointerDown = false));
    canvas.addEventListener("pointercancel", () => (pointerDown = false));
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") player.u = Math.max(0, player.u - 0.04);
        if (e.key === "ArrowRight") player.u = Math.min(1, player.u + 0.04);
        if (e.key === "ArrowUp") player.v = Math.max(0.7, player.v - 0.02);   // forward
        if (e.key === "ArrowDown") player.v = Math.min(0.95, player.v + 0.02); // backward
    });

    function hitPaddle(paddle) {

        const du = ball.u - paddle.u;
        const dv = ball.v - paddle.v;
        const dist = Math.sqrt(du * du + dv * dv);
        return dist < 0.06; // hit radius (tweak as needed)
    }

    // === Loop ===
    function loop(now) {
        // if (!running) return;
        const dt = Math.min(40, now - last);
        last = now;

        updateBall(dt);
        // bot AI
        const speed = botSpeed * dt;
        if (bot.u < ball.u - 0.02) bot.u += speed;
        if (bot.u > ball.u + 0.02) bot.u -= speed;

        // move ball
        ball.u += ball.vu * dt;
        ball.v += ball.vv * dt;

        // walls
        if (ball.u < 0 || ball.u > 1) ball.vu *= -1;

        // collisions
        if (
            ball.v > player.v - 0.05 &&
            ball.v < player.v + 0.05 &&
            Math.abs(ball.u - player.u) < player.w * 0.5 &&
            ball.vv > 0
        ) {
            ball.vv = -Math.abs(ball.vv) - 0.00005;
            ball.vu += (ball.u - player.u) * 0.015 + spinBoost;
            ball.v = player.v - 0.03;
        }

        if (
            ball.v < bot.v + 0.05 &&
            ball.v > bot.v - 0.05 &&
            Math.abs(ball.u - bot.u) < bot.w * 0.5 &&
            ball.vv < 0
        ) {

            ball.vv = Math.abs(ball.vv) + 0.00005;
            ball.vu += (ball.u - bot.u) * 0.012;
            ball.v = bot.v + 0.03;
        }
        // Player hit
        if (hitPaddle(player) && ball.vv > 0) {

            soundHandler.play("hitPaddle");

            ball.vv = -Math.abs(ball.vv) - 0.00005;
            ball.vu += (ball.u - player.u) * 0.015 + spinBoost;
            ball.v = player.v - 0.03;
        }

// Bot hit
        if (hitPaddle(bot) && ball.vv < 0) {
            soundHandler.play("hitPaddle");

            ball.vv = Math.abs(ball.vv) + 0.00005;
            ball.vu += (ball.u - bot.u) * 0.012;
            ball.v = bot.v + 0.03;
        }

        // scoring
        if (ball.v < bot.v - 0.08) { // player scores
            playerScore++;
            soundHandler.play("score");
            // addXP(50);    // XP reward
            // addCoins(10); // coins reward
            resetBall("bot");
            updateProgressUI(); // ✅ refresh UI immediately

        } else if (ball.v > player.v + 0.08) { // bot scores
            botScore++;

            soundHandler.play("score");
            // addXP(20);    // smaller XP for playing
            resetBall("player");
            updateProgressUI(); // ✅ refresh UI immediately

        }
        // === Check win/lose conditions ===
        if (playerScore >= 7) {
            const {earnedXP, earnedCoins} = grantRewards(true);
            endLevel();
            showEndOverlay(true, earnedXP, earnedCoins);
            return;
        }

        if (botScore >= 7) {
            const {earnedXP, earnedCoins} = grantRewards(false);
            endLevel();
            showEndOverlay(false, earnedXP, earnedCoins);
            return;
        }


        ctx.clearRect(0, 0, width, height);
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#eeb030");
        bg.addColorStop(1, "#fcce70");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        drawTable();
        drawNet();

        // convert logical (u,v) → screen coords
        const botScreen = worldToScreen(bot.u, bot.v);
        const playerScreen = worldToScreen(player.u, player.v);

// radius should scale with perspective
        const baseRadius = Math.min(width, height) * 0.06; // tweak size
        const botRadius = baseRadius;
        const playerRadius = baseRadius;
        if (ball.v < player.v - 0.05) {
            drawBall();
            drawPaddle(ctx, botScreen.x, botScreen.y, botRadius, "#3498db", true, true);
            drawPaddle(ctx, playerScreen.x, playerScreen.y, playerRadius, "#e74c3c", false, true);
        } else {
            drawPaddle(ctx, botScreen.x, botScreen.y, botRadius, "#3498db", true, true);
            drawBall();
            drawPaddle(ctx, playerScreen.x, playerScreen.y, playerRadius, "#e74c3c", false, true);
        }


        requestAnimationFrame(loop);
    }

    // === Start ===
    // startBtn.addEventListener("click", () => {
    //     if (imagesLoaded < 2) {
    //         alert("Game is still loading assets...");
    //         return;
    //     }
    //
    //
    //     overlay.style.display = "none";
    //     running = true;
    //     resetBall("bot");
    //     last = performance.now();
    //     loop(last);
    // });
    // function startGame() {
    //     if (imagesLoaded < 2) {
    //         console.log("⏳ Waiting for assets...");
    //         return;
    //     }
    //     overlay.style.display = "none";
    //     running = true;
    //     resetBall("bot");
    //     last = performance.now();
    //     loop(last);
    // }
//
// // auto-start once assets are loaded
//     [playerImg, botImg].forEach(img => {
//         img.onload = () => {
//             imagesLoaded++;
//             if (imagesLoaded === 2) startGame();
//         };
//     });

    // btnBack.addEventListener("click", () => (location.href = "/"));
    // btnExit.addEventListener("click", () => (location.href = "/"));

//     game progression
    // === Player Progression ===
    let playerXP = 0;
    let playerLevel = 1;
    let playerCoins = 0;

// XP thresholds for each level
    const xpNeeded = [0, 100, 250, 500, 1000]; // expand as needed

    const xpEl = document.getElementById("xp-display");
    const coinsEl = document.getElementById("coins-display");

    function updateProgressUI() {
        xpEl.textContent = `XP: ${playerXP} | Lvl: ${playerLevel}`;
        coinsEl.textContent = `💰 ${playerCoins}`;
        scoreEl.textContent = `Player: ${playerScore} | Bot: ${botScore}`;
        const stageEl = document.getElementById("levelReached");
        stageEl.textContent = `Category ${currentCategory} - Lvl ${currentLevel}`;
    }

    function addXP(amount, allowLevelUp = true) {
        playerXP += amount;

        // Check level up
        if (allowLevelUp) {
            if (playerLevel < xpNeeded.length - 1 && playerXP >= xpNeeded[playerLevel]) {
                playerLevel = Math.max(1, playerLevel + 1);
            }
        }


        updateProgressUI();
        saveProgress(); // also persist to backend
    }

    function addCoins(amount) {
        playerCoins += amount;
        updateProgressUI();
    }

    // === Load saved progress from localStorage ===
    async function loadProgress() {
        try {
            const res = await fetch("/api/progress");
            if (!res.ok) throw new Error("Failed to load progress");
            const data = await res.json();
            playerXP = data.xp || 0;
            playerLevel = data.level && data.level > 0 ? data.level : 1;
            playerCoins = data.coins || 0;
            currentCategory = data.category || 1;
            currentLevel = data.stage || 1;

            updateProgressUI();
        } catch (err) {
            console.error(err);
        }
    }

    async function initProgress() {
        await loadProgress();
        updateProgressUI();
    }

    async function saveProgress() {
        try {
            await fetch("/api/progress", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    xp: playerXP,
                    level: playerLevel,
                    coins: playerCoins,
                    category: currentCategory,
                    stage: currentLevel
                })
            });
        } catch (err) {
            console.error("❌ Failed to save progress", err);
        }
    }

    function showEndOverlay(win, earnedXP, earnedCoins) {
        const endOverlay = document.getElementById("endOverlay");

        const title = document.getElementById("endTitle");
        const emoji = document.getElementById("endEmoji");
        const nextBtn = document.getElementById("nextBtn");
        const reviveBtn = document.getElementById("reviveBtn");

        // Update stats
        document.getElementById("earnedXP").textContent = earnedXP;
        document.getElementById("earnedCoins").textContent = earnedCoins;
        // document.getElementById("totalXP").textContent = playerXP;
        // document.getElementById("totalCoins").textContent = playerCoins;
        document.getElementById("levelReached").textContent = playerLevel;

        if (win) {
            title.textContent = "🎉 You Win!";
            emoji.textContent = "😃";
            reviveBtn.style.display = "none";
            nextBtn.style.display = "inline-block";
            nextBtn.onclick = () => {
                unlockNextLevel();
                endOverlay.classList.remove("active"); // ✅ hide overlay after button click
                startLevel();
            };
        } else {
            title.textContent = "Level Failed!";
            emoji.textContent = "😟";
            reviveBtn.style.display = "inline-block";
            nextBtn.style.display = "none";

            reviveBtn.onclick = () => {
                endOverlay.classList.remove("active"); // ✅ hide overlay after revive
                startLevel();
            };
        }

        // ✅ Show overlay
        endOverlay.classList.add("active");
    }


    document.getElementById("homeBtn").addEventListener("click", () => {
        window.location.href = "/"; // go home
    });
    // let levelTime = 30; // seconds
    // let levelXPGoal = 200; // target XP for win
    // let levelTimerId = null;
    const rewardRules = {
        1: {winXP: 100, loseXP: 50, winCoins: 50, loseCoins: 25},
        2: {winXP: 120, loseXP: 60, winCoins: 60, loseCoins: 30},
        // Add more categories if needed
    };

    function grantRewards(win) {
        const rules = rewardRules[currentCategory] || rewardRules[1];
        let earnedXP, earnedCoins;

        if (win) {
            earnedXP = rules.winXP;
            earnedCoins = rules.winCoins;
            addXP(earnedXP); // allow level up


        } else {
            earnedXP = rules.loseXP;
            earnedCoins = rules.loseCoins;
            addXP(earnedXP, false); // XP adds, but no level up

        }

        addXP(earnedXP);
        addCoins(earnedCoins);

        saveProgress(); // ✅ persist changes

        return {earnedXP, earnedCoins};
    }


    function startLevel() {
        document.getElementById("progressBar").classList.remove("active");
        scoreEl.classList.add("active");

        // playerXP = 0;
        // playerCoins = 0;
        playerScore = 0;
        botScore = 0;
        updateProgressUI();

        running = true;
        resetBall("bot");
        last = performance.now();


        loop(performance.now());
    }


    function endLevel() {
        running = false;
        // if (levelTimerId) clearInterval(levelTimerId);
        scoreEl.classList.remove("active");
        document.getElementById("progressBar").classList.add("active");
    }

    const categories = 10;
    const levelsPerCategory = 30;
    let currentCategory = null;
    let currentLevel = null;

// Elements
    const categoryOverlay = document.getElementById("categoryOverlay");
    const categoryList = document.getElementById("categoryList");
    const levelList = document.getElementById("levelList");
    const skipCategoryBtn = document.getElementById("skipCategoryBtn");
    skipCategoryBtn.addEventListener("click", () => {
        categoryOverlay.classList.add("hidden"); // hide overlay
        startLevel(); // just start the game
    });
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

    // const categories = 10;
    // const levelsPerCategory = 30;
    //
    // let currentCategory = 1;
    // let currentLevel = 1;

    function unlockNextLevel() {
        currentLevel++;
        // Optional: if you want to roll over to the next category
        if (currentLevel > levelsPerCategory) {
            currentLevel = 1;
            currentCategory++;
        }
        saveProgress();
        updateProgressUI();
    }

    const unlocks = {
        1: {table: "classic", paddle: "default", ball: "white"},
        2: {paddle: "neon", ball: "fire"},
        3: {table: "space", paddle: "laser"},
        // ... up to 10
    };

    function getUnlockedTheme(category) {
        return unlocks[category] || unlocks[1];
    }

    const categoryIcon = document.getElementById("categoryIcon");

    function showCategoryIcon() {
        if (currentCategory && currentLevel) {
            categoryIcon.textContent = currentCategory; // show just category number
            categoryIcon.classList.remove("hidden");
        }
    }

    categoryIcon.addEventListener("click", () => {
        // re-open overlay so user sees category & level
        categoryOverlay.classList.add("active");
    });


    sessionStorage.setItem("xp", playerXP);
    sessionStorage.getItem("xp");

    resetBall("bot");
    initProgress();


});
