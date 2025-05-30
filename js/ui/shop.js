// js/shop.js
import * as Config from './config.js';
import * as UI from './ui.js';
import { createBuilding } from './gameObjects.js';
import * as InGameUpgrades from './inGameUpgrades.js';
import { unlockOrAddChargePower } from './powers.js';

let currentShopItemsState = [];

export function resetShop() {
    currentShopItemsState = Config.SHOP_ITEMS_CONFIG.map(configItem => ({
        ...configItem,
        currentLevel: 0,
    }));
}

export function getShopItems() {
    return [...currentShopItemsState];
}

function calculateShopItemCost(itemState) {
    const factor = Math.max(1, itemState.costFactor || 1);
    return Math.floor(itemState.costBase * Math.pow(factor, itemState.currentLevel || 0));
}

// MODIFICATION : closeShopCallback est de nouveau un argument
export function handleBuyShopItem(itemId, gameStats, baseCore, currentBuildingToPlaceRef, closeShopCallback) {
    const itemState = currentShopItemsState.find(i => i.id === itemId);
    if (!itemState) return { success: false };

    const isMaxedOrUniquePurchased = itemState.currentLevel >= itemState.maxLevel && itemState.maxLevel === 1 && itemState.type !== 'consumable';
    if (isMaxedOrUniquePurchased) {
        UI.showNotification("Déjà acheté (achat unique).", "warning");
        return { success: false };
    }
    if (itemState.maxLevel > 1 && itemState.currentLevel >= itemState.maxLevel) {
        UI.showNotification("Niveau maximum atteint pour cet item du shop.", "warning");
        return { success: false };
    }

    const currentCost = calculateShopItemCost(itemState);
    if (gameStats.cash < currentCost) {
        UI.showNotification("Pas assez de cash !", "warning");
        return { success: false };
    }

    gameStats.cash -= currentCost;
    if (itemState.type !== 'consumable') {
        itemState.currentLevel++;
    }

    let shouldCloseShopAfterPurchase = false; // Flag pour contrôler la fermeture

    if (itemState.type === 'building') {
        const originalConfig = Config.SHOP_ITEMS_CONFIG.find(c => c.id === itemId);
        let buildingDataForPlacement = {...originalConfig.buildingData};
        if (itemState.id === 'cubeGenerator') buildingDataForPlacement.productionRate = 1 + (itemState.currentLevel -1);
        if (itemState.id === 'bank') buildingDataForPlacement.cashPerInterval = (originalConfig.buildingData.cashPerInterval || 10) + (itemState.currentLevel -1) * 5;
        if (itemState.id === 'turret') {
            // buildingDataForPlacement.damage = (originalConfig.buildingData.damage || Config.TURRET_BASE_DAMAGE) + (itemState.currentLevel -1) * 5; // Exemple d'évolution par niveau du shop
        }

        currentBuildingToPlaceRef.building = createBuilding(buildingDataForPlacement);
        currentBuildingToPlaceRef.itemConfig = originalConfig;
        UI.showNotification(`MODE PLACEMENT: ${itemState.name} (Niv ${itemState.currentLevel}). Cliquez sur la carte pour placer.`, "info");
        shouldCloseShopAfterPurchase = true; // <<<<<<<<<<<<<<<<<<< MARQUER POUR FERMER LE SHOP
    } else if (itemState.type === 'unlock') {
        if (itemState.unlocksUpgrade) {
            InGameUpgrades.unlockInGameUpgrade(itemState.unlocksUpgrade);
        }
        UI.showNotification(`${itemState.name} acheté ! L'amélioration est maintenant disponible en jeu.`, "success");
    } else if (itemState.type === 'power_unlock') {
        if (itemState.powerId) {
            unlockOrAddChargePower(itemState.powerId, itemState.initialUses || 1);
        }
    } else if (itemState.type === 'consumable' || itemState.effectKey === 'repairBase') {
        baseCore.health = Math.min(Config.BASE_MAX_HEALTH, baseCore.health + itemState.effectValue);
        UI.updateBaseHealthBarUI(baseCore.health);
        UI.showNotification(itemState.desc || `${itemState.name} utilisé !`, "success");
    } else {
        UI.showNotification(itemState.notification || `${itemState.name} acheté !`, "success");
    }

    if (shouldCloseShopAfterPurchase && typeof closeShopCallback === 'function') {
        closeShopCallback(); // <<<<<<<<<<<<<<<<<<< APPELER LE CALLBACK POUR FERMER LE SHOP
    }
    return { success: true };
}