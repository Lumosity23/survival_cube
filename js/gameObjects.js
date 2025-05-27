// js/gameObjects.js
import * as Config from './config.js';

export function createObstacle(difficulty, wave, camera, canvas, baseCore) {
    // 1. Déterminer la taille (radius)
    let radiusMin = 8;
    let radiusMax = 12;
    if (wave >= 3) radiusMax += (wave - 2) * 1.0;
    if (wave >= 7) radiusMax += (wave - 6) * 0.8;
    radiusMax = Math.min(radiusMax, Config.GRID_SIZE * 0.7);
    let radius = radiusMin + Math.random() * (radiusMax - radiusMin);

    // 2. HP basé sur la taille
    let hpFromSize = Math.pow(radius, 2) * 2.0;
    let waveHpMultiplier = 1 + (wave > 4 ? (wave - 4) * 0.15 : 0) + (difficulty * 0.05);
    let baseHp = hpFromSize * waveHpMultiplier;

    if (wave < 3) {
        baseHp = Math.max(1, baseHp * 0.2);
    } else if (wave < 5) {
        baseHp = Math.max(1, baseHp * 0.5);
    }
    baseHp = Math.max(1, Math.floor(baseHp));

    // 3. Dégâts, couleur, score, cash
    let baseDamage = Math.floor(radius * 0.20 + difficulty * 0.25 + wave * 0.10);
    baseDamage = Math.max(1, baseDamage);
    let color = Config.COLOR_OBSTACLE_DEFAULT;
    let scoreValue = Math.floor(radius * 0.5 + difficulty);
    let baseCashFromSize = Math.floor(radius * 0.15); // Un peu de cash pour la taille
    let cashFromWave = Math.floor(wave * 0.5 + Math.pow(Math.max(0, wave - 3), 1.2)); // Augmente bien avec les vagues
    let cashFromDifficulty = Math.floor(difficulty * 0.3);
    let cashValue = baseCashFromSize + cashFromWave + cashFromDifficulty;
    cashValue = Math.max(1, cashValue); // Au moins 1
    let specialType = null;

    const specialChanceModifier = wave < 3 ? 0.3 : (wave < 5 ? 0.6 : 1.0);
    const randSpecial = Math.random();

    if (randSpecial < (0.02 + difficulty * 0.001) * specialChanceModifier && wave >= 3) {
        specialType = 'giant';
        radius *= 1.5;
        baseHp = Math.pow(radius, 2) * 0.6 * (1 + difficulty * 0.15 + (wave > 4 ? (wave - 4) * 0.08 : 0));
        baseHp = Math.max(10, Math.floor(baseHp));
        baseDamage = Math.floor(radius * 0.3 + difficulty * 0.4 + wave * 0.2);
        color = Config.COLOR_OBSTACLE_GIANT; scoreValue *=1.8; cashValue = Math.floor(cashValue * 1.8);
    } else if (randSpecial < (0.08 + difficulty * 0.003) * specialChanceModifier && wave >= 2) {
        specialType = 'fast';
        radius *= 0.85;
        baseHp = Math.pow(radius, 2) * 0.4 * (1 + difficulty * 0.08 + (wave > 4 ? (wave - 4) * 0.04 : 0));
        baseHp = Math.max(1, Math.floor(baseHp));
        color = Config.COLOR_OBSTACLE_FAST; scoreValue = Math.floor(scoreValue*0.9);
    }

    // Ajustement des PV pour les one-shots (UTILISE specialType ICI)
    if (wave < 15 && specialType !== 'giant') {
         baseHp = Math.min(baseHp, Math.floor(Config.TURRET_BASE_DAMAGE * 0.8));
         baseHp = Math.max(1, baseHp);
    }
    // Si c'est un géant, même avant la vague 5, il peut avoir plus de vie.
    // Si on veut que TOUS les ennemis soient one-shot avant la vague 5, même les géants, il faudrait faire :
    // if (wave < 5) { baseHp = 1; } // Après le bloc if/else if pour specialType

    // Ajustement de la vitesse (UTILISE specialType ICI)
    const baseSpeedValue = (specialType === 'fast' ? 1.9 : 0.65) // Si specialType est null, il prendra 0.65
                           + difficulty * 0.04 + wave * 0.015 - (radius / 18);
    let speedVar = Math.random() * baseSpeedValue * (specialType === 'fast' ? 1.1 : 0.7);
    if (specialType === 'giant') speedVar *= 0.45;

    // ... (reste de la logique de spawn position et vélocité)
    const spawnDist = Math.max(canvas.width/2, canvas.height/2) + 100 + Math.random() * 50;
    const angleFromCenter = Math.random() * Math.PI * 2;
    const x = camera.x + Math.cos(angleFromCenter) * spawnDist;
    const y = camera.y + Math.sin(angleFromCenter) * spawnDist;
    const angleToBase = Math.atan2(baseCore.y - y, baseCore.x - x);
    const spreadAngle = (Math.random() - 0.5) * Math.PI / 2.8;
    const finalSpeed = Math.max(0.3, baseSpeedValue + speedVar);
    const vx = Math.cos(angleToBase + spreadAngle) * finalSpeed;
    const vy = Math.sin(angleToBase + spreadAngle) * finalSpeed;

    if (isNaN(vx) || isNaN(vy)) {
        // console.error("NaN speed detected in createObstacle", {vx, vy, finalSpeed, angleToBase, spreadAngle});
        return null;
    }

    return { x, y, vx, vy, hp: baseHp, maxHp: baseHp, damage: baseDamage, radius, color, specialType, scoreValue, cashValue };
}

