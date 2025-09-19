import {SoundHandler} from "./soundHandler.js";

const categoryNames = [
    "Rookie Rally",
    "Spin Masters",
    "Power Play",
    "Precision Pros",
    "Speed Demons",
    "Tactical Titans",
    "Elite Champions",
    "Ultimate Showdown",
    "Legendary League",
    "Hall of Fame"
];

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const soundHandler = new SoundHandler();
    const scoreEl = document.getElementById("score-display");

    // Extract category and level from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let currentCategory = parseInt(urlParams.get('category')) || 1;
    let currentLevel = parseInt(urlParams.get('level')) || 1;

    console.log(`Starting game: Category ${currentCategory}, Level ${currentLevel}`);

    let playerScore = 0;
    let botScore = 0;
    let botSpeed = 0.00025;
    let width = window.innerWidth,
        height = window.innerHeight;

    const playerImg = new Image();
    playerImg.src = "assets/img/player-paddle.png";

    const botImg = new Image();
    botImg.src = "assets/img/bot-paddle.png";

    // let imagesLoaded = 0;

    // === Paddle Controls ===
    function pointerToU(x) {
        const left = worldToScreen(0, player.v);
        const right = worldToScreen(1, player.v);
        return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
    }

    // Pointer (works for mouse + touch)
    let pointerActive = false;

    canvas.addEventListener("pointerdown", (e) => {
        if (e.clientY > window.innerHeight * 0.6) {
            pointerActive = true;
            player.u = pointerToU(e.clientX);
        }
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!pointerActive) return;
        const targetU = pointerToU(e.clientX);
        player.u = lerp(player.u, targetU, 0.35);
    });

    canvas.addEventListener("pointerup", () => (pointerActive = false));
    canvas.addEventListener("pointercancel", () => (pointerActive = false));

    // Keyboard (desktop) - Added forward/backward movement
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") player.u = Math.max(0, player.u - 0.04);
        if (e.key === "ArrowRight") player.u = Math.min(1, player.u + 0.04);
        if (e.key === "ArrowUp") player.v = Math.max(0.7, player.v - 0.02);   // Move forward
        if (e.key === "ArrowDown") player.v = Math.min(0.95, player.v + 0.02); // Move backward
    });

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

    function resize() {
        const dpr = window.devicePixelRatio || 1;

        width = window.innerWidth;
        height = window.innerHeight;

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
    // const player = {u: 0.5, v: 0.80, w: 0.25, z: 0.1}; // push player below bottom edge
    // const bot    = {u: 0.5, v: -0.15, w: 0.25, z: 0.1}; // push bot above top edge
// Player near bottom edge
    const player= {u: 0.5, v: 0.72, w: 0.25, z: 0.1};

// Bot near top edge
    const bot = {u: 0.5, v: -0.40, w: 0.25, z: 0.1};

    const ball = {
        u: 0.5, v: 0.1,
        vu: 0.004, vv: 0.004,
        z: 0.1, vz: 0,       // height above table
        radius: 0.03
    };

    let running = false;
    let last = performance.now();
    let spinBoost = 0;
    // const colors = ["#8d6e63", "#a1887f", "#8d6e63", "#a1887f"]; // natural wood tones

    // Physics constants
    const gravity = -0.00005;
    const bounceFactor = 0.7;
    // let plankColors = [];

    // function generateFloorPlanks() {
    //     const plankHeight = 70;
    //     plankColors = [];
    //     for (let y = height / 2; y < height; y += plankHeight) {
    //         plankColors.push(colors[Math.floor(Math.random() * colors.length)]);
    //     }
    // }

    // 🎨 Fun arcade colors for kids + adults
//     const funColors = [
//         // "#ff6f61", // coral red
//         "rgba(255,174,0,0.28)", // bright yellow
//         // "#66bb6a", // playful green
//         // "#ffcc00", // bright yellow
//
//         // "#42a5f5", // sky blue
//         // "#ab47bc", // purple
//         // "#ff8a65", // orange
//     ];
//
// // Generate fun planks
//     function generateFloorPlanks() {
//         const plankHeight = 70;
//         plankColors = [];
//         for (let y = height / 2; y < height; y += plankHeight) {
//             plankColors.push(funColors[Math.floor(Math.random() * funColors.length)]);
//         }
//     }
//
//     function drawWoodFloor() {
//         const plankHeight = 70;
//         if (plankColors.length === 0) generateFloorPlanks();
//
//         let i = 0;
//         for (let y = height / 2; y < height; y += plankHeight) {
//             ctx.fillStyle = plankColors[i++ % plankColors.length];
//
//             // main plank
//             ctx.fillRect(0, y, width, plankHeight);
//
//             // shiny cartoon highlight
//             const grad = ctx.createLinearGradient(0, y, 0, y + plankHeight);
//             grad.addColorStop(0, "rgba(255,255,255,0.25)");
//             grad.addColorStop(0.5, "transparent");
//             ctx.fillStyle = grad;
//             ctx.fillRect(0, y, width, plankHeight);
//
//             // black outline for cartoon feel
//             ctx.strokeStyle = "rgba(0,0,0,0.3)";
//             ctx.strokeRect(0, y, width, plankHeight);
//         }
//     }
//
//     function drawWoodWalls() {
//         const plankWidth = 80; // width of each vertical plank
//
//         // Make sure we have colors
//         if (plankColors.length === 0) generateFloorPlanks();
//
//         let i = 0;
//         for (let x = 0; x < width; x += plankWidth) {
//             ctx.fillStyle = plankColors[i % plankColors.length];
//             ctx.fillRect(x, 0, plankWidth, height / 2); // vertical planks from top to halfway
//
//             // Grain line between planks
//             ctx.strokeStyle = "rgba(0,0,0,0.1)";
//             ctx.beginPath();
//             ctx.moveTo(x, 0);
//             ctx.lineTo(x, height / 2);
//             ctx.stroke();
//
//             i++;
//         }
//
//         // Add a soft shadow at the bottom of the wall (for depth)
//         // Add a soft shadow at the bottom of the wall (for depth)
//         const grad = ctx.createLinearGradient(0, height / 2, 0, height / 2 + 80);
//         grad.addColorStop(0, "rgba(0,0,0,0.5)"); // dark at wall bottom
//         grad.addColorStop(1, "rgba(0,0,0,0)");   // fade into floor
//         ctx.fillStyle = grad;
//         ctx.fillRect(0, height / 2, width, 80);
//
//     }
//



    // === Enhanced Drawing Functions ===
    function drawTable() {
        const cx = width / 2;
        const cy = height / 2;

        // Responsive table sizing
        const tableDepth = Math.min(width, height) * 0.35;
        const topWidth = width * 0.25;
        const bottomWidth = width * 0.45;

        const topY = cy - height * 0.25;
        const bottomY = cy + tableDepth;

        const topLeftX = cx - topWidth;
        const topRightX = cx + topWidth;
        const bottomLeftX = cx - bottomWidth;
        const bottomRightX = cx + bottomWidth;

        // Enhanced table gradient with better 3D effect
        const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
        grad.addColorStop(0, "#1a6e3d"); // darker far side
        grad.addColorStop(0.5, "#006b2d"); // medium tone
        grad.addColorStop(1, "#65ff00"); // brighter near side
        ctx.fillStyle = grad;

        // Table top with perspective
        ctx.beginPath();
        ctx.moveTo(topLeftX, topY);
        ctx.lineTo(topRightX, topY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.closePath();
        ctx.fill();

        // Table edge for 3D effect
        ctx.fillStyle = "#145b32";
        ctx.beginPath();
        ctx.moveTo(bottomLeftX, bottomY);
        ctx.lineTo(bottomLeftX, bottomY + 15);
        ctx.lineTo(bottomRightX, bottomY + 15);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.closePath();
        ctx.fill();

        // White lines
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Center line
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx, bottomY);
        ctx.stroke();

        // Enhanced net with better 3D appearance
        const netY = (topY + bottomY) / 2;
        const netLeftX = (topLeftX + bottomLeftX) / 2;
        const netRightX = (topRightX + bottomRightX) / 2;
        const netHeight = tableDepth * 0.15;

        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        for (let i = 0; i <= netRightX - netLeftX; i += 12) {
            ctx.beginPath();
            ctx.moveTo(netLeftX + i, netY - netHeight / 2);
            ctx.lineTo(netLeftX + i, netY + netHeight / 2);
            ctx.stroke();
        }

        // Net top and bottom bars
        ctx.fillStyle = "#fff";
        ctx.fillRect(netLeftX, netY - netHeight / 2 - 3, netRightX - netLeftX, 6);
        ctx.fillRect(netLeftX, netY + netHeight / 2 - 3, netRightX - netLeftX, 6);

        // Enhanced legs with 3D effect
        const legHeight = height * 0.2;
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 10;

        // // Left leg
        // ctx.beginPath();
        // ctx.moveTo(bottomLeftX, bottomY);
        // ctx.lineTo(bottomLeftX - 10, bottomY + legHeight);
        // ctx.stroke();
        //
        // // Right leg
        // ctx.beginPath();
        // ctx.moveTo(bottomRightX, bottomY);
        // ctx.lineTo(bottomRightX + 10, bottomY + legHeight);
        // ctx.stroke();

        // Table shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(cx, bottomY-150 + legHeight + 10, bottomWidth * 0.8, tableDepth * 0.2, 0, 0, Math.PI * 2);
        ctx.filter = "blur(8px)";
        ctx.fill();
        ctx.filter = "none";
    }

    function updateBall(dt) {
        // Apply gravity
        ball.vz += gravity * dt;
        ball.z += ball.vz * dt;

        // Bounce off table with more realistic physics
        if (ball.z <= 0.1) {
            ball.z = 0.1;
            ball.vz *= -bounceFactor;
            // Add some horizontal friction on bounce
            ball.vu *= 0.95;
            soundHandler.play("hitTable");
        }

        // Move in table plane
        ball.u += ball.vu * dt;
        ball.v += ball.vv * dt;

        // Bounce off side walls with energy loss
        if (ball.u < 0 || ball.u > 1) {
            ball.vu *= -0.9;
            ball.vu *= 0.95; // Energy loss
            soundHandler.play("hitTable");
        }
    }

    function drawBall() {
        const p = worldToScreen(ball.u, ball.v);
        const r = ball.radius * Math.min(width, height) * p.scale;

        // Enhanced shadow that changes based on ball height
        const shadowScale = 1 - Math.min(0.8, (ball.z - 0.1) * 4);
        const shadowAlpha = 0.4 - Math.min(0.3, (ball.z - 0.1) * 1.5);

        ctx.beginPath();
        ctx.ellipse(p.x, p.y + r + 5, r * 1.3 * shadowScale, r * 0.5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.filter = "blur(6px)";
        ctx.fill();
        ctx.filter = "none";

        // Enhanced ball with better 3D appearance
        ctx.beginPath();
        ctx.arc(p.x, p.y - (ball.z - 0.1) * 300, r, 0, Math.PI * 2);

        // More realistic ball gradient
        const grad = ctx.createRadialGradient(
            p.x - r / 3, p.y - (ball.z - 0.1) * 300 - r / 3, r * 0.1,
            p.x, p.y - (ball.z - 0.1) * 300, r
        );
        grad.addColorStop(0, "#fff");
        grad.addColorStop(0.7, "#e0e0e0");
        grad.addColorStop(1, "#c0c0c0");
        ctx.fillStyle = grad;
        ctx.fill();

        // Ball highlight
        ctx.beginPath();
        ctx.arc(p.x - r / 4, p.y - (ball.z - 0.1) * 300 - r / 4, r / 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fill();

        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawPaddle(ctx, x, y, radius, color, isBot = false, useRound = true) {
        const paddleHeight = radius * 0.3; // Height of the paddle face

        // Enhanced shadow
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.2, y + radius * 0.3, radius * 1.1, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.filter = "blur(8px)";
        ctx.fill();
        ctx.filter = "none";

        if (useRound) {
            // Paddle face with better 3D appearance
            const grad = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, radius * 0.1,
                x, y, radius
            );
            grad.addColorStop(0, color === "#e74c3c" ? "#ff8a7a" : "#6bb5ff");
            grad.addColorStop(0.6, color);
            grad.addColorStop(1, color === "#e74c3c" ? "#c0392b" : "#2980b9");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Paddle edge for 3D effect
            ctx.strokeStyle = color === "#e74c3c" ? "#c0392b" : "#2980b9";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Enhanced shine
            const shine = ctx.createRadialGradient(
                x - radius * 0.5, y - radius * 0.5, radius * 0.05,
                x, y, radius * 0.8
            );
            shine.addColorStop(0, "rgba(255,255,255,0.7)");
            shine.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Enhanced handle with better 3D appearance
            const handleWidth = radius * 0.4;
            const handleHeight = radius * 1.4;

// ✅ Always below the paddle (straight vertical)
            let handleY;
            if (isBot) {
                // Bot paddle → handle above the circle
                // handleY = y - radius - handleHeight + 15;
                handleY = y + radius - 15;

            } else {
                // Player paddle → handle below the circle
                handleY = y + radius - 15;
            }
// Handle base
            ctx.fillStyle = "#5d4037";
            ctx.beginPath();
            ctx.roundRect(x - handleWidth / 2, handleY, handleWidth, handleHeight, 8);
            ctx.fill();

// Handle shading
            const woodGrad = ctx.createLinearGradient(
                x - handleWidth / 2, handleY,
                x + handleWidth / 2, handleY + handleHeight
            );
            woodGrad.addColorStop(0, "rgba(0,0,0,0.3)");
            woodGrad.addColorStop(0.5, "rgba(255,255,255,0.1)");
            woodGrad.addColorStop(1, "rgba(0,0,0,0.2)");
            ctx.fillStyle = woodGrad;
            ctx.beginPath();
            ctx.roundRect(x - handleWidth / 2, handleY, handleWidth, handleHeight, 8);
            ctx.fill();

// Handle outline
            ctx.strokeStyle = "#4e342e";
            ctx.lineWidth = 2;
            ctx.stroke();

        }
    }

    function worldToScreen(u, v) {
        const scale = 0.6 + v * 0.5;  // reduce scaling so top is smaller
        const x = width * (0.5 + (u - 0.5) * scale);
        const y = height * (0.5 + (v - 0.5) * scale * 0.8); // 0.8 flattens perspective
        return {x, y, scale};
    }


    // === Enhanced Game Logic ===
    function resetBall(to = "player") {
        if (to === "bot") {
            ball.u = bot.u;
            ball.v = bot.v + 0.06;  // serve slightly below bot
        } else {
            ball.u = player.u;
            ball.v = player.v - 0.06; // serve slightly above player
        }

        // Adjust difficulty based on category and level
        let baseSpeed = 0.00020;
        let speedFactor = 0.7;

        if (currentCategory >= 2) baseSpeed += 0.00005 * (currentCategory - 1);
        if (currentLevel >= 10) baseSpeed += 0.00002 * (currentLevel / 10);

        botSpeed = baseSpeed;

        if (currentCategory >= 4 || currentLevel >= 15) {
            speedFactor = 1.4;
            botSpeed = 0.00035;
        }
        if (currentCategory >= 7 || currentLevel >= 25) {
            speedFactor = 2.0;
            botSpeed = 0.00055;
        }

        // random horizontal push
        ball.vu = (Math.random() - 0.5) * 0.0012 * speedFactor;
        // vertical push depending on server
        ball.vv = (to === "bot" ? 0.0011 : -0.0011) * speedFactor;

        // Reset ball height and velocity
        ball.z = 0.2;
        ball.vz = 0;
    }

    function hitPaddle(paddle) {
        const du = ball.u - paddle.u;
        const dv = ball.v - paddle.v;
        const dist = Math.sqrt(du * du + dv * dv);
        return dist < 0.06 && Math.abs(ball.z - paddle.z) < 0.05;
    }

    // === Enhanced Main Game Loop ===
    function loop(now) {
        const dt = Math.min(40, now - last);
        last = now;

        // Clear canvas with a subtle court background
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#b28aff");
        bg.addColorStop(1, "#120017");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
// Draw wooden room background
//         drawWoodFloor();
        // drawWoodWalls();
        // Draw table & elements
        drawTable();

        // // Draw paddles
        const p = worldToScreen(player.u, player.v);
        drawPaddle(ctx, p.x, p.y, Math.min(width, height) * 0.05, "#e74c3c", false, true);

        const b = worldToScreen(bot.u, bot.v);
        drawPaddle(ctx, b.x, b.y, Math.min(width, height) * 0.05, "#3498db", true, true);
// Player paddle (normal size)
//         const p = worldToScreen(player.u, player.v);
//         drawPaddle(ctx, p.x, p.y, Math.min(width, height) * 0.05, "#e74c3c", false, true);
//
// // Bot paddle (smaller size)
//         const b = worldToScreen(bot.u, bot.v);
//         drawPaddle(ctx, b.x, b.y, Math.min(width, height) * 0.035, "#3498db", true, true);

        // Draw ball
        drawBall();

        // Update game state
        updateBall(dt);

        // Enhanced bot AI with predictive movement
        const speed = botSpeed * dt;
        const predictU = ball.u + (ball.vu * 10); // Simple prediction
        if (bot.u < predictU - 0.02) bot.u += speed * 1.2;
        if (bot.u > predictU + 0.02) bot.u -= speed * 1.2;

        // Move ball
        ball.u += ball.vu * dt;
        ball.v += ball.vv * dt;

        // Player hit with enhanced physics
        if (hitPaddle(player) && ball.vv > 0) {
            // soundHandler.play("hitPaddle");
            ball.vv = -Math.abs(ball.vv) - 0.00005;
            ball.vu += (ball.u - player.u) * 0.02 + spinBoost; // More spin influence
            ball.v = player.v - 0.03;
            ball.vz = 0.002; // Add upward velocity
        }

        // Bot hit
        if (hitPaddle(bot) && ball.vv < 0) {
            // soundHandler.play("hitPaddle");
            ball.vv = Math.abs(ball.vv) + 0.00005;
            ball.vu += (ball.u - bot.u) * 0.015;
            ball.v = bot.v + 0.03;
            ball.vz = 0.002; // Add upward velocity
        }

        // Scoring
        if (ball.v < bot.v - 0.08) {
            playerScore++;
            soundHandler.play("score");
            resetBall("bot");
            updateProgressUI();
        } else if (ball.v > player.v + 0.08) {
            botScore++;
            soundHandler.play("score");
            resetBall("player");
            updateProgressUI();
        }

        // Check win/lose conditions
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

        requestAnimationFrame(loop);
    }

    // ... (rest of your code remains the same, including player progression, rewards, etc.)

    // Initialize the game
    initProgress();

    // === Logic ===
    // function resetBall(to = "player") {
    //     if (to === "bot") {
    //         ball.u = bot.u;
    //         ball.v = bot.v + 0.06;
    //     } else {
    //         ball.u = player.u;
    //         ball.v = player.v - 0.06;
    //     }
    //
    //     // Adjust difficulty based on category and level
    //     let baseSpeed = 0.00020;
    //     let speedFactor = 0.7; // easy
    //
    //     // Increase difficulty with higher categories and levels
    //     if (currentCategory >= 2) baseSpeed += 0.00005 * (currentCategory - 1);
    //     if (currentLevel >= 10) baseSpeed += 0.00002 * (currentLevel / 10);
    //
    //     botSpeed = baseSpeed;
    //
    //     if (currentCategory >= 4 || currentLevel >= 15) {
    //         speedFactor = 1.4; // medium
    //         botSpeed = 0.00035;
    //     }
    //     if (currentCategory >= 7 || currentLevel >= 25) {
    //         speedFactor = 2.0; // hard
    //         botSpeed = 0.00055;
    //     }
    //
    //     // random horizontal push
    //     ball.vu = (Math.random() - 0.5) * 0.0012 * speedFactor;
    //     // vertical push depending on server
    //     ball.vv = (to === "bot" ? 0.0011 : -0.0011) * speedFactor;
    // }

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

    // let pointerDown = false
    // canvas.addEventListener("pointerup", () => (pointerDown = false));
    // canvas.addEventListener("pointercancel", () => (pointerDown = false));
    // window.addEventListener("keydown", (e) => {
    //     if (e.key === "ArrowLeft") player.u = Math.max(0, player.u - 0.04);
    //     if (e.key === "ArrowRight") player.u = Math.min(1, player.u + 0.04);
    //     if (e.key === "ArrowUp") player.v = Math.max(0.7, player.v - 0.02);   // forward
    //     if (e.key === "ArrowDown") player.v = Math.min(0.95, player.v + 0.02); // backward
    // });



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

        // Show the current category name and level
        const stageEl = document.getElementById("levelReached");
        if (stageEl) {
            const categoryName = categoryNames[currentCategory - 1] || `Category ${currentCategory}`;
            stageEl.textContent = `${categoryName} - Level ${currentLevel}`;
        }
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
        // First try to get category/level from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlCategory = parseInt(urlParams.get('category'));
        const urlLevel = parseInt(urlParams.get('level'));

        if (urlCategory && urlLevel) {
            currentCategory = urlCategory;
            currentLevel = urlLevel;
        } else {
            // Fall back to saved progress
            await loadProgress();
        }

        updateProgressUI();

        // Set difficulty based on category/level
        // setDifficulty();
    }

    // function setDifficulty() {
    //     // Set bot difficulty based on category and level
    //     if (currentCategory <= 3) {
    //         difficulty = "easy";
    //     } else if (currentCategory <= 6) {
    //         difficulty = "medium";
    //     } else {
    //         difficulty = "hard";
    //     }
    //
    //     // Additional difficulty adjustments based on level
    //     if (currentLevel > 20) {
    //         // Make it even harder for high levels
    //         difficulty = "hard";
    //     }
    //
    //     console.log(`Difficulty set to: ${difficulty} for Category ${currentCategory}, Level ${currentLevel}`);
    // }

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

        // Show category name instead of number
        const categoryName = categoryNames[currentCategory - 1] || `Category ${currentCategory}`;
        document.getElementById("levelReached").textContent = `${categoryName} - Lvl ${currentLevel}`;

        if (win) {
            title.textContent = "🎉 You Win!";
            emoji.textContent = "😃";
            reviveBtn.style.display = "none";
            nextBtn.style.display = "inline-block";
            nextBtn.onclick = () => {
                unlockNextLevel();
                endOverlay.classList.remove("active");

                // Check if we need to redirect back to level selection
                if (currentLevel > levelsPerCategory) {
                    window.location.href = "/levels"; // Go back to level selection
                } else {
                    // Restart with next level
                    startLevel();
                }
            };
        } else {
            title.textContent = "Level Failed!";
            emoji.textContent = "😟";
            reviveBtn.style.display = "inline-block";
            nextBtn.style.display = "none";
            reviveBtn.onclick = () => {
                endOverlay.classList.remove("active");
                startLevel(); // Restart same level
            };
        }

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
    // let currentCategory = null;
    // let currentLevel = null;

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

        // Update the global progress
        const globalLevel = (currentCategory - 1) * levelsPerCategory + currentLevel;

        // Save progress to server
        saveProgressToServer(currentCategory, currentLevel, globalLevel);

        updateProgressUI();
    }

    async function saveProgressToServer(category, level, globalLevel) {
        try {
            await fetch("/api/progress", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    xp: playerXP,
                    level: playerLevel,
                    coins: playerCoins,
                    category: category,
                    stage: globalLevel // This should be the global level, not the category level
                })
            });
        } catch (err) {
            console.error("❌ Failed to save progress", err);
            // Fallback to localStorage
            localStorage.setItem('pingPongProgress', JSON.stringify({
                xp: playerXP,
                level: playerLevel,
                coins: playerCoins,
                category: category,
                stage: globalLevel
            }));
        }
    }
    //
    // const unlocks = {
    //     1: {table: "classic", paddle: "default", ball: "white"},
    //     2: {paddle: "neon", ball: "fire"},
    //     3: {table: "space", paddle: "laser"},
    //     // ... up to 10
    // };

    // function getUnlockedTheme(category) {
    //     return unlocks[category] || unlocks[1];
    // }

    const categoryIcon = document.getElementById("categoryIcon");

    // function showCategoryIcon() {
    //     if (currentCategory && currentLevel) {
    //         categoryIcon.textContent = currentCategory; // show just category number
    //         categoryIcon.classList.remove("hidden");
    //     }
    // }

    categoryIcon.addEventListener("click", () => {
        // re-open overlay so user sees category & level
        categoryOverlay.classList.add("active");
    });


    sessionStorage.setItem("xp", playerXP);
    sessionStorage.getItem("xp");

    resetBall("bot");
    initProgress();


});
