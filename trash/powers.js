// js/powers.js
import * as Config from './config.js';
import * as UI from './ui.js';

let activePowersState = [];

export function initializePowers() {
    activePowersState = Config.POWERS_CONFIG.map(config => ({
        ...config,
        lastUsedTime: 0,
        usesLeft: config.isUnlocked ? (config.initialUses || 0) : 0, // Si isUnlocked de base, donner des charges. Sinon 0.
                                                                    // Les achats via shop ajouteront des charges.
        isActive: false,
        activeUntil: 0
    }));
}

export function getPowersState() {
    return [...activePowersState];
}

export function unlockOrAddChargePower(powerId, chargesToAdd = 1) { // Renommé pour plus de clarté
    const power = activePowersState.find(p => p.id === powerId);
    if (power) {
        if (!power.isUnlocked) {
            power.isUnlocked = true;
            power.usesLeft = chargesToAdd;
            UI.showNotification(`Pouvoir "${power.name}" débloqué (${chargesToAdd} charge(s)) !`, "success");
        } else {
            power.usesLeft = (power.usesLeft || 0) + chargesToAdd;
            UI.showNotification(`+${chargesToAdd} charge(s) pour "${power.name}" !`, "success");
        }
        return true;
    }
    return false;
}

export function tryActivatePower(powerId, gameElements, baseCore, gameStats, now) {
    const power = activePowersState.find(p => p.id === powerId);
    if (!power || !power.isUnlocked) {
        UI.showNotification("Pouvoir non débloqué.", "warning"); return false;
    }
    if (power.usesLeft <= 0) {
        UI.showNotification("Plus de charges pour ce pouvoir.", "warning"); return false;
    }
    if (now - power.lastUsedTime < power.cooldown) {
        const timeLeft = Math.ceil((power.cooldown - (now - power.lastUsedTime)) / 1000);
        UI.showNotification(`Pouvoir "${power.name}" en cooldown (${timeLeft}s).`, "warning");
        return false;
    }

    power.lastUsedTime = now;
    power.usesLeft--;

    switch (power.id) {
        case 'pushBack':
            gameElements.obstacles.forEach(enemy => {
                const distX = enemy.x - baseCore.x;
                const distY = enemy.y - baseCore.y;
                const distance = Math.hypot(distX, distY);
                if (distance < power.effectRadius && distance > 0.1) { // distance > 0.1 pour éviter division par zéro
                    const pushAngle = Math.atan2(distY, distX); // Angle depuis le noyau vers l'ennemi
                    // On veut repousser dans la direction opposée à l'ennemi par rapport au noyau, ou directement depuis le noyau
                    enemy.x += Math.cos(pushAngle) * power.pushStrength;
                    enemy.y += Math.sin(pushAngle) * power.pushStrength;
                }
            });
            UI.showNotification("Onde de Choc activée !", "info");
            break;
        case 'turretOvercharge':
            power.isActive = true;
            power.activeUntil = now + power.duration;
            UI.showNotification("Surcharge des tourelles activée !", "info");
            break;
    }
    return true;
}

export function updateActivePowers(now, gameStats) {
    let wasOvercharged = gameStats.isTurretOvercharged;
    gameStats.isTurretOvercharged = false; // Réinitialiser avant de vérifier

    activePowersState.forEach(power => {
        if (power.isActive && now > power.activeUntil) {
            power.isActive = false;
            if (power.id === 'turretOvercharge') {
                UI.showNotification("Surcharge des tourelles terminée.", "info");
            }
        }
        // Mettre à jour gameStats si des pouvoirs actifs modifient des stats globales
        if (power.id === 'turretOvercharge' && power.isActive) {
            gameStats.isTurretOvercharged = true;
        }
    });
    // Si l'état de surcharge a changé, on pourrait forcer une mise à jour UI des pouvoirs
    // if (wasOvercharged !== gameStats.isTurretOvercharged) {
    //     // main.js appellera UI.renderPowersUI de toute façon
    // }
}