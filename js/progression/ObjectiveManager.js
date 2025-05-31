// js/objectives.js
import * as Config from '../config.js'; // Assure-toi que Config est bien importé
import * as UI from '../ui/UIManager.js';

let activeObjectivesList = []; // Liste interne des objectifs actifs

// Initialise les objectifs au début d'une partie
export function initializeObjectives(gameStats) {
    activeObjectivesList.length = 0; // Vider la liste existante
    while (activeObjectivesList.length < Config.MAX_ACTIVE_OBJECTIVES) {
        addRandomObjective(gameStats);
    }
    UI.updateObjectiveDisplayUI(activeObjectivesList, gameStats); // Mettre à jour l'affichage initial
}

// Ajoute un nouvel objectif aléatoire à la liste
function addRandomObjective(gameStats) {
    if (activeObjectivesList.length >= Config.MAX_ACTIVE_OBJECTIVES) return;

    // Filtrer pour ne pas reprendre immédiatement un type d'objectif déjà actif
    let availableTemplates = Config.ALL_OBJECTIVES_TEMPLATES.filter(
        tmpl => !activeObjectivesList.some(actObj => actObj.id.startsWith(tmpl.idBase))
    );
    // Si tous les types sont déjà actifs (ou s'il y a moins de types que MAX_ACTIVE_OBJECTIVES), on permet la répétition
    if (availableTemplates.length === 0 && Config.ALL_OBJECTIVES_TEMPLATES.length > 0) {
        availableTemplates = Config.ALL_OBJECTIVES_TEMPLATES;
    }
    if (availableTemplates.length === 0) return; // Pas de templates disponibles

    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    let objectiveSpecificData = {}; // Pour stocker des données spécifiques à l'objectif (comme le point de départ)
    let targetValue;

    // Logique spécifique pour calculer la cible pour les objectifs de type "delta"
    if (template.idBase === 'earn_X_cash') {
        objectiveSpecificData.cashAtStart = gameStats.cashEarnedThisGame || 0;
        // targetFn pour "earn_X_cash" retourne le montant *supplémentaire* à gagner
        targetValue = template.targetFn(gameStats.wave); // Ne dépend pas de la valeur actuelle pour calculer le delta
    } else if (template.idBase === 'survive_X_sec') {
        objectiveSpecificData.timeAtStart = gameStats.survivalTime || 0;
        // targetFn pour "survive_X_sec" retourne le temps *supplémentaire* à survivre
        targetValue = template.targetFn(gameStats.wave); // Ne dépend pas de la valeur actuelle pour calculer le delta
    } else {
        // Pour les autres types d'objectifs, targetFn peut dépendre de la valeur actuelle si nécessaire,
        // ou simplement de la vague. La config actuelle ne passe pas la valeur actuelle pour les autres.
        targetValue = template.targetFn(gameStats.wave, gameStats[template.currentKey] || 0);
    }

    const rewardAmount = template.rewardAmountFn(targetValue, gameStats.wave);

    // Débogage : Afficher les informations sur le nouvel objectif créé
    // console.log(
    //     `NOUVEL OBJECTIF: ${template.idBase} (Vague ${gameStats.wave})`,
    //     `Cible (calculée): ${targetValue.toFixed(0)},`,
    //     `Clé de progression: ${template.currentKey},`,
    //     `Valeur actuelle de la clé: ${(gameStats[template.currentKey] || 0).toFixed(0)},`,
    //     `Data spécifique: ${JSON.stringify(objectiveSpecificData)}`
    // );

    activeObjectivesList.push({
        id: `${template.idBase}_${Date.now()}_${Math.random()}`, // ID unique
        text: template.textFn(targetValue), // Le texte de l'objectif utilise la cible calculée
        target: targetValue,               // La cible à atteindre (peut être un delta)
        currentKey: template.currentKey,     // La clé dans gameStats pour suivre la progression globale
        completed: false,
        reward: template.reward,
        rewardAmount: rewardAmount,
        data: objectiveSpecificData        // Données spécifiques comme le point de départ pour les deltas
    });
}

