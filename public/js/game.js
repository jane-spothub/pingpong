// public/js/game.js
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("startBtn");
    const btnBack = document.getElementById("btn-back");
    const btnExit = document.getElementById("btn-exit");
    const scoreEl = document.getElementById("score");
    let botSpeed = 0.00025; // default

    let width = 0,
        height = 0;
    const levelButtons = document.querySelectorAll(".level-btn");
// === Load paddle images ===
//     const playerImg = new Image();
//     playerImg.src = "/assets/img/player-paddle.png";  // adjust path
//
//     const botImg = new Image();
//     botImg.src = "/assets/img/bot-paddle.png";        // adjust path
//     let imagesLoaded = 0;
    // function checkReady() {
    //     imagesLoaded++;
    //     if (imagesLoaded === 2) {
    //         // both images ready, now safe to start
    //         resetBall("bot");
    //         updateScore();
    //     }
    // }
    //
    // playerImg.onload = checkReady;
    // botImg.onload = checkReady;
// === Load paddle images ===
    const playerImg = new Image();
    playerImg.src = "assets/img/player-paddle.png";

    const botImg = new Image();
    botImg.src = "assets/img/bot-paddle.png"; // fixed typo
    let imagesLoaded = 0;

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


    levelButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const level = btn.dataset.level;

            if (level === "easy") botSpeed = 0.00018;
            if (level === "medium") botSpeed = 0.00025;
            if (level === "hard") botSpeed = 0.00035;

            // update UI to show start button
            document.querySelector("h2").textContent = `Level: ${level.toUpperCase()}`;
            document.querySelector("p").textContent = "Ready? Click Start to play.";
            document.querySelector(".level-select").style.display = "none";
            document.getElementById("startBtn").style.display = "inline-block";
        });
    });

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
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

        const topScale = 0.6; // smaller = stronger perspective
        const tableHeight = h * 0.8;
        const tableWidthBottom = w * 0.9;
        const tableWidthTop = tableWidthBottom * topScale;

        const bottomY = h * 0.9;
        const topY = bottomY - tableHeight;

        return {
            lt: { x: (w - tableWidthTop) / 2, y: topY },   // left top
            rt: { x: (w + tableWidthTop) / 2, y: topY },   // right top
            rb: { x: (w + tableWidthBottom) / 2, y: bottomY }, // right bottom
            lb: { x: (w - tableWidthBottom) / 2, y: bottomY }, // left bottom
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

    // canvas.addEventListener("touchstart", (e) => {
    //     e.preventDefault();
    //     pointerDown = true;
    //     const touch = e.touches[0];
    //     player.u = lastPointerU = pointerToU(touch.clientX);
    // });

    // canvas.addEventListener("touchmove", (e) => {
    //     e.preventDefault();
    //     if (!pointerDown) return;
    //     const touch = e.touches[0];
    //     const u = pointerToU(touch.clientX);
    //     spinBoost = (u - lastPointerU) * 0.075;
    //     lastPointerU = u;
    //     player.u = u;
    // });

    // canvas.addEventListener("touchend", () => (pointerDown = false));

    // === Game State ===
    const player = {u: 0.5, v: 0.82, w: 0.25};
    const bot = {u: 0.5, v: 0.08, w: 0.25};
    const ball = {u: 0.5, v: 0.5, vu: 0.004, vv: 0.004, radius: 0.04};

    let playerScore = 0,
        botScore = 0;
    const winningScore = 7;

    let running = false;
    let last = performance.now();
    let pointerDown = false;
    let lastPointerU = player.u;
    let spinBoost = 0;

    // === Drawing Functions ===
    function drawTable() {
        ctx.save();

        const w = canvas.width;
        const h = canvas.height;

        const topScale = 0.6;
        const tableHeight = h * 0.8;
        const tableWidthBottom = w * 0.9;
        const tableWidthTop = tableWidthBottom * topScale;

        const bottomY = h * 0.9;
        const topY = bottomY - tableHeight;

        const leftBottom = { x: (w - tableWidthBottom) / 2, y: bottomY };
        const rightBottom = { x: (w + tableWidthBottom) / 2, y: bottomY };

        const leftTop = { x: (w - tableWidthTop) / 2, y: topY };
        const rightTop = { x: (w + tableWidthTop) / 2, y: topY };

        // === SHADOW ===
        ctx.beginPath();
        ctx.moveTo(leftBottom.x, leftBottom.y);
        ctx.lineTo(rightBottom.x, rightBottom.y);
        ctx.lineTo(rightBottom.x, rightBottom.y + 80); // extend downward
        ctx.lineTo(leftBottom.x, leftBottom.y + 80);
        ctx.closePath();

        const shadowGrad = ctx.createLinearGradient(
            0,
            bottomY,
            0,
            bottomY + 80
        );
        shadowGrad.addColorStop(0, "rgba(0,0,0,0.35)");
        shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // === TABLE TOP ===
        const grd = ctx.createLinearGradient(leftTop.x, topY, leftBottom.x, bottomY);
        grd.addColorStop(0, "#0f9b5e");
        grd.addColorStop(1, "#07c77f");

        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(leftTop.x, leftTop.y);
        ctx.lineTo(rightTop.x, rightTop.y);
        ctx.lineTo(rightBottom.x, rightBottom.y);
        ctx.lineTo(leftBottom.x, leftBottom.y);
        ctx.closePath();
        ctx.fill();

        // outline
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#eafaf1";
        ctx.stroke();

        // midline
        ctx.lineWidth = 3;
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
        const steps = 60;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const top = worldToScreen(u, 0.48);
            const bottom = worldToScreen(u, 0.52);
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawBall() {
        const p = worldToScreen(ball.u, ball.v);
        const r = ball.radius * Math.min(width, height) * p.scale;

        // small lift above the table
        const lift = r * 0.6;

        ctx.save();

        // === shadow (ellipse under ball) ===
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + r + 5, r * 1.3, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.filter = "blur(4px)";
        ctx.fill();
        ctx.filter = "none";

        // === ball ===
        ctx.beginPath();
        ctx.arc(p.x, p.y - lift, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
            p.x - r / 3, p.y - lift - r / 3, r * 0.2,
            p.x, p.y - lift, r
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



    // function drawPaddle(target, color, isBot) {
    //     const p = worldToScreen(target.u, target.v);
    //     const scale = p.scale;
    //     const radius = 28 * scale;
    //     const handleLen = 40 * scale;
    //
    //     ctx.save();
    //
    //     // face
    //     ctx.beginPath();
    //     ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    //     ctx.fillStyle = color;
    //     ctx.fill();
    //     ctx.strokeStyle = "white";
    //     ctx.lineWidth = 2;
    //     ctx.stroke();
    //
    //     // handle
    //     ctx.fillStyle = "#e6b35b";
    //     ctx.beginPath();
    //     if (isBot) {
    //         ctx.fillRect(p.x - handleLen * 0.1, p.y - radius - handleLen, handleLen * 0.2, handleLen);
    //     } else {
    //         ctx.fillRect(p.x - handleLen * 0.1, p.y + radius * 0.2, handleLen * 0.2, handleLen);
    //     }
    //     ctx.fill();
    //
    //     ctx.restore();
    // }
    function drawPaddle(target, isBot = false) {
        if (!(isBot ? botImg.complete : playerImg.complete)) {
            console.warn("⏳ Paddle image not ready yet");
            return;
        }

        const p = worldToScreen(target.u, target.v);
        const scale = p.scale;

        const baseSize = 100;
        const w = baseSize * scale;
        const h = baseSize * scale;

        ctx.save();

        // === shadow under paddle ===
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + h * 0.35, w * 0.6, h * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.filter = "blur(6px)";
        ctx.fill();
        ctx.filter = "none";

        // === paddle image ===
        ctx.drawImage(isBot ? botImg : playerImg, p.x - w / 2, p.y - h / 2, w, h);

        ctx.restore();
    }



    function updateScore() {
        scoreEl.innerHTML = `You: ${playerScore} — Bot: ${botScore}`;
    }

    // === Logic ===
    function resetBall(to = "player") {
        ball.u = 0.5;
        ball.v = 0.5;

        // very slow start, feels more natural
        ball.vu = (Math.random() - 0.5) * 0.0008;
        ball.vv = to === "player" ? -0.0009 : 0.0009;
    }


    function showWin(winner) {
        running = false;
        overlay.style.display = "flex";
        overlay.querySelector("h2").textContent = `${winner} won!`;
        overlay.querySelector(
            "p"
        ).textContent = `Final score: You ${playerScore} — Bot ${botScore}`;
        playerScore = botScore = 0;
        updateScore();
    }

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
        // if (
        //     ball.v > player.v - 0.05 &&
        //     ball.v < player.v + 0.05 &&
        //     Math.abs(ball.u - player.u) < player.w * 0.5 &&
        //     ball.vv > 0
        // ) {
        //     ball.vv = -Math.abs(ball.vv) - 0.00005;
        //     ball.vu += (ball.u - player.u) * 0.015 + spinBoost;
        //     ball.v = player.v - 0.03;
        // }
        //
        // if (
        //     ball.v < bot.v + 0.05 &&
        //     ball.v > bot.v - 0.05 &&
        //     Math.abs(ball.u - bot.u) < bot.w * 0.5 &&
        //     ball.vv < 0
        // ) {
        //
        //     ball.vv = Math.abs(ball.vv) + 0.00005;
        //     ball.vu += (ball.u - bot.u) * 0.012;
        //     ball.v = bot.v + 0.03;
        // }
        // Player hit
        if (hitPaddle(player) && ball.vv > 0) {
            ball.vv = -Math.abs(ball.vv) - 0.00005;
            ball.vu += (ball.u - player.u) * 0.015 + spinBoost;
            ball.v = player.v - 0.03;
        }

// Bot hit
        if (hitPaddle(bot) && ball.vv < 0) {
            ball.vv = Math.abs(ball.vv) + 0.00005;
            ball.vu += (ball.u - bot.u) * 0.012;
            ball.v = bot.v + 0.03;
        }


        // scoring
        if (ball.v < -0.05) {
            playerScore++;
            updateScore();
            if (playerScore >= winningScore) return showWin("You");
            resetBall("bot");
        } else if (ball.v > 1.05) {
            botScore++;
            updateScore();
            if (botScore >= winningScore) return showWin("Bot");
            resetBall("player");
        }

        // draw
        ctx.clearRect(0, 0, width, height);
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#082d4e");
        bg.addColorStop(1, "#0f5f8a");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        drawTable();
        drawNet();

        if (ball.v < player.v - 0.05) {
            drawBall();
            drawPaddle(bot,  true);
            drawPaddle(player,  false);
        } else {
            drawPaddle(bot,  true);
            drawBall();
            drawPaddle(player,  false);
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
});
