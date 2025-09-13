// public/js/game.js
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("startBtn");
    const btnBack = document.getElementById("btn-back");
    const scoreEl = document.getElementById("score");

    let width = 0,
        height = 0;
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
        const topInset = Math.min(height * 0.08, 90);
        const bottomInset = Math.min(height * 0.12, 150);
        return {
            lt: { x: width * 0.12, y: topInset },
            rt: { x: width * 0.88, y: topInset + 6 },
            rb: { x: width * 0.94, y: height * 0.94 },
            lb: { x: width * 0.06, y: height * 0.78 },
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
    const player = { u: 0.5, v: 0.82, w: 0.25 };
    const bot = { u: 0.5, v: 0.08, w: 0.25 };
    const ball = { u: 0.5, v: 0.5, vu: 0.004, vv: 0.004, radius: 0.02 };

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
        const c = tableCorners();
        ctx.save();
        const grd = ctx.createLinearGradient(c.lt.x, c.lt.y, c.lb.x, c.lb.y);
        grd.addColorStop(0, "#0f9b5e");
        grd.addColorStop(1, "#07c77f");
        ctx.fillStyle = grd;

        ctx.beginPath();
        ctx.moveTo(c.lt.x, c.lt.y);
        ctx.lineTo(c.rt.x, c.rt.y);
        ctx.lineTo(c.rb.x, c.rb.y);
        ctx.lineTo(c.lb.x, c.lb.y);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 8;
        ctx.strokeStyle = "#eafaf1";
        ctx.stroke();

        // midline
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        const p1 = worldToScreen(0.5, 0);
        const p2 = worldToScreen(0.5, 1);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
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
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawPaddle(target, color, isBot) {
        const p = worldToScreen(target.u, target.v);
        const scale = p.scale;
        const radius = 28 * scale;
        const handleLen = 40 * scale;

        ctx.save();

        // face
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // handle
        ctx.fillStyle = "#e6b35b";
        ctx.beginPath();
        if (isBot) {
            ctx.fillRect(p.x - handleLen * 0.1, p.y - radius - handleLen, handleLen * 0.2, handleLen);
        } else {
            ctx.fillRect(p.x - handleLen * 0.1, p.y + radius * 0.2, handleLen * 0.2, handleLen);
        }
        ctx.fill();

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

    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") player.u = Math.max(0, player.u - 0.04);
        if (e.key === "ArrowRight") player.u = Math.min(1, player.u + 0.04);
    });

    // === Loop ===
    function loop(now) {
        if (!running) return;
        const dt = Math.min(40, now - last);
        last = now;

        // bot AI
        const speed = 0.00025 * dt; // was 0.0006
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
            drawPaddle(bot, "red", true);
            drawPaddle(player, "#bf00ff", false);
        } else {
            drawPaddle(bot, "red", true);
            drawBall();
            drawPaddle(player, "#bf00ff", false);
        }

        requestAnimationFrame(loop);
    }

    // === Start ===
    startBtn.addEventListener("click", () => {
        overlay.style.display = "none";
        running = true;
        resetBall("bot");
        last = performance.now();
        loop(last);
    });

    btnBack.addEventListener("click", () => (location.href = "/"));

    resetBall("bot");
    updateScore();
});
