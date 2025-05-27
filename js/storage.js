import { HIGH_SCORES_KEY } from './config.js';

export function loadHighScores() {
    return JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
}

export function saveHighScore(score, wave, time, highScores) {
    highScores.push({ score, wave, time, date: new Date().toISOString().slice(0,10) });
    highScores.sort((a, b) => b.score - a.score || b.wave - a.wave || b.time - a.time);
    highScores = highScores.slice(0, 10); // Keep top 10
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    return highScores; // Return the updated list
}