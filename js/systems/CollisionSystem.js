// js/systems/CollisionSystem.js
import * as Config from '../config.js';
import * as UIManager from '../ui/UIManager.js'; // Garder pour showNotification si besoin

export function handleObstacleCollisions(gameElements, gameStats, baseCore, endGameCallback) {
    let gameShouldEnd = false;
    for (let obsIdx = gameElements.obstacles.length - 1; obsIdx >= 0; obsIdx--) {
        const obstacle = gameElements.obstacles[obsIdx];
        if (!obstacle) continue;

        // Collision avec Base Core
        if (Math.hypot(obstacle.x - baseCore.x, obstacle.y - baseCore.y) < obstacle.radius + baseCore.radius) {
            const previousHealth = baseCore.health;
            baseCore.health -= obstacle.damage;

            // Déclencher l'effet visuel de dégât si la vie a diminué
            if (baseCore.health < previousHealth && UIManager.triggerScreenBorderEffect) { // S'assurer que la fonction existe dans UIManager ou Effects
                 // Si triggerScreenBorderEffect est dans Effects.js (ce qui est le cas maintenant)
                 // alors CollisionSystem doit importer Effects.js et l'appeler.
                 // Pour l'instant, on suppose que main.js gère l'effet de dégât en observant baseCore.health
                 // ou on importe Effects.js ici.
                 // Exemple avec import de Effects:
                 // import * as Effects from '../effects.js'; // A ajouter en haut
                 // Effects.triggerScreenBorderEffect('player_damage');
            }

            // La mise à jour de l'UI TEXTUELLE (baseHealthDisplay) se fera via updateStatsUI dans main.js
            // car gameStats.baseCoreHealth sera mis à jour.
            // UIManager.updateBaseHealthBarUI(baseCore.health); // Cette fonction met à jour la BARRE GRAPHIQUE si elle est utilisée.

            gameElements.obstacles.splice(obsIdx, 1);

            if (baseCore.health <= 0) {
                endGameCallback("Noyau détruit par un ennemi !");
                gameShouldEnd = true;
                // if (Effects && Effects.triggerScreenBorderEffect) Effects.triggerScreenBorderEffect('none'); // Nettoyer l'effet
                break;
            }
            continue;
        }

        // Collision avec Cubes ou Bâtiments (si réintroduits)
        const gridX = Math.floor(obstacle.x / Config.GRID_SIZE);
        const gridY = Math.floor(obstacle.y / Config.GRID_SIZE);
        const key = `${gridX},${gridY}`;

        let collidedWithStructure = false;
        if (gameElements.cubes && gameElements.cubes.has(key)) { // Vérifier si cubes existe
            let cube = gameElements.cubes.get(key);
            const cubeDamageToObstacle = cube.damage || 0;
            obstacle.hp -= cubeDamageToObstacle;
            cube.hp -= obstacle.damage;
            if (cube.hp <= 0) gameElements.cubes.delete(key);
            collidedWithStructure = true;
        } else if (gameElements.buildings && gameElements.buildings.has(key)) { // Vérifier si buildings existe
            let building = gameElements.buildings.get(key);
            if (building.hp !== undefined) {
                building.hp -= obstacle.damage;
                if (building.hp <= 0) {
                    gameElements.buildings.delete(key);
                    if (UIManager.showNotification) UIManager.showNotification(`${building.type === 'generator' ? 'Générateur' : (building.type === 'turret' ? 'Tourelle' : 'Bâtiment')} détruit !`, "warning");
                }
            }
            obstacle.hp -= obstacle.maxHp * 0.8; // L'obstacle prend de gros dégâts
            collidedWithStructure = true;
        }

        if (obstacle.hp <= 0) {
            if (gameElements.obstacles[obsIdx] === obstacle) {
                gameElements.obstacles.splice(obsIdx, 1);
                if(gameStats) { // S'assurer que gameStats est disponible
                    gameStats.score = (gameStats.score || 0) + (obstacle.scoreValue || 10);
                    gameStats.cash = (gameStats.cash || 0) + (obstacle.cashValue || 1);
                    gameStats.cashEarnedThisGame = (gameStats.cashEarnedThisGame || 0) + (obstacle.cashValue || 1);
                    gameStats.obstaclesDestroyed = (gameStats.obstaclesDestroyed || 0) + 1;
                }
            }
            continue;
        }

        if (gameStats && gameStats.camera && gameStats.canvasWidth && gameStats.canvasHeight &&
            (Math.abs(obstacle.x - gameStats.camera.x) > gameStats.canvasWidth * 1.2 ||
             Math.abs(obstacle.y - gameStats.camera.y) > gameStats.canvasHeight * 1.2)) {
            if (gameElements.obstacles[obsIdx] === obstacle) {
                 gameElements.obstacles.splice(obsIdx, 1);
            }
        }
    }
    return gameShouldEnd;
}

export function handlePowerUpProximity(powerUp, camera) {
    return false; // Non utilisé pour l'instant
}

export function checkCameraCollision(newCamX, newCamY, camera, gameElements) {
    return { canMoveX: true, canMoveY: true }; // Pas de collision pour l'instant
}