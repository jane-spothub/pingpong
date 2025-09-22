document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("usernameOverlay");
    const input = document.getElementById("usernameInput");
    const button = document.getElementById("usernameSubmit");

    // If already saved, skip overlay
    let savedUsername = localStorage.getItem("username");
    if (savedUsername) {
        overlay.style.display = "none";
    }

    button.addEventListener("click", () => {
        const username = input.value.trim();
        if (!username) {
            alert("Please enter a username!");
            return;
        }

        // Save locally (so user won’t have to re-enter each time)
        localStorage.setItem("username", username);

        // Later: send to backend to check/create user record
        fetch("/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        // Hide overlay
        overlay.style.display = "none";
    });
});
