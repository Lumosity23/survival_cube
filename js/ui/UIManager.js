// js/ui/UIManager.js
import { BASE_MAX_HEALTH } from '../config.js';
import * as GameState from '../core/GameState.js';

let uiElementsCache = null;
let notificationContainerCache = null;
let lastWaveStartMessageShown = -1; // Tracker pour le message "VAGUE EN COURS"

export function cacheUiElements(elements) {
    uiElementsCache = elements;
    if (elements.notificationContainer) notificationContainerCache = elements.notificationContainer;
}

export function resetWaveStartMessageTracker() {
    lastWaveStartMessageShown = -1;
}

function shouldShowWaveStartMessage(currentWaveNumber) {
    return currentWaveNumber > lastWaveStartMessageShown;
}

function markWaveStartMessageShown(currentWaveNumber) {
    lastWaveStartMessageShown = currentWaveNumber;
}

export function updateStatsUI(gameStats, gameElements) {
    if (!uiElementsCache) return;
    if (uiElementsCache.cubeCount) uiElementsCache.cubeCount.textContent = gameStats.cubesLeft !== undefined ? gameStats.cubesLeft : 'N/A';
    if (uiElementsCache.score) uiElementsCache.score.textContent = gameStats.score !== undefined ? gameStats.score : 'N/A';
    if (uiElementsCache.cashDisplay) uiElementsCache.cashDisplay.textContent = gameStats.cash !== undefined ? gameStats.cash : 'N/A';
    if (uiElementsCache.survivalTime) uiElementsCache.survivalTime.textContent = gameStats.survivalTime !== undefined ? gameStats.survivalTime : 'N/A';
    if (uiElementsCache.baseHealthDisplay && gameStats.baseCoreHealth !== undefined) {
        const healthPercent = Math.max(0, (gameStats.baseCoreHealth / BASE_MAX_HEALTH) * 100);
        uiElementsCache.baseHealthDisplay.textContent = `${healthPercent.toFixed(0)}%`;
    }
    if (uiElementsCache.cubeProductionRate && gameElements && gameElements.buildings) {
        let totalProduction = 0;
        gameElements.buildings.forEach(building => {
            if (building.type === 'generator' && building.interval > 0) {
                totalProduction += (building.productionRate || 0) / ((building.interval || 1000) / 1000);
            }
        });
        uiElementsCache.cubeProductionRate.textContent = totalProduction.toFixed(1);
    }
}

export function updateBaseHealthBarUI(baseCoreHealth) {
    if (!uiElementsCache || !uiElementsCache.baseHealthBar) { // Si la barre de vie graphique est utilisée
        // Si tu utilises seulement baseHealthDisplay, cette fonction peut être vide ou commenter son contenu
        return;
    }
    // Logique pour la barre de vie graphique si tu la réactives
    // const healthPercent = Math.max(0, (baseCoreHealth / BASE_MAX_HEALTH) * 100);
    // const bar = uiElementsCache.baseHealthBar;
    // bar.style.width = healthPercent + '%';
    // bar.textContent = `INTÉGRITÉ NOYAU: ${healthPercent.toFixed(0)}%`;
    // if (healthPercent > 60) bar.style.backgroundColor = '#00ccaa';
    // else if (healthPercent > 30) bar.style.backgroundColor = '#ffc040';
    // else bar.style.backgroundColor = '#dd4455';
}

export function showNotification(text, type = "info") {
    if (!notificationContainerCache) return;
    const notification = document.createElement('div');
    notification.className = `notification ${type}`; notification.textContent = text;
    notificationContainerCache.appendChild(notification);
    while (notificationContainerCache.children.length > 5) {
        notificationContainerCache.removeChild(notificationContainerCache.firstChild);
    }
    setTimeout(() => { if (notificationContainerCache && notificationContainerCache.contains(notification)) notificationContainerCache.removeChild(notification); }, 4900);
}

