import {SoundHandler} from "./soundHandler.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const soundHandler = new SoundHandler();
    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("startBtn");
    const btnBack = document.getElementById("btn-back");
    const btnExit = document.getElementById("btn-exit");
    const btnMute = document.getElementById("btn-mute");
    const scoreEl = document.getElementById("score");
    const round = document.getElementById("round");
    // const roundWon = document.getElementById("round-won");
    let botSpeed = 0.00025; // default
    btnMute.textContent = "🔊";
    let width = 800,
        height = 800;
    // const levelButtons = document.querySelectorAll(".level-btn");

    const playerImg = new Image();
    playerImg.src = "assets/img/player-paddle.png";

    const botImg = new Image();
    botImg.src = "assets/img/bot-paddle.png"; // fixed typo
    let imagesLoaded = 0;

    function showOverlay() {
        overlay.classList.add("active");
    }

    function hideOverlay() {
        overlay.classList.remove("active");
    }

    document.addEventListener("DOMContentLoaded", () => {
        showOverlay(); // show the difficulty overlay immediately
    });

    [playerImg, botImg].forEach(img => {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === 2) {
                console.log("✅ Both paddles ready");
                // Only now allow the game to start
                resetBall("bot");
                updateScore();
            }
        };
        img.onerror = () => console.error("❌ Failed to load", img.src);
    });

    btnMute.addEventListener("click", () => {
        soundHandler.toggleMute();
        btnMute.textContent = soundHandler.muted ? "🔇" : "🔊";
        // for img
        // btnMute.style.backgroundImage = soundHandler.muted
        //     ? `url(${muteIcon})`
        //     : `url(${unmuteIcon})`;
    });


    let difficulty = window.difficulty || "easy";

    // levelButtons.forEach(btn => {
    //     btn.addEventListener("click", () => {
    //         difficulty = btn.dataset.level;
    //
    //         if (difficulty === "easy") botSpeed = 0.00018;
    //         if (difficulty === "medium") botSpeed = 0.00025;
    //         if (difficulty === "hard") botSpeed = 0.00035;
    //
    //         document.querySelector("h2").textContent = `Level: ${difficulty.toUpperCase()}`;
    //         document.querySelector("p").textContent = "Ready? Click Start to play.";
    //         document.querySelector(".level-select").style.display = "none";
    //         document.getElementById("startBtn").style.display = "inline-block";
    //     });
    // });


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

    // === Game State ===
    // const player = {u: 0.5, v: 0.82, w: 0.25};
    // const bot = {u: 0.5, v: 0.08, w: 0.25};
    const player = {u: 0.5, v: 0.83, w: 0.25}; // below bottom edge
    const bot = {u: 0.5, v: -0.02, w: 0.25}; // above top edge

    // const ball = {u: 0.5, v: 0.5, vu: 0.004, vv: 0.004, radius: 0.04};
    // const ball = {
    //     u: 0.5, v: 0.5,       // position on table (2D)
    //     vu: 0.004, vv: 0.004, // velocity along table
    //     z: 0.05, vz: 0,       // height above table, vertical velocity
    //     radius: 0.03
    // };

    const ball = {
        u: 0.5, v: 0.5,
        vu: 0.004, vv: 0.004,
        z: 0, vz: 0,       // height above table, vertical velocity
        radius: 0.03
    };


    let playerScore = 0,
        botScore = 0;
    // const winningScore = 7;
    const roundWinningScore = 3;  // score needed to win a round
    let currentRound = 1;
    let playerRoundsWon = 0;
    let botRoundsWon = 0;
    const totalRounds = 3;

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

        // const topScale = 0.6;
        const tableHeight = h * 0.65;
        const tableWidth = w * 0.9;
        // const tableWidthTop = tableWidthBottom * topScale;

        // const bottomY = h * 0.88;
        // const topY = bottomY - tableHeight;
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

        // draw a filled path just to "drop" the shadow
        // ctx.fillStyle = "#75c93f"; // same color as table (placeholder)
        // ctx.beginPath();
        // ctx.moveTo(leftTop.x, leftTop.y);
        // ctx.lineTo(rightTop.x, rightTop.y);
        // ctx.lineTo(rightBottom.x, rightBottom.y);
        // ctx.lineTo(leftBottom.x, leftBottom.y);
        // ctx.closePath();
        // ctx.fill();
        // ctx.restore();
        // === shadow ===
        // ctx.beginPath();
        // ctx.moveTo(leftBottom.x, leftBottom.y);
        // ctx.lineTo(rightBottom.x, rightBottom.y);
        // ctx.lineTo(rightBottom.x, rightBottom.y + 80);
        // ctx.lineTo(leftBottom.x, leftBottom.y + 80);
        // ctx.closePath();
        //
        // const shadowGrad = ctx.createLinearGradient(0, bottomY, 0, bottomY + 80);
        // shadowGrad.addColorStop(0, "rgba(0,0,0,0.35)");
        // shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
        // ctx.fillStyle = shadowGrad;
        // ctx.fill();

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


    // function drawNet() {
    //     const steps = 60;
    //     ctx.save();
    //     ctx.strokeStyle = "rgba(255,255,255,0.8)";
    //     ctx.lineWidth = 2;
    //     for (let i = 0; i <= steps; i++) {
    //         const u = i / steps;
    //         const top = worldToScreen(u, 0.48);
    //         const bottom = worldToScreen(u, 0.52);
    //         ctx.beginPath();
    //         ctx.moveTo(top.x, top.y);
    //         ctx.lineTo(bottom.x, bottom.y);
    //         ctx.stroke();
    //     }
    //     ctx.restore();
    // }

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

    function drawPaddle(ctx, x, y, radius, color, isBot = false, useRound = false) {
        ctx.save();

        // === Shadow (to the right side) ===
        ctx.beginPath();
        ctx.arc(x + radius * 0.35, y + radius * 0.15, radius * 1.05, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.filter = "blur(6px)";
        ctx.fill();
        ctx.filter = "none";

        if (useRound) {
            // === ROUND PADDLE WITH HANDLE ===
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#000";
            ctx.fillStyle = color;

            // Paddle head (circle)
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // === Center line inside the circle ===
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.6, y);  // left edge
            ctx.lineTo(x + radius * 0.6, y);  // right edge
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.stroke();
            // === Center line inside the circle ===
            ctx.lineWidth = 3;

// main line (dark)
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.6, y);
            ctx.lineTo(x + radius * 0.6, y);
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.stroke();

// highlight above (lighter shadow)
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.6, y - 2);
            ctx.lineTo(x + radius * 0.6, y - 2);
            ctx.strokeStyle = "rgba(0,0,0,0.6)";
            ctx.stroke();

