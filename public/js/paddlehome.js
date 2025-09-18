document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameHomePaddle");
    const ctx = canvas.getContext("2d");

    // Fullscreen canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let angle = 0;

    function drawPaddle(rotation) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        // --- 🏓 Paddle head (round) ---
        const radius = 90;

        // Red rubber gradient (gives 3D depth)
        const grad = ctx.createRadialGradient(-30, -30, 20, 0, 0, radius);
        grad.addColorStop(0, "#ff6f61");
        grad.addColorStop(0.6, "#e63946");
        grad.addColorStop(1, "#a4161a");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle shine
        const shineGrad = ctx.createRadialGradient(-40, -50, 10, 0, 0, radius);
        shineGrad.addColorStop(0, "rgba(255,255,255,0.6)");
        shineGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // --- 🪵 Handle ---
        ctx.fillStyle = "#8B5A2B"; // brown wood
        ctx.beginPath();
        ctx.roundRect(-20, radius - 5, 40, 120, 10);
        ctx.fill();

        // Handle shading (to make it 3D)
        const handleGrad = ctx.createLinearGradient(-20, radius, 20, radius + 120);
        handleGrad.addColorStop(0, "rgba(0,0,0,0.2)");
        handleGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = handleGrad;
        ctx.beginPath();
        ctx.roundRect(-20, radius - 5, 40, 120, 10);
        ctx.fill();

        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        angle += 0.02;
        drawPaddle(Math.sin(angle) * 0.4); // smooth left-right rotation
        requestAnimationFrame(animate);
    }

    animate();
});
