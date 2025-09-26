const username = localStorage.getItem("username");

async function fetchProgress() {
    try {
        const res = await fetch(`/api/progress/${username}`);
        const data = await res.json();
        const progress = data.progress; // 🔹 fix

        document.getElementById("xp-display").textContent = `⭐: ${progress.xp} | 🛡️Lvl: ${progress.level}`;
        document.getElementById("coins-display").textContent = `🟡 ${progress.coins}`;


        // update UI
        // document.getElementById("xp-display").textContent = `⭐: ${data.xp} | 🛡️Lvl: ${data.level}`;
        // document.getElementById("coins-display").textContent = `🟡 ${data.coins}`;
    } catch (err) {
        console.error("❌ Failed to fetch progress:", err);
    }
}

// 🔹 fetch immediately when page loads
document.addEventListener("DOMContentLoaded", () => {
    fetchProgress();

    // 🔹 auto-refresh every 3s
    setInterval(fetchProgress, 3000);
});