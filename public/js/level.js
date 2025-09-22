const categoryNames = [
    "Rookie Rally",
    "Spin Masters",
    "Power Play",
    "Precision Pros",
    "Speed Demons",
    "Tactical Titans",
    "Elite Champions",
    "Ultimate Showdown",
    "Legendary League",
    "Hall of Fame"
];

const categoryIcons = [
    "fa-table-tennis-paddle-ball",
    "fa-spinner",
    "fa-bolt",
    "fa-bullseye",
    "fa-gauge-high",
    "fa-chess",
    "fa-trophy",
    "fa-fire",
    "fa-crown",
    "fa-medal"
];

const LEVELS_PER_CATEGORY = 30;
let userProgress = {
    xp: 0,
    level: 1,
    coins: 0,
    category: 1,
    stage: 1
};

// Add this near the top of your backend file, after the users object
const XP_LEVELS = [
    0,    // Level 1: 0 XP
    100,  // Level 2: 100 XP
    250,  // Level 3: 250 XP
    500,  // Level 4: 500 XP
    1000, // Level 5: 1000 XP
    2000, // Level 6: 2000 XP
    3500, // Level 7: 3500 XP
    5000, // Level 8: 5000 XP
    7000, // Level 9: 7000 XP
    10000 // Level 10: 10000 XP
    // Add more levels as needed
];

// Helper function to calculate level based on XP
function calculateLevel(xp) {
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
        if (xp >= XP_LEVELS[i]) {
            return i + 1;
        }
    }
    return 1;
}

// Helper function to update user level based on XP
function updateUserLevel(user) {
    const newLevel = calculateLevel(user.xp);

    // Check if level increased
    if (newLevel > user.level) {
        user.level = newLevel;

        // Check if level-based challenges are completed
        const level2Challenge = user.challenges.find(c => c.id === "level_2");
        const level5Challenge = user.challenges.find(c => c.id === "level_5");

        if (level2Challenge && user.level >= 2 && !level2Challenge.completed) {
            level2Challenge.completed = true;
        }

        if (level5Challenge && user.level >= 5 && !level5Challenge.completed) {
            level5Challenge.completed = true;
        }

        return true; // Level increased
    }

    return false; // Level didn't change
}
// Manual sync function
async function syncLevels() {
    try {
        // Get progress from homepage (which seems to be correct)
        const response = await fetch('/api/progress');
        const data = await response.json();

        // Force update the UI with the correct levels
        if (data.category && data.stage) {
            const globalStage = (data.category - 1) * LEVELS_PER_CATEGORY + data.stage;
            updateUI(data.category, data.stage, globalStage);
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserProgress();
    // Also try syncing after a short delay
    setTimeout(syncLevels, 1000);
});
const username = localStorage.getItem("username");


// Fetch user progress from API
async function loadUserProgress() {
    try {
        const response = await fetch(`/api/progress/${username}`);
        if (response.ok) {
            const data = await response.json();
            console.log("API Data:", data); // Debugging

            userProgress = data;

            // Determine the correct current level display
            let currentCategory, currentLevel;

            if (data.hasOwnProperty('stage') && data.hasOwnProperty('category')) {
                // If API returns both stage and category
                currentCategory = data.category;
                currentLevel = data.stage;
            } else if (data.hasOwnProperty('stage')) {
                // If API returns only stage (global level)
                currentCategory = Math.floor((data.stage - 1) / LEVELS_PER_CATEGORY) + 1;
                currentLevel = ((data.stage - 1) % LEVELS_PER_CATEGORY) + 1;
            } else {
                // Fallback
                currentCategory = 1;
                currentLevel = 1;
            }

            updateUI(currentCategory, currentLevel, data.stage);
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        // Use default values if API fails
        updateUI(1, 1, 1);
    }
}

// Update the UI based on user progress
function updateUI(currentCategory, currentLevel, globalStage) {
    // Update current progress display
    document.getElementById('current-category').textContent = currentCategory;
    document.getElementById('current-level').textContent = currentLevel;

    // Generate categories and levels
    const categoriesContainer = document.getElementById('categories-container');
    categoriesContainer.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = `category-container category-${i}`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'category-title';
        titleDiv.innerHTML = `<i class="fas ${categoryIcons[i-1]}"></i> ${i}. ${categoryNames[i-1]}`;

        const levelsGrid = document.createElement('div');
        levelsGrid.className = 'levels-grid';

        for (let j = 1; j <= LEVELS_PER_CATEGORY; j++) {
            const levelButton = document.createElement('button');
            levelButton.className = 'level-button';

            // Calculate level number (across all categories)
            const levelNumber = (i - 1) * LEVELS_PER_CATEGORY + j;

            // Determine if level is available, completed, or locked
            if (levelNumber < globalStage) {
                // Level is completed
                levelButton.classList.add('completed');
                levelButton.innerHTML = `
                    <div class="level-number">${j}</div>
                    <div class="level-status">Completed</div>
                    <div class="level-icon"><i class="fas fa-check"></i></div>
                `;
                levelButton.onclick = () => startLevel(i, j);
            } else if (levelNumber === globalStage) {
                // Current level
                levelButton.classList.add('available');
                levelButton.innerHTML = `
                    <div class="level-number">${j}</div>
                    <div class="level-status">Play Now!</div>
                `;
                levelButton.onclick = () => startLevel(i, j);
            } else {
                // Locked level
                levelButton.classList.add('locked');
                levelButton.innerHTML = `
                    <div class="level-number">${j}</div>
                    <div class="level-status">Locked</div>
                    <div class="level-icon"><i class="fas fa-lock"></i></div>
                `;
                levelButton.onclick = null;
            }

            levelsGrid.appendChild(levelButton);
        }

        categoryDiv.appendChild(titleDiv);
        categoryDiv.appendChild(levelsGrid);
        categoriesContainer.appendChild(categoryDiv);
    }
}

// Start a level
function startLevel(category, level) {
    // Calculate global level number
    const globalLevel = (category - 1) * LEVELS_PER_CATEGORY + level;

    // Show a confirmation message
    const playNow = confirm(`Start ${categoryNames[category-1]} - Level ${level}?`);

    if (playNow) {
        // Update user progress based on your API structure
        // Try both formats to see what works
        userProgress.category = category;
        userProgress.stage = level;

        // Also set the global stage if needed
        userProgress.globalStage = globalLevel;

        // Save progress
        saveProgress();

        // Redirect to bot game page with level parameters
        window.location.href = `/bot?category=${category}&level=${level}`;
    }
}

// Save progress to API
async function saveProgress() {
    try {
        // Try to save in the format your API expects
        const response = await fetch(`/api/progress/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userProgress)
        });

        if (!response.ok) {
            throw new Error('API save failed');
        }

        console.log("Progress saved successfully");
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadUserProgress();
});