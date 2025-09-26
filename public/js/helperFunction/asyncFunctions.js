// frontend/progress.js
import {
    playerScore,
    botScore,
    ball,
    player,
    bot,
    botSpeed,
    categoryNames,
    serveTurn,
    setBallHeld,
    setBotSpeed,
    currentCategory,
    currentLevel,
    levelsPerCategory,
    scoreEl,
    totalPlayTime,
    xpNeeded,
    setCurrentCategory,
    setCurrrentLevel,
    incrementMatches,
    incrementMatchesWon,
    matchDuration,
    totalPPlayTime,
    incrementCurrentLevel, incrementCurrentCategory
} from "../globals.js";
let playerXP = 0, playerLevel = 1, playerCoins = 0; // === Player Progression ===

//
// ─── BOT AI ──────────────────────────────────────────────────────────────
//
export function updateBotMovement(dt) {
    const horizontalSpeed = botSpeed * dt;
    const verticalSpeed = botSpeed * dt;
    const predictU = ball.u + (ball.vu * 12);

    // Horizontal movement
    const horizontalError = predictU - bot.u;
    if (Math.abs(horizontalError) > 0.025) {
        bot.u += Math.sign(horizontalError) * horizontalSpeed;
    }

    // Vertical movement
    if (ball.vv < 0) {
        if (ball.v < bot.v + 0.18) {
            if (bot.v > -0.5) bot.v -= verticalSpeed * 0.6;
        } else {
            if (bot.v < -0.3) bot.v += verticalSpeed * 0.4;
        }
    } else {
        if (bot.v < -0.3) bot.v += verticalSpeed * 0.3;
    }

    // Human-like imperfections
    if (Math.random() < 0.04) {
        bot.u += (Math.random() - 0.5) * 0.008;
        bot.v += (Math.random() - 0.5) * 0.004;
    }

    // Bounds
    bot.u = Math.max(0.1, Math.min(0.9, bot.u));
    bot.v = Math.max(-0.6, Math.min(-0.1, bot.v));
}

//
// ─── UI ─────────────────────────────────────────────────────────────────
//
export function updateProgressUI() {
    scoreEl.textContent = `Player: ${playerScore} | Bot: ${botScore}`;
    const stageEl = document.getElementById("levelReached");
    if (stageEl) {
        const categoryName = categoryNames[currentCategory - 1] || `Category ${currentCategory}`;
        stageEl.textContent = `${categoryName} - Level ${currentLevel}`;
    }
}

//
// ─── PROGRESS SYNC ──────────────────────────────────────────────────────
//
export async function saveProgressToServer(category, level, globalLevel) {
    try {
        const username = localStorage.getItem("username") || "guest";
        const response = await fetch(`/api/progress/${username}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username,
                xp: playerXP,
                level: playerLevel,
                coins: playerCoins,
                category,
                stage: level
            })
        });
        if (!response.ok) throw new Error("Failed to save progress");
        console.log("Progress saved:", await response.json());
    } catch (err) {
        console.error("❌ Failed to save progress", err);
        localStorage.setItem("pingPongProgress", JSON.stringify({
            xp: playerXP, level: playerLevel, coins: playerCoins,
            category, stage: level
        }));
    }
}

export async function saveProgress() {
    try {
        const username = localStorage.getItem("username") || "guest";
        await fetch(`/api/progress/${username}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username,
                xp: playerXP,
                level: playerLevel,
                coins: playerCoins,
                category: currentCategory,
                stage: currentLevel
            })
        });
    } catch (err) {
        console.error("❌ Failed to save progress", err);
    }
}

export async function initProgress() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = parseInt(urlParams.get("category"));
    const urlLevel = parseInt(urlParams.get("level"));

    if (urlCategory && urlLevel) {
        setCurrentCategory(urlCategory);
        setCurrrentLevel(urlLevel);
    } else {
        try {
            const username = localStorage.getItem("username") || "guest";
            const response = await fetch(`/api/progress/${username}`);
            if (!response.ok) throw new Error("Failed to load progress");

            const data = await response.json(); // backend returns plain object
            playerXP = data.xp || 0;
            playerLevel = data.level || 1;
            playerCoins = data.coins || 0;
            setCurrentCategory(data.category || 1);
            setCurrrentLevel(data.stage || 1);
        } catch {
            const saved = JSON.parse(localStorage.getItem("pingPongProgress") || "{}");
            playerXP = saved.xp || 0;
            playerLevel = saved.level || 1;
            playerCoins = saved.coins || 0;
            setCurrentCategory(saved.category || 1);
            setCurrrentLevel(saved.stage || 1);
        }
    }

    updateProgressUI();
}