export function createPowerUp(wave, camera) {
    // ... (inchangé)
    const typeConfig = Config.POWERUP_TYPES[Math.floor(Math.random() * Config.POWERUP_TYPES.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 250;
    return {
        x: camera.x + Math.cos(angle) * distance,
        y: camera.y + Math.sin(angle) * distance,
        radius: 12,
        icon: typeConfig.icon,
        color: typeConfig.color,
        type: typeConfig.type,
        amount: typeConfig.amountFn(wave),
        spawnTime: Date.now()
    };
}

export function createCube(gameStatsSnapshot) {
    // ... (inchangé)
    const hpBonusPercentage = gameStatsSnapshot.cubeMaxHpPercentBonus || 0;
    const baseHp = Config.CUBE_BASE_HP;
    const finalHp = baseHp * (1 + hpBonusPercentage / 100);
    const cubeDamage = gameStatsSnapshot.cubeDamageBonus || 0;

    return {
        hp: finalHp,
        maxHp: finalHp,
        type: hpBonusPercentage > 0 ? 'reinforced' : 'standard',
        color: hpBonusPercentage > 0 ? Config.COLOR_CUBE_REINFORCED : Config.COLOR_CUBE_STANDARD,
        damage: cubeDamage,
    };
}

export function createBuilding(buildingDataFromShopConfig) {
    // buildingDataFromShopConfig est la section buildingData de l'item du shop
    let buildingInstance = {
        ...buildingDataFromShopConfig,
        lastGenTime: buildingDataFromShopConfig.type === 'generator' ? Date.now() : undefined,
        lastShotTime: buildingDataFromShopConfig.type === 'turret' ? 0 : undefined, // Pour les tourelles
        // Appliquer les bonus des améliorations en jeu si nécessaire ici
        // Par exemple, si turretDamageBonus affecte les nouvelles tourelles :
        // damage: buildingDataFromShopConfig.type === 'turret' ?
        // (buildingDataFromShopConfig.damage + (gameStatsSnapshot.turretDamageBonus || 0)) :
        // buildingDataFromShopConfig.damage,
        // Pour l'instant, les stats de base de la tourelle viennent de sa config, les bonus s'appliqueront dans la logique de tir.
    };
    buildingInstance.hp = buildingDataFromShopConfig.hp || 100;
    buildingInstance.maxHp = buildingDataFromShopConfig.maxHp || 100;
    return buildingInstance;
}