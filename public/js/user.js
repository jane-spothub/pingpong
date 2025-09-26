
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.querySelector(".username-overlay");
    const input = document.getElementById("usernameInput");
    const button = document.getElementById("usernameSubmit");
    const gameContainer = document.getElementById("gameContainer");

    const savedUsername = localStorage.getItem("username");

    if (savedUsername) {
        overlay.classList.add("hidden");
        gameContainer.style.display = "block";
    } else {
            overlay.classList.remove("hidden");
            gameContainer.style.display = "none";
    }

    button.addEventListener("click", async () => {
        const username = input.value.trim();
        if (!username) {
            alert("Please enter a username!");
            return;
        }

        localStorage.setItem("username", username);

        try {
            const response = await fetch(`/api/progress/${username}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username})
            });
            const result = await response.json();
            console.log("Saved progress:", result);
        } catch (err) {
            console.error("❌ Failed to save progress:", err);
        }

        overlay.classList.add("hidden");
        overlay.classList.remove("active");
        gameContainer.style.display = "block";

        if (window.soundHandler) {
            window.soundHandler.playBackground();
        }
    });

});
