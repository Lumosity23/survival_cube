// js/main.js
// ... (imports et début du DOMContentLoaded comme avant) ...
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
    // ... (uiElements, canvas, ctx, et autres variables d'état comme avant) ...
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const uiElements = { /* ... */
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
        powersPanel: document.getElementById('powersPanel'),    
        powersList: document.getElementById('powersList'),      
    };
    UI.cacheUiElements(uiElements);

    let gameState = 'menu';
    let camera = { x: 0, y: 0 };
    let gameElements = { cubes: new Map(), buildings: new Map(), obstacles: [], powerUps: [] };
    let baseCore = {
        x: 0, y: 0,
        health: Config.BASE_MAX_HEALTH,
        radius: Config.GRID_SIZE * 0.6,
        // Stats de tourelle pour le noyau
        damage: Config.BASE_CORE_TURRET_INITIAL_DAMAGE,
        range: Config.BASE_CORE_TURRET_INITIAL_RANGE,
        fireRate: Config.BASE_CORE_TURRET_INITIAL_FIRE_RATE,
        lastShotTime: 0,
        shootingTarget: null // Pour l'effet visuel
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
    

    function resizeCanvasAndRender() { /* ... inchangé ... */
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (gameStats) {
            gameStats.canvasWidth = canvas.width;
            gameStats.canvasHeight = canvas.height;
        }
        if(gameState !== 'menu' && gameState !== 'loading') render();
    }

    function startGame() { /* ... inchangé ... */
        UI.setOverlayDisplay(uiElements.menu, false);
        UI.setElementDisplay(uiElements.uiStats, true);
        UI.setElementDisplay(uiElements.objectivesDisplay, true);
        UI.setElementDisplay(uiElements.instructions, true);
        UI.setElementDisplay(uiElements.gameControls, true);
        UI.setElementDisplay(uiElements.baseHealthBarContainer, true);
        UI.setElementDisplay(uiElements.inGameUpgrades, true);
        UI.setElementDisplay(uiElements.powersPanel, true); // Afficher le panneau des pouvoirs

        gameState = 'playing';
        resetGame();
        Objectives.initializeObjectives(gameStats);
        UI.updateBaseHealthBarUI(baseCore.health);
        UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
        gameLoop();
    }

    function resetGame() { /* ... inchangé (sauf pour l'initialisation des nouvelles stats pour tourelles) ... */
        gameElements.cubes.clear();
        gameElements.buildings.clear();
        gameElements.obstacles.length = 0;
        gameElements.powerUps.length = 0;
        baseCore.health = Config.BASE_MAX_HEALTH;
        currentBuildingToPlaceRef.building = null;
        currentBuildingToPlaceRef.itemConfig = null;
        isMouseDownRef.value = false;
        lastPaintedGridCell.x = null;
        lastPaintedGridCell.y = null;
        baseCore.damage = Config.BASE_CORE_TURRET_INITIAL_DAMAGE;
        baseCore.range = Config.BASE_CORE_TURRET_INITIAL_RANGE;
        baseCore.fireRate = Config.BASE_CORE_TURRET_INITIAL_FIRE_RATE;
        baseCore.lastShotTime = 0;

        gameStats = {
            score: 0, wave: 1, cubesLeft: Config.INITIAL_CUBES, cash: Config.INITIAL_CASH,
            startTime: Date.now(), survivalTime: 0,
            obstaclesDestroyed: 0, cashEarnedThisGame: Config.INITIAL_CASH, cubesPlaced: 0,
            cubeMaxHpPercentBonus: 0,
            cubeDamageBonus: 0, // Dégâts que les cubes infligent (si applicable)
            coreRegenPerMin: 0,
            turretDamageBonus: 0, // NOUVEAU pour les améliorations de tourelles
            // turretRangeBonus: 0, // Exemple si on ajoute une amélioration de portée
            // turretFireRateBonus: 0, // Exemple
            camera: camera,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            baseTurretDamageBonus: 0,
            baseTurretFireRateMultiplier: 1.0, // 1.0 = pas de changement, < 1.0 = plus rapide
            baseTurretRangeBonus: 0,
            turretFireRateMultiplier: 1.0,
            isTurretOvercharged: false,
        };
        Shop.resetShop();
        InGameUpgrades.initializeInGameUpgrades();
        InGameUpgrades.applyAllPassiveInGameUpgrades(gameStats);
        baseCore.damage = Config.BASE_CORE_TURRET_INITIAL_DAMAGE;
        baseCore.range = Config.BASE_CORE_TURRET_INITIAL_RANGE;
        baseCore.fireRate = Config.BASE_CORE_TURRET_INITIAL_FIRE_RATE;
        baseCore.lastShotTime = 0;
        baseCore.shootingTarget = null;
        Powers.initializePowers();
    

        camera = { x: 0, y: 0 };
        gameStats.camera = camera;
        lastObstacleSpawn = Date.now();

        UI.updateStatsUI(gameStats, gameElements);
        UI.updateBaseHealthBarUI(baseCore.health);
        UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
        UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, Date.now());
    }

    function gameLoop() { /* ... inchangé ... */
        if (gameState === 'gameOver' || gameState === 'menu') {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            animationFrame = null;
            return;
        }
        if (gameState === 'playing') {
            const now = Date.now();
            update(now);
        }
        render();
        animationFrame = requestAnimationFrame(gameLoop);
    }

    function update(now) {
        gameStats.survivalTime = Math.floor((now - gameStats.startTime) / 1000);
        handleCameraMovement();

        const timeDifficulty = Math.floor(gameStats.survivalTime / (Config.WAVE_DURATION / 1.6)); // Difficulté basée sur le temps
        const currentOverallDifficulty = gameStats.wave + timeDifficulty; // Difficulté générale pour le spawn rate

        // Obstacle Spawning
        const spawnRate = Math.max(Config.OBSTACLE_SPAWN_RATE_BASE - currentOverallDifficulty * Config.OBSTACLE_SPAWN_RATE_DIFFICULTY_FACTOR, Config.OBSTACLE_SPAWN_MIN_RATE);
        if (now - lastObstacleSpawn > spawnRate) {
            let obstacleCount;
        // --- NOUVELLE LOGIQUE POUR obstacleCount ---
            if (gameStats.wave < 3) {
                obstacleCount = 1; // Juste 1 ennemi par spawn
            } else if (gameStats.wave < 7) {
                // Augmente de 1 à 2 (ou 3 si currentOverallDifficulty est déjà un peu haut)
                obstacleCount = 1 + Math.floor(currentOverallDifficulty / 10);
            } else if (gameStats.wave < 12) {
            // Augmente de 2 à 3-4
                obstacleCount = 2 + Math.floor(currentOverallDifficulty / 12);
            } else {
            // Augmentation plus rapide pour les vagues plus élevées
                obstacleCount = 2 + Math.floor(currentOverallDifficulty / 7);
            }
            obstacleCount = Math.max(1, Math.min(obstacleCount, 8)); // Minimum 1, Maximum 8 par spawn (ajuster max si besoin)
            // --- FIN NOUVELLE LOGIQUE ---

            for (let i = 0; i < obstacleCount; i++) {
            // La difficulté individuelle de l'ennemi est toujours basée sur la vague et le temps
                const individualEnemyDifficulty = Math.max(1, Math.floor(gameStats.wave * 0.6) + Math.floor(timeDifficulty * 0.4));
                const newObstacle = GameObjects.createObstacle(individualEnemyDifficulty, gameStats.wave, camera, canvas, baseCore);
                if (newObstacle) gameElements.obstacles.push(newObstacle);
            }
            lastObstacleSpawn = now;
        }

        // Logique de tir pour le Noyau-Tourelle
        if (now - baseCore.lastShotTime > (baseCore.fireRate * gameStats.baseTurretFireRateMultiplier)) {
            handleBaseCoreShooting(now);
        }
        // Power-up Spawning
        if (Math.random() < Config.POWERUP_SPAWN_CHANCE_BASE + gameStats.survivalTime * Config.POWERUP_SPAWN_CHANCE_TIME_FACTOR) {
            gameElements.powerUps.push(GameObjects.createPowerUp(gameStats.wave, camera));
        }

        // Building Updates (Générateurs ET Tourelles)
        gameElements.buildings.forEach((building, key) => { // Ajout de 'key' pour la position si besoin
            if (building.type === 'generator' && building.lastGenTime && now - building.lastGenTime > building.interval) {
                gameStats.cubesLeft += building.productionRate;
                building.lastGenTime = now;
                UI.showNotification(`+${building.productionRate} 🧊 du générateur`, "info");
            } else if (building.type === 'turret' && now - building.lastShotTime > (building.fireRate * (gameStats.turretFireRateMultiplier || 1.0))) { // Appliquer le multiplicateur
                handleTurretShooting(building, key.split(',').map(Number));
            } else if (building.type === 'turret') {
                let currentFireRate = building.fireRate * (gameStats.turretFireRateMultiplier || 1.0);
                if (gameStats.isTurretOvercharged) {
                    const overchargeEffect = Config.POWERS_CONFIG.find(p=>p.id==='turretOvercharge').fireRateMultiplierEffect;
                    currentFireRate *= overchargeEffect;
                }
                if (now - building.lastShotTime > currentFireRate) {
                    handleTurretShooting(building, key.split(',').map(Number));
                }
            }
        });

        updateGameElements();

        // Régénération du Noyau
        if (gameStats.coreRegenPerMin > 0 && baseCore.health < Config.BASE_MAX_HEALTH) {
            const regenThisFrame = (gameStats.coreRegenPerMin / 60) * (16.666 / 1000);
            baseCore.health = Math.min(Config.BASE_MAX_HEALTH, baseCore.health + regenThisFrame);
            UI.updateBaseHealthBarUI(baseCore.health);
        }

        const newWave = Math.floor(gameStats.survivalTime / Config.WAVE_DURATION) + 1;
        if (newWave > gameStats.wave) {
            gameStats.wave = newWave;
            // ... (récompenses de vague)
            gameStats.cubesLeft += 5 + Math.floor(newWave / 3);
            const cashBonus = 100 + newWave * 5;
            gameStats.cash += cashBonus;
            gameStats.cashEarnedThisGame += cashBonus;
            UI.showNotification(`🌊 VAGUE ${newWave} ! +${5 + Math.floor(newWave / 3)} Cubes, +${cashBonus}💲`, "info");
            Objectives.initializeObjectives(gameStats); // Réinitialiser/mettre à jour les objectifs pour la nouvelle vague
        }

        gameStats.score += Math.floor(currentOverallDifficulty / 25); // Score passif un peu réduit
        Objectives.checkObjectives(gameStats);
        UI.updateStatsUI(gameStats, gameElements);
        Powers.updateActivePowers(now, gameStats);

        // Optionnel: rafraîchir l'UI des pouvoirs moins souvent que chaque frame si coûteux
        if (gameStats.survivalTime % 1 === 0) { // Toutes les secondes
            UI.renderPowersUI(Powers.getPowersState(), uiElements.powersList, handleActivatePower, now);
    }
    }


    function handleTurretShooting(turret, turretGridPos) {
        let closestEnemy = null;
        let minDistanceSq = turret.range * turret.range;
    
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
            const actualTurretDamage = turret.damage + (gameStats.turretDamageBonus || 0);
            closestEnemy.hp -= actualTurretDamage;
            turret.lastShotTime = Date.now();
            turret.shootingTarget = { x: closestEnemy.x, y: closestEnemy.y };
            setTimeout(() => { turret.shootingTarget = null; }, 100);
    
            // >>> AJOUT DE LA LOGIQUE DE SUPPRESSION ICI <<<
            if (closestEnemy.hp <= 0) {
                const enemyIndex = gameElements.obstacles.indexOf(closestEnemy);
                if (enemyIndex > -1) {
                    gameElements.obstacles.splice(enemyIndex, 1);
                    gameStats.score += closestEnemy.scoreValue;
                    gameStats.cash += closestEnemy.cashValue;
                    gameStats.cashEarnedThisGame += closestEnemy.cashValue;
                    gameStats.obstaclesDestroyed++;
                    // Pas besoin de UI.updateStatsUI(gameStats) ici, car la boucle update principale le fera.
                }
            }
        }
    }

    function handleBaseCoreShooting(now) {
        let closestEnemy = null;
        // La portée du noyau est affectée par les améliorations
        const currentBaseRange = baseCore.range; // On pourrait ajouter gameStats.baseTurretRangeBonus ici
        let minDistanceSq = currentBaseRange * currentBaseRange;
    
        gameElements.obstacles.forEach(enemy => {
            const distX = enemy.x - baseCore.x; // Le noyau est en (0,0) du monde
            const distY = enemy.y - baseCore.y;
            const distanceSq = distX * distX + distY * distY;
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });
    
        if (closestEnemy) {
            const actualBaseDamage = baseCore.damage + (gameStats.baseTurretDamageBonus || 0);
            closestEnemy.hp -= actualBaseDamage;
            baseCore.lastShotTime = now; // Utiliser 'now' passé en argument
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

    function updateGameElements() { /* ... inchangé ... */
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
    function handleCameraMovement() { /* ... inchangé ... */
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
        // ... (début du render comme avant : clear, translate)
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2 - camera.x, canvas.height / 2 - camera.y);

        const gs = Config.GRID_SIZE;
        const viewBounds = { /* ... */ };
        viewBounds.minX = camera.x - canvas.width/2 - gs;
        viewBounds.maxX = camera.x + canvas.width/2 + gs;
        viewBounds.minY = camera.y - canvas.height/2 - gs;
        viewBounds.maxY = camera.y + canvas.height/2 + gs;

        ctx.strokeStyle = Config.COLOR_GRID; ctx.lineWidth = 1;
        for (let gx = Math.floor(viewBounds.minX / gs) * gs; gx < viewBounds.maxX; gx += gs) { /* ... */ ctx.beginPath(); ctx.moveTo(gx, viewBounds.minY); ctx.lineTo(gx, viewBounds.maxY); ctx.stroke(); }
        for (let gy = Math.floor(viewBounds.minY / gs) * gs; gy < viewBounds.maxY; gy += gs) { /* ... */ ctx.beginPath(); ctx.moveTo(viewBounds.minX, gy); ctx.lineTo(viewBounds.maxX, gy); ctx.stroke(); }

        ctx.fillStyle = baseCore.health > Config.BASE_MAX_HEALTH * 0.6 ? Config.COLOR_BASE_HEALTHY : (baseCore.health > Config.BASE_MAX_HEALTH * 0.3 ? Config.COLOR_BASE_DAMAGED : Config.COLOR_BASE_CRITICAL);
        ctx.beginPath(); ctx.arc(baseCore.x, baseCore.y, baseCore.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'white'; ctx.font = '12px Courier New'; ctx.textAlign = 'center'; ctx.fillText('CORE', baseCore.x, baseCore.y + 4);

        gameElements.cubes.forEach((cube, key) => { /* ... */
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
                // Dessin spécifique pour la tourelle
                if (building.type === 'turret') {
                    ctx.arc(buildingCenterX, buildingCenterY, gs * 0.35, 0, Math.PI * 2); // Base plus petite
                    ctx.fill();
                    ctx.fillRect(buildingCenterX - gs * 0.1, buildingCenterY - gs * 0.45, gs * 0.2, gs * 0.3); // Canon
                } else { // Générateur ou autre
                    ctx.arc(buildingCenterX, buildingCenterY, gs * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); // Contour pour tous

                if (building.icon && building.type !== 'turret') { // Ne pas mettre l'icône si on a un dessin custom pour la tourelle
                    ctx.fillStyle = 'black'; ctx.font = `${gs*0.4}px Arial`; ctx.textAlign = 'center';
                    ctx.fillText(building.icon, buildingCenterX, buildingCenterY + gs * 0.15);
                }

                // Barre de vie du bâtiment
                if (building.hp !== undefined && building.maxHp !== undefined) { /* ... */
                    const hpPercent = Math.max(0, building.hp / building.maxHp);
                    ctx.fillStyle = hpPercent > 0.6 ? 'lightgreen' : hpPercent > 0.3 ? 'yellow' : 'red';
                    const barWidth = gs * 0.8; const barX = buildingCenterX - barWidth / 2; const barY = buildingCenterY - gs * 0.5 - 8;
                    ctx.fillRect(barX , barY, barWidth * hpPercent, 5);
                    ctx.strokeStyle = 'rgba(50,50,50,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, 5);
                }

                // Ligne de tir de la tourelle
                if (building.type === 'turret' && building.shootingTarget) {
                    ctx.beginPath();
                    ctx.moveTo(buildingCenterX, buildingCenterY);
                    ctx.lineTo(building.shootingTarget.x, building.shootingTarget.y);
                    ctx.strokeStyle = 'rgba(255, 255, 100, 0.7)'; // Jaune clair
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                // Ligne de tir pour le Noyau
                if (baseCore.shootingTarget) {
                ctx.beginPath();
                ctx.moveTo(baseCore.x, baseCore.y); // Noyau est en (0,0)
                ctx.lineTo(baseCore.shootingTarget.x, baseCore.shootingTarget.y);
                ctx.strokeStyle = 'rgba(180, 220, 255, 0.7)'; // Bleu clair pour le noyau
                ctx.lineWidth = 2;
                ctx.stroke();
                }
            }
        });

        // Lignes de tir (Noyau et Tourelles)
        const drawShootingLine = (sourceX, sourceY, target, color) => {
            if (target) {
                ctx.beginPath();
                ctx.moveTo(sourceX, sourceY);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2; // Un peu plus épais
                ctx.globalAlpha = 0.7; // Un peu transparent
                ctx.stroke();
                // Petit éclat à l'impact (optionnel)
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(target.x, target.y, 4, 0, Math.PI * 2); // Petit cercle à l'impact
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        };

        // Ligne de tir pour le Noyau
        drawShootingLine(baseCore.x, baseCore.y, baseCore.shootingTarget, 'rgba(180, 220, 255, 0.7)');

        // Lignes de tir pour les tourelles construites
        gameElements.buildings.forEach((building, key) => {
            if (building.type === 'turret' && building.shootingTarget) {
                const [gridX, gridY] = key.split(',').map(Number);
                const turretCenterX = gridX * gs + gs / 2;
                const turretCenterY = gridY * gs + gs / 2;
                drawShootingLine(turretCenterX, turretCenterY, building.shootingTarget, 'rgba(255, 200, 100, 0.7)');
            }
        });

        gameElements.obstacles.forEach(obstacle => { /* ... */
            if (obstacle.x < viewBounds.maxX + obstacle.radius && obstacle.x > viewBounds.minX - obstacle.radius && obstacle.y < viewBounds.maxY + obstacle.radius && obstacle.y > viewBounds.minY - obstacle.radius) {
                ctx.fillStyle = obstacle.color;
                ctx.beginPath(); ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2); ctx.fill();
                const hpPercent = Math.max(0, obstacle.hp / obstacle.maxHp);
                ctx.fillStyle = hpPercent > 0.6 ? 'lightgreen' : hpPercent > 0.3 ? 'yellow' : 'red';
                ctx.fillRect(obstacle.x - obstacle.radius, obstacle.y - obstacle.radius - 8, obstacle.radius * 2 * hpPercent, 5);
                ctx.strokeStyle = 'rgba(50,50,50,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(obstacle.x - obstacle.radius, obstacle.y - obstacle.radius - 8, obstacle.radius * 2, 5);
            }
        });
        gameElements.powerUps.forEach(pu => { /* ... */
            if (pu.x < viewBounds.maxX + pu.radius && pu.x > viewBounds.minX - pu.radius && pu.y < viewBounds.maxY + pu.radius && pu.y > viewBounds.minY - pu.radius) {
                ctx.fillStyle = pu.color; ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#2a2a2a'; ctx.font = `${pu.radius*0.8}px Arial`; ctx.textAlign = 'center'; ctx.fillText(pu.icon, pu.x, pu.y + pu.radius * 0.25);
            }
        });
        if (currentBuildingToPlaceRef.building && (gameState === 'playing' || gameState === 'shop')) { /* ... */
             const mouseWorld = getMouseWorldPosCallback(lastMousePosRef);
            if (mouseWorld) {
                const gridX = Math.floor(mouseWorld.x / gs); const gridY = Math.floor(mouseWorld.y / gs);
                const key = `${gridX},${gridY}`;
                const canPlace = !gameElements.cubes.has(key) && !gameElements.buildings.has(key) && !(gridX === 0 && gridY === 0);
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = canPlace ? currentBuildingToPlaceRef.building.color : 'red';
                ctx.beginPath(); ctx.arc(gridX * gs + gs / 2, gridY * gs + gs / 2, gs * 0.4, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
        ctx.restore();

        const playerScreenX = canvas.width / 2; const playerScreenY = canvas.height / 2;
        ctx.fillStyle = 'rgba(0, 150, 255, 0.7)'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(playerScreenX, playerScreenY, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    // ... (endGame, restartGame, goToMenu, togglePause, resumeGameFromSomeMenu comme avant)
    function endGame(reason = "Votre base a été submergée.") { /* ... */
        if (gameState === 'gameOver') return;
        gameState = 'gameOver';
        UI.setOverlayDisplay(uiElements.gameOver, true);
        [uiElements.uiStats, uiElements.objectivesDisplay, uiElements.instructions, uiElements.gameControls, uiElements.baseHealthBarContainer, uiElements.inGameUpgrades].forEach(el => UI.setElementDisplay(el, false));
        uiElements.finalScore.textContent = `Score: ${gameStats.score}`;
        uiElements.gameOverText.textContent = `${reason} Vague Atteinte: ${gameStats.wave}. Temps Survécu: ${gameStats.survivalTime}s.`;
        highScores = Storage.saveHighScore(gameStats.score, gameStats.wave, gameStats.survivalTime, highScores);
        UI.displayHighScoresUI(highScores);
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    }
    function restartGame() { UI.setOverlayDisplay(uiElements.gameOver, false); startGame(); }
    function goToMenu() { /* ... */
        [uiElements.gameOver, uiElements.pauseMenu, uiElements.shopMenu, uiElements.uiStats, uiElements.objectivesDisplay, uiElements.instructions, uiElements.gameControls, uiElements.baseHealthBarContainer, uiElements.inGameUpgrades].forEach(el => UI.setElementDisplay(el, false));
        UI.setOverlayDisplay(uiElements.menu, true);
        gameState = 'menu';
        UI.displayHighScoresUI(highScores);
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    }
    function togglePause() { /* ... */
        if (gameState === 'playing') {
            gameState = 'paused';
            UI.setOverlayDisplay(uiElements.pauseMenu, true);
            currentBuildingToPlaceRef.building = null;
        } else if (gameState === 'paused') {
            UI.setOverlayDisplay(uiElements.pauseMenu, false);
            resumeGameFromSomeMenu();
        }
    }
    function resumeGameFromSomeMenu() { /* ... */
        if(gameState === 'gameOver' || gameState === 'menu') return;
        gameState = 'playing';
        UI.setOverlayDisplay(uiElements.pauseMenu, false);
        UI.setOverlayDisplay(uiElements.shopMenu, false);
        currentBuildingToPlaceRef.building = null;
        if (!animationFrame) requestAnimationFrame(gameLoop);
    }


    function openShop(isFromPauseMenu) { /* ... (inchangé, mais s'assure que renderShopItemsUI utilise Shop.getShopItems()) ... */
        const canOpen = gameState === 'playing' || gameState === 'paused';
        if (!canOpen) return;
        let cameFromState = gameState;
        gameState = 'shop';
        if (cameFromState === 'paused' && isFromPauseMenu) {
            UI.setOverlayDisplay(uiElements.pauseMenu, false);
        }
        UI.setOverlayDisplay(uiElements.shopMenu, true);
        UI.updateShopCashUI(gameStats.cash);
        UI.renderShopItemsUI(Shop.getShopItems(), gameStats.cash, uiElements.shopItemsContainer, handlePurchaseShopItem);
    }
    function closeShop() { /* ... (inchangé) ... */
        if (gameState !== 'shop') return;
        UI.setOverlayDisplay(uiElements.shopMenu, false);
        currentBuildingToPlaceRef.building = null;
        resumeGameFromSomeMenu();
    }
    function handlePurchaseShopItem(itemId) { /* ... (inchangé, s'assure que UI.renderShopItemsUI et UI.renderInGameUpgradesUI sont appelés) ... */
        const purchaseSuccessful = Shop.handleBuyShopItem(itemId, gameStats, baseCore, currentBuildingToPlaceRef);
        if (purchaseSuccessful) {
            UI.updateStatsUI(gameStats);
            UI.updateShopCashUI(gameStats.cash);
            UI.renderShopItemsUI(Shop.getShopItems(), gameStats.cash, uiElements.shopItemsContainer, handlePurchaseShopItem);
            const itemConfig = Config.SHOP_ITEMS_CONFIG.find(i => i.id === itemId);
            if (itemConfig && itemConfig.type === 'unlock') {
                UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
            }
        }
    }
    function handlePurchaseInGameUpgrade(upgradeId) { /* ... (inchangé) ... */
        const purchased = InGameUpgrades.tryPurchaseUpgrade(upgradeId, gameStats);
        if (purchased) {
            InGameUpgrades.applyAllPassiveInGameUpgrades(gameStats);
            UI.updateStatsUI(gameStats);
            UI.renderInGameUpgradesUI(InGameUpgrades.getUpgradesState(), gameStats.cash, uiElements.upgradesList, handlePurchaseInGameUpgrade);
        }
    }
    function showRules() { alert(Config.RULES_TEXT); }

    // --- Définition des Callbacks pour EventListeners --- (Peu de changements ici)
    function getMouseWorldPosCallback(mouseCanvasPos) { /* ... */
        if(!mouseCanvasPos || typeof mouseCanvasPos.x === 'undefined') return null;
        return { x: mouseCanvasPos.x - canvas.width / 2 + camera.x, y: mouseCanvasPos.y - canvas.height / 2 + camera.y };
    }
    function placeCubeAtGrid(gridX, gridY) { /* ... */
        if (currentBuildingToPlaceRef.building) return;
        const key = `${gridX},${gridY}`;
        if (gridX === 0 && gridY === 0) return;
        if (!gameElements.cubes.has(key) && !gameElements.buildings.has(key) && gameStats.cubesLeft > 0) {
            gameElements.cubes.set(key, GameObjects.createCube({
                cubeMaxHpPercentBonus: gameStats.cubeMaxHpPercentBonus,
                cubeDamageBonus: gameStats.cubeDamageBonus
            }));
            gameStats.cubesLeft--; gameStats.cubesPlaced++;
            UI.updateStatsUI(gameStats);
            lastPaintedGridCell.x = gridX; lastPaintedGridCell.y = gridY;
        }
    }
    function handleCanvasMouseDownCallback(e) { /* ... */
        if (gameState !== 'playing' && !(gameState === 'shop' && currentBuildingToPlaceRef.building)) return;
        const rect = canvas.getBoundingClientRect();
        const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldPos = getMouseWorldPosCallback(mouseCanvasPos);
        if (!worldPos) return;
        lastPaintedGridCell.x = null; lastPaintedGridCell.y = null;
        if (currentBuildingToPlaceRef.building) {
            const gridX = Math.floor(worldPos.x / Config.GRID_SIZE); const gridY = Math.floor(worldPos.y / Config.GRID_SIZE);
            const key = `${gridX},${gridY}`;
            if (!gameElements.cubes.has(key) && !gameElements.buildings.has(key) && !(gridX === 0 && gridY === 0)) {
                gameElements.buildings.set(key, { ...currentBuildingToPlaceRef.building });
                UI.showNotification(`${currentBuildingToPlaceRef.itemConfig.name} construit !`, "success");
                currentBuildingToPlaceRef.building = null; currentBuildingToPlaceRef.itemConfig = null;
                if (gameState === 'shop') resumeGameFromSomeMenu();
            } else { UI.showNotification("Impossible de construire ici !", "warning"); }
        } else if (gameState === 'playing') {
            const gridX = Math.floor(worldPos.x / Config.GRID_SIZE); const gridY = Math.floor(worldPos.y / Config.GRID_SIZE);
            placeCubeAtGrid(gridX, gridY);
        }
    }
    function handleCanvasMouseUpCallback(e) { /* ... */
        lastPaintedGridCell.x = null; lastPaintedGridCell.y = null;
    }
    function handleCanvasMouseMovePaintCallback(e) { /* ... */
        if (gameState !== 'playing' || currentBuildingToPlaceRef.building) return;
        const rect = canvas.getBoundingClientRect();
        const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldPos = getMouseWorldPosCallback(mouseCanvasPos);
        if (!worldPos) return;
        const gridX = Math.floor(worldPos.x / Config.GRID_SIZE); const gridY = Math.floor(worldPos.y / Config.GRID_SIZE);
        if (gridX !== lastPaintedGridCell.x || gridY !== lastPaintedGridCell.y) {
            placeCubeAtGrid(gridX, gridY);
        }
    }
    function handleCanvasContextMenuCallback(e) { /* ... */
        e.preventDefault();
        if (gameState !== 'playing' && !(gameState === 'shop' && currentBuildingToPlaceRef.building)) return;
        if (currentBuildingToPlaceRef.building) { /* ... */ currentBuildingToPlaceRef.building = null; currentBuildingToPlaceRef.itemConfig = null; UI.showNotification("Placement de bâtiment annulé.", "info"); if (gameState === 'shop') resumeGameFromSomeMenu(); return; }
        if (gameState !== 'playing') return;
        const rect = canvas.getBoundingClientRect(); const mouseCanvasPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }; const worldPos = getMouseWorldPosCallback(mouseCanvasPos); if (!worldPos) return;
        const gridX = Math.floor(worldPos.x / Config.GRID_SIZE); const gridY = Math.floor(worldPos.y / Config.GRID_SIZE); const key = `${gridX},${gridY}`;
        if (gameElements.cubes.has(key)) { /* ... */ gameElements.cubes.delete(key); gameStats.cubesLeft++; }
        else if (gameElements.buildings.has(key)) { /* ... */
            const building = gameElements.buildings.get(key);
            const shopItemConfig = Config.SHOP_ITEMS_CONFIG.find(item => item.buildingData && item.buildingData.type === building.type);
            if (shopItemConfig && shopItemConfig.costBase) {
                const currentCostOfThisBuildingLevel = Math.floor(shopItemConfig.costBase * Math.pow(shopItemConfig.costFactor, building.level || 0)); // building.level devrait être stocké
                const refund = Math.floor(currentCostOfThisBuildingLevel * 0.5); // Remboursement 50% du coût de ce niveau
                gameStats.cash += refund;
                gameElements.buildings.delete(key);
                UI.showNotification(`${building.type === 'generator' ? 'Générateur' : 'Bâtiment'} vendu (+${refund}💲)`, "info");
            } else { UI.showNotification("Impossible de vendre (info manquante).", "warning"); }
        }
        UI.updateStatsUI(gameStats);
    }
    function handleKeyDownCallback(e) { /* ... */
        keys[e.key.toLowerCase()] = true;
        const keyLower = e.key.toLowerCase();
        if (keyLower === 'p') { if (gameState === 'playing' || gameState === 'paused') togglePause(); }
        if (keyLower === 'escape') { /* ... */
            if (currentBuildingToPlaceRef.building) { currentBuildingToPlaceRef.building = null; currentBuildingToPlaceRef.itemConfig = null; UI.showNotification("Placement annulé.", "info"); if (gameState === 'shop') resumeGameFromSomeMenu(); }
            else if (gameState === 'shop') { closeShop(); }
            else if (gameState === 'paused') { resumeGameFromSomeMenu(); }
            else if (gameState === 'playing') { togglePause(); }
        }
    }
    function handleKeyUpCallback(e) { keys[e.key.toLowerCase()] = false; }


    EventListeners.setupEventListeners(
        canvas, keys, lastMousePosRef, isMouseDownRef,
        getMouseWorldPosCallback,
        handleCanvasMouseDownCallback, // Mousedown gère maintenant le placement initial
        handleCanvasMouseUpCallback,
        handleCanvasMouseMovePaintCallback,
        handleCanvasContextMenuCallback,
        handleKeyDownCallback, handleKeyUpCallback, resizeCanvasAndRender,
        uiElements,
        { startGame, showRules, restartGame, goToMenu, resumeGame: resumeGameFromSomeMenu, openShop, closeShop, togglePause }
    );
    resizeCanvasAndRender();
    goToMenu();

    function handleActivatePower(powerId) {
        const activated = Powers.tryActivatePower(powerId, gameElements, baseCore, gameStats, Date.now());
        if (activated) {
            // L'UI des pouvoirs est déjà mise à jour par updateActivePowers et le renderPowersUI dans update()
            // UI.updateStatsUI(gameStats); // Si le pouvoir modifie cash/cubes
        }
    }
});