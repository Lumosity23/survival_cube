import * as Config from './config.js';
import * as UI from './ui.js'; // Potentially for collision feedback, though less common

// Note: gameStats, gameElements, baseCore will be passed from main.js update loop
export function handleObstacleCollisions(gameElements, gameStats, baseCore, endGameCallback) {
    for (let obsIdx = gameElements.obstacles.length - 1; obsIdx >= 0; obsIdx--) {
        const obstacle = gameElements.obstacles[obsIdx];

        // Collision with Base Core
        if (Math.hypot(obstacle.x - baseCore.x, obstacle.y - baseCore.y) < obstacle.radius + baseCore.radius) {
            baseCore.health -= obstacle.damage;
            gameElements.obstacles.splice(obsIdx, 1);
            UI.updateBaseHealthBarUI(baseCore.health); // UI update specific to base health
            if (baseCore.health <= 0) {
                endGameCallback("Noyau détruit par un ennemi !"); // Call the endGame function passed from main
                return true; // Indicates game should end
            }
            continue; // Move to next obstacle
        }

        // Collision with Cubes or Buildings
        const gridX = Math.floor(obstacle.x / Config.GRID_SIZE);
        const gridY = Math.floor(obstacle.y / Config.GRID_SIZE);
        const key = `${gridX},${gridY}`;

        let collidedWithStructure = false;
        let obstacleDestroyedInCollision = false;

        if (gameElements.cubes.has(key)) {
            let cube = gameElements.cubes.get(key);
            cube.hp -= obstacle.damage;
            obstacle.hp -= (cube.type === 'reinforced' ? 20 : 10); // Cube damage to obstacle

            if (cube.hp <= 0) gameElements.cubes.delete(key);
            collidedWithStructure = true;
        } else if (gameElements.buildings.has(key)) {
            let building = gameElements.buildings.get(key);
            if (building.hp !== undefined) { // Check if building is destructible
                building.hp -= obstacle.damage;
                // Obstacle takes damage from building? For now, no.
                if (building.hp <= 0) {
                    gameElements.buildings.delete(key);
                    UI.showNotification(`${building.type === 'generator' ? 'Générateur' : 'Bâtiment'} détruit !`, "warning");
                }
            }
            // Obstacle is destroyed on impact with building in current model
            // If not, obstacle.hp check below will handle it.
            // For now, let's assume obstacle is heavily damaged or destroyed by hitting a building.
            obstacle.hp -= obstacle.maxHp; // Effectively destroy obstacle on building hit
            collidedWithStructure = true;
        }

        if (collidedWithStructure && obstacle.hp <= 0) {
            gameElements.obstacles.splice(obsIdx, 1);
            gameStats.score += obstacle.scoreValue;
            gameStats.cash += obstacle.cashValue;
            gameStats.cashEarnedThisGame += obstacle.cashValue;
            gameStats.obstaclesDestroyed++;
            obstacleDestroyedInCollision = true;
        }
        // If obstacle survived the collision but the structure it hit was destroyed, it continues.

        // Remove off-screen obstacles (if not destroyed by collision already)
        if (!obstacleDestroyedInCollision && (Math.abs(obstacle.x - gameStats.camera.x) > gameStats.canvasWidth * 1.5 || Math.abs(obstacle.y - gameStats.camera.y) > gameStats.canvasHeight * 1.5)) {
            gameElements.obstacles.splice(obsIdx, 1);
        }
    }
    return false; // Game does not need to end due to collisions in this pass
}

export function handlePowerUpProximity(powerUp, camera) {
    return Math.hypot(powerUp.x - camera.x, powerUp.y - camera.y) < powerUp.radius + 20; // 20 is approx camera/cursor radius
}

export function checkCameraCollision(newCamX, newCamY, camera, gameElements) {
    const camRadius = Config.GRID_SIZE / 3;
    const pointsToTest = [
        {x: newCamX - camRadius, y: newCamY - camRadius}, {x: newCamX + camRadius, y: newCamY - camRadius},
        {x: newCamX - camRadius, y: newCamY + camRadius}, {x: newCamX + camRadius, y: newCamY + camRadius},
        {x: newCamX, y: newCamY} // center
    ];

    let canMoveX = true;
    let canMoveY = true;

    for (const point of pointsToTest) {
        const gridX = Math.floor(point.x / Config.GRID_SIZE);
        const gridY = Math.floor(point.y / Config.GRID_SIZE);
        const key = `${gridX},${gridY}`;

        if (gameElements.cubes.has(key) || gameElements.buildings.has(key)) {
            const currentGridX = Math.floor(camera.x / Config.GRID_SIZE);
            const currentGridY = Math.floor(camera.y / Config.GRID_SIZE);
            const targetGridX = Math.floor(newCamX / Config.GRID_SIZE);
            const targetGridY = Math.floor(newCamY / Config.GRID_SIZE);

            // If trying to move into a blocked cell horizontally
            if (targetGridX === gridX && currentGridY === gridY && newCamX !== camera.x) {
                canMoveX = false;
            }
            // If trying to move into a blocked cell vertically
            if (targetGridY === gridY && currentGridX === gridX && newCamY !== camera.y) {
                canMoveY = false;
            }
            // If moving diagonally into a corner or more complex scenario
            if (targetGridX === gridX && targetGridY === gridY) { // simplified: if target cell is blocked
                if (newCamX !== camera.x) canMoveX = false;
                if (newCamY !== camera.y) canMoveY = false;
            }
        }
    }
    return { canMoveX, canMoveY };
}