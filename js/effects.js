// js/effects.js

// On a besoin d'une référence à l'élément DOM de la bordure.
// On pourrait le passer à chaque fois, ou l'initialiser une fois.
let borderEffectElement = null;
let borderEffectTimeout = null;

export function initializeEffects(uiElementsFromMain) { // Renommer l'argument pour clarté
    if (uiElementsFromMain && uiElementsFromMain.gameScreenBorderEffect) {
        borderEffectElement = uiElementsFromMain.gameScreenBorderEffect;
        // console.log("[Effects] Effet de bordure initialisé avec:", borderEffectElement);
    } else {
        console.error("[Effects] L'élément gameScreenBorderEffect n'a pas été fourni ou trouvé lors de l'initialisation.");
    }
}

export function setScreenBorder(effectType) { // 'none', 'wave_starting', 'boss_active', 'player_damage'
    if (!borderEffectElement) return;

    // Enlever toutes les classes d'effet précédentes
    borderEffectElement.classList.remove('wave-starting', 'boss-active', 'player-damage');
    borderEffectElement.style.display = 'none'; // Cacher par défaut

    if (borderEffectTimeout) {
        clearTimeout(borderEffectTimeout);
        borderEffectTimeout = null;
    }

    switch (effectType) {
        case 'wave_starting':
            borderEffectElement.classList.add('wave-starting');
            borderEffectElement.style.display = 'block';
            break;
        case 'boss_active':
            borderEffectElement.classList.add('boss-active');
            borderEffectElement.style.display = 'block';
            break;
        case 'player_damage':
            borderEffectElement.classList.add('player-damage');
            borderEffectElement.style.display = 'block';
            // L'animation CSS flashRedDamage le fera disparaître, mais on s'assure
            // qu'il est bien caché après un délai au cas où l'animation ne se terminerait pas sur display:none
            borderEffectTimeout = setTimeout(() => {
                // Vérifier si l'effet est toujours 'player_damage' avant de le cacher,
                // pour ne pas interférer si un autre effet a été appliqué entre-temps.
                if (borderEffectElement && borderEffectElement.classList.contains('player-damage')) {
                    borderEffectElement.style.display = 'none';
                    borderEffectElement.classList.remove('player-damage'); // Nettoyer la classe
                }
            }, 500); // Correspond à la durée de l'animation flashRedDamage dans le CSS
            break;
        case 'none':
        default:
            // Déjà caché par défaut ou par le nettoyage des classes ci-dessus
            break;
    }
}

export function triggerScreenBorderEffect(effectType) {
    if (!borderEffectElement) return;

    // Si l'effet demandé est déjà actif (sauf pour les flashs qui peuvent se répéter)
    // et que ce n'est pas un flash, on ne fait rien pour éviter de relancer l'animation.
    // if (borderEffectElement.classList.contains(effectType) && effectType !== 'player_damage' && effectType !== 'wave_start_flash') {
    //     if (borderEffectElement.style.display === 'block') return; // Déjà affiché et c'est un effet persistant
    // }

    // Nettoyer les classes persistantes (boss_active) si on applique un flash
    if (effectType === 'player_damage' || effectType === 'wave_start_flash') {
        borderEffectElement.classList.remove('boss-active'); // Un flash a priorité sur un effet boss persistant
    } else { // Pour les effets persistants, enlever les autres effets persistants
        borderEffectElement.classList.remove('wave-starting', 'boss-active');
    }
    // Les flashs se retirent eux-mêmes via animation/timeout.

    borderEffectElement.style.display = 'none'; // Cacher pour forcer le reflow si on réapplique la même classe de flash

    if (borderEffectTimeout) {
        clearTimeout(borderEffectTimeout);
        borderEffectTimeout = null;
    }

    switch (effectType) {
        case 'wave_start_flash':
            borderEffectElement.classList.add('wave-start-flash');
            borderEffectElement.style.display = 'block'; // Doit être 'block' pour que l'animation CSS joue
            // Le CSS avec 'animation-fill-mode: forwards' devrait cacher l'élément à la fin.
            // Le timeout JS est une sécurité supplémentaire.
            borderEffectTimeout = setTimeout(() => {
                if (borderEffectElement && borderEffectElement.classList.contains('wave-start-flash')) {
                    borderEffectElement.style.display = 'none';
                    borderEffectElement.classList.remove('wave-start-flash');
                }
            }, 600); // Durée de l'animation CSS flashRedBorderEffect
            break;
        case 'boss_active':
            borderEffectElement.classList.remove('wave-start-flash', 'player-damage'); // S'assurer que les flashs sont partis
            borderEffectElement.classList.add('boss-active');
            borderEffectElement.style.display = 'block';
            break;
        case 'player_damage':
            borderEffectElement.classList.remove('boss-active'); // Priorité au flash de dégât
            borderEffectElement.classList.add('player-damage');
            borderEffectElement.style.display = 'block';
            borderEffectTimeout = setTimeout(() => {
                if (borderEffectElement && borderEffectElement.classList.contains('player-damage')) {
                    borderEffectElement.style.display = 'none';
                    borderEffectElement.classList.remove('player-damage');
                }
            }, 500); // Durée de l'animation CSS flashRedDamage
            break;
        case 'none':
        default:
            borderEffectElement.className = 'screen-border-base-class'; // Réinitialiser à une classe de base ou vide
            borderEffectElement.style.display = 'none';
            break;
    }
}

export function clearScreenBorderEffect(effectClassToRemove) {
    // ... (comme avant)
    if (!borderEffectElement) return;
    if (effectClassToRemove) {
        borderEffectElement.classList.remove(effectClassToRemove);
    }
    // Cacher si plus aucune classe d'effet spécifique (persistant) n'est active
    const persistentEffects = ['boss-active']; // Ajouter d'autres effets persistants ici
    let isAnyPersistentEffectActive = false;
    for (const effect of persistentEffects) {
        if (borderEffectElement.classList.contains(effect)) {
            isAnyPersistentEffectActive = true;
            break;
        }
    }
    if (!isAnyPersistentEffectActive) {
        borderEffectElement.style.display = 'none';
    }
}
// Tu pourrais ajouter d'autres fonctions ici pour d'autres types d'effets visuels globaux plus tard
// par exemple, un screenshake, des changements de filtre de couleur, etc.