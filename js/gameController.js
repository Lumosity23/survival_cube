import * as Config from './config.js';
import * as UI from './ui.js';
// Les fonctions d'objectifs et de shop seront importées dans main.js et appelées depuis là-bas.

export function handlePowerUpCollection(powerUp, gameStats, baseCore) {
    let message = "";
    switch (powerUp.type) {
        case 'cubes':
            gameStats.cubesLeft += powerUp.amount;
            message = `🧊 +${powerUp.amount} Cubes !`;
            break;
        case 'cash':
            gameStats.cash += powerUp.amount;
            gameStats.cashEarnedThisGame += powerUp.amount;
            message = `💲 +${powerUp.amount} Cash !`;
            break;
        case 'base_heal':
            baseCore.health = Math.min(Config.BASE_MAX_HEALTH, baseCore.health + powerUp.amount);
            UI.updateBaseHealthBarUI(baseCore.health);
            message = `🛠️ Noyau réparé +${powerUp.amount} PV !`;
            break;
    }
    UI.showNotification(message, "success");
}

// Si d'autres logiques de contrôle général du jeu apparaissent, elles peuvent venir ici.
// Par exemple, des fonctions pour gérer des événements spéciaux dans le jeu, etc.