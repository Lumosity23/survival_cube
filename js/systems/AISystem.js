// js/systems/AISystem.js
import * as Config from '../config.js';

export function updateEnemyAIAndMovement(gameElements, baseCore, gameStats) {
    if (!gameElements || !gameElements.obstacles || !baseCore) {
         //console.warn("[AISystem] Données manquantes pour updateEnemyAIAndMovement");
        return;
    }

    gameElements.obstacles.forEach((obstacle, index) => { // Ajout de l'index pour les logs
        if (!obstacle) {
            //console.warn(`[AISystem] Obstacle undefined à l'index ${index}`);
            return;
        }
        if (typeof obstacle.speed !== 'number' || isNaN(obstacle.speed) || obstacle.speed <= 0) {
             //console.warn(`[AISystem] Obstacle ${index} avec vitesse invalide ou nulle:`, obstacle.speed, obstacle);
            // Si la vitesse est invalide, on ne peut pas le faire bouger logiquement.
            // On pourrait lui donner une vitesse par défaut ici ou le laisser statique.
            // Pour l'instant, on le saute. Si beaucoup d'ennemis ont ce problème, c'est createObstacle qu'il faut revoir.
            obstacle.vx = 0; // Assurer qu'il ne bouge pas si vitesse invalide
            obstacle.vy = 0;
            return;
        }

        const targetX = baseCore.x;
        const targetY = baseCore.y;

        const dirX = targetX - obstacle.x;
        const dirY = targetY - obstacle.y;
        const distanceToTarget = Math.hypot(dirX, dirY);

         if (index === 0 && gameStats.survivalTime % 2 === 0) { // Log pour le premier ennemi toutes les 2s
             //console.log(`[AISystem] Obstacle ${index}: Pos(${obstacle.x.toFixed(0)},${obstacle.y.toFixed(0)}), Target(${targetX},${targetY}), Dist: ${distanceToTarget.toFixed(1)}, Speed: ${obstacle.speed.toFixed(2)}`);
         }

        if (distanceToTarget > 1) { // Seuil pour éviter la gigue
            const normalizedDirX = dirX / distanceToTarget;
            const normalizedDirY = dirY / distanceToTarget;

            obstacle.vx = normalizedDirX * obstacle.speed;
            obstacle.vy = normalizedDirY * obstacle.speed;
        } else {
             //console.log(`[AISystem] Obstacle ${index} a atteint la cible (ou presque). Arrêt.`);
            obstacle.vx = 0;
            obstacle.vy = 0;
        }

        // Appliquer le mouvement physique
        obstacle.x += obstacle.vx;
        obstacle.y += obstacle.vy;

         //if (index === 0 && gameStats.survivalTime % 2 === 0 && (obstacle.vx !== 0 || obstacle.vy !== 0) ) {
           // console.log(`[AISystem] Obstacle ${index} après mouvement: Pos(${obstacle.x.toFixed(0)},${obstacle.y.toFixed(0)}), Vel(${obstacle.vx.toFixed(2)},${obstacle.vy.toFixed(2)})`);
         //}
    });
}