//
// ─── MATCHES & CHALLENGES ───────────────────────────────────────────────
//
export async function recordMatchCompletion(win) {
    incrementMatches();
    incrementMatchesWon(win)
    totalPPlayTime();

    try {
        const username = localStorage.getItem("username") || "guest";
        const response = await fetch("/api/match/complete", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username, win, duration: matchDuration,
                category: currentCategory, level: currentLevel,
                score: {player: playerScore, bot: botScore},
                timestamp: new Date().toISOString()
            })
        });
        console.log("Match recorded:", await response.json());
        updateChallengesAfterMatch(win, matchDuration);
    } catch (err) {
        console.error("Failed to record match:", err);
    }
}

export async function updateChallengesAfterMatch(win, duration) {
    try {
        const username = localStorage.getItem("username") || "guest";
        const res = await fetch(`/api/challenges/${username}`);
        if (!res.ok) throw new Error("Failed to fetch challenges");
        const challenges = await res.json();
        if (document.getElementById("challengesContainer")) {
            renderChallenges(challenges);
        }
    } catch (err) {
        console.error("❌ Failed to update challenges", err);
    }
}

//
// ─── LEVELING & REWARDS ─────────────────────────────────────────────────
//
export function unlockNextLevel() {
    incrementCurrentLevel();
    if (currentLevel > levelsPerCategory) {
        setCurrrentLevel(1);
        incrementCurrentCategory();
    }
    const globalLevel = (currentCategory - 1) * levelsPerCategory + currentLevel;
    saveProgressToServer(currentCategory, currentLevel, globalLevel);
    updateProgressUI();
}

const rewardRules = {
    1: {winXP: 100, loseXP: 50, winCoins: 50, loseCoins: 25},
    2: {winXP: 120, loseXP: 60, winCoins: 60, loseCoins: 30},
};

export function grantRewards(win) {
    const rules = rewardRules[currentCategory] || rewardRules[1];
    const earnedXP = win ? rules.winXP : rules.loseXP;
    const earnedCoins = win ? rules.winCoins : rules.loseCoins;
    addXP(earnedXP, win);
    addCoins(earnedCoins);
    saveProgress();
    return {earnedXP, earnedCoins};
}

function addXP(amount, allowLevelUp = true) {
    playerXP += amount;
    if (allowLevelUp &&
        playerLevel < xpNeeded.length - 1 &&
        playerXP >= xpNeeded[playerLevel]) {
        playerLevel = Math.max(1, playerLevel + 1);
    }
    updateProgressUI();
    saveProgress();
}

function addCoins(amount) {
    playerCoins += amount;
    updateProgressUI();
}

//
// ─── BALL / SERVE ───────────────────────────────────────────────────────
//

export function resetBall() {
    let baseSpeed = 0.00020;
    let speedFactor = 0.7;

    // difficulty scaling
    if (currentCategory >= 2) baseSpeed += 0.00005 * (currentCategory - 1);
    if (currentLevel >= 10) baseSpeed += 0.00002 * (currentLevel / 10);
    setBotSpeed(baseSpeed);

    if (currentCategory >= 4 || currentLevel >= 5) {
        speedFactor = 1.4; setBotSpeed(0.00035);
    }
    if (currentCategory >= 7 || currentLevel >= 10) {
        speedFactor = 2.0; setBotSpeed(0.00055);
    }

    player.u = 0.5; player.v = 0.72;
    bot.u = 0.5; bot.v = -0.40;

    if (serveTurn === "player") {
        // Ball in player’s hand until serve
        setBallHeld(true);
        ball.u = player.u;
        ball.v = player.v - 0.06;
        ball.vu = 0; ball.vv = 0;
    } else {
        // Bot serve immediately
        setBallHeld(false);
        ball.u = bot.u;
        ball.v = bot.v + 0.06;
        ball.vu = (Math.random() - 0.5) * 0.0012 * speedFactor;
        ball.vv = 0.0011 * speedFactor;
    }

    ball.z = 0.2;
    ball.vz = 0;
}



sessionStorage.setItem("xp", playerXP);