// shadow below (darker shadow)
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.6, y + 2);
            ctx.lineTo(x + radius * 0.6, y + 2);
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.stroke();


            // Handle
            const handleWidth = radius * 0.4;
            const handleHeight = radius * 0.9;
            ctx.beginPath();
            ctx.rect(
                x - handleWidth / 2,
                isBot ? y - radius - handleHeight : y + radius,
                handleWidth,
                handleHeight
            );
            ctx.fill();
            ctx.stroke();
        } else {
            // === OLD STYLE (rectangular paddle) ===
            ctx.fillStyle = color;
            ctx.fillRect(x - radius / 2, y - radius / 2, radius, radius * 0.2);
        }

        ctx.restore();
    }


    // function drawPaddle(target, isBot = false) {
    //     if (!(isBot ? botImg.complete : playerImg.complete)) {
    //         console.warn("⏳ Paddle image not ready yet");
    //         return;
    //     }
    //
    //     const p = worldToScreen(target.u, target.v);
    //     const scale = p.scale;
    //
    //     const baseSize = Math.min(width, height) * 0.12; // ~12% of screen
    //     const w = baseSize * scale;
    //     const h = baseSize * scale;
    //
    //
    //     ctx.save();
    //
    //     // === shadow under paddle ===
    //     ctx.beginPath();
    //     ctx.ellipse(p.x, p.y + h * 0.35, w * 0.6, h * 0.25, 0, 0, Math.PI * 2);
    //     ctx.fillStyle = "rgba(0,0,0,0.35)";
    //     ctx.filter = "blur(6px)";
    //     ctx.fill();
    //     ctx.filter = "none";
    //
    //     // === paddle image ===
    //     ctx.drawImage(isBot ? botImg : playerImg, p.x - w / 2, p.y - h / 2, w, h);
    //
    //     ctx.restore();
    // }


    // function updateScore() {
    //     scoreEl.innerHTML = `You: ${playerScore} — Bot: ${botScore}`;
    // }
    function showRoundPopup(title, message) {
        running = false; // pause the loop
        overlay.style.display = "flex";
        overlay.querySelector("h2").textContent = title;
        overlay.querySelector("p").textContent = message;

        startBtn.style.display = "inline-block";
        startBtn.textContent = "Next Round";

        // when player clicks, resume with reset scores
        startBtn.onclick = () => {
            overlay.style.display = "none";
            playerScore = 0;
            botScore = 0;
            updateScore();
            resetBall("bot");
            running = true;
            last = performance.now();
            loop(last);

            // reset button text back for later
            startBtn.textContent = "Start Game";
            startBtn.onclick = null;
        };
    }


    function checkRoundEnd() {
        if (playerScore >= roundWinningScore || botScore >= roundWinningScore) {
            if (playerScore >= roundWinningScore) {
                playerRoundsWon++;
            } else if (botScore >= roundWinningScore) {
                botRoundsWon++;
            }

            // End of a round
            if (currentRound < totalRounds) {
                showRoundPopup(`Round ${currentRound} finished!`, `Score → You: ${playerScore}, Bot: ${botScore}`);
                currentRound++;
            } else {
                // === Match finished ===
                if (playerRoundsWon > botRoundsWon) {
                    soundHandler.play("win");
                    showFinalResult("You won the match!");
                } else if (botRoundsWon > playerRoundsWon) {
                    soundHandler.play("lose");
                    showFinalResult("You lost the match! Try again?");
                } else {
                    showFinalResult("It’s a tie overall!");
                }
            }
        }
    }

    function showFinalResult(message) {
        running = false;
        overlay.style.display = "flex";
        overlay.querySelector("h2").textContent = message;
        overlay.querySelector("p").textContent =
            `Final Rounds → You: ${playerRoundsWon}, Bot: ${botRoundsWon}`;

        // reset everything for next time
        currentRound = 1;
        playerScore = botScore = 0;
        playerRoundsWon = botRoundsWon = 0;
    }


    function updateScore() {
        scoreEl.innerHTML = `Round ${currentRound}/${totalRounds}`;
        // round.innerHTML = `You: ${playerScore} — Bot: ${botScore}`;
        // roundWon.innerHTML = `Rounds Won You: ${playerRoundsWon}, Bot: ${botRoundsWon}`;
    }


    // === Logic ===
    function resetBall(to = "player") {
        // place ball near bot or player depending on who serves
        if (to === "bot") {
            ball.u = bot.u;
            ball.v = bot.v + 0.06;  // just below bot paddle so it goes down
        } else {
            ball.u = player.u;
            ball.v = player.v - 0.06; // just above player paddle so it goes up
        }

        let speedFactor = 0.3; // default normal speed
        if (difficulty === "medium") speedFactor = 0.6;
        if (difficulty === "hard") speedFactor = 0.7;

        // random horizontal push
        ball.vu = (Math.random() - 0.5) * 0.0008 * speedFactor;
        // vertical push depending on server
        ball.vv = (to === "bot" ? 0.0009 : -0.0009) * speedFactor;
    }



    // function showWin(winner) {
    //     running = false;
    //     overlay.style.display = "flex";
    //     overlay.querySelector("h2").textContent = `${winner} won!`;
    //     overlay.querySelector(
    //         "p"
    //     ).textContent = `Final score: You ${playerScore} — Bot ${botScore}`;
    //     playerScore = botScore = 0;
    //     updateScore();
    // }

    // === Input ===
    function pointerToU(x) {
        const left = worldToScreen(0, player.v);
        const right = worldToScreen(1, player.v);
        return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
    }

    canvas.addEventListener("pointerdown", (e) => {
        pointerDown = true;
        player.u = lastPointerU = pointerToU(e.clientX);
    });
    canvas.addEventListener("pointermove", (e) => {
        if (!pointerDown) return;
        const u = pointerToU(e.clientX);
        spinBoost = (u - lastPointerU) * 0.075;
        lastPointerU = u;
        player.u = u;
    });
    canvas.addEventListener("pointerup", () => (pointerDown = false));
    canvas.addEventListener("pointercancel", () => (pointerDown = false));

    // window.addEventListener("keydown", (e) => {
    //     if (e.key === "ArrowLeft") player.u = Math.max(0, player.u - 0.04);
    //     if (e.key === "ArrowRight") player.u = Math.min(1, player.u + 0.04);
    // });
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
        if (!running) return;
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

        // wallss
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
        if (ball.v < -0.05) {
            playerScore++;
            soundHandler.play("score");
            updateScore();
            checkRoundEnd();
            resetBall("bot");
        } else if (ball.v > 1.05) {
            botScore++;
            soundHandler.play("score");
            updateScore();
            checkRoundEnd();
            resetBall("player");
        }


        // if (ball.u < 0 || ball.u > 1) {
        //     soundHandler.play("hitTable");
        //     ball.vu *= -1;
        // }


        // draw
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
        // const botRadius = baseRadius * botScreen.scale;
        // const playerRadius = baseRadius * playerScreen.scale;
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
    startBtn.addEventListener("click", () => {
        if (imagesLoaded < 2) {
            alert("Game is still loading assets...");
            return;
        }
        overlay.style.display = "none";
        running = true;
        resetBall("bot");
        last = performance.now();
        loop(last);
    });


    btnBack.addEventListener("click", () => (location.href = "/"));
    btnExit.addEventListener("click", () => (location.href = "/"));

    resetBall("bot");
    updateScore();

    // btnBack.addEventListener("click", () => (location.href = "/"));
    // btnExit.addEventListener("click", () => (location.href = "/"));

    // resetBall("bot");
    // updateScore();
});
