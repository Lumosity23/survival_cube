// js/ui.js
import { BASE_MAX_HEALTH } from './config.js';

let uiElementsCache = null;
let notificationContainerCache = null;

export function cacheUiElements(elements) {
    uiElementsCache = elements;
    notificationContainerCache = elements.notificationContainer; // Assurez-vous que 'notificationContainer' est dans l'objet elements
}

export function updateStatsUI(gameStats, gameElements) {
    if (!uiElementsCache) return;
    uiElementsCache.cubeCount.textContent = gameStats.cubesLeft;
    uiElementsCache.score.textContent = gameStats.score;
    uiElementsCache.wave.textContent = gameStats.wave;
    uiElementsCache.cashDisplay.textContent = gameStats.cash;
    uiElementsCache.survivalTime.textContent = gameStats.survivalTime;
    if (uiElementsCache.cubeProductionRate) {
        let totalProduction = 0;
        gameElements.buildings.forEach(building => {
            if (building.type === 'generator' && building.interval > 0) {
                totalProduction += building.productionRate / (building.interval / 1000); // Cubes par seconde
            }
        });
        uiElementsCache.cubeProductionRate.textContent = totalProduction.toFixed(1);
    }
}

export function updateBaseHealthBarUI(baseCoreHealth) {
    if (!uiElementsCache || !uiElementsCache.baseHealthBar) return;
    const healthPercent = Math.max(0, (baseCoreHealth / BASE_MAX_HEALTH) * 100);
    const bar = uiElementsCache.baseHealthBar;
    bar.style.width = healthPercent + '%';
    bar.textContent = `Noyau: ${healthPercent.toFixed(0)}%`;
    bar.style.backgroundColor = healthPercent > 60 ? '#4CAF50' : healthPercent > 30 ? '#FFC107' : '#F44336';
}

export function showNotification(text, type = "info") {
    if (!notificationContainerCache) {
        // console.warn("notificationContainerCache non défini dans ui.js");
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;
    notificationContainerCache.appendChild(notification);
    while (notificationContainerCache.children.length > 5) {
        notificationContainerCache.removeChild(notificationContainerCache.firstChild);
    }
    setTimeout(() => {
        if (notificationContainerCache && notificationContainerCache.contains(notification)) {
            notificationContainerCache.removeChild(notification);
        }
    }, 4900);
}

export function updateObjectiveDisplayUI(activeObjectives, gameStats) {
    if (!uiElementsCache || !uiElementsCache.objectiveList) return;
    uiElementsCache.objectiveList.innerHTML = '';
    activeObjectives.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'objective' + (obj.completed ? ' completed' : '');
        const currentValue = gameStats[obj.currentKey] || 0;
        const progress = Math.min(currentValue, obj.target);
        div.innerHTML = `<div>${obj.text}</div><div style="font-size: 10px; color: #a0a0a0;">${progress.toFixed(0)}/${obj.target.toFixed(0)}</div>`;
        uiElementsCache.objectiveList.appendChild(div);
    });
}

export function displayHighScoresUI(highScores) {
    if (!uiElementsCache || !uiElementsCache.highScoresList) { // Changer highScoresBody en highScoresList
        // console.warn("Conteneur highScoresList non trouvé dans uiElementsCache.");
        return;
    }
    const listContainer = uiElementsCache.highScoresList; // Utiliser le nouveau conteneur
    listContainer.innerHTML = ''; // Vider la liste

    if (highScores.length === 0) {
        const noScoreMessage = document.createElement('div');
        noScoreMessage.textContent = 'Aucun score enregistré. Soyez le premier Opérateur !';
        noScoreMessage.style.textAlign = 'center';
        noScoreMessage.style.color = '#80a0ff';
        noScoreMessage.style.padding = '20px';
        listContainer.appendChild(noScoreMessage);
        return;
    }

    highScores.forEach((s, index) => {
        const scoreEntryDiv = document.createElement('div');
        scoreEntryDiv.className = 'score-entry';

        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank';
        rankSpan.textContent = `${index + 1}.`;

        const playerScoreSpan = document.createElement('span');
        playerScoreSpan.className = 'player-score';
        playerScoreSpan.textContent = `${s.score.toLocaleString()} PTS`; // Formatage des points

        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'details';
        detailsSpan.textContent = `Vague ${s.wave} - ${s.time}s`;

        scoreEntryDiv.appendChild(rankSpan);
        scoreEntryDiv.appendChild(playerScoreSpan);
        scoreEntryDiv.appendChild(detailsSpan);

        listContainer.appendChild(scoreEntryDiv);
    });
}

