async function fetchProgress() {
    try {
        const res = await fetch("/api/progress");
        const data = await res.json();

        // update UI
        document.getElementById("xp-display").textContent = `💎: ${data.xp} | Lvl: ${data.level}`;
        document.getElementById("coins-display").textContent = `💰 ${data.coins}`;
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