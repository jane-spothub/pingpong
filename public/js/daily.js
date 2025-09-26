document.addEventListener('DOMContentLoaded', function () {
    // document.getElementById("daily-challenges-Popup").classList.add("hidden");

    document.getElementById("openDailyChallenges").addEventListener("click", () => {
        document.querySelector(".daily-settings-overlay").classList.remove("hidden");
    });

    document.querySelector(".back-daily-button").addEventListener("click", () => {
        document.querySelector(".daily-settings-overlay").classList.add("hidden");
    });


    const claimButton = document.getElementById('claimButton');
    const notification = document.getElementById('rewardNotification');
    const streakCount = document.querySelector('.streak-count');
    const username = localStorage.getItem("username");
    const rewards = [
        { day: 1, type: "Coins", amount: 25, icon: "💰" },
        { day: 2, type: "XP", amount: 50, icon: "⭐" },
        { day: 3, type: "Coins", amount: 50, icon: "💰" },
        { day: 4, type: "Paddle Skin", amount: 1, icon: "🎨" },
        { day: 5, type: "Coins", amount: 75, icon: "💰" },
        { day: 6, type: "XP", amount: 100, icon: "⭐" },
        { day: 7, type: "Mystery Box", amount: "?", icon: "🎁" },
    ];
    const rewardCalendar = document.querySelector(".reward-calendar");

    // Clear placeholder HTML
    rewardCalendar.innerHTML = "";

    // Create each reward day
    rewards.forEach(reward => {
        const rewardDiv = document.createElement("div");
        rewardDiv.classList.add("reward-day", "future"); // default = locked/future

        rewardDiv.innerHTML = `
            <div class="day-number">Day ${reward.day}</div>
            <div class="reward-icon">${reward.icon}</div>
            <div class="reward-amount">${reward.amount}</div>
            <div class="reward-type">${reward.type}</div>
        `;

        rewardCalendar.appendChild(rewardDiv);
    });
    // Load progress to see which day is next
    fetch(`/api/progress/${username}`)
        .then(res => res.json())
        .then(user => {
            const userM = data;

            const nextDay = (userM.daily.streak % 7) + 1;

            // const nextDay = (user.daily.streak % 7) + 1;

            // Update streak text
            streakCount.textContent = `${user.daily.streak} days`;

            // Check if already claimed today
            const today = new Date().toDateString();
            if (user.daily.lastClaim === today) {
                // User already claimed today's reward
                const dayBox = document.querySelector(`.reward-day:nth-child(${nextDay})`);
                if (dayBox) {
                    dayBox.classList.remove("available");
                    dayBox.classList.add("claimed");
                }
                claimButton.disabled = true;
                claimButton.textContent = "Already Claimed!";
            } else {
                // Otherwise, highlight the next available day
                const dayBox = document.querySelector(`.reward-day:nth-child(${nextDay})`);
                if (dayBox) {
                    dayBox.classList.add("available");
                }
                claimButton.textContent = `Claim Daily Reward (Day ${nextDay})`;
                claimButton.disabled = false;
            }
        });


    claimButton.addEventListener('click', function () {
        this.disabled = true;
        this.textContent = 'Reward Claimed!';

        fetch("api/daily/claim", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username})
        })
            .then(res => res.json())
            .then(data => {
                console.log("Server response:", data);

                if (data.success) {
                    // Mark the day as claimed
                    const dayBox = document.querySelector(`.reward-day:nth-child(${data.day})`);
                    if (dayBox) {
                        dayBox.classList.remove("available");
                        dayBox.classList.add("claimed");
                    }

                    // Update streak
                    streakCount.textContent = `${data.progress.daily.streak} days`;

                    // Show notification
                    // notification.querySelector("div:last-child").textContent =
                    //     `Reward claimed: ${data.reward.xp ? data.reward.xp + " XP" : ""} ${data.reward.coins ? "+ " + data.reward.coins + " Coins" : ""}`;
                    notification.classList.add('show');

                    setTimeout(() => {
                        notification.classList.remove("show");
                    }, 3000);
                } else {
                    alert(data.message);
                }
            });
    });
    // claimButton.addEventListener('click', function () {
    //     notification.classList.add("show");
    //     setTimeout(() => notification.classList.remove("show"), 3000);
    // });

});