// Helper function à placer dans ui.js (ou shop.js/inGameUpgrades.js si plus spécifique)
function calculateDisplayCost(itemState) {
    // S'assure que costFactor est au moins 1 pour éviter des coûts décroissants si mal configuré
    const factor = Math.max(1, itemState.costFactor || 1);
    return Math.floor(itemState.costBase * Math.pow(factor, itemState.currentLevel || 0));
}


export function renderShopItemsUI(shopItemsState, gameCash, shopItemsContainer, buyCallback) {
    if (!uiElementsCache || !shopItemsContainer) return;
    shopItemsContainer.innerHTML = '';

    shopItemsState.forEach(itemState => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';

        const currentCost = calculateDisplayCost(itemState); // Utiliser le helper
        const isMaxLevel = itemState.currentLevel >= itemState.maxLevel;
        // Pour les items "unlock", une fois achetés (level 1), ils sont "maxed" pour cet affichage
        const isEffectivelyMaxed = itemState.type === 'unlock' && itemState.currentLevel > 0 ? true : isMaxLevel;


        let btnText = isEffectivelyMaxed ? "Max Atteint" : `Acheter (${currentCost}💲)`;
        if (itemState.type === 'unlock' && itemState.currentLevel > 0) btnText = "Débloqué";

        let btnDisabled = gameCash < currentCost || isEffectivelyMaxed;
        if (itemState.type === 'consumable' && itemState.currentLevel >= itemState.maxLevel) {
             // Pour les consommables, si maxLevel = 1 et currentLevel = 1, c'est acheté.
             // On pourrait ajouter une logique pour les réactiver après un certain temps/vague.
             // Pour l'instant, un consommable de maxLevel 1 est juste "Acheté".
             btnText = "Acheté";
             btnDisabled = true;
        }


        const description = typeof itemState.getDescription === 'function' ?
                            itemState.getDescription(itemState.currentLevel) :
                            itemState.desc;
        const itemName = `${itemState.name}${itemState.maxLevel > 1 && itemState.type !== 'unlock' ? ` (Niv ${itemState.currentLevel}/${itemState.maxLevel})` : ''}`;


        itemDiv.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${itemName}</div>
                <div class="shop-item-desc">${description}</div>
            </div>
            <button class="btn shop-buy-btn" data-itemid="${itemState.id}" ${btnDisabled ? 'disabled' : ''}>${btnText}</button>`;
        shopItemsContainer.appendChild(itemDiv);
    });
    shopItemsContainer.querySelectorAll('.shop-buy-btn').forEach(button => {
        button.addEventListener('click', (e) => buyCallback(e.currentTarget.dataset.itemid));
    });
}

export function updateShopCashUI(cash) {
    if (uiElementsCache && uiElementsCache.shopCashDisplay) {
        uiElementsCache.shopCashDisplay.textContent = cash;
    }
}

export function renderInGameUpgradesUI(upgradesState, gameCash, upgradesListContainer, purchaseCallback) {
    if (!uiElementsCache || !upgradesListContainer) {
        // console.warn("Impossible de rendre les améliorations en jeu: conteneur ou cache UI manquant.");
        return;
    }
    upgradesListContainer.innerHTML = '';

    upgradesState.forEach(upgrade => {
        if (!upgrade.isUnlocked) return; // Ne pas afficher les améliorations non débloquées

        const itemDiv = document.createElement('div');
        itemDiv.className = 'upgrade-item';
        const currentCost = calculateDisplayCost(upgrade);
        const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;

        if (isMaxed) {
            itemDiv.classList.add('maxed');
        }

        const currentValue = upgrade.getValue(upgrade.currentLevel);
        const nextValue = upgrade.currentLevel < upgrade.maxLevel ? upgrade.getValue(upgrade.currentLevel + 1) : currentValue;
        const desc = upgrade.descTemplate
            .replace('{value}', currentValue.toFixed(0)) // Afficher sans décimales pour les pourcentages
            .replace('{nextValue}', nextValue.toFixed(0));

        itemDiv.innerHTML = `
            <div class="upgrade-item-name">${upgrade.name} <span class="upgrade-item-level">(Niv ${upgrade.currentLevel}/${upgrade.maxLevel})</span></div>
            <div class="upgrade-item-desc">${desc}</div>
            ${!isMaxed ? `<div class="upgrade-item-cost">Coût: ${currentCost}💲</div>` : '<div class="upgrade-item-cost">Max Atteint</div>'}
        `;

        if (!isMaxed) {
            itemDiv.addEventListener('click', () => {
                // La vérification du cash se fait maintenant dans tryPurchaseUpgrade
                purchaseCallback(upgrade.id);
            });
        }
        upgradesListContainer.appendChild(itemDiv);
    });
}


export function setOverlayDisplay(overlayElement, displayStatus) {
    if (overlayElement) {
        overlayElement.style.display = displayStatus ? 'flex' : 'none';
    } else {
        // console.warn("Tentative de modifier l'affichage d'un overlayElement indéfini");
    }
}

export function setElementDisplay(element, displayStatus) {
     if (element) {
        element.style.display = displayStatus ? (element.id === 'gameControls' || element.id === 'inGameUpgrades' ? 'flex' : 'block') : 'none';
        if (element.id === 'inGameUpgrades' && displayStatus) { // S'assurer que le conteneur parent est aussi flex si besoin
             element.style.flexDirection = 'column'; // Pour que les items s'empilent bien
        }
    } else {
        // console.warn("Tentative de modifier l'affichage d'un element indéfini");
    }
}

export function renderPowersUI(powersState, powersListContainer, activateCallback, now) {
    if (!uiElementsCache || !powersListContainer) return;
    powersListContainer.innerHTML = '';

    powersState.forEach(power => {
        if (!power.isUnlocked) return;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'upgrade-item power-item'; // Utiliser une classe similaire ou nouvelle

        const cooldownTimeLeft = power.lastUsedTime > 0 ? Math.max(0, power.cooldown - (now - power.lastUsedTime)) : 0;
        const onCooldown = cooldownTimeLeft > 0;
        const canUse = power.usesLeft > 0 && !onCooldown;

        if (onCooldown || power.usesLeft === 0) {
            itemDiv.classList.add('maxed'); // Ou une classe 'on-cooldown'
        }
        if (power.isActive) {
             itemDiv.classList.add('active'); // Pour un style différent si actif
        }


        itemDiv.innerHTML = `
            <div class="upgrade-item-name">${power.icon} ${power.name} ${power.usesLeft > 0 ? `(${power.usesLeft}x)` : ''}</div>
            <div class="upgrade-item-desc">${power.description}</div>
            ${onCooldown ? `<div class="upgrade-item-cost">Cooldown: ${Math.ceil(cooldownTimeLeft/1000)}s</div>`
                         : (power.usesLeft > 0 ? `<div class="upgrade-item-cost">Prêt !</div>` : `<div class="upgrade-item-cost">Plus de charges</div>`)}
            ${power.isActive ? `<div class="upgrade-item-cost">Actif: ${Math.ceil((power.activeUntil - now)/1000)}s</div>` : ''}
        `;

        if (canUse) {
            itemDiv.addEventListener('click', () => activateCallback(power.id));
        }
        powersListContainer.appendChild(itemDiv);
    });
}