import express from "express";

const router = express.Router();

// Temporary in-memory storage (swap with MongoDB later)
let users = {}; // { username: { xp, level, coins, daily, challenges } }

// Helper: create a new user record if not exists
function getOrCreateUser(username) {
    if (!users[username]) {
        users[username] = {
            xp: 0,
            level: 1,
            coins: 0,
            category: 1,
            stage: 1,
            daily: {
                streak: 0,
                lastClaim: null,
                claimedDays: []
            },
            challenges: [
                {
                    id: "first_win",
                    title: "First Win of the Day",
                    desc: "Win a match today",
                    reward: { xp: 75, coins: 35 },
                    completed: false,
                    claimed: false
                },
                {
                    id: "marathon",
                    title: "Marathon Player",
                    desc: "Spend 10 minutes playing ping pong",
                    reward: { xp: 50, coins: 25 },
                    completed: false,
                    claimed: false
                },
                {
                    id: "level_2",
                    title: "Rising Star",
                    desc: "Reach Level 2",
                    reward: { xp: 100, coins: 50 },
                    completed: false,
                    claimed: false
                }
            ]
        };
    }
    return users[username];
}

//
// ─── PROGRESS ROUTES ───────────────────────────────────────────────────────────
//

// GET progress
router.get("/progress/:username", (req, res) => {
    const { username } = req.params;
    const user = getOrCreateUser(username);
    res.json(user);
});

// POST save progress (update xp/level/coins)
router.post("/progress", (req, res) => {
    const { username, xp, level, coins } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "No username" });

    const user = getOrCreateUser(username);
    if (xp !== undefined) user.xp = xp;
    if (level !== undefined) user.level = level;
    if (coins !== undefined) user.coins = coins;

    res.json({ success: true, progress: user });
});

//
// ─── DAILY REWARDS ROUTES ──────────────────────────────────────────────────────
//

// POST claim daily reward
router.post("/daily/claim", (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Missing username" });

    const user = getOrCreateUser(username);
    const today = new Date().toDateString();

    if (user.daily.lastClaim === today) {
        return res.json({ success: false, message: "Already claimed today" });
    }

    // If the user skipped a day, reset streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (user.daily.lastClaim !== yesterday.toDateString()) {
        user.daily.streak = 0; // reset
        user.daily.claimedDays = [];
    }

    // Next day is streak + 1 (loop back to 1 after day 7)
    const day = (user.daily.streak % 7) + 1;

    // Rewards mapping
    const rewards = {
        1: { coins: 25 },
        2: { xp: 50 },
        3: { coins: 50 },
        4: { paddleSkin: 1 },
        5: { coins: 75 },
        6: { xp: 100 },
        7: { mysteryBox: true }
    };

    const reward = rewards[day];

    // Apply reward
    if (reward.xp) user.xp += reward.xp;
    if (reward.coins) user.coins += reward.coins;

    user.daily.streak += 1;
    user.daily.lastClaim = today;
    user.daily.claimedDays.push(day);

    res.json({ success: true, reward, day, progress: user });
});


//
// ─── CHALLENGES ROUTES ─────────────────────────────────────────────────────────
//

// GET challenges
// Add this to your backend routes to get challenge progress
router.get("/challenges/:username", (req, res) => {
    const { username } = req.params;
    const user = getOrCreateUser(username);

    // Calculate progress for each challenge
    const challengesWithProgress = user.challenges.map(challenge => {
        let progressValue = 0;

        if (challenge.id === "marathon") {
            // Calculate total play time in minutes
            progressValue = Math.floor((user.matchStats?.totalPlayTime || 0) / 60);
        } else if (challenge.id === "first_win") {
            // Check if user has a win today
            const today = new Date().toDateString();
            const hasWinToday = user.matchHistory?.some(match => {
                return match.win && new Date(match.timestamp).toDateString() === today;
            });
            progressValue = hasWinToday ? 100 : 0;
        } else if (challenge.id === "level_2") {
            progressValue = Math.min(100, (user.level / 2) * 100);
        } else if (challenge.id === "level_5") {
            progressValue = Math.min(100, (user.level / 5) * 100);
        }

        return {
            ...challenge,
            progressValue
        };
    });

    res.json(challengesWithProgress);
});

// POST claim challenge
router.post("/challenges/claim", (req, res) => {
    const { username, challengeId } = req.body;
    if (!username || !challengeId) return res.status(400).json({ success: false, message: "Missing username or challengeId" });

    const user = getOrCreateUser(username);
    const challenge = user.challenges.find(c => c.id === challengeId);

    if (!challenge) return res.status(404).json({ success: false, message: "Challenge not found" });
    if (challenge.claimed) return res.json({ success: false, message: "Already claimed" });
    if (!challenge.completed) return res.json({ success: false, message: "Not completed yet" });

    // Apply rewards
    user.xp += challenge.reward.xp;
    user.coins += challenge.reward.coins;
    challenge.claimed = true;

    res.json({ success: true, reward: challenge.reward, progress: user });
});
// Add this to your backend routes
router.post("/match/complete", (req, res) => {
    const { username, win, duration, category, level, score, timestamp } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username required" });
    }

    const user = getOrCreateUser(username);

    // Update match statistics
    if (!user.matchStats) {
        user.matchStats = {
            total: 0,
            wins: 0,
            losses: 0,
            totalPlayTime: 0,
            bestWinStreak: 0,
            currentWinStreak: 0
        };
    }

    user.matchStats.total++;
    user.matchStats.totalPlayTime += duration;

    if (win) {
        user.matchStats.wins++;
        user.matchStats.currentWinStreak++;
        user.matchStats.bestWinStreak = Math.max(
            user.matchStats.bestWinStreak,
            user.matchStats.currentWinStreak
        );

        // Update "First Win of the Day" challenge
        const firstWinChallenge = user.challenges.find(c => c.id === "first_win");
        if (firstWinChallenge && !firstWinChallenge.completed) {
            const today = new Date().toDateString();
            const lastWinDate = firstWinChallenge.lastCompleted;

            if (!lastWinDate || lastWinDate !== today) {
                firstWinChallenge.completed = true;
                firstWinChallenge.lastCompleted = today;
            }
        }
    } else {
        user.matchStats.losses++;
        user.matchStats.currentWinStreak = 0;
    }

    // Update "Marathon Player" challenge
    const marathonChallenge = user.challenges.find(c => c.id === "marathon");
    if (marathonChallenge) {
        // Convert seconds to minutes
        const totalMinutes = Math.floor(user.matchStats.totalPlayTime / 60);
        marathonChallenge.progress = Math.min(100, (totalMinutes / 10) * 100);
        marathonChallenge.completed = marathonChallenge.progress >= 100;
    }

    // Store match history (limit to last 20 matches)
    if (!user.matchHistory) {
        user.matchHistory = [];
    }

    user.matchHistory.unshift({
        win,
        duration,
        category,
        level,
        score,
        timestamp
    });

    // Keep only the last 20 matches
    user.matchHistory = user.matchHistory.slice(0, 20);

    res.json({
        success: true,
        stats: user.matchStats,
        challenges: user.challenges
    });
});
export default router;
