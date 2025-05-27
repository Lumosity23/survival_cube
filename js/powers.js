// js/powers.js
import * as Config from './config.js';
import * as UI from './ui.js';

let activePowersState = [];

export function initializePowers() {
    activePowersState = Config.POWERS_CONFIG.map(config => ({
        ...config,
        lastUsedTime: 0, // Prêt à être utilisé
        usesLeft: config.isUnlocked ? (config.initialUses || 1) : 0, // Si débloqué par défaut, donne des charges
        isActive: false, // Pour les pouvoirs à durée
        activeUntil: 0
    }));
}

export function getPowersState() {
    return [...activePowersState];
}

export function unlockPower(powerId, initialUses = 1) {
    const power = activePowersState.find(p => p.id === powerId);
    if (power) {
        power.isUnlocked = true;
        power.usesLeft = (power.usesLeft || 0) + initialUses;
        UI.showNotification(`Pouvoir "${power.name}" obtenu !`, "success");
        return true;
    }
    return false;
}

export function tryActivatePower(powerId, gameElements, baseCore, gameStats, now) {
    const power = activePowersState.find(p => p.id === powerId);
    if (!power || !power.isUnlocked || power.usesLeft <= 0) {
        UI.showNotification("Pouvoir non disponible ou pas de charges.", "warning");
        return false;
    }
    if (now - power.lastUsedTime < power.cooldown) {
        const timeLeft = Math.ceil((power.cooldown - (now - power.lastUsedTime)) / 1000);
        UI.showNotification(`Pouvoir "${power.name}" en cooldown (${timeLeft}s).`, "warning");
        return false;
    }

    power.lastUsedTime = now;
    power.usesLeft--; // Ou ne pas décrémenter si c'est un cooldown pur sans charges limitées après achat

    // Appliquer l'effet
    switch (power.id) {
        case 'pushBack':
            gameElements.obstacles.forEach(enemy => {
                const distX = enemy.x - baseCore.x;
                const distY = enemy.y - baseCore.y;
                const distance = Math.hypot(distX, distY);
                if (distance < power.effectRadius && distance > 0) { // Ne pas affecter les ennemis sur le noyau
                    const pushFactor = power.pushStrength / distance;
                    enemy.x += distX * pushFactor;
                    enemy.y += distY * pushFactor;
                }
            });
            UI.showNotification("Onde de Choc activée !", "info");
            break;
        case 'turretOvercharge':
            power.isActive = true;
            power.activeUntil = now + power.duration;
            // Le bonus sera appliqué dans la logique de tir des tourelles/noyau
            UI.showNotification("Surcharge des tourelles activée !", "info");
            break;
    }
    return true;
}

// Appeler cette fonction dans la boucle update de main.js
export function updateActivePowers(now, gameStats) {
    activePowersState.forEach(power => {
        if (power.isActive && now > power.activeUntil) {
            power.isActive = false;
            // Retirer l'effet si nécessaire (ex: remettre le fireRate à la normale)
            if (power.id === 'turretOvercharge') {
                UI.showNotification("Surcharge des tourelles terminée.", "info");
            }
        }
    });
    // Mettre à jour gameStats si les pouvoirs actifs modifient des stats globales
    gameStats.isTurretOvercharged = activePowersState.some(p => p.id === 'turretOvercharge' && p.isActive);
}