export function updateWaveUI(waveNumber, timeRemainingMs, currentGameState) {
    if (!uiElementsCache) return;

    const waveInfoEl = uiElementsCache.waveInfo;
    const waveTimerEl = uiElementsCache.waveTimer; // Le petit timer
    const bigTimerOverlayEl = uiElementsCache.bigWaveTimerOverlay;
    const bigTimerTextEl = uiElementsCache.bigWaveTimerText;
    const bigCountdownEl = uiElementsCache.bigWaveCountdown;
    const waveStatusOverlayEl = uiElementsCache.waveStatusOverlay;
    const waveStatusTextEl = uiElementsCache.waveStatusText;

    if (waveInfoEl) waveInfoEl.textContent = `Vague ${waveNumber}`;

    if (waveTimerEl) {
        waveTimerEl.classList.remove('wave-in-progress-text');
        waveTimerEl.style.display = 'block';
        if (currentGameState === GameState.GameStates.WAVE_PREPARATION) {
            const secondsLeft = Math.max(0, Math.ceil(timeRemainingMs / 1000));
            waveTimerEl.textContent = `Prochaine vague: ${secondsLeft}s`;
            waveTimerEl.style.color = '#00ff88';
        } else if (currentGameState === GameState.GameStates.WAVE_IN_PROGRESS) {
            waveTimerEl.textContent = `Vague ${waveNumber} active`; // Texte plus neutre
            waveTimerEl.style.color = '#ff8080'; // Rouge discret
        } else {
            waveTimerEl.textContent = 'Chargement...';
            waveTimerEl.style.color = '#80a0c0';
        }
    }

    if (bigTimerOverlayEl && bigCountdownEl && bigTimerTextEl) {
        if (currentGameState === GameState.GameStates.WAVE_PREPARATION && timeRemainingMs > 0) {
            bigTimerOverlayEl.style.display = 'flex';
            bigTimerTextEl.textContent = `VAGUE ${waveNumber} EN APPROCHE`;
            bigCountdownEl.textContent = Math.max(0, Math.ceil(timeRemainingMs / 1000));
        } else {
            bigTimerOverlayEl.style.display = 'none';
        }
    }

    if (waveStatusOverlayEl && waveStatusTextEl) {
        if (currentGameState === GameState.GameStates.WAVE_IN_PROGRESS && shouldShowWaveStartMessage(waveNumber)) {
            // console.log(`[UIManager] Affichage du message VAGUE ${waveNumber} EN COURS !`);
            waveStatusTextEl.textContent = `VAGUE ${waveNumber} EN COURS !`;
            waveStatusOverlayEl.style.animation = 'none'; // Reset animation
            waveStatusOverlayEl.offsetHeight; // Force reflow
            waveStatusOverlayEl.style.animation = 'fadeInThenOutWaveStatus 3.5s ease-out forwards'; // Appliquer animation (3s visible + 0.5 fadein + 0.5 fadeout)
            waveStatusOverlayEl.style.display = 'flex';
            markWaveStartMessageShown(waveNumber);
        } else if (currentGameState !== GameState.GameStates.WAVE_IN_PROGRESS) {
             // Si l'animation ne le cache pas, on le force ici. Mais 'forwards' devrait suffire.
            // if (waveStatusOverlayEl.style.display === 'flex') waveStatusOverlayEl.style.display = 'none';
        }
    }
}

// Fonctions pour gérer l'affichage unique du message de début de vague
// Ces variables pourraient être dans un scope plus global si UIManager est une classe, ou ici.

export function setOverlayDisplay(overlayElement, displayStatus) {
    if (overlayElement) overlayElement.style.display = displayStatus ? 'flex' : 'none';
}
export function setElementDisplay(element, displayStatus) {
     if (element) element.style.display = displayStatus ? (element.id === 'gameControls' ? 'flex' : 'block') : 'none';
}

// Les fonctions pour Shop, Upgrades, Powers, Objectives, HighScores ne sont pas incluses dans cette version minimale.