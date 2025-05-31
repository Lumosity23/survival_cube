// js/main.js
import * as Config from './config.js';
import * as UIManager from './ui/UIManager.js';
import * as GameObjects from './game_elements/gameObjects.js'; // Contient createBuilding
// Importer les futures classes/factories de bâtiments si elles existent déjà
// import { Turret } from './game_elements/Turret.js';
// import { CoreBuilding } from './game_elements/CoreBuilding.js';
// import { Generator } from './game_elements/Generator.js';
// import { Bank } from './game_elements/Bank.js';
import * as EventListeners from './InputSystem.js';
import * as Storage from './storage.js';
import * as CollisionSystem from './systems/CollisionSystem.js';
import * as RenderingSystem from './systems/RenderingSystem.js';
import * as GameState from './core/GameState.js';
import * as WaveManager from './core/WaveManager.js';
import * as AISystem from './systems/AISystem.js';
// Importer les modules pour Shop, Upgrades, Pouvoirs, Objectifs s'ils sont réintégrés
// import * as ShopPanel from './ui/ShopPanel.js';
// import * as InGameUpgradePanel from './ui/InGameUpgradePanel.js';
// import * as PowersPanel from './ui/PowersPanel.js';
// import * as ObjectiveManager from './progression/ObjectiveManager.js';
import * as GameController from './core/gameController.js'; // Pour handlePowerUpCollection
import * as Effects from './effects.js'


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Chargé. Initialisation du jeu...");

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) {
        console.error("Impossible d'initialiser le canvas ou le contexte 2D.");
        return;
    }

    const uiElements = {
        menu: document.getElementById('menu'),
        gameOver: document.getElementById('gameOver'),
        pauseMenu: document.getElementById('pauseMenu'),
        uiStats: document.getElementById('ui'),
        gameControls: document.getElementById('gameControls'),
        // baseHealthBarContainer: document.querySelector('.base-health-bar-container'), // Pas utilisé pour l'instant
        // baseHealthBar: document.getElementById('baseHealthBar'),
        baseHealthDisplay: document.getElementById('baseHealthDisplay'), // Pour UI texte
        waveInfo: document.getElementById('waveInfo'),
        waveTimer: document.getElementById('waveTimer'),
        waveStatusOverlay: document.getElementById('waveStatusOverlay'), // Vérifie cet ID
        waveStatusText: document.getElementById('waveStatusText'),
        bigWaveTimerOverlay: document.getElementById('bigWaveTimerOverlay'),
        bigWaveTimerText: document.getElementById('bigWaveTimerText'),
        bigWaveCountdown: document.getElementById('bigWaveCountdown'),
        finalScore: document.getElementById('finalScore'),
        gameOverText: document.getElementById('gameOverText'),
        notificationContainer: document.getElementById('notificationContainer'),
        startGameBtn: document.getElementById('startGameBtn'),
        showRulesBtnMenu: document.getElementById('showRulesBtnMenu'),
        restartGameBtn: document.getElementById('restartGameBtn'),
        goToMenuBtnGameOver: document.getElementById('goToMenuBtnGameOver'),
        goToMenuBtnPause: document.getElementById('goToMenuBtnPause'),
        resumeGameBtn: document.getElementById('resumeGameBtn'),
        pauseButton: document.getElementById('pauseButton'),
        gameScreenBorderEffect: document.getElementById('gameScreenBorderEffect'),
    };

    UIManager.cacheUiElements(uiElements);
    Effects.initializeEffects(uiElements);

    let isShopOverlayOpen = false; // Non utilisé pour l'instant
    let camera = { x: 0, y: 0 };
    let gameElements = { cubes: new Map(), buildings: new Map(), obstacles: [], powerUps: [] };
    let baseCore = {
        x: 0, y: 0, health: Config.BASE_MAX_HEALTH, radius: Config.GRID_SIZE * 0.6,
        damage: Config.BASE_CORE_TURRET_INITIAL_DAMAGE,
        range: Config.GRID_SIZE * Config.BASE_CORE_TURRET_INITIAL_RANGE_FACTOR,
        fireRate: Config.BASE_CORE_TURRET_INITIAL_FIRE_RATE,
        lastShotTime: 0, shootingTarget: null
    };
    let gameStats = {};
    let keys = {};
    let animationFrame = null;
    // let highScores = Storage.loadHighScores ? Storage.loadHighScores() : []; // Commenté
    let currentBuildingToPlaceRef = { building: null, itemConfig: null }; // Même si non utilisé activement, EventListeners.js peut l'attendre
    let lastMousePosRef = { x: 0, y: 0 };
    let isMouseDownRef = { value: false };
    let lastPaintedGridCell = { x: null, y: null }; // Pour la logique de dessin de cube future

    function addObstacleToGame(obstacleData) {
        if (obstacleData) {
            console.log("[Main] Ajout d'un obstacle au jeu. Propriété 'speed':", obstacleData.speed, "Objet complet:", JSON.parse(JSON.stringify(obstacleData)));
            gameElements.obstacles.push(obstacleData);
        } else {
            console.warn("[Main] Tentative d'ajouter un obstacleData null/undefined.");
        }
    }
    WaveManager.initializeWaveManager(addObstacleToGame);

    function resizeCanvasAndRender() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (gameStats && typeof gameStats === 'object' && Object.keys(gameStats).length > 0) {
            gameStats.canvasWidth = canvas.width;
            gameStats.canvasHeight = canvas.height;
        }
        const currentState = GameState.getGameState();
        if(currentState !== GameState.GameStates.MENU && currentState !== GameState.GameStates.LOADING) {
            render();
        } else if (currentState === GameState.GameStates.MENU) {
             // Optionnel: dessiner un fond statique pour le menu si le canvas est visible derrière
             ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    function startGame() {
        UIManager.setOverlayDisplay(uiElements.menu, false);
        UIManager.setElementDisplay(uiElements.uiStats, true);
        UIManager.setElementDisplay(uiElements.gameControls, true);
        // UIManager.setElementDisplay(uiElements.baseHealthBarContainer, true); // Pas utilisé pour l'instant

        GameState.setGameState(GameState.GameStates.LOADING); // Ou directement WAVE_PREPARATION
        resetGame();
        WaveManager.startNewGameWaveSystem();
        UIManager.updateBaseHealthBarUI(baseCore.health); // Au cas où, mais c'est via baseHealthDisplay
        if(uiElements.baseHealthDisplay && gameStats.baseCoreHealth !== undefined) {
            const healthPercent = Math.max(0, (gameStats.baseCoreHealth / Config.BASE_MAX_HEALTH) * 100);
            uiElements.baseHealthDisplay.textContent = `${healthPercent.toFixed(0)}%`;
        }

        if (!animationFrame) gameLoop();
    }

    function resetGame() {
        gameElements.obstacles.length = 0;
        // On ne réinitialise pas cubes et buildings car ils ne sont pas utilisés pour l'instant
        baseCore.health = Config.BASE_MAX_HEALTH;
        baseCore.lastShotTime = 0; baseCore.shootingTarget = null;

        gameStats = {
            score: 0, wave: 0,
            cubesLeft: Config.INITIAL_CUBES, cash: Config.INITIAL_CASH,
            startTime: Date.now(), survivalTime: 0,
            obstaclesDestroyed: 0, cashEarnedThisGame: Config.INITIAL_CASH,
            baseCoreHealth: baseCore.health, // Pour l'UI texte
            camera: camera, canvasWidth: canvas.width, canvasHeight: canvas.height,
            isBossWaveActive: false
        };
        camera = { x: 0, y: 0 }; gameStats.camera = camera;
        // lastObstacleSpawn est géré par WaveManager
        UIManager.updateStatsUI(gameStats, gameElements);
        UIManager.resetWaveStartMessageTracker();
    }

    function gameLoop() {
        const currentState = GameState.getGameState();
        if (currentState === GameState.GameStates.GAME_OVER || currentState === GameState.GameStates.MENU) {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            animationFrame = null; return;
        }
        const now = Date.now();
        if (currentState === GameState.GameStates.WAVE_PREPARATION || currentState === GameState.GameStates.WAVE_IN_PROGRESS) {
            update(now);
        } else if (currentState === GameState.GameStates.PAUSED) {
            // Rien à mettre à jour en pause pour l'instant
        }
        render();
        animationFrame = requestAnimationFrame(gameLoop);
    }

    function update(now) {
        gameStats.survivalTime = Math.floor((now - gameStats.startTime) / 1000);
        gameStats.wave = WaveManager.getCurrentWaveNumber(); // Toujours mettre à jour la vague
        if (baseCore) { // S'assurer que baseCore est initialisé
             gameStats.baseCoreHealth = baseCore.health;
        }


        if (!isShopOverlayOpen) { // isShopOverlayOpen est toujours pertinent pour les inputs
            handleCameraMovement();
        }

        WaveManager.updateWaveManager(now, gameStats, camera, canvas, baseCore, gameElements);
        AISystem.updateEnemyAIAndMovement(gameElements, baseCore, gameStats);

        // --- MISE À JOUR DE LA LOGIQUE DES BÂTIMENTS ET DU NOYAU (Logique de tir/production) ---
        // Noyau
        if (baseCore && typeof baseCore.updateLogic === 'function') {
            baseCore.updateLogic(now, gameElements, gameStats);
        } else if (baseCore) { // Fallback si pas de méthode updateLogic
            let effectiveBaseFireRate = (baseCore.fireRate * (gameStats.baseTurretFireRateMultiplier || 1.0));
            // La logique pour isTurretOvercharged serait ici si PowersPanel était actif
            // if (gameStats.isTurretOvercharged && Config.POWERS_CONFIG) { ... }
            if (now - baseCore.lastShotTime > effectiveBaseFireRate) {
                tempHandleBaseCoreShooting(now);
            }
        }
        // Bâtiments construits
        gameElements.buildings.forEach((building, key) => {
            if (typeof building.updateLogic === 'function') {
                building.updateLogic(now, gameElements, gameStats, key.split(',').map(Number));
            } else { // Fallback
                if (building.type === 'turret') {
                    let effectiveFireRate = (building.fireRate || Config.TURRET_BASE_FIRE_RATE) * (gameStats.turretFireRateMultiplier || 1.0);
                    // if (gameStats.isTurretOvercharged && Config.POWERS_CONFIG) { ... }
                    if (now - building.lastShotTime > effectiveFireRate) {
                        tempHandleTurretShooting(building, key.split(',').map(Number));
                    }
                }
                // Ajouter ici la logique de fallback pour générateurs et banques si nécessaire
            }
        });
        // --- FIN MISE À JOUR BÂTIMENTS ---

        updateGameElements(); // Contient le mouvement PHYSIQUE des obstacles (déjà fait par AISystem) et les COLLISIONS

        // Régénération du Noyau (si la stat existe dans gameStats)
        if (gameStats.coreRegenPerMin > 0 && baseCore && baseCore.health < Config.BASE_MAX_HEALTH) {
            const regenThisFrame = (gameStats.coreRegenPerMin / 60) * (16.666 / 1000); // approx 1/60 de seconde
            baseCore.health = Math.min(Config.BASE_MAX_HEALTH, baseCore.health + regenThisFrame);
            // UIManager.updateBaseHealthBarUI(baseCore.health); // UIManager.updateStatsUI le fait via gameStats.baseCoreHealth
        }

        // --- GESTION DES EFFETS DE BORDURE D'ÉCRAN ---
        const currentState = GameState.getGameState();
        if (currentState === GameState.GameStates.WAVE_IN_PROGRESS) {
            // L'effet 'wave_start_flash' est un one-shot déclenché par WaveManager.beginWaveAttack()
            // et se gère lui-même via CSS/timeout JS dans effects.js.
            // On ne le gère pas de manière persistante ici.

            if (gameStats.isBossWaveActive) { // Ce flag est mis à jour par WaveManager
                Effects.triggerScreenBorderEffect('boss_active');
            } else {
                // Si ce n'est pas une vague de boss, s'assurer que l'effet 'boss_active' est enlevé.
                // L'effet 'player_damage' se gère tout seul (disparaît après un court instant).
                // L'effet 'wave_start_flash' se gère tout seul.
                // Donc, on veut seulement enlever 'boss_active' s'il n'est plus pertinent.
                Effects.clearScreenBorderEffect('boss_active');
            }
        } else if (currentState === GameState.GameStates.WAVE_PREPARATION) {
            // Pendant la préparation, on pourrait vouloir un effet bleu subtil,
            // ou simplement s'assurer que les effets de la vague précédente sont nettoyés.
            // Pour l'instant, le grand timer est l'indicateur principal.
            Effects.clearScreenBorderEffect('boss_active'); // Nettoyer l'effet boss
            // L'effet 'wave_start_flash' se sera déjà terminé.
        } else { // MENU, PAUSED, GAME_OVER, LOADING
            // Assurer qu'aucun effet de bordure n'est actif quand on n'est pas en phase de jeu active.
            Effects.triggerScreenBorderEffect('none');
        }
        // L'effet 'player_damage' est déclenché directement par CollisionSystem.js en appelant Effects.triggerScreenBorderEffect.

        // Calcul du score passif
        const timeDifficultyForScore = Math.floor(gameStats.survivalTime / (Config.WAVE_DURATION / 1.8)); // Ajuster le diviseur si besoin
        const currentOverallDifficultyForScore = gameStats.wave + timeDifficultyForScore;
        gameStats.score = (gameStats.score || 0) + Math.floor(currentOverallDifficultyForScore / 25);


        // ObjectiveManager.checkObjectives(gameStats); // Commenté pour l'instant
        // PowersPanel.updateActivePowers(now, gameStats); // Commenté pour l'instant
        // if (uiElements.powersPanel && uiElements.powersPanel.style.display !== 'none' && gameStats.survivalTime % 1 === 0) {
        //      UIManager.renderPowersUI(PowersPanel.getPowersState(), uiElements.powersList, handleActivatePower, now);
        // }

        UIManager.updateStatsUI(gameStats, gameElements);
    }

    function updateGameElements() {
        // Le mouvement physique des obstacles est maintenant dans AISystem.updateEnemyAIAndMovement

        if (CollisionSystem.handleObstacleCollisions(gameElements, gameStats, baseCore, endGame)) {
            return; // Jeu terminé
        }
    }

    function tempHandleTurretShooting(turret, turretGridPos) {
        let closestEnemy = null;
        const turretRange = (turret.range || Config.GRID_SIZE * Config.TURRET_BASE_RANGE_FACTOR);
        let minDistanceSq = turretRange * turretRange;
        const turretWorldX = turretGridPos[0] * Config.GRID_SIZE + Config.GRID_SIZE / 2;
        const turretWorldY = turretGridPos[1] * Config.GRID_SIZE + Config.GRID_SIZE / 2;

        gameElements.obstacles.forEach(enemy => {
            const distX = enemy.x - turretWorldX; const distY = enemy.y - turretWorldY;
            const distanceSq = distX * distX + distY * distY;
            if (distanceSq < minDistanceSq) { minDistanceSq = distanceSq; closestEnemy = enemy; }
        });

        if (closestEnemy) {
            const actualTurretDamage = (turret.damage || Config.TURRET_BASE_DAMAGE) + (gameStats.turretDamageBonus || 0);
            closestEnemy.hp -= actualTurretDamage;
            turret.lastShotTime = Date.now(); // Mettre à jour sur l'instance de la tourelle
            turret.shootingTarget = { x: closestEnemy.x, y: closestEnemy.y };
            setTimeout(() => { if(turret) turret.shootingTarget = null; }, 100);

            if (closestEnemy.hp <= 0) {
                const enemyIndex = gameElements.obstacles.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    gameElements.obstacles.splice(enemyIndex, 1);
                    if(gameStats && closestEnemy) {
                        gameStats.score += closestEnemy.scoreValue || 10;
                        gameStats.cash += closestEnemy.cashValue || 1;
                        gameStats.obstaclesDestroyed = (gameStats.obstaclesDestroyed || 0) + 1;
                    }
                }
            }
        }
    }

    function tempHandleBaseCoreShooting(now) { // 'now' est déjà disponible dans la portée de update
        let closestEnemy = null;
        const currentBaseRange = (baseCore.range || Config.GRID_SIZE * Config.BASE_CORE_TURRET_INITIAL_RANGE_FACTOR) ;
        let minDistanceSq = currentBaseRange * currentBaseRange;
        gameElements.obstacles.forEach(enemy => {
            const distX = enemy.x - baseCore.x; const distY = enemy.y - baseCore.y;
            const distanceSq = distX * distX + distY * distY;
            if (distanceSq < minDistanceSq) { minDistanceSq = distanceSq; closestEnemy = enemy; }
        });
        if (closestEnemy) {
            const actualBaseDamage = (baseCore.damage || Config.BASE_CORE_TURRET_INITIAL_DAMAGE) + (gameStats.baseTurretDamageBonus || 0);
            closestEnemy.hp -= actualBaseDamage;
            baseCore.lastShotTime = now; // Utiliser 'now' qui vient de la boucle update
            baseCore.shootingTarget = { x: closestEnemy.x, y: closestEnemy.y };
            setTimeout(() => { if(baseCore) baseCore.shootingTarget = null; }, 100);

            if (closestEnemy.hp <= 0) {
                const enemyIndex = gameElements.obstacles.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    gameElements.obstacles.splice(enemyIndex, 1);
                    if(gameStats && closestEnemy) {
                        gameStats.score += closestEnemy.scoreValue || 10;
                        gameStats.cash += closestEnemy.cashValue || 1;
                        gameStats.obstaclesDestroyed = (gameStats.obstaclesDestroyed || 0) + 1;
                    }
                }
            }
        }
    }

    function handleBaseCoreShooting(now) {
        let closestEnemy = null;
        const currentBaseRange = (baseCore.range || Config.GRID_SIZE * Config.BASE_CORE_TURRET_INITIAL_RANGE_FACTOR) ;
        let minDistanceSq = currentBaseRange * currentBaseRange;
        gameElements.obstacles.forEach(enemy => {
            const distX = enemy.x - baseCore.x; const distY = enemy.y - baseCore.y;
            const distanceSq = distX * distX + distY * distY;
            if (distanceSq < minDistanceSq) { minDistanceSq = distanceSq; closestEnemy = enemy; }
        });
        if (closestEnemy) {
            const actualBaseDamage = (baseCore.damage || Config.BASE_CORE_TURRET_INITIAL_DAMAGE) + (gameStats.baseTurretDamageBonus || 0);
            closestEnemy.hp -= actualBaseDamage;
            baseCore.lastShotTime = now;
            baseCore.shootingTarget = { x: closestEnemy.x, y: closestEnemy.y };
            setTimeout(() => { if(baseCore) baseCore.shootingTarget = null; }, 100); // Vérifier si baseCore existe encore

            if (closestEnemy.hp <= 0) {
                const enemyIndex = gameElements.obstacles.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    gameElements.obstacles.splice(enemyIndex, 1);
                    if(gameStats) { // Vérifier si gameStats existe
                        gameStats.score += closestEnemy.scoreValue || 10; // Valeur par défaut
                        gameStats.cash += closestEnemy.cashValue || 1;
                        gameStats.obstaclesDestroyed = (gameStats.obstaclesDestroyed || 0) + 1;
                    }
                }
            }
        }
    }

    function handleCameraMovement() {
        if (isShopOverlayOpen || GameState.getGameState() !== GameState.GameStates.WAVE_IN_PROGRESS && GameState.getGameState() !== GameState.GameStates.WAVE_PREPARATION) return;
        let newCamX = camera.x; let newCamY = camera.y;
        if (keys['w']) newCamY -= Config.CAMERA_SPEED; if (keys['s']) newCamY += Config.CAMERA_SPEED;
        if (keys['a']) newCamX -= Config.CAMERA_SPEED; if (keys['d']) newCamX += Config.CAMERA_SPEED;
        // Pas de collision caméra pour l'instant pour simplifier
        camera.x = newCamX; camera.y = newCamY;
        if(gameStats) gameStats.camera = camera;
    }

    function render() {
        if (!ctx || !gameStats || Object.keys(gameStats).length === 0) return;
        const uiStateForRendering = {
            currentBuildingToPlaceRef: null, // Pas de placement de bâtiment pour l'instant
            lastMousePosRef: lastMousePosRef,
            isShopOverlayOpen: isShopOverlayOpen
        };
        RenderingSystem.renderGame(ctx, camera, gameElements, baseCore, gameStats, uiStateForRendering);
    }

    function endGame(reason = "Noyau compromis.") {
        GameState.setGameState(GameState.GameStates.GAME_OVER);
        isShopOverlayOpen = false;
        Effects.setScreenBorder('none');
        Effects.triggerScreenBorderEffect('none');
        UIManager.setOverlayDisplay(uiElements.gameOver, true);
        [uiElements.uiStats, uiElements.instructions, uiElements.gameControls].forEach(el => UIManager.setElementDisplay(el, false));
        if (uiElements.finalScore) uiElements.finalScore.textContent = `Score: ${gameStats.score || 0}`;
        if (uiElements.gameOverText) uiElements.gameOverText.textContent = `${reason} Vague: ${gameStats.wave || 0}. Temps: ${gameStats.survivalTime || 0}s.`;
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    }
    function restartGame() { UIManager.setOverlayDisplay(uiElements.gameOver, false); startGame(); }
    function goToMenu() {
        GameState.setGameState(GameState.GameStates.MENU);
        isShopOverlayOpen = false;
        Effects.setScreenBorder('none');
        Effects.triggerScreenBorderEffect('none');
        [uiElements.gameOver, uiElements.pauseMenu, uiElements.uiStats, uiElements.instructions, uiElements.gameControls].forEach(el => UIManager.setElementDisplay(el, false));
        UIManager.setOverlayDisplay(uiElements.menu, true);
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    }

    function togglePause() {
        const currentState = GameState.getGameState();
        if (currentState === GameState.GameStates.WAVE_PREPARATION || currentState === GameState.GameStates.WAVE_IN_PROGRESS) {
            GameState.setGameState(GameState.GameStates.PAUSED);
            UIManager.setOverlayDisplay(uiElements.pauseMenu, true);
        } else if (currentState === GameState.GameStates.PAUSED) {
            UIManager.setOverlayDisplay(uiElements.pauseMenu, false);
            const timeUntilWave = WaveManager.getTimeUntilNextWaveMs ? WaveManager.getTimeUntilNextWaveMs() : 0;
            GameState.setGameState(timeUntilWave > 0 && WaveManager.getCurrentWaveNumber() > 0 ? GameState.GameStates.WAVE_PREPARATION : GameState.GameStates.WAVE_IN_PROGRESS);
            if (!animationFrame) requestAnimationFrame(gameLoop);
        }
    }
    function resumeGameFromPause() { // Spécifique pour le bouton reprendre du menu pause
        if (GameState.getGameState() === GameState.GameStates.PAUSED) {
            UIManager.setOverlayDisplay(uiElements.pauseMenu, false);
            const timeUntilWave = WaveManager.getTimeUntilNextWaveMs ? WaveManager.getTimeUntilNextWaveMs() : 0;
            GameState.setGameState(timeUntilWave > 0 && WaveManager.getCurrentWaveNumber() > 0 ? GameState.GameStates.WAVE_PREPARATION : GameState.GameStates.WAVE_IN_PROGRESS);
            if (!animationFrame) requestAnimationFrame(gameLoop);
        }
    }

    function showRules() { alert(Config.RULES_TEXT); }
    // --- Callbacks pour EventListeners (fonctions vides pour l'instant car non utilisées activement) ---
    function getMouseWorldPosCallback(mouseCanvasPos) {
        if(!mouseCanvasPos || typeof mouseCanvasPos.x === 'undefined') return null;
        return {
            x: mouseCanvasPos.x - canvas.width / 2 + camera.x,
            y: mouseCanvasPos.y - canvas.height / 2 + camera.y
        };
     }
    function placeCubeAtGrid(gridX, gridY) { /* Logique de placement de cube viendra ici */ }
    function handleCanvasMouseDownCallback(e) { /* Logique de clic pour placer/interagir viendra ici */ }
    function handleCanvasMouseUpCallback(e) { /* Logique de relâchement du clic viendra ici */ }
    function handleCanvasMouseMovePaintCallback(e) { /* Logique de dessin en glissant viendra ici */ }
    function handleCanvasContextMenuCallback(e) { e.preventDefault(); /* Logique de clic droit viendra ici */ }

    function handleKeyDownCallback(e) {
        keys[e.key.toLowerCase()] = true;
        const keyLower = e.key.toLowerCase();
        if (keyLower === 'p') { togglePause(); }
        if (keyLower === 'escape') {
            const currentState = GameState.getGameState();
            if (currentState === GameState.GameStates.PAUSED) resumeGameFromPause();
            else if (currentState === GameState.GameStates.WAVE_IN_PROGRESS || currentState === GameState.GameStates.WAVE_PREPARATION) togglePause();
            // Ajouter une condition pour fermer le shop si ouvert avec Echap plus tard
        }
    }
    function handleKeyUpCallback(e) {
        keys[e.key.toLowerCase()] = false;
    }


    // Initial Setup
    // L'erreur était probablement ici, car lastMousePosRef et isMouseDownRef n'étaient pas déclarés avant cet appel.
    EventListeners.setupEventListeners(
        canvas,
        keys,
        lastMousePosRef,    // Maintenant déclaré
        isMouseDownRef,     // Maintenant déclaré
        getMouseWorldPosCallback,
        handleCanvasMouseDownCallback,
        handleCanvasMouseUpCallback,
        handleCanvasMouseMovePaintCallback,
        handleCanvasContextMenuCallback,
        handleKeyDownCallback,
        handleKeyUpCallback,
        resizeCanvasAndRender,
        uiElements,
        { // Callbacks pour les boutons de l'UI
            startGame: startGame,
            showRules: showRules,
            restartGame: restartGame,
            goToMenu: goToMenu,
            resumeGame: resumeGameFromPause,
            openShop: () => {}, // Placeholder, sera implémenté plus tard
            closeShop: () => {},// Placeholder
            togglePause: togglePause
        }
    );

    resizeCanvasAndRender(); // Appel initial
    goToMenu(); // Démarrer au menu
    console.log("Initialisation de main.js terminée.");
});