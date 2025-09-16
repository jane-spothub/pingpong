document.addEventListener("DOMContentLoaded", () => {
    const cube = document.querySelector(".cube");
    const levelText = document.getElementById("selected-level");
    const progressFill = document.querySelector(".progress-fill");
    const progressPoints = document.querySelectorAll(".progress-points span");

    const rotations = {
        easy: "rotateX(0deg)",
        medium: "rotateX(-90deg)",
        hard: "rotateX(-180deg)",
    };

    function setDifficulty(level) {
        // Rotate cube
        cube.style.transform = rotations[level];

        // Update text
        if (levelText) {
            levelText.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        }

        // Update progress bar
        if (level === "easy") progressFill.style.width = "0%";
        if (level === "medium") progressFill.style.width = "50%";
        if (level === "hard") progressFill.style.width = "100%";

        // Highlight active point
        progressPoints.forEach(p => p.classList.remove("active"));
        document
            .querySelector(`.progress-points span[data-level="${level}"]`)
            .classList.add("active");

        // Show start button
        document.getElementById("startBtn").style.display = "block";
    }

    // Attach click handlers
    progressPoints.forEach(point => {
        point.addEventListener("click", () => setDifficulty(point.dataset.level));
    });

    // Default to medium
    setDifficulty("medium");
});