// Vérifie si des objectifs ont été complétés et en ajoute de nouveaux si nécessaire
export function checkObjectives(gameStats) {
    let anObjectiveWasCompleted = false;

    activeObjectivesList.forEach(obj => {
        if (obj.completed) return; // Ne pas revérifier un objectif déjà complété

        let currentValueForComparison;

        // Calculer la progression actuelle basée sur le type d'objectif
        if (obj.id.startsWith('earn_X_cash') && obj.data && typeof obj.data.cashAtStart === 'number') {
            currentValueForComparison = (gameStats.cashEarnedThisGame || 0) - obj.data.cashAtStart;
        } else if (obj.id.startsWith('survive_X_sec') && obj.data && typeof obj.data.timeAtStart === 'number') {
            currentValueForComparison = (gameStats.survivalTime || 0) - obj.data.timeAtStart;
        } else {
            currentValueForComparison = gameStats[obj.currentKey] || 0; // Pour les objectifs absolus
        }

        // Débogage : Afficher la vérification de chaque objectif
        // console.log(
        //     `Vérif Objectif: ID=${obj.id.substring(0,15)}, Text=${obj.text.substring(0,20)}...`,
        //     `Progression (calculée): ${currentValueForComparison.toFixed(0)},`,
        //     `Cible: ${obj.target.toFixed(0)}`
        // );

        if (currentValueForComparison >= obj.target) {
            obj.completed = true;
            anObjectiveWasCompleted = true;
            let rewardMsg = "";
            switch (obj.reward) {
                case 'cubes':
                    gameStats.cubesLeft += obj.rewardAmount;
                    rewardMsg = `+${obj.rewardAmount} 🧊`;
                    break;
                case 'cash':
                    gameStats.cash += obj.rewardAmount;
                    // On ne rajoute pas à cashEarnedThisGame ici, car c'est une récompense, pas un "gain" direct du gameplay
                    // gameStats.cashEarnedThisGame += obj.rewardAmount;
                    rewardMsg = `+${obj.rewardAmount}💲`;
                    break;
            }
            UI.showNotification(`🎯 Objectif: ${obj.text.substring(0,25)}... COMPLÉTÉ! (${rewardMsg})`, "success");
        }
    });

    if (anObjectiveWasCompleted) {
        // Filtrer les objectifs complétés
        activeObjectivesList = activeObjectivesList.filter(obj => !obj.completed);
        // Ajouter de nouveaux objectifs pour combler les vides
        while (activeObjectivesList.length < Config.MAX_ACTIVE_OBJECTIVES) {
            addRandomObjective(gameStats);
        }
    }

    // Mettre à jour l'affichage des objectifs (même si aucun n'a été complété, pour la progression)
    UI.updateObjectiveDisplayUI(activeObjectivesList, gameStats);
}

// Optionnel: si d'autres modules ont besoin d'accéder à la liste (en lecture seule)
export function getActiveObjectives() {
    return [...activeObjectivesList]; // Retourne une copie pour éviter la modification externe
}

// Optionnel: Fonction pour rescaler les cibles si la difficulté du jeu change drastiquement (ex: nouvelle vague majeure)
// Non utilisé pour l'instant car on réinitialise/ajoute des objectifs basés sur la vague actuelle.
/*
export function rescaleActiveObjectiveTargets(gameStats) {
    activeObjectivesList.forEach(obj => {
        if (!obj.completed) {
            // Retrouver le template original pour recalculer la cible
            const template = Config.ALL_OBJECTIVES_TEMPLATES.find(t => obj.id.startsWith(t.idBase));
            if (template) {
                let newTarget;
                if (obj.id.startsWith('earn_X_cash') || obj.id.startsWith('survive_X_sec')) {
                    // Pour les deltas, la cible initiale (le delta à atteindre) ne change pas avec la vague,
                    // mais on pourrait rendre le *prochain* objectif de ce type plus difficile.
                    // Laisser la cible actuelle telle quelle.
                } else {
                    newTarget = template.targetFn(gameStats.wave, gameStats[obj.currentKey] || 0);
                    obj.target = newTarget;
                    obj.text = template.textFn(newTarget); // Mettre à jour le texte aussi
                }
            }
        }
    });
    UI.updateObjectiveDisplayUI(activeObjectivesList, gameStats);
}
*/