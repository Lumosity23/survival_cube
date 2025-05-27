// js/shop.js
import * as Config from './config.js';
import * as UI from './ui.js';
import { createBuilding } from './gameObjects.js';
import { unlockInGameUpgrade } from './inGameUpgrades.js'; // Pour les items de déblocage
import { unlockPower } from './powers.js';

let currentShopItemsState = [];

export function resetShop() {
    currentShopItemsState = Config.SHOP_ITEMS_CONFIG.map(configItem => ({
        ...configItem,
        currentLevel: 0, // Pour les items qui ont des niveaux, comme les générateurs
                          // Pour les achats uniques (unlock, consumable), currentLevel = 1 signifie acheté.
    }));
}

export function getShopItems() {
    return [...currentShopItemsState];
}

function calculateShopItemCost(itemState) {
    const factor = Math.max(1, itemState.costFactor || 1);
    return Math.floor(itemState.costBase * Math.pow(factor, itemState.currentLevel || 0));
}

export function handleBuyShopItem(itemId, gameStats, baseCore, currentBuildingToPlaceRef) {
    const itemState = currentShopItemsState.find(i => i.id === itemId);
    if (!itemState) return false;

    const isMaxedOrPurchased = itemState.currentLevel >= itemState.maxLevel;
    if (isMaxedOrPurchased) {
        UI.showNotification("Déjà acheté ou niveau maximum atteint.", "warning");
        return false;
    }

    const currentCost = calculateShopItemCost(itemState);
    if (gameStats.cash < currentCost) {
        UI.showNotification("Pas assez de cash !", "warning");
        return false;
    }
    else if (itemState.type === 'power_unlock') {
        if (itemState.powerId) {
            // Importer unlockPower depuis powers.js
            // import { unlockPower } from './powers.js'; // En haut du fichier
            unlockPower(itemState.powerId, itemState.initialUses || 1);
        }
        // L'item du shop est "consommé" ou marqué comme acheté pour ce déblocage
        // itemState.currentLevel = itemState.maxLevel; // Si c'est un achat unique
    }

    gameStats.cash -= currentCost;
    itemState.currentLevel++; // Marque comme acheté ou passe au niveau suivant

    if (itemState.type === 'building') {
        const originalConfig = Config.SHOP_ITEMS_CONFIG.find(c => c.id === itemId);
        let buildingDataForPlacement = {...originalConfig.buildingData};
        if (itemState.id === 'cubeGenerator') {
            buildingDataForPlacement.productionRate = 1 + (itemState.currentLevel -1); // -1 car level vient d'être incrémenté
        }
        currentBuildingToPlaceRef.building = createBuilding(buildingDataForPlacement);
        currentBuildingToPlaceRef.itemConfig = originalConfig;
        UI.showNotification(`Choisissez où placer: ${itemState.name} (Niv ${itemState.currentLevel})`, "info");
    } else if (itemState.type === 'unlock') {
        if (itemState.unlocksUpgrade) {
            unlockInGameUpgrade(itemState.unlocksUpgrade); // Appelle la fonction du module inGameUpgrades
        }
        UI.showNotification(`${itemState.name} acheté ! L'amélioration est maintenant disponible en jeu.`, "success");
    } else if (itemState.type === 'consumable' || itemState.effectKey === 'repairBase') { // Cas spécifique pour la réparation
        baseCore.health = Math.min(Config.BASE_MAX_HEALTH, baseCore.health + itemState.effectValue);
        UI.updateBaseHealthBarUI(baseCore.health);
        UI.showNotification(itemState.desc || `${itemState.name} utilisé !`, "success");
    } else {
        // Pour d'autres effets passifs du shop principal (si tu en ajoutes)
        UI.showNotification(itemState.notification || `${itemState.name} acheté !`, "success");
    }
    return true;
}