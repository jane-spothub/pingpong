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

const LEVELS_PER_CATEGORY = 15;
let userProgress = {
    xp: 0,
    level: 1,
    coins: 0,
    category: 1,
    stage: 1
};

let currentSelectedCategory = 1;

// Fetch user progress from API
async function loadUserProgress() {
    try {
        const username = localStorage.getItem('username') || 'guest';
        const response = await fetch(`/api/progress/${username}`);
        if (response.ok) {
            const data = await response.json();
            console.log("API Data:", data);
            userProgress = data;
            // Calculate currentCategory, currentLevel, and globalStage
            let currentCategory, currentLevel, globalStage;
            if (data.hasOwnProperty('stage') && data.hasOwnProperty('category')) {
                currentCategory = data.category;
                currentLevel = data.stage;
                globalStage = (currentCategory - 1) * LEVELS_PER_CATEGORY + currentLevel;
            } else if (data.hasOwnProperty('stage')) {
                globalStage = data.stage;
                currentCategory = Math.floor((globalStage - 1) / LEVELS_PER_CATEGORY) + 1;
                currentLevel = ((globalStage - 1) % LEVELS_PER_CATEGORY) + 1;
            } else {
                currentCategory = 1;
                currentLevel = 1;
                globalStage = 1;
            }
            updateUI(currentCategory, currentLevel, globalStage);
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        updateUI(1, 1, 1); // Fallback to default
    }
}

// Update the UI based on user progress
function updateUI(currentCategory, currentLevel, globalStage) {
    // Update current progress display
    document.getElementById('current-category').textContent = currentCategory;
    document.getElementById('current-level').textContent = currentLevel;

    // Generate category tabs
    const categoriesTabs = document.getElementById('categories-tabs');
    categoriesTabs.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const tab = document.createElement('div');
        tab.className = `category-tab ${i === currentCategory ? 'active' : ''}`;
        tab.innerHTML = `<i class="fas ${categoryIcons[i - 1]}"></i> ${i}`;
        tab.onclick = () => switchCategory(i);
        categoriesTabs.appendChild(tab);
    }

    // Generate categories and levels
    const categoriesContainer = document.getElementById('categories-container');
    categoriesContainer.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = `category-container category-${i} ${i === currentCategory ? 'active' : ''}`;
        categoryDiv.id = `category-${i}`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'category-title';
        titleDiv.innerHTML = `<i class="fas ${categoryIcons[i - 1]}"></i> ${i}. ${categoryNames[i - 1]}`;

        const levelsGrid = document.createElement('div');
        levelsGrid.className = 'levels-grid';

        // Calculate completed levels in this category
        let completedInCategory = 0;
        for (let j = 1; j <= LEVELS_PER_CATEGORY; j++) {
            const levelNumber = (i - 1) * LEVELS_PER_CATEGORY + j;
            const levelButton = document.createElement('button');
            levelButton.className = 'level-button';

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
                completedInCategory++;
            } else if (levelNumber === globalStage) {
                // Current level
                levelButton.classList.add('available');
                levelButton.innerHTML = `
                    <div class="level-number">${j}</div>
                    <div class="level-status">Play Now!</div>
                `;
                if (i === currentCategory && j === currentLevel) {
                    levelButton.classList.add('pulse');
                }
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

        // Add completion badge to category title if not all levels completed
        if (completedInCategory > 0 && completedInCategory < LEVELS_PER_CATEGORY) {
            const badge = document.createElement('span');
            badge.className = 'completion-badge';
            badge.textContent = `${completedInCategory}/${LEVELS_PER_CATEGORY}`;
            titleDiv.appendChild(badge);
        }

        categoryDiv.appendChild(titleDiv);
        categoryDiv.appendChild(levelsGrid);
        categoriesContainer.appendChild(categoryDiv);
    }
    currentSelectedCategory = currentCategory;
}


// Switch between categories
function switchCategory(categoryId) {
    // Update tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.category-tab:nth-child(${categoryId})`).classList.add('active');
    // Update category visibility
    document.querySelectorAll('.category-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`category-${categoryId}`).classList.add('active');
    currentSelectedCategory = categoryId;
    // Scroll to top of category
    document.getElementById(`category-${categoryId}`).scrollIntoView({behavior: 'smooth'});
}


// Start a level
function startLevel(category, level) {
    // Update user progress
    userProgress.category = category;
    userProgress.stage = level;
    // Save progress
    saveProgress();
    // Redirect to bot game page with level parameters
    window.location.href = `/bot?category=${category}&level=${level}`;
}



// Save progress to API
async function saveProgress() {
    try {
        const username = localStorage.getItem('username') || 'guest';
        const response = await fetch('/api/progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                xp: userProgress.xp,
                level: userProgress.level,
                coins: userProgress.coins,
                category: userProgress.category,
                stage: userProgress.stage
            })
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

    document.getElementById("openlevels").addEventListener("click", () => {
        document.querySelector(".level-overlay").classList.remove("hidden");
    });

    document.querySelector(".lvl-back-button").addEventListener("click", () => {
        document.querySelector(".level-overlay").classList.add("hidden");
    });
    // Refresh progress when page becomes visible
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            loadUserProgress();
        }
    });
});
