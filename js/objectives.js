import * as Config from './config.js';
import * as UI from './ui.js';

let activeObjectivesList = []; // Internal state for this module

export function initializeObjectives(gameStats) {
    activeObjectivesList.length = 0; // Clear the array
    while(activeObjectivesList.length < Config.MAX_ACTIVE_OBJECTIVES) {
        addRandomObjective(gameStats);
    }
    UI.updateObjectiveDisplayUI(activeObjectivesList, gameStats); // Initial display
}

function addRandomObjective(gameStats) {
    if (activeObjectivesList.length >= Config.MAX_ACTIVE_OBJECTIVES) return;

    let availableTemplates = Config.ALL_OBJECTIVES_TEMPLATES.filter(
        tmpl => !activeObjectivesList.some(actObj => actObj.id.startsWith(tmpl.idBase))
    );
    if (availableTemplates.length === 0) availableTemplates = Config.ALL_OBJECTIVES_TEMPLATES;

    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    const targetValue = template.targetFn(gameStats.wave);
    const currentValueForObjective = gameStats[template.currentKey] || 0; // Valeur actuelle au moment de la création
    console.log(`NOUVEL OBJECTIF: ${template.idBase} (Vague ${gameStats.wave}) - Cible: ${targetValue.toFixed(0)}, Valeur Actuelle: ${currentValueForObjective.toFixed(0)}, Scalaire: ${Config.objectiveDifficultyScalar(gameStats.wave).toFixed(1)}`);
    const rewardAmount = template.rewardAmountFn(targetValue, gameStats.wave);

    activeObjectivesList.push({
        id: `${template.idBase}_${Date.now()}_${Math.random()}`,
        text: template.textFn(targetValue),
        target: targetValue,
        currentKey: template.currentKey, // Key to access value in gameStats
        completed: false,
        reward: template.reward,
        rewardAmount: rewardAmount
    });
}

export function checkObjectives(gameStats) { // baseCore and gameElements no longer needed here
    let anObjectiveCompleted = false;
    activeObjectivesList.forEach(obj => {
        if (!obj.completed && (gameStats[obj.currentKey] || 0) >= obj.target) {
            obj.completed = true;
            anObjectiveCompleted = true;
            let rewardMsg = "";
            switch (obj.reward) {
                case 'cubes':
                    gameStats.cubesLeft += obj.rewardAmount;
                    rewardMsg = `+${obj.rewardAmount} 🧊`;
                    break;
                case 'cash':
                    gameStats.cash += obj.rewardAmount;
                    gameStats.cashEarnedThisGame += obj.rewardAmount;
                    rewardMsg = `+${obj.rewardAmount}💲`;
                    break;
            }
            UI.showNotification(`🎯 Objectif: ${obj.text.substring(0,25)}... (${rewardMsg})`, "success");
        }
    });

    if(anObjectiveCompleted){
        activeObjectivesList = activeObjectivesList.filter(obj => !obj.completed);
        while(activeObjectivesList.length < Config.MAX_ACTIVE_OBJECTIVES){
            addRandomObjective(gameStats);
        }
    }
    UI.updateObjectiveDisplayUI(activeObjectivesList, gameStats);
}

export function getActiveObjectives() { // If main needs read-only access for some reason
    return [...activeObjectivesList];
}