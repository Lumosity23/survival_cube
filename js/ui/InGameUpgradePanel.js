// js/inGameUpgrades.js
import * as Config from '../config.js';
import * as UI from './UIManager.js';

let currentUpgradesState = [];

export function initializeInGameUpgrades() {
    currentUpgradesState = Config.IN_GAME_UPGRADES_CONFIG.map(config => ({
        ...config,
        currentLevel: 0,
    }));
}

export function getUpgradesState() {
    return [...currentUpgradesState];
}

function calculateUpgradeCost(upgradeState) {
    return Math.floor(upgradeState.costBase * Math.pow(upgradeState.costFactor, upgradeState.currentLevel));
}

export function tryPurchaseUpgrade(upgradeId, gameStats) {
    const upgrade = currentUpgradesState.find(u => u.id === upgradeId);
    if (!upgrade || !upgrade.isUnlocked) {
        if(upgrade && !upgrade.isUnlocked) UI.showNotification("Cette amélioration doit d'abord être débloquée via le Shop !", "warning");
        return false;
    }
    if (upgrade.currentLevel >= upgrade.maxLevel) {
        UI.showNotification("Niveau maximum déjà atteint !", "warning");
        return false;
    }
    const cost = calculateUpgradeCost(upgrade);
    if (gameStats.cash < cost) {
        UI.showNotification("Pas assez de cash !", "warning");
        return false;
    }
    gameStats.cash -= cost;
    upgrade.currentLevel++;
    //UI.showNotification(`${upgrade.name} amélioré au Niv. ${upgrade.currentLevel} !`, "success");
    return true;
}

export function applyAllPassiveInGameUpgrades(gameStats) {
    Config.IN_GAME_UPGRADES_CONFIG.forEach(config => {
        if (config.effectKey) {
            // Valeurs par défaut
            if (config.effectKey.includes('PercentBonus')) gameStats[config.effectKey] = 0;
            else if (config.effectKey.includes('Multiplier')) gameStats[config.effectKey] = 1.0;
            else gameStats[config.effectKey] = 0;
        }
    });

    currentUpgradesState.forEach(upgrade => {
        if (upgrade.isUnlocked && upgrade.currentLevel > 0 && upgrade.effectKey) {
            const valueFromThisUpgrade = upgrade.getValue(upgrade.currentLevel);
            // Pour les % et multiplicateurs, la fonction getValue doit retourner la valeur *totale* de l'effet
            // Pour les bonus additifs, on peut sommer, mais getValue devrait aussi donner la valeur totale pour ce niveau.
            gameStats[upgrade.effectKey] = valueFromThisUpgrade;
        }
    });
    // console.log("GameStats après upgrades:", JSON.parse(JSON.stringify(gameStats)));
}

export function unlockInGameUpgrade(upgradeIdToUnlock) {
    const upgrade = currentUpgradesState.find(u => u.id === upgradeIdToUnlock);
    if (upgrade && !upgrade.isUnlocked) {
        upgrade.isUnlocked = true;
        UI.showNotification(`Amélioration "${upgrade.name}" débloquée en jeu !`, "success");
        return true;
    }
    return false;
}