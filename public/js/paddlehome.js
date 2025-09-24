import { SoundHandler } from "./soundHandler.js";
if (!window.soundHandler) {
    window.soundHandler = new SoundHandler();
}
// Try to autoplay background music
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameHomePaddle");
    const ctx = canvas.getContext("2d");
    // 🎵 Create sound handler (make global if needed across pages)
    try {
        window.soundHandler.playBackground();
    } catch (e) {
        console.warn("Background sound error:", e);
    }    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height / 2;

    let angle = 0;
    let ballAngle = 0;
    let ballRadius = 20;

    // ------------------ Glow Particles ------------------
    const particles = [];
    const particleCount = 25; // adjust for density

    // class Particle {
    //     constructor() {
    //         this.reset();
    //     }
    //     reset() {
    //         this.x = Math.random() * canvas.width;
    //         this.y = Math.random() * canvas.height;
    //         this.radius = 10 + Math.random() * 20;
    //         this.alpha = 0;
    //         this.fadeIn = true;
    //         this.speedX = (Math.random() - 0.5) * 0.3;
    //         this.speedY = (Math.random() - 0.5) * 0.3;
    //         this.color = `hsl(${Math.random() * 360}, 80%, 60%)`; // colorful glow
    //     }
    //     update() {
    //         this.x += this.speedX;
    //         this.y += this.speedY;
    //
    //         // Fade in/out
    //         if (this.fadeIn) {
    //             this.alpha += 0.01;
    //             if (this.alpha >= 0.7) this.fadeIn = false;
    //         } else {
    //             this.alpha -= 0.005;
    //             if (this.alpha <= 0) this.reset();
    //         }
    //
    //         // Wrap around edges
    //         if (this.x < -50 || this.x > canvas.width + 50 ||
    //             this.y < -50 || this.y > canvas.height + 50) {
    //             this.reset();
    //         }
    //     }
    //     draw() {
    //         const grad = ctx.createRadialGradient(
    //             this.x, this.y, 0,
    //             this.x, this.y, this.radius
    //         );
    //         grad.addColorStop(0, this.color);
    //         grad.addColorStop(1, "transparent");
    //
    //         ctx.globalAlpha = this.alpha;
    //         ctx.fillStyle = grad;
    //         ctx.beginPath();
    //         ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    //         ctx.fill();
    //         ctx.globalAlpha = 1;
    //     }
    // }
    //
    // for (let i = 0; i < particleCount; i++) {
    //     particles.push(new Particle());
    // }

    // ------------------ Table ------------------
    function drawTable() {
        const w = canvas.width;
        const h = canvas.height;
        const cx = centerX();
        const cy = centerY();

        // Perspective sizing
        const tableDepth = h * 0.35;   // how long the table appears
        const topWidth = w * 0.25;     // narrow far edge
        const bottomWidth = w * 0.55;  // wide near edge

        // Raise the back edge so it looks tilted
        const topY = cy - h * 0.1;
        const bottomY = cy + tableDepth;

        const topLeftX = cx - topWidth;
        const topRightX = cx + topWidth;
        const bottomLeftX = cx - bottomWidth;
        const bottomRightX = cx + bottomWidth;

        // Shaded gradient: darker far, brighter near
        const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
        grad.addColorStop(0, "#1e8449"); // far side darker
        grad.addColorStop(1, "#2ecc71"); // near side brighter
        ctx.fillStyle = grad;

        // Draw table
        ctx.beginPath();
        ctx.moveTo(topLeftX, topY);
        ctx.lineTo(topRightX, topY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.closePath();
        ctx.fill();

        // White outline
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Center line
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx, bottomY);
        ctx.stroke();

        // ------------- NET -------------
        const netHeight = 40;

        // Midpoint between top and bottom edges
        const netY = (topY + bottomY) / 2;
        const netLeftX = (topLeftX + bottomLeftX) / 2;
        const netRightX = (topRightX + bottomRightX) / 2;

        // Net bar
        ctx.fillStyle = "#333";
        ctx.fillRect(netLeftX, netY - 3, netRightX - netLeftX, 6);

        // Net mesh
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= netRightX - netLeftX; i += 10) {
            ctx.beginPath();
            ctx.moveTo(netLeftX + i, netY - netHeight);
            ctx.lineTo(netLeftX + i, netY);
            ctx.stroke();
        }
    }




// Paddle repositioned below table
    function drawPaddle(rotation) {
        const cx = centerX();
        const cy = centerY();

        ctx.save();
        ctx.translate(cx, cy + canvas.height * 0.25); // move below table edge
        ctx.rotate(rotation);

        const radius = 70;
        const grad = ctx.createRadialGradient(-20, -20, 10, 0, 0, radius);
        grad.addColorStop(0, "#ff6f61");
        grad.addColorStop(0.6, "#e63946");
        grad.addColorStop(1, "#a4161a");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#8B5A2B";
        ctx.fillRect(-15, radius - 5, 30, 80); // handle
        ctx.restore();
    }


    // ------------------ Ball ------------------
    function drawBall() {
        const cx = centerX();
        const cy = centerY();

        const ballX = cx + Math.sin(ballAngle) * 150;
        const ballY = cy - 50 + Math.cos(ballAngle) * 50;

        const grad = ctx.createRadialGradient(
            ballX - 10, ballY - 10, 5,
            ballX, ballY, ballRadius
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#cccccc");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ------------------ Animate ------------------
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw glow particles in background
        for (let p of particles) {
            p.update();
            p.draw();
        }

        // Draw table
        drawTable();

        // Draw paddle + ball
        drawPaddle(Math.sin(angle) * 0.4);
        drawBall();

        angle += 0.02;
        ballAngle += 0.08;

        requestAnimationFrame(animate);
    }

    animate();
});
