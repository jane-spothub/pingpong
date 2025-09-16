document.addEventListener("DOMContentLoaded", () => {
    const cube = document.querySelector(".cube");
    const progressFill = document.querySelector(".progress-fill");
    const progressPoints = document.querySelectorAll(".progress-points span");
    const levelText = document.getElementById("selected-level");

    // Inline transforms
    const inlineRotations = {
        easy: "rotateX(0deg)",
        medium: "rotateX(-90deg)",
        hard: "rotateX(-180deg)",
    };

    // Class names
    const classRotations = {
        easy: "easy",
        medium: "medium",
        hard: "hard",
    };

    function setDifficulty(level, useClasses = true) {
        if (useClasses) {
            // Use CSS classes
            cube.className = "cube " + classRotations[level];
        } else {
            // Use inline style
            cube.style.transform = inlineRotations[level];
        }

        // Update label
        levelText.textContent = level.charAt(0).toUpperCase() + level.slice(1);

        // Update progress bar
        if (level === "easy") progressFill.style.width = "0%";
        if (level === "medium") progressFill.style.width = "50%";
        if (level === "hard") progressFill.style.width = "100%";

        // Highlight active dot
        progressPoints.forEach(p => p.classList.remove("active"));
        document
            .querySelector(`.progress-points span[data-level="${level}"]`)
            .classList.add("active");

        // Show start button
        document.getElementById("startBtn").style.display = "block";
    }

    // Add listeners
    progressPoints.forEach(point => {
        point.addEventListener("click", () => setDifficulty(point.dataset.level, true));
    });

    // Default start
    setDifficulty("medium", true); // true = use CSS classes
});
