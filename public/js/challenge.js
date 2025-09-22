// Global variable to store challenges
let challenges = [];

// Fetch challenges from backend
async function fetchChallenges() {
    try {
        const username = localStorage.getItem("username");
        if (!username) {
            console.error("No username found");
            return;
        }

        const response = await fetch(`/api/challenges/${username}`);
        const data = await response.json();

        if (response.ok) {
            // Transform backend data to match frontend format
            challenges = data.map(challenge => ({
                id: challenge.id,
                category: getChallengeCategory(challenge.id),
                icon: getChallengeIcon(challenge.id),
                title: challenge.title,
                desc: challenge.desc,
                progress: calculateProgress(challenge),
                reward: challenge.reward,
                claimable: challenge.completed && !challenge.claimed,
                completed: challenge.completed
            }));

            renderChallenges();
        } else {
            console.error("Failed to fetch challenges:", data.message);
        }
    } catch (error) {
        console.error("Error fetching challenges:", error);
    }
}

// Helper function to determine challenge category
function getChallengeCategory(challengeId) {
    if (challengeId.includes('daily') || challengeId === 'first_win' || challengeId === 'marathon') {
        return "Daily Challenges";
    } else if (challengeId.includes('level')) {
        return "Progression Challenges";
    } else {
        return "Other Challenges";
    }
}

// Helper function to get appropriate icon for challenge
function getChallengeIcon(challengeId) {
    switch(challengeId) {
        case 'first_win': return 'fas fa-trophy';
        case 'marathon': return 'fas fa-clock';
        case 'level_2':
        case 'level_5': return 'fas fa-level-up-alt';
        default: return 'fas fa-star';
    }
}

// Helper function to calculate progress percentage
function calculateProgress(challenge) {
    // For time-based challenges like marathon
    if (challenge.id === 'marathon') {
        // Assuming challenge tracks minutes played
        const targetMinutes = 10; // 10 minute target
        const currentMinutes = challenge.progressValue || 0;
        return Math.min(100, (currentMinutes / targetMinutes) * 100);
    }

    // For win-based challenges
    if (challenge.id === 'first_win') {
        return challenge.completed ? 100 : 0;
    }

    // For level-based challenges
    if (challenge.id === 'level_2') {
        const userLevel = parseInt(localStorage.getItem('userLevel') || 1);
        return Math.min(100, (userLevel / 2) * 100);
    }

    if (challenge.id === 'level_5') {
        const userLevel = parseInt(localStorage.getItem('userLevel') || 1);
        return Math.min(100, (userLevel / 5) * 100);
    }

    return 0;
}

// Render challenges grouped by category
function renderChallenges() {
    const container = document.getElementById("challengesContainer");
    if (!container) return;

    container.innerHTML = "";

    const categories = [...new Set(challenges.map(c => c.category))];

    categories.forEach(cat => {
        const categoryEl = document.createElement("div");
        categoryEl.classList.add("challenge-category");

        categoryEl.innerHTML = `
            <div class="category-title">
                <div class="category-icon"><i class="fas fa-list"></i></div>
                <h2>${cat}</h2>
            </div>
        `;

        challenges
            .filter(c => c.category === cat)
            .forEach(ch => {
                const card = document.createElement("div");
                card.classList.add("challenge-card");
                if (ch.completed) card.classList.add("completed");

                card.innerHTML = `
                    <div class="challenge-icon">
                        <i class="${ch.icon}"></i>
                    </div>
                    <div class="challenge-details">
                        <div class="challenge-title">${ch.title}</div>
                        <div class="challenge-desc">${ch.desc}</div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${ch.progress}%; background: ${ch.progress === 100 ? "#4CAF50" : "#FF5252"};"></div>
                        </div>
                        <div class="challenge-reward">
                            <span class="reward-icon"><i class="fas fa-star" style="color: #fdbb2d;"></i></span>
                            <span>${ch.reward.xp} XP</span>
                            <span class="reward-icon" style="margin-left: 10px;"><i class="fas fa-coins" style="color: gold;"></i></span>
                            <span>${ch.reward.coins} Coins</span>
                        </div>
                    </div>
                    <button class="btn-claim" data-id="${ch.id}" ${!ch.claimable ? "disabled" : ""}>
                        ${ch.completed && !ch.claimable ? "Claimed" : "Claim"}
                    </button>
                `;

                categoryEl.appendChild(card);
            });

        container.appendChild(categoryEl);
    });

    attachClaimEvents(); // rebind claim button clicks
}

// Attach claim event listeners
function attachClaimEvents() {
    document.querySelectorAll(".btn-claim").forEach(button => {
        button.addEventListener("click", async function () {
            const id = this.dataset.id;
            const challenge = challenges.find(c => c.id === id);

            if (!challenge || !challenge.claimable) return;

            try {
                const username = localStorage.getItem("username");
                const response = await fetch("/api/challenges/claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, challengeId: challenge.id })
                });

                const data = await response.json();

                if (data.success) {
                    // Mark as claimed in UI
                    this.textContent = "Claimed";
                    this.disabled = true;

                    // Update the challenge in our local array
                    const challengeIndex = challenges.findIndex(c => c.id === id);
                    if (challengeIndex !== -1) {
                        challenges[challengeIndex].claimable = false;
                    }

                    // Update stats from backend response
                    if (data.progress) {
                        localStorage.setItem('userXP', data.progress.xp);
                        localStorage.setItem('userLevel', data.progress.level);
                        localStorage.setItem('userCoins', data.progress.coins);

                        // Update UI elements if they exist
                        const xpElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
                        const coinsElement = document.querySelector('.stat-item:nth-child(2) .stat-value');

                        if (xpElement) xpElement.textContent = data.progress.xp.toLocaleString();
                        if (coinsElement) coinsElement.textContent = data.progress.coins.toLocaleString();
                    }

                    // Show notification
                    const notification = document.getElementById("rewardNotification");
                    if (notification) {
                        notification.innerHTML = `<i class="fas fa-check-circle"></i> Reward claimed: +${challenge.reward.xp} XP & +${challenge.reward.coins} Coins!`;
                        notification.classList.add("show");

                        setTimeout(() => notification.classList.remove("show"), 3000);
                    }

                    console.log("Challenge reward claimed:", data.reward);
                } else {
                    alert(data.message || "Failed to claim reward");
                }
            } catch (error) {
                console.error("Error claiming challenge:", error);
                alert("Error claiming reward. Please try again.");
            }
        });
    });
}

// Function to refresh challenges (call this after completing a match)
async function refreshChallenges() {
    await fetchChallenges();
}

// Initialize challenges when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    fetchChallenges();

    // Set up periodic refresh (every 30 seconds)
    setInterval(fetchChallenges, 30000);
});