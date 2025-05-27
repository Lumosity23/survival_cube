// js/main.js
import * as Config from './config.js';
import * as UI from './ui.js';
import * as GameObjects from './gameObjects.js';
import * as GameController from './gameController.js';
import * as EventListeners from './eventListeners.js';
import * as Storage from './storage.js';
import * as Collision from './collision.js';
import * as Objectives from './objectives.js';
import * as Shop from './shop.js';
import * as InGameUpgrades from './inGameUpgrades.js';
import * as Powers from './powers.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const uiElements = {
        menu: document.getElementById('menu'),
        gameOver: document.getElementById('gameOver'),
        pauseMenu: document.getElementById('pauseMenu'),
        shopMenu: document.getElementById('shopMenu'),
        uiStats: document.getElementById('ui'),
        objectivesDisplay: document.getElementById('objectives'),
        instructions: document.getElementById('instructions'),
        gameControls: document.getElementById('gameControls'),
        baseHealthBarContainer: document.querySelector('.base-health-bar-container'),
        baseHealthBar: document.getElementById('baseHealthBar'),
        cubeCount: document.getElementById('cubeCount'),
        score: document.getElementById('score'),
        wave: document.getElementById('wave'),
        cashDisplay: document.getElementById('cashDisplay'),
        survivalTime: document.getElementById('survivalTime'),
        objectiveList: document.getElementById('objectiveList'),
        finalScore: document.getElementById('finalScore'),
        gameOverText: document.getElementById('gameOverText'),
        shopCashDisplay: document.getElementById('shopCashDisplay'),
        shopItemsContainer: document.getElementById('shopItemsContainer'),
        highScoresBody: document.getElementById('highScoresBody'),
        notificationContainer: document.getElementById('notificationContainer'),
        inGameUpgrades: document.getElementById('inGameUpgrades'),
        upgradesList: document.getElementById('upgradesList'),
        powersPanel: document.getElementById('powersPanel'),
        powersList: document.getElementById('powersList'),
        // Boutons pour EventListeners
        startGameBtn: document.getElementById('startGameBtn'),
        showRulesBtnMenu: document.getElementById('showRulesBtnMenu'),
        restartGameBtn: document.getElementById('restartGameBtn'),
        goToMenuBtnGameOver: document.getElementById('goToMenuBtnGameOver'),
        goToMenuBtnPause: document.getElementById('goToMenuBtnPause'),
        resumeGameBtn: document.getElementById('resumeGameBtn'),
        openShopPauseBtn: document.getElementById('openShopPauseBtn'),
        closeShopBtn: document.getElementById('closeShopBtn'),
        shopButton: document.getElementById('shopButton'),
        pauseButton: document.getElementById('pauseButton'),
    };
    UI.cacheUiElements(uiElements);

    let gameState = 'menu';
    let isShopOverlayOpen = false;
    let camera = { x: 0, y: 0 };
    let gameElements = { cubes: new Map(), buildings: new Map(), obstacles: [], powerUps: [] };
    let baseCore = {
        x: 0, y: 0,
        health: Config.BASE_MAX_HEALTH,
        radius: Config.GRID_SIZE * 0.6,
        damage: Config.BASE_CORE_TURRET_INITIAL_DAMAGE,
        range: Config.GRID_SIZE * Config.BASE_CORE_TURRET_INITIAL_RANGE_FACTOR,
        fireRate: Config.BASE_CORE_TURRET_INITIAL_FIRE_RATE,
        lastShotTime: 0,
        shootingTarget: null
    };
    let gameStats = {};
    let keys = {};
    let lastObstacleSpawn = 0;
    let animationFrame;
    let highScores = Storage.loadHighScores();
    let currentBuildingToPlaceRef = { building: null, itemConfig: null };
    let lastMousePosRef = { x:0, y:0 };
    let isMouseDownRef = { value: false };
    let lastPaintedGridCell = { x: null, y: null };

    function resizeCanvasAndRender() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (gameStats && typeof gameStats === 'object') { // Vérifier que gameStats est initialisé
            gameStats.canvasWidth = canvas.width;
            gameStats.canvasHeight = canvas.height;
        }
        if(gameState !== 'menu' && gameState !== 'loading') render();
    }

    function startGame() {
        UI.setOverlayDisplay(uiElements.menu, false);
        UI.setElementDisplay(uiElements.uiStats, true);
        UI.setElementDisplay(uiElements.objectivesDisplay, true);
        UI.setElementDisplay(uiElements.instructions, true);
        UI.setElementDisplay(uiElements.gameControls, true);
        UI.setElementDisplay(uiElements.baseHealthBarContainer, true);
        UI.setElementDisplay(uiElements.inGameUpgrades, true);
        UI.setElementDisplay(uiElements.powersPanel, true);

        gameState = 'playing';
        isShopOverlayOpen = false; // S'assurer que le shop est fermé au début
        resetGame();
        Objectives.initializeObjectives(gameStats);
        UI.updateBaseHealthBarUI(baseCore.health);
        UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
        UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, Date.now());
        gameLoop();
    }

    function resetGame() {
        gameElements.cubes.clear();
        gameElements.buildings.clear();
        gameElements.obstacles.length = 0;
        gameElements.powerUps.length = 0;

        baseCore.health = Config.BASE_MAX_HEALTH;
        baseCore.damage = Config.BASE_CORE_TURRET_INITIAL_DAMAGE;
        baseCore.range = Config.GRID_SIZE * Config.BASE_CORE_TURRET_INITIAL_RANGE_FACTOR;
        baseCore.fireRate = Config.BASE_CORE_TURRET_INITIAL_FIRE_RATE;
        baseCore.lastShotTime = 0;
        baseCore.shootingTarget = null;

        currentBuildingToPlaceRef.building = null;
        currentBuildingToPlaceRef.itemConfig = null;
        isMouseDownRef.value = false;
        lastPaintedGridCell.x = null;
        lastPaintedGridCell.y = null;

        gameStats = {
            score: 0, wave: 1, cubesLeft: Config.INITIAL_CUBES, cash: Config.INITIAL_CASH,
            startTime: Date.now(), survivalTime: 0,
            obstaclesDestroyed: 0, cashEarnedThisGame: Config.INITIAL_CASH, cubesPlaced: 0,
            cubeMaxHpPercentBonus: 0,
            cubeDamageBonus: 0,
            coreRegenPerMin: 0,
            turretDamageBonus: 0,
            turretFireRateMultiplier: 1.0,
            baseTurretDamageBonus: 0,
            baseTurretFireRateMultiplier: 1.0,
            isTurretOvercharged: false,
            camera: camera,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        };
        Shop.resetShop();
        InGameUpgrades.initializeInGameUpgrades();
        InGameUpgrades.applyAllPassiveInGameUpgrades(gameStats);
        Powers.initializePowers();

        camera = { x: 0, y: 0 };
        gameStats.camera = camera;
        lastObstacleSpawn = Date.now();

        UI.updateStatsUI(gameStats, gameElements);
        UI.updateBaseHealthBarUI(baseCore.health);
        // Objectives.initializeObjectives(gameStats); // Déjà appelé dans startGame après resetGame
        UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
        UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, Date.now());
    }

    function gameLoop() {
        if (gameState === 'gameOver' || gameState === 'menu') {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            animationFrame = null;
            return;
        }

        if (gameState === 'playing') {
            const now = Date.now();
            update(now);
        } else if (gameState === 'paused') {
            // On pourrait vouloir mettre à jour certains éléments UI même en pause (ex: cooldowns des pouvoirs)
            const now = Date.now();
            Powers.updateActivePowers(now, gameStats); // Pour que les durées de pouvoirs s'écoulent
            if (uiElements.powersList.style.display !== 'none') { // Si le panneau est visible
                 UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, now);
            }
        }
        render();
        animationFrame = requestAnimationFrame(gameLoop);
    }

    function update(now) {
        gameStats.survivalTime = Math.floor((now - gameStats.startTime) / 1000);
        // La caméra ne bouge que si le shop n'est pas l'overlay actif ET qu'on n'est pas en train de placer un bâtiment
        if (!isShopOverlayOpen && !currentBuildingToPlaceRef.building && gameState === 'playing') {
            handleCameraMovement();
        } else if (isShopOverlayOpen && currentBuildingToPlaceRef.building) {
            // Permettre le mouvement de la caméra si on est en mode placement, même si le shop est techniquement "ouvert"
            // Mais on ne veut peut-être pas ça, pour forcer le joueur à se concentrer sur le placement.
            // Pour l'instant, on bloque le mouvement WASD si le shop est ouvert.
            // Le joueur utilisera la souris pour voir où placer.
        }

        const timeDifficulty = Math.floor(gameStats.survivalTime / (Config.WAVE_DURATION / 1.6));
        const currentOverallDifficulty = gameStats.wave + timeDifficulty;

        const spawnRate = Math.max(Config.OBSTACLE_SPAWN_RATE_BASE - currentOverallDifficulty * Config.OBSTACLE_SPAWN_RATE_DIFFICULTY_FACTOR, Config.OBSTACLE_SPAWN_MIN_RATE);
        if (now - lastObstacleSpawn > spawnRate) {
            let obstacleCount;
            if (gameStats.wave < 3) obstacleCount = 1;
            else if (gameStats.wave < 7) obstacleCount = 1 + Math.floor(currentOverallDifficulty / 10);
            else if (gameStats.wave < 12) obstacleCount = 2 + Math.floor(currentOverallDifficulty / 12);
            else obstacleCount = 2 + Math.floor(currentOverallDifficulty / 7);
            obstacleCount = Math.max(1, Math.min(obstacleCount, 8));

            for (let i = 0; i < obstacleCount; i++) {
                const individualEnemyDifficulty = Math.max(1, Math.floor(gameStats.wave * 0.6) + Math.floor(timeDifficulty * 0.4));
                const newObstacle = GameObjects.createObstacle(individualEnemyDifficulty, gameStats.wave, camera, canvas, baseCore);
                if (newObstacle) gameElements.obstacles.push(newObstacle);
            }
            lastObstacleSpawn = now;
        }

        if (Math.random() < Config.POWERUP_SPAWN_CHANCE_BASE + gameStats.survivalTime * Config.POWERUP_SPAWN_CHANCE_TIME_FACTOR) {
            gameElements.powerUps.push(GameObjects.createPowerUp(gameStats.wave, camera));
        }

        gameElements.buildings.forEach((building, key) => {
            if (building.type === 'generator' && building.lastGenTime && now - building.lastGenTime > building.interval) {
                gameStats.cubesLeft += building.productionRate;
                building.lastGenTime = now;
                UI.showNotification(`+${building.productionRate} 🧊 du générateur`, "info");
            } else if (building.type === 'turret') {
                let effectiveFireRate = (building.fireRate || Config.TURRET_BASE_FIRE_RATE) * (gameStats.turretFireRateMultiplier || 1.0);
                if (gameStats.isTurretOvercharged) {
                    const overchargeConfig = Config.POWERS_CONFIG.find(p => p.id === 'turretOvercharge');
                    if (overchargeConfig) effectiveFireRate *= overchargeConfig.fireRateMultiplierEffect;
                }
                if (now - building.lastShotTime > effectiveFireRate) {
                    handleTurretShooting(building, key.split(',').map(Number));
                }
            } else if (building.type === 'bank' && building.lastGenTime && now - building.lastGenTime > building.interval) {
                const cashGenerated = building.cashPerInterval || 0; // Utiliser 0 si undefined
                gameStats.cash += cashGenerated;
                gameStats.cashEarnedThisGame += cashGenerated;
                building.lastGenTime = now;
                //UI.showNotification(`+${cashGenerated}💲 de la banque`, "success");
            }
        });

        updateGameElements();

        if (gameStats.coreRegenPerMin > 0 && baseCore.health < Config.BASE_MAX_HEALTH) {
            const regenThisFrame = (gameStats.coreRegenPerMin / 60) * (16.666 / 1000);
            baseCore.health = Math.min(Config.BASE_MAX_HEALTH, baseCore.health + regenThisFrame);
            UI.updateBaseHealthBarUI(baseCore.health);
        }

        let effectiveBaseFireRate = (baseCore.fireRate * (gameStats.baseTurretFireRateMultiplier || 1.0));
        if (gameStats.isTurretOvercharged) {
            const overchargeConfig = Config.POWERS_CONFIG.find(p => p.id === 'turretOvercharge');
            if (overchargeConfig) effectiveBaseFireRate *= overchargeConfig.fireRateMultiplierEffect;
        }
        if (now - baseCore.lastShotTime > effectiveBaseFireRate) {
            handleBaseCoreShooting(now);
        }

        const newWave = Math.floor(gameStats.survivalTime / Config.WAVE_DURATION) + 1;
        if (newWave > gameStats.wave) {
            gameStats.wave = newWave;
            gameStats.cubesLeft += 5 + Math.floor(newWave / 3);
            const cashBonus = 25 + newWave * 5;
            gameStats.cash += cashBonus;
            gameStats.cashEarnedThisGame += cashBonus;
            UI.showNotification(`🌊 VAGUE ${newWave} ! +${5 + Math.floor(newWave / 3)} Cubes, +${cashBonus}💲`, "info");
            Objectives.initializeObjectives(gameStats);
        }

        gameStats.score += Math.floor(currentOverallDifficulty / 25);
        Objectives.checkObjectives(gameStats);
        Powers.updateActivePowers(now, gameStats);
        if (uiElements.powersPanel.style.display !== 'none' && gameStats.survivalTime % 1 === 0) {
             UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, now);
        }
        UI.updateStatsUI(gameStats, gameElements);
    }

    function updateGameElements() {
        for (let obsIdx = gameElements.obstacles.length - 1; obsIdx >= 0; obsIdx--) {
            const obstacle = gameElements.obstacles[obsIdx];
            if (typeof obstacle.vx === 'number' && typeof obstacle.vy === 'number') {
                obstacle.x += obstacle.vx;
                obstacle.y += obstacle.vy;
            }
        }
        if (Collision.handleObstacleCollisions(gameElements, gameStats, baseCore, endGame)) {
            return;
        }
        for (let puIdx = gameElements.powerUps.length - 1; puIdx >=0; puIdx--) {
            const pu = gameElements.powerUps[puIdx];
            if (Collision.handlePowerUpProximity(pu, camera)) {
                GameController.handlePowerUpCollection(pu, gameStats, baseCore);
                gameElements.powerUps.splice(puIdx, 1);
            } else if (Date.now() - pu.spawnTime > Config.POWERUP_DESPAWN_TIME) {
                gameElements.powerUps.splice(puIdx, 1);
            }
        }
    }

    function handleTurretShooting(turret, turretGridPos) {
        let closestEnemy = null;
        const turretRange = (turret.range || Config.GRID_SIZE * Config.TURRET_BASE_RANGE_FACTOR); // Utiliser une valeur par défaut si non définie
        let minDistanceSq = turretRange * turretRange;

        const turretWorldX = turretGridPos[0] * Config.GRID_SIZE + Config.GRID_SIZE / 2;
        const turretWorldY = turretGridPos[1] * Config.GRID_SIZE + Config.GRID_SIZE / 2;

        gameElements.obstacles.forEach(enemy => {
            const distX = enemy.x - turretWorldX;
            const distY = enemy.y - turretWorldY;
            const distanceSq = distX * distX + distY * distY;
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });

        if (closestEnemy) {
            const actualTurretDamage = (turret.damage || Config.TURRET_BASE_DAMAGE) + (gameStats.turretDamageBonus || 0);
            closestEnemy.hp -= actualTurretDamage;
            turret.lastShotTime = Date.now();
            turret.shootingTarget = { x: closestEnemy.x, y: closestEnemy.y };
            setTimeout(() => { turret.shootingTarget = null; }, 100);

            if (closestEnemy.hp <= 0) {
                const enemyIndex = gameElements.obstacles.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    gameElements.obstacles.splice(enemyIndex, 1);
                    gameStats.score += closestEnemy.scoreValue;
                    gameStats.cash += closestEnemy.cashValue;
                    gameStats.cashEarnedThisGame += closestEnemy.cashValue;
                    gameStats.obstaclesDestroyed++;
                }
            }
        }
    }

    function handleBaseCoreShooting(now) {
        let closestEnemy = null;
        const currentBaseRange = (baseCore.range || Config.GRID_SIZE * Config.BASE_CORE_TURRET_INITIAL_RANGE_FACTOR) ;
        let minDistanceSq = currentBaseRange * currentBaseRange;

        gameElements.obstacles.forEach(enemy => {
            const distX = enemy.x - baseCore.x;
            const distY = enemy.y - baseCore.y;
            const distanceSq = distX * distX + distY * distY;
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });

        if (closestEnemy) {
            const actualBaseDamage = (baseCore.damage || Config.BASE_CORE_TURRET_INITIAL_DAMAGE) + (gameStats.baseTurretDamageBonus || 0);
            closestEnemy.hp -= actualBaseDamage;
            baseCore.lastShotTime = now;
            baseCore.shootingTarget = { x: closestEnemy.x, y: closestEnemy.y };
            setTimeout(() => { baseCore.shootingTarget = null; }, 100);

            if (closestEnemy.hp <= 0) {
                const enemyIndex = gameElements.obstacles.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    gameElements.obstacles.splice(enemyIndex, 1);
                    gameStats.score += closestEnemy.scoreValue;
                    gameStats.cash += closestEnemy.cashValue;
                    gameStats.cashEarnedThisGame += closestEnemy.cashValue;
                    gameStats.obstaclesDestroyed++;
                }
            }
        }
    }

    function handleCameraMovement() {
        if (gameState !== 'playing' || isShopOverlayOpen || currentBuildingToPlaceRef.building) return;
        let newCamX = camera.x;
        let newCamY = camera.y;
        if (keys['w']) newCamY -= Config.CAMERA_SPEED;
        if (keys['s']) newCamY += Config.CAMERA_SPEED;
        if (keys['a']) newCamX -= Config.CAMERA_SPEED;
        if (keys['d']) newCamX += Config.CAMERA_SPEED;
        const collisionResult = Collision.checkCameraCollision(newCamX, newCamY, camera, gameElements);
        if (collisionResult.canMoveX) camera.x = newCamX;
        if (collisionResult.canMoveY) camera.y = newCamY;
        gameStats.camera = camera;
    }

    function render() {
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2 - camera.x, canvas.height / 2 - camera.y);

        const gs = Config.GRID_SIZE;
        const viewBounds = {
            minX: camera.x - canvas.width/2 - gs, maxX: camera.x + canvas.width/2 + gs,
            minY: camera.y - canvas.height/2 - gs, maxY: camera.y + canvas.height/2 + gs,
        };
        ctx.strokeStyle = Config.COLOR_GRID; ctx.lineWidth = 1;
        for (let gx = Math.floor(viewBounds.minX / gs) * gs; gx < viewBounds.maxX; gx += gs) {
            ctx.beginPath(); ctx.moveTo(gx, viewBounds.minY); ctx.lineTo(gx, viewBounds.maxY); ctx.stroke();
        }
        for (let gy = Math.floor(viewBounds.minY / gs) * gs; gy < viewBounds.maxY; gy += gs) {
            ctx.beginPath(); ctx.moveTo(viewBounds.minX, gy); ctx.lineTo(viewBounds.maxX, gy); ctx.stroke();
        }

        ctx.fillStyle = baseCore.health > Config.BASE_MAX_HEALTH * 0.6 ? Config.COLOR_BASE_HEALTHY : (baseCore.health > Config.BASE_MAX_HEALTH * 0.3 ? Config.COLOR_BASE_DAMAGED : Config.COLOR_BASE_CRITICAL);
        ctx.beginPath(); ctx.arc(baseCore.x, baseCore.y, baseCore.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'white'; ctx.font = '12px Courier New'; ctx.textAlign = 'center'; ctx.fillText('CORE', baseCore.x, baseCore.y + 4);

        // Ligne de tir pour le Noyau
        if (baseCore.shootingTarget) {
            ctx.beginPath(); ctx.moveTo(baseCore.x, baseCore.y); ctx.lineTo(baseCore.shootingTarget.x, baseCore.shootingTarget.y);
            ctx.strokeStyle = 'rgba(180, 220, 255, 0.7)'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke();
            ctx.fillStyle = 'rgba(180, 220, 255, 0.7)'; ctx.beginPath(); ctx.arc(baseCore.shootingTarget.x, baseCore.shootingTarget.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }


        gameElements.cubes.forEach((cube, key) => {
            const [gridX, gridY] = key.split(',').map(Number);
            const cubeScreenX = gridX * gs; const cubeScreenY = gridY * gs;
            if (cubeScreenX < viewBounds.maxX && cubeScreenX + gs > viewBounds.minX && cubeScreenY < viewBounds.maxY && cubeScreenY + gs > viewBounds.minY) {
                ctx.fillStyle = cube.color;
                ctx.strokeStyle = '#909090'; ctx.lineWidth = 2;
                ctx.fillRect(cubeScreenX, cubeScreenY, gs, gs);
                ctx.strokeRect(cubeScreenX, cubeScreenY, gs, gs);
            }
        });

        gameElements.buildings.forEach((building, key) => {
            const [gridX, gridY] = key.split(',').map(Number);
            const buildingCenterX = gridX * gs + gs / 2;
            const buildingCenterY = gridY * gs + gs / 2;
             if (buildingCenterX < viewBounds.maxX + gs && buildingCenterX > viewBounds.minX - gs && buildingCenterY < viewBounds.maxY + gs && buildingCenterY > viewBounds.minY - gs) {
                ctx.fillStyle = building.color || '#00CED1';
                ctx.beginPath();
                if (building.type === 'turret') {
                    ctx.arc(buildingCenterX, buildingCenterY, gs * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(buildingCenterX - gs * 0.1, buildingCenterY - gs * 0.45, gs * 0.2, gs * 0.3);
                } else {
                    ctx.arc(buildingCenterX, buildingCenterY, gs * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

                if (building.icon && building.type !== 'turret') {
                    ctx.fillStyle = 'black'; ctx.font = `${gs*0.4}px Arial`; ctx.textAlign = 'center';
                    ctx.fillText(building.icon, buildingCenterX, buildingCenterY + gs * 0.15);
                }
                 if (building.hp !== undefined && building.maxHp !== undefined) {
                    const hpPercent = Math.max(0, building.hp / building.maxHp);
                    ctx.fillStyle = hpPercent > 0.6 ? 'lightgreen' : hpPercent > 0.3 ? 'yellow' : 'red';
                    const barWidth = gs * 0.8; const barX = buildingCenterX - barWidth / 2; const barY = buildingCenterY - gs * 0.5 - 8;
                    ctx.fillRect(barX , barY, barWidth * hpPercent, 5);
                    ctx.strokeStyle = 'rgba(50,50,50,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, 5);
                }
                if (building.type === 'turret' && building.shootingTarget) {
                    ctx.beginPath(); ctx.moveTo(buildingCenterX, buildingCenterY); ctx.lineTo(building.shootingTarget.x, building.shootingTarget.y);
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.7)'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke();
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.7)'; ctx.beginPath(); ctx.arc(building.shootingTarget.x, building.shootingTarget.y, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
        });

        gameElements.obstacles.forEach(obstacle => {
            if (obstacle.x < viewBounds.maxX + obstacle.radius && obstacle.x > viewBounds.minX - obstacle.radius && obstacle.y < viewBounds.maxY + obstacle.radius && obstacle.y > viewBounds.minY - obstacle.radius) {
                ctx.fillStyle = obstacle.color;
                ctx.beginPath(); ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2); ctx.fill();
                const hpPercent = Math.max(0, obstacle.hp / obstacle.maxHp);
                ctx.fillStyle = hpPercent > 0.6 ? 'lightgreen' : hpPercent > 0.3 ? 'yellow' : 'red';
                ctx.fillRect(obstacle.x - obstacle.radius, obstacle.y - obstacle.radius - 8, obstacle.radius * 2 * hpPercent, 5);
                ctx.strokeStyle = 'rgba(50,50,50,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(obstacle.x - obstacle.radius, obstacle.y - obstacle.radius - 8, obstacle.radius * 2, 5);
            }
        });
        gameElements.powerUps.forEach(pu => {
            if (pu.x < viewBounds.maxX + pu.radius && pu.x > viewBounds.minX - pu.radius && pu.y < viewBounds.maxY + pu.radius && pu.y > viewBounds.minY - pu.radius) {
                ctx.fillStyle = pu.color; ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#2a2a2a'; ctx.font = `${pu.radius*0.8}px Arial`; ctx.textAlign = 'center'; ctx.fillText(pu.icon, pu.x, pu.y + pu.radius * 0.25);
            }
        });

        if (currentBuildingToPlaceRef.building && (gameState === 'playing' || gameState === 'paused' || isShopOverlayOpen )) {
            const gs = Config.GRID_SIZE;
            const mouseWorld = getMouseWorldPosCallback(lastMousePosRef);
            if (mouseWorld) {
                const gridX = Math.floor(mouseWorld.x / gs); const gridY = Math.floor(mouseWorld.y / gs);
                const key = `${gridX},${gridY}`;
                const canPlace = !gameElements.cubes.has(key) && !gameElements.buildings.has(key) && !(gridX === 0 && gridY === 0);
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = canPlace ? (currentBuildingToPlaceRef.building.color || '#00FF00') : 'red';
                ctx.beginPath();
                // Dessin spécifique pour le fantôme de la tourelle
                if (currentBuildingToPlaceRef.building.type === 'turret') {
                    ctx.arc(gridX * gs + gs / 2, gridY * gs + gs / 2, gs * 0.35, 0, Math.PI * 2);
                    ctx.fill(); // Base
                    ctx.fillRect((gridX * gs + gs / 2) - gs * 0.1, (gridY * gs + gs / 2) - gs * 0.45, gs * 0.2, gs * 0.3); // Canon
                    // Dessiner la portée en mode placement
                    ctx.beginPath();
                    ctx.arc(gridX * gs + gs/2, gridY * gs + gs/2, currentBuildingToPlaceRef.building.range || Config.GRID_SIZE * Config.TURRET_BASE_RANGE_FACTOR, 0, Math.PI*2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                } else { // Fantôme générique pour autres bâtiments
                    ctx.arc(gridX * gs + gs / 2, gridY * gs + gs / 2, gs * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
        }
        ctx.restore();

        const playerScreenX = canvas.width / 2; const playerScreenY = canvas.height / 2;
        ctx.fillStyle = 'rgba(0, 150, 255, 0.7)'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(playerScreenX, playerScreenY, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }


    function endGame(reason = "Votre base a été submergée.") {
        if (gameState === 'gameOver') return;
        gameState = 'gameOver';
        isShopOverlayOpen = false;
        UI.setOverlayDisplay(uiElements.gameOver, true);
        [uiElements.uiStats, uiElements.objectivesDisplay, uiElements.instructions, uiElements.gameControls, uiElements.baseHealthBarContainer, uiElements.inGameUpgrades, uiElements.powersPanel].forEach(el => UI.setElementDisplay(el, false));
        uiElements.finalScore.textContent = `Score: ${gameStats.score}`;
        uiElements.gameOverText.textContent = `${reason} Vague Atteinte: ${gameStats.wave}. Temps Survécu: ${gameStats.survivalTime}s.`;
        highScores = Storage.saveHighScore(gameStats.score, gameStats.wave, gameStats.survivalTime, highScores);
        UI.displayHighScoresUI(highScores);
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    }

    function restartGame() { UI.setOverlayDisplay(uiElements.gameOver, false); startGame(); }

    function goToMenu() {
        isShopOverlayOpen = false;
        [uiElements.gameOver, uiElements.pauseMenu, uiElements.shopMenu, uiElements.uiStats, uiElements.objectivesDisplay, uiElements.instructions, uiElements.gameControls, uiElements.baseHealthBarContainer, uiElements.inGameUpgrades, uiElements.powersPanel].forEach(el => UI.setElementDisplay(el, false));
        UI.setOverlayDisplay(uiElements.menu, true);
        gameState = 'menu';
        UI.displayHighScoresUI(highScores);
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    }

    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            isShopOverlayOpen = false;
            UI.setOverlayDisplay(uiElements.shopMenu, false);
            UI.setOverlayDisplay(uiElements.pauseMenu, true);
            currentBuildingToPlaceRef.building = null;
        } else if (gameState === 'paused') {
            UI.setOverlayDisplay(uiElements.pauseMenu, false);
            resumeGameFromSomeMenu(); // Va mettre gameState à 'playing'
        }
    }

    function resumeGameFromSomeMenu() {
        if(gameState === 'gameOver' || gameState === 'menu') return;
        gameState = 'playing';
        isShopOverlayOpen = false;
        UI.setOverlayDisplay(uiElements.pauseMenu, false);
        UI.setOverlayDisplay(uiElements.shopMenu, false);
        currentBuildingToPlaceRef.building = null;
        if (!animationFrame) { // S'assurer que la boucle redémarre si elle était arrêtée
            animationFrame = requestAnimationFrame(gameLoop);
        }
    }

    function openShop(isFromPauseMenu) {
        if (gameState !== 'playing' && gameState !== 'paused') return;

        if (isFromPauseMenu && gameState === 'paused') {
            UI.setOverlayDisplay(uiElements.pauseMenu, false);
        }
        // Si gameState est 'playing', le jeu continue en arrière-plan.
        // Si gameState est 'paused', on vient du menu pause, le jeu est déjà figé par l'état 'paused'.

        isShopOverlayOpen = true;
        UI.setOverlayDisplay(uiElements.shopMenu, true);
        UI.updateShopCashUI(gameStats.cash);
        UI.renderShopItemsUI(Shop.getShopItems(), gameStats.cash, uiElements.shopItemsContainer, handlePurchaseShopItem);
    }

    function closeShopAndResumePlay() {
        if (!isShopOverlayOpen && !currentBuildingToPlaceRef.building) {
            // Si le shop n'est pas ouvert ET qu'on n'est pas en train de placer un bâtiment, ne rien faire.
            // (Peut arriver si appelé plusieurs fois par erreur)
            // return;
        }
        isShopOverlayOpen = false;
        UI.setOverlayDisplay(uiElements.shopMenu, false);

        // Si on ferme manuellement le shop (via bouton) alors qu'un bâtiment était en attente,
        // annuler ce placement. Si c'est un achat de bâtiment, currentBuildingToPlaceRef
        // est rempli, et on ne veut pas l'annuler ici car l'utilisateur va placer.
        // Cette fonction est maintenant plus un "gestionnaire de fermeture d'overlay de shop".
        // Le placement de bâtiment est géré par currentBuildingToPlaceRef.
        // Si on clique sur "FERMER" et qu'on avait un bâtiment en main, on l'annule :
        if (currentBuildingToPlaceRef.building && !arguments.callee.caller.toString().includes('handleBuyShopItem')) { // Heuristique pour savoir si appelé par bouton Fermer
            // Ce check est un peu fragile. Mieux : passer un flag à closeShopAndResumePlay
            // UI.showNotification("Placement de bâtiment annulé (shop fermé).", "info");
            // currentBuildingToPlaceRef.building = null;
            // currentBuildingToPlaceRef.itemConfig = null;
        }


        // Si on n'était pas en pause explicite (via menu pause), on s'assure que le jeu est en 'playing'
        if (gameState === 'paused') {
            // Si on était en pause (menu pause) avant d'ouvrir le shop,
            // on retourne au menu pause.
            UI.setOverlayDisplay(uiElements.pauseMenu, true);
        } else if (gameState !== 'gameOver' && gameState !== 'menu') {
            // Si on était en train de jouer et qu'on a ouvert le shop, puis acheté un bâtiment (qui a fermé le shop),
            // ou si on a fermé le shop manuellement, on s'assure d'être en 'playing'.
            gameState = 'playing';
            if (!animationFrame) requestAnimationFrame(gameLoop);
        }
        // Si currentBuildingToPlaceRef.building est non-nul, le fantôme s'affichera dans render().
    }

    function handlePurchaseShopItem(itemId) {
        const purchaseResult = Shop.handleBuyShopItem(itemId, gameStats, baseCore, currentBuildingToPlaceRef, closeShopAndResumePlay); // <<<<<<<<<<<<<<<<<< MODIFIÉ ICI
        if (purchaseResult.success) {
            UI.updateStatsUI(gameStats, gameElements); // Mettre à jour l'UI principale (cash, etc.)

            // Si le shop s'est fermé (achat de bâtiment), isShopOverlayOpen sera false.
            // Si le shop est resté ouvert (autres types d'achat), il faut rafraîchir ses items.
            if (isShopOverlayOpen) {
                UI.updateShopCashUI(gameStats.cash);
                UI.renderShopItemsUI(Shop.getShopItems(), gameStats.cash, uiElements.shopItemsContainer, handlePurchaseShopItem);
            }

            const itemConfig = Config.SHOP_ITEMS_CONFIG.find(i => i.id === itemId);
            if (itemConfig && itemConfig.type === 'unlock') {
                InGameUpgrades.applyAllPassiveInGameUpgrades(gameStats);
                UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
            }
            if (itemConfig && itemConfig.type === 'power_unlock') {
                UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, Date.now());
            }
            // Si un bâtiment a été acheté, `currentBuildingToPlaceRef` est rempli,
            // et `closeShopAndResumePlay` aura été appelé par `Shop.handleBuyShopItem`,
            // donc `isShopOverlayOpen` sera `false`.
            // Le fantôme de placement s'affichera dans `render()`.
        }
    }

    function handlePurchaseInGameUpgrade(upgradeId) {
        const purchased = InGameUpgrades.tryPurchaseUpgrade(upgradeId, gameStats);
        if (purchased) {
            InGameUpgrades.applyAllPassiveInGameUpgrades(gameStats);
            UI.updateStatsUI(gameStats, gameElements);
            UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
        }
    }

    function handleActivatePower(powerId) {
        const activated = Powers.tryActivatePower(powerId, gameElements, baseCore, gameStats, Date.now());
        if (activated) {
            // L'UI des pouvoirs sera mise à jour par la boucle `update` qui appelle `renderPowersUI`
            UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, Date.now()); // Forcer un refresh immédiat
        }
    }

    function showRules() { alert(Config.RULES_TEXT); }

    function getMouseWorldPosCallback(mouseCanvasPos) {
        if(!mouseCanvasPos || typeof mouseCanvasPos.x === 'undefined') return null;
        return { x: mouseCanvasPos.x - canvas.width / 2 + camera.x, y: mouseCanvasPos.y - canvas.height / 2 + camera.y };
    }

    function placeCubeAtGrid(gridX, gridY) {
        if (currentBuildingToPlaceRef.building) return;
        const key = `${gridX},${gridY}`;
        if (gridX === 0 && gridY === 0 && baseCore.radius > 0) return; // Ne pas placer sur le noyau s'il existe
        if (!gameElements.cubes.has(key) && !gameElements.buildings.has(key) && gameStats.cubesLeft > 0) {
            gameElements.cubes.set(key, GameObjects.createCube({
                cubeMaxHpPercentBonus: gameStats.cubeMaxHpPercentBonus,
                cubeDamageBonus: gameStats.cubeDamageBonus
            }));
            gameStats.cubesLeft--; gameStats.cubesPlaced++;
            UI.updateStatsUI(gameStats, gameElements);
            lastPaintedGridCell.x = gridX; lastPaintedGridCell.y = gridY;
        }
    }

    function handleCanvasMouseDownCallback(e) {
        // Priorité au placement de bâtiment si un est sélectionné
        if (currentBuildingToPlaceRef.building) {
            const rect = canvas.getBoundingClientRect();
            const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const worldPos = getMouseWorldPosCallback(mouseCanvasPos);
            if (!worldPos) return;

            const gridX = Math.floor(worldPos.x / Config.GRID_SIZE);
            const gridY = Math.floor(worldPos.y / Config.GRID_SIZE);
            const key = `${gridX},${gridY}`;

            if (!gameElements.cubes.has(key) && !gameElements.buildings.has(key) && !(gridX === 0 && gridY === 0 && baseCore.radius > 0)) {
                gameElements.buildings.set(key, { ...currentBuildingToPlaceRef.building });
                UI.showNotification(`${currentBuildingToPlaceRef.itemConfig.name} construit !`, "success");
                currentBuildingToPlaceRef.building = null; // Réinitialiser après placement
                currentBuildingToPlaceRef.itemConfig = null;

                // S'assurer que le jeu est bien en mode 'playing' après un placement réussi
                // (au cas où le callback de fermeture du shop n'aurait pas suffi ou un autre état interfère)
                if (gameState !== 'playing' && gameState !== 'gameOver' && gameState !== 'menu') {
                    gameState = 'playing';
                    if(!animationFrame) requestAnimationFrame(gameLoop);
                }
                // isShopOverlayOpen devrait déjà être false si le shop s'est fermé.

            } else {
                UI.showNotification("Impossible de construire ici !", "warning");
                // Le bâtiment reste en main pour essayer de placer ailleurs
            }
            UI.updateStatsUI(gameStats, gameElements);
            return;
        }

        // Placement de cube par clic simple (si pas de bâtiment en main et shop fermé)
        if (gameState === 'playing' && !isShopOverlayOpen) {
            const rect = canvas.getBoundingClientRect();
            const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const worldPos = getMouseWorldPosCallback(mouseCanvasPos);
            if (!worldPos) return;

            lastPaintedGridCell.x = null;
            lastPaintedGridCell.y = null;
            const gridX = Math.floor(worldPos.x / Config.GRID_SIZE);
            const gridY = Math.floor(worldPos.y / Config.GRID_SIZE);
            placeCubeAtGrid(gridX, gridY);
        }
    }

    function handleCanvasMouseUpCallback(e) {
        lastPaintedGridCell.x = null; lastPaintedGridCell.y = null;
    }

    function handleCanvasMouseMovePaintCallback(e) {
        // isMouseDownRef.value est vérifié dans eventListeners.js
        // Ne pas peindre si le shop est l'UI active, ou si on place un bâtiment, ou si pas en jeu
        if (gameState !== 'playing' || isShopOverlayOpen || currentBuildingToPlaceRef.building) return;

        // ... (reste de la logique de dessin de cube par glisser, inchangée)
        const rect = canvas.getBoundingClientRect();
        const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldPos = getMouseWorldPosCallback(mouseCanvasPos);
        if (!worldPos) return;
        const gridX = Math.floor(worldPos.x / Config.GRID_SIZE); const gridY = Math.floor(worldPos.y / Config.GRID_SIZE);
        if (gridX !== lastPaintedGridCell.x || gridY !== lastPaintedGridCell.y) {
            placeCubeAtGrid(gridX, gridY);
        }
    }

    function handleCanvasContextMenuCallback(e) {
        e.preventDefault();
        // Annuler le placement de bâtiment avec clic droit, même si le shop est "ouvert"
        if (currentBuildingToPlaceRef.building) {
            currentBuildingToPlaceRef.building = null; currentBuildingToPlaceRef.itemConfig = null;
            UI.showNotification("Placement de bâtiment annulé.", "info");
            // Le shop reste ouvert
            return;
        }

        // Ne pas détruire si shop ouvert (et qu'on n'annulait pas un placement) ou si pas en jeu
        if (gameState !== 'playing' || isShopOverlayOpen) return;

        // ... (reste de la logique de destruction de cube/bâtiment, inchangée)
        const rect = canvas.getBoundingClientRect(); const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }; const worldPos = getMouseWorldPosCallback(mouseCanvasPos); if (!worldPos) return;
        const gridX = Math.floor(worldPos.x / Config.GRID_SIZE); const gridY = Math.floor(worldPos.y / Config.GRID_SIZE); const key = `${gridX},${gridY}`;
        if (gameElements.cubes.has(key)) {
            gameElements.cubes.delete(key); gameStats.cubesLeft++;
        } else if (gameElements.buildings.has(key)) {
            const building = gameElements.buildings.get(key);
            const shopItemConfig = Config.SHOP_ITEMS_CONFIG.find(item => item.buildingData && item.buildingData.type === building.type);
            if (shopItemConfig && shopItemConfig.costBase) {
                const refund = Math.floor(shopItemConfig.costBase * 0.5); // Pourrait être basé sur le niveau du bâtiment s'ils en ont
                gameStats.cash += refund;
                gameElements.buildings.delete(key);
                UI.showNotification(`${building.type === 'generator' ? 'Générateur' : 'Bâtiment'} vendu (+${refund}💲)`, "info");
            } else { UI.showNotification("Impossible de vendre (info manquante).", "warning"); }
        }
        UI.updateStatsUI(gameStats, gameElements);
    }


    function handleKeyDownCallback(e) {
        const keyLower = e.key.toLowerCase();

        // Les touches de mouvement WASD ne fonctionnent que si le shop n'est pas l'UI principale
        // ET qu'on n'est pas en train de taper dans un champ de texte (si on en ajoute plus tard)
        if (!isShopOverlayOpen) {
            if (['w', 'a', 's', 'd'].includes(keyLower)) {
                keys[keyLower] = true;
            }
        }

        if (keyLower === 'p') { // Pause fonctionne toujours, et fermera le shop si ouvert
            if (isShopOverlayOpen) {
                closeShopAndResumePlay(); // D'abord fermer le shop
            }
            if (gameState === 'playing' || gameState === 'paused') { // Ensuite gérer la pause
                 togglePause();
            }
        }
        if (keyLower === 'escape') {
            if (currentBuildingToPlaceRef.building) { // Priorité : annuler placement
                currentBuildingToPlaceRef.building = null; currentBuildingToPlaceRef.itemConfig = null;
                UI.showNotification("Placement annulé.", "info");
                // Le shop reste ouvert
            } else if (isShopOverlayOpen) { // Ensuite : fermer le shop
                closeShopAndResumePlay();
            } else if (gameState === 'paused') { // Ensuite : reprendre le jeu
                resumeGameFromSomeMenu();
            } else if (gameState === 'playing') { // Enfin : mettre en pause
                togglePause();
            }
        }
    }
    // ... (handleKeyUpCallback, EventListeners.setupEventListeners, resizeCanvasAndRender, goToMenu inchangés)
    function handleKeyUpCallback(e) { keys[e.key.toLowerCase()] = false; }

    EventListeners.setupEventListeners(
        canvas, keys, lastMousePosRef, isMouseDownRef,
        getMouseWorldPosCallback,
        handleCanvasMouseDownCallback,
        handleCanvasMouseUpCallback,
        handleCanvasMouseMovePaintCallback,
        handleCanvasContextMenuCallback,
        handleKeyDownCallback, handleKeyUpCallback, resizeCanvasAndRender,
        uiElements,
        { startGame, showRules, restartGame, goToMenu, resumeGame: resumeGameFromSomeMenu, openShop, closeShop: closeShopAndResumePlay, togglePause }
    );
    resizeCanvasAndRender();
    goToMenu();
});