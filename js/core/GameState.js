// js/core/GameState.js
export const GameStates = {
    MENU: 'menu',
    LOADING: 'loading',
    WAVE_PREPARATION: 'wave_preparation',
    WAVE_IN_PROGRESS: 'wave_in_progress',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};
let currentGameState = GameStates.MENU;
export function getGameState() { return currentGameState; }
export function setGameState(newState) {
    if (Object.values(GameStates).includes(newState)) {
        currentGameState = newState;
    } else { console.error("État de jeu invalide:", newState); }
}
export function isMenu() { return currentGameState === GameStates.MENU; }
export function isLoading() { return currentGameState === GameStates.LOADING; }
export function isWavePreparation() { return currentGameState === GameStates.WAVE_PREPARATION; }
export function isWaveInProgress() { return currentGameState === GameStates.WAVE_IN_PROGRESS; }
export function isPaused() { return currentGameState === GameStates.PAUSED; }
export function isGameOver() { return currentGameState === GameStates.GAME_OVER; }