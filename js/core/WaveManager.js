// js/core/WaveManager.js
import * as Config from '../config.js';
import * as GameObjects from '../game_elements/gameObjects.js';
import * as GameState from './GameState.js';
import * as UIManager from '../ui/UIManager.js';
import * as Effects from '../effects.js';

let currentWaveNumber = 0;
let timeUntilNextWaveMs = 0;
let waveTimerIntervalId = null;
let enemiesToSpawnForCurrentWave = [];
let enemiesSpawnedCountThisWave = 0;
let lastSingleEnemySpawnTime = 0;
let currentWaveSpawnConfig = null;
let addObstacleToGameCallback = null;

export function initializeWaveManager(addObstacleFunc) {
    addObstacleToGameCallback = addObstacleFunc;
}

export function startNewGameWaveSystem() {
    currentWaveNumber = 0;
    if (waveTimerIntervalId) clearInterval(waveTimerIntervalId);
    waveTimerIntervalId = null;
    prepareForNextWave();
}

function prepareForNextWave() {
    currentWaveNumber++;
    GameState.setGameState(GameState.GameStates.WAVE_PREPARATION);
    enemiesSpawnedCountThisWave = 0;
    enemiesToSpawnForCurrentWave.length = 0;
    currentWaveSpawnConfig = null;

    if (currentWaveNumber === 1) {
        timeUntilNextWaveMs = Config.PREPARATION_TIME_FIRST_WAVE;
    } else {
        timeUntilNextWaveMs = Config.PREPARATION_TIME_BASE + ((currentWaveNumber - 2) * Config.PREPARATION_TIME_PER_WAVE_INCREMENT);
    }
    if (UIManager.updateWaveUI) UIManager.updateWaveUI(currentWaveNumber, timeUntilNextWaveMs, GameState.getGameState());

    if (waveTimerIntervalId) clearInterval(waveTimerIntervalId);
    waveTimerIntervalId = setInterval(() => {
        timeUntilNextWaveMs -= 1000;
        if (UIManager.updateWaveUI) UIManager.updateWaveUI(currentWaveNumber, timeUntilNextWaveMs, GameState.getGameState());
        if (timeUntilNextWaveMs <= 0) {
            clearInterval(waveTimerIntervalId);
            waveTimerIntervalId = null;
            beginWaveAttack();
        }
    }, 1000);
}

function generateWaveEnemies(waveNum, gameStatsRef, cameraRef, canvasRef, baseCoreRef, timeDifficulty) {
    const enemyList = [];
    let baseEnemyCount = 1 + Math.floor(waveNum * 0.8 + Math.pow(Math.max(0, waveNum - 1), 1.05) + timeDifficulty * 0.05);
    baseEnemyCount = Math.max(1, Math.min(Math.floor(baseEnemyCount), 12 + Math.floor(waveNum * 0.25)));

    let isBossWaveType = false;
    if (waveNum > 0 && waveNum % 10 === 0) {
        isBossWaveType = true;
        const bossDifficulty = waveNum * 1.8 + timeDifficulty * 1.5;
        const boss = GameObjects.createObstacle(bossDifficulty, waveNum, cameraRef, canvasRef, baseCoreRef, true);
        if(boss) enemyList.push(boss);
        baseEnemyCount = Math.floor(baseEnemyCount * 0.2);
    } else if (waveNum > 0 && waveNum % 5 === 0) {
        isBossWaveType = true;
        const miniBossDifficulty = waveNum * 1.3 + timeDifficulty * 1.2;
        const miniBoss = GameObjects.createObstacle(miniBossDifficulty, waveNum, cameraRef, canvasRef, baseCoreRef, false, true);
        if(miniBoss) enemyList.push(miniBoss);
        baseEnemyCount = Math.floor(baseEnemyCount * 0.35);
    }

    for (let i = 0; i < baseEnemyCount; i++) {
        const individualEnemyDifficulty = Math.max(1, Math.floor(waveNum * 0.4) + Math.floor(timeDifficulty * 0.25));
        const enemy = GameObjects.createObstacle(individualEnemyDifficulty, waveNum, cameraRef, canvasRef, baseCoreRef);
        if (enemy) enemyList.push(enemy);
    }
    return {
        enemies: enemyList,
        spawnIntervalMs: Math.max(250, 2000 - waveNum * 65 - timeDifficulty * 12),
        isBossWave: isBossWaveType
    };
}

function beginWaveAttack() {
    GameState.setGameState(GameState.GameStates.WAVE_IN_PROGRESS);
    Effects.triggerScreenBorderEffect('wave_start_flash'); // Flash rouge au début de la vague
    if (UIManager.updateWaveUI) UIManager.updateWaveUI(currentWaveNumber, 0, GameState.getGameState());
    lastSingleEnemySpawnTime = Date.now();
}

export function updateWaveManager(now, gameStatsRef, cameraRef, canvasRef, baseCoreRef, gameElementsRef) {
    if (GameState.isWaveInProgress()) {
        if (!currentWaveSpawnConfig) {
            const timeDifficulty = Math.floor((gameStatsRef.survivalTime || 0) / 45);
            currentWaveSpawnConfig = generateWaveEnemies(currentWaveNumber, gameStatsRef, cameraRef, canvasRef, baseCoreRef, timeDifficulty);
            enemiesToSpawnForCurrentWave = [...currentWaveSpawnConfig.enemies];
            enemiesSpawnedCountThisWave = 0;
            if(gameStatsRef) gameStatsRef.isBossWaveActive = currentWaveSpawnConfig.isBossWave;
            // L'effet de bordure 'boss_active' sera géré par main.js/update
        }

        if (enemiesSpawnedCountThisWave < enemiesToSpawnForCurrentWave.length) {
            if (now - lastSingleEnemySpawnTime > currentWaveSpawnConfig.spawnIntervalMs) {
                const enemyToSpawn = enemiesToSpawnForCurrentWave[enemiesSpawnedCountThisWave];
                if (addObstacleToGameCallback && enemyToSpawn) {
                    addObstacleToGameCallback(enemyToSpawn);
                }
                enemiesSpawnedCountThisWave++;
                lastSingleEnemySpawnTime = now;
            }
        } else if (gameElementsRef.obstacles.length === 0) { // Fin de vague
            currentWaveSpawnConfig = null;
            if(gameStatsRef) gameStatsRef.isBossWaveActive = false;
            Effects.clearScreenBorderEffect('boss_active'); // S'assurer d'enlever l'effet boss
            prepareForNextWave(); // Qui déclenchera l'effet 'wave_starting' via main.js/update
        }
    }
}
export function getCurrentWaveNumber() { return currentWaveNumber; }
export function getTimeUntilNextWaveMs() { return timeUntilNextWaveMs; }