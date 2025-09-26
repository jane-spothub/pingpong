// gameState.js
export const scoreEl = document.getElementById("score-display");
export let matchStartTime = 0;

export function setmatchStartTime(time) {
    matchStartTime = time;
}

export let width = window.innerWidth, height = window.innerHeight;
export let matchesPlayed, matchesWon, totalPlayTime = 0;
export function incrementMatches(){
    matchesPlayed++;
}

export const matchDuration = Math.floor((performance.now() - matchStartTime) / 1000);

export function totalPPlayTime(){
    totalPlayTime += matchDuration;
}
export function incrementMatchesWon(win){
    if (win) matchesWon++;
}



// Extract category and level from URL parameters
export const xpNeeded = [0, 100, 250, 500, 1000]; // XP thresholds for each level
// Physics constants
export let playerScore = 0;
export let botScore = 0;
export const categoryNames = [
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
export const ball = {
    u: 0.5, v: 0.1, vu: 0.004, vv: 0.004,
    z: 0.1, vz: 0,
    radius: 0.03
};
// export let serveTurn = "";
export const player = {u: 0.5, v: 0.72, w: 0.25, z: 0.1};
export const bot = {u: 0.5, v: -0.40, w: 0.25, z: 0.1};
export let botSpeed = 0.001; // instead of 0.00015
export let serveTurn = "bot"; // start with player, you can randomize if you want

export function setServerTurn(actor) {
    serveTurn = actor;
}

export function setBotSpeed(speed) {
    botSpeed = speed;
}

export function setPlayerScore(score) {
    playerScore = score;
}

export function setBotScore(score) {
    botScore = score;
}

export let ballHeld = true;
export function setBallHeld(state) { ballHeld = state; }

export function incrementPlayerScore(increment = false) {
    if (increment) {
        playerScore++
    }
}

export function incrementBotScore(increment = false) {
    if (increment) {
        botScore++
    }
}

export const PlayerImg = new Image();
PlayerImg.src = "assets/img/ProplayerPaddle.png"; // Matches loader

export const BotImg = new Image();
BotImg.src = "assets/img/ProBotPaddle.png"; // Matches loader


export const levelsPerCategory = 15;

const urlParams = new URLSearchParams(window.location.search);
export let currentCategory = parseInt(urlParams.get('category')) || 1;
export let currentLevel = parseInt(urlParams.get('level')) || 1;

export function setCurrrentLevel(level) {
    currentLevel = level;
}
export function incrementCurrentLevel(){
    currentLevel++;
}
export function incrementCurrentCategory(){
    currentCategory++;
}
export function setCurrentCategory(category) {
    currentCategory = category;
}