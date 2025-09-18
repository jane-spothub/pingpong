document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameHomePaddle");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let angle = 0;
    let ballAngle = 0;
    let ballRadius = 20;

    function drawPaddle(rotation) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        // Paddle head
        const radius = 90;
        const grad = ctx.createRadialGradient(-30, -30, 20, 0, 0, radius);
        grad.addColorStop(0, "#ff6f61");
        grad.addColorStop(0.6, "#e63946");
        grad.addColorStop(1, "#a4161a");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        const shineGrad = ctx.createRadialGradient(-40, -50, 10, 0, 0, radius);
        shineGrad.addColorStop(0, "rgba(255,255,255,0.6)");
        shineGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Handle
        ctx.fillStyle = "#8B5A2B";
        ctx.beginPath();
        ctx.roundRect(-20, radius - 5, 40, 120, 10);
        ctx.fill();

        const handleGrad = ctx.createLinearGradient(-20, radius, 20, radius + 120);
        handleGrad.addColorStop(0, "rgba(0,0,0,0.2)");
        handleGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = handleGrad;
        ctx.beginPath();
        ctx.roundRect(-20, radius - 5, 40, 120, 10);
        ctx.fill();

        ctx.restore();
    }

    function drawBall() {
        const ballX = centerX + Math.sin(ballAngle) * 150;
        const ballY = centerY - 50 + Math.cos(ballAngle) * 50;

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

        // Small outline for depth
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // drawTable();
        drawPaddle(Math.sin(angle) * 0.4);
        drawBall();

        angle += 0.02;
        ballAngle += 0.08; // ball moves in a small circular arc

        requestAnimationFrame(animate);
    }

    animate();
});
