// js/game_elements/gameObjects.js
import * as Config from '../config.js';
import { createObstacleObject } from './Obstacle.js';

export function createObstacle(difficulty, wave, camera, canvas, baseCore, isBoss = false, isMiniBoss = false) {
    let radiusMin = 7; let radiusMax = 10;
    if (wave >= 3) radiusMax += (wave - 2) * 0.8; if (wave >= 7) radiusMax += (wave - 6) * 0.6;
    radiusMax = Math.min(radiusMax, Config.GRID_SIZE * 0.6);
    let radius = radiusMin + Math.random() * (radiusMax - radiusMin);

    let hpFromSize = Math.pow(radius, Config.ENEMY_HP_FROM_SIZE_FACTOR);
    let waveHpMultiplier = Config.ENEMY_HP_WAVE_MULTIPLIER_BASE + (wave > 4 ? (wave - 4) * Config.ENEMY_HP_WAVE_MULTIPLIER_INCREMENT : 0) + (difficulty * Config.ENEMY_HP_DIFFICULTY_MULTIPLIER);
    let baseHp = hpFromSize * waveHpMultiplier;

    if (wave < 3 && !isBoss && !isMiniBoss) baseHp = Math.max(1, baseHp * 0.15);
    else if (wave < 5 && !isBoss && !isMiniBoss) baseHp = Math.max(1, baseHp * 0.4);
    baseHp = Math.max(1, Math.floor(baseHp));

    let baseDamage = Math.floor(radius * Config.ENEMY_DAMAGE_FROM_SIZE_FACTOR + difficulty * Config.ENEMY_DAMAGE_DIFFICULTY_FACTOR + wave * Config.ENEMY_DAMAGE_WAVE_FACTOR);
    baseDamage = Math.max(1, baseDamage);
    let color = Config.ENEMY_DEFAULT_COLOR;
    let scoreValue = Math.floor(radius * 0.4 + difficulty * 0.8);
    let cashValue = Math.floor(radius * 0.08 + wave * 0.6 + difficulty * 0.2);
    cashValue = Math.max(1, Math.floor(cashValue));

    let specialType = null;
    if (isBoss) {
        specialType = 'boss'; radius *= 1.8;
        baseHp = Math.pow(radius, Config.ENEMY_HP_FROM_SIZE_FACTOR) * (waveHpMultiplier * 1.8);
        baseHp = Math.max(Config.CUBE_BASE_HP * 10, Math.floor(baseHp));
        baseDamage = Math.floor(radius* Config.ENEMY_DAMAGE_FROM_SIZE_FACTOR*1.6 + difficulty* Config.ENEMY_DAMAGE_DIFFICULTY_FACTOR*1.6 + wave* Config.ENEMY_DAMAGE_WAVE_FACTOR*1.6);
        color = Config.ENEMY_GIANT_COLOR; scoreValue = Math.floor(scoreValue * 3.5); cashValue = Math.floor(cashValue * 4);
    } else if (isMiniBoss) {
        specialType = 'mini_boss'; radius *= 1.3;
        baseHp = Math.pow(radius, Config.ENEMY_HP_FROM_SIZE_FACTOR) * (waveHpMultiplier * 1.3);
        baseHp = Math.max(Config.CUBE_BASE_HP * 5, Math.floor(baseHp));
        baseDamage = Math.floor(radius* Config.ENEMY_DAMAGE_FROM_SIZE_FACTOR*1.3 + difficulty* Config.ENEMY_DAMAGE_DIFFICULTY_FACTOR*1.3 + wave* Config.ENEMY_DAMAGE_WAVE_FACTOR*1.3);
        color = Config.ENEMY_FAST_COLOR; scoreValue = Math.floor(scoreValue * 2.2); cashValue = Math.floor(cashValue * 2.8);
    } else {
        const specialChanceModifier = wave < 3 ? 0.2 : (wave < 5 ? 0.5 : 1.0);
        const randSpecial = Math.random();
        if (randSpecial < (0.015 + difficulty * 0.0008) * specialChanceModifier && wave >= 4) {
            specialType = 'giant'; radius *= 1.4;
            baseHp = Math.pow(radius, Config.ENEMY_HP_FROM_SIZE_FACTOR) * (waveHpMultiplier * 1.05);
            baseHp = Math.max(Config.CUBE_BASE_HP * 1.8, Math.floor(baseHp));
            baseDamage = Math.floor(radius* Config.ENEMY_DAMAGE_FROM_SIZE_FACTOR*1.05 + difficulty* Config.ENEMY_DAMAGE_DIFFICULTY_FACTOR*1.05 + wave* Config.ENEMY_DAMAGE_WAVE_FACTOR*1.05);
            color = Config.ENEMY_GIANT_COLOR; scoreValue = Math.floor(scoreValue*1.4); cashValue = Math.floor(cashValue*1.4);
        } else if (randSpecial < (0.06 + difficulty * 0.002) * specialChanceModifier && wave >= 2) {
            specialType = 'fast'; radius *= 0.9;
            baseHp = Math.pow(radius, Config.ENEMY_HP_FROM_SIZE_FACTOR * 0.95) * waveHpMultiplier;
            baseHp = Math.max(1, Math.floor(baseHp));
            color = Config.ENEMY_FAST_COLOR; scoreValue = Math.floor(scoreValue*0.95);
        }
    }
    if (wave < 5 && specialType !== 'giant' && specialType !== 'boss' && specialType !== 'mini_boss') {
        baseHp = Math.min(baseHp, Math.floor(Config.BASE_CORE_TURRET_INITIAL_DAMAGE * 1.2));
        baseHp = Math.max(1, baseHp);
   }

    let speedFactor = 1.0;
    if (specialType === 'fast' || specialType === 'mini_boss') speedFactor = 1.40;
    if (specialType === 'giant' || specialType === 'boss') speedFactor = 0.70;

    const baseSpeedValue = (0.72 * speedFactor) + difficulty * 0.032 + wave * 0.015 - (radius / 20); // Ajustement léger
    let speedVar = Math.random() * baseSpeedValue * 0.15; // Variation encore réduite pour plus de prévisibilité
    const finalSpeed = Math.max(0.25, baseSpeedValue + speedVar); // Vitesse minimale un peu plus basse pour test

    console.log(`[CreateObstacle] Wave: ${wave}, Diff: ${difficulty}, Radius: ${radius.toFixed(1)}, Special: ${specialType}, BaseSpeed: ${baseSpeedValue.toFixed(2)}, SpeedVar: ${speedVar.toFixed(2)}, FinalSpeed: ${finalSpeed.toFixed(2)}`); // LOG IMPORTANT

    const spawnDist = Math.max(canvas.width/2, canvas.height/2) + 100 + Math.random() * 50;
    const angleFromCenter = Math.random() * Math.PI * 2;
    const x = camera.x + Math.cos(angleFromCenter) * spawnDist;
    const y = camera.y + Math.sin(angleFromCenter) * spawnDist;

    if (isNaN(finalSpeed) || finalSpeed <= 0) {
        console.error(`[CreateObstacle] ERREUR: finalSpeed est invalide (${finalSpeed}) pour l'ennemi. Forcé à 0.5.`);
        // finalSpeed = 0.5; // Valeur de secours pour éviter NaN dans l'objet
    }

    return createObstacleObject(
        x, y,
        0, 0, // vx, vy initiaux sont 0, AISystem les calcule
        baseHp, baseHp, baseDamage, radius, color, specialType, scoreValue, cashValue,
        finalSpeed
    );
}
// Pour l'instant, on ne crée pas de cubes, bâtiments, powerups pour simplifier
// export function createPowerUp(wave, camera) { /* ... */ }
// export function createCube(gameStatsSnapshot) { /* ... */ }
// export function createBuilding(buildingDataFromShopConfig) { /* ... */ }