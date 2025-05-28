// js/config.js

// Game Mechanics & Balancing
export const GRID_SIZE = 40;
export const BASE_MAX_HEALTH = 250;
export const INITIAL_CUBES = 25;
export const INITIAL_CASH = 150;
export const CAMERA_SPEED = 5;
export const OBSTACLE_SPAWN_RATE_BASE = 2800; // Ralentir encore un peu plus le début
export const OBSTACLE_SPAWN_RATE_DIFFICULTY_FACTOR = 65; // Moins d'impact par niveau de difficulté
export const OBSTACLE_SPAWN_MIN_RATE = 200;
export const POWERUP_SPAWN_CHANCE_BASE = 0.001;
export const POWERUP_SPAWN_CHANCE_TIME_FACTOR = 0.000005;
export const POWERUP_DESPAWN_TIME = 15000;
export const WAVE_DURATION = 45; // Vagues un peu plus longues pour donner le temps
export const CUBE_BASE_HP = 20;

// Colors & Styles
export const COLOR_GRID = '#3a3a3a';
export const COLOR_BASE_HEALTHY = '#40E0D0';
export const COLOR_BASE_DAMAGED = '#FFD700';
export const COLOR_BASE_CRITICAL = '#FF6347';
export const COLOR_CUBE_STANDARD = '#d0d0d0';
export const COLOR_CUBE_REINFORCED = '#A9A9A9';
export const COLOR_OBSTACLE_DEFAULT = 'rgb(80,30,30)';
export const COLOR_OBSTACLE_GIANT = 'rgb(150,40,40)';
export const COLOR_OBSTACLE_FAST = 'rgb(80,60,100)';

// Objectives
export const MAX_ACTIVE_OBJECTIVES = 3;
export const objectiveDifficultyScalar = (wave) => wave * 0.8 + Math.pow(Math.max(0, wave - 1), 1.2); // Courbe encore plus douce au début

export const ALL_OBJECTIVES_TEMPLATES = [
    {
        idBase: 'survive_X_sec',
        textFn: (val) => `Survivre ${val}s de plus`, // Texte pour un delta
        // targetFn retourne maintenant le *temps supplémentaire* à survivre
        targetFn: (wave, currentTotalSurvivalTimeIgnored) => Math.floor(WAVE_DURATION * (1.2 + wave * 0.15) + objectiveDifficultyScalar(wave) * 4),
        currentKey: 'survivalTime', // Toujours utilisé pour le temps total, mais la progression est calculée différemment
        reward: 'cash',
        rewardAmountFn: (val, wave) => Math.floor(val * 0.15 + wave * 6)
    },
    {
        idBase: 'destroy_X_obstacles', textFn: (val) => `Détruire ${val} ennemis`,
        targetFn: (wave) => Math.floor(8 + (wave * 3) + objectiveDifficultyScalar(wave) * 4),
        currentKey: 'obstaclesDestroyed', reward: 'cubes',
        rewardAmountFn: (val, wave) => Math.floor(val/2.5 + wave + 1)
    },
    {
        idBase: 'earn_X_cash', textFn: (val) => `Gagner ${val}💲`,
        targetFn: (wave) => Math.floor(80 + (wave * 30) + objectiveDifficultyScalar(wave) * 40),
        currentKey: 'cashEarnedThisGame', reward: 'cubes',
        rewardAmountFn: (val, wave) => Math.floor(val/25 + wave * 1.5 + 1)
    },
    {
        idBase: 'reach_wave_X', textFn: (val) => `Atteindre Vague ${val}`,
        targetFn: (wave) => wave + 1 + Math.floor(wave/4), // Atteindre la vague suivante ou +2 pour les plus hautes
        currentKey: 'wave', reward: 'cash',
        rewardAmountFn: (val, wave) => val * 12 + wave * 7
    },
];

// TURRET STATS
export const TURRET_BASE_DAMAGE = 50;
export const TURRET_BASE_FIRE_RATE = 250; // ms
export const TURRET_BASE_RANGE_FACTOR = 5;

// BASE CORE TURRET STATS
export const BASE_CORE_TURRET_INITIAL_DAMAGE = 15;
export const BASE_CORE_TURRET_INITIAL_RANGE_FACTOR = 10; // Facteur pour GRID_SIZE
export const BASE_CORE_TURRET_INITIAL_FIRE_RATE = 500; // ms

// Shop Items
export const SHOP_ITEMS_CONFIG = [
    {
        id: 'cubeGenerator', name: 'Générateur de Cubes', desc: 'Placez-le pour +X cube/Ys.',
        costBase: 200, costFactor: 1.8, level: 0,
        type: 'building',
        buildingData: { type: 'generator', productionRate: 1, interval: 10000, icon: '⚙️', color: '#ADD8E6', hp: 50, maxHp: 50 },
        getDescription: (level) => `Placez un Générateur (Niv ${level+1}). ${1 + level} cube(s)/10s.`
    },
    {
        id: 'turret', name: 'Tourelle de Défense', desc: 'Tire automatiquement sur les ennemis à portée.',
        costBase: 150, costFactor: 1.7, level: 0,
        type: 'building',
        buildingData: {
            type: 'turret',
            range: GRID_SIZE * TURRET_BASE_RANGE_FACTOR, // Utilise la constante
            damage: TURRET_BASE_DAMAGE,                 // Utilise la constante
            fireRate: TURRET_BASE_FIRE_RATE,           // Utilise la constante
            icon: '🎯', color: '#FF8C00', hp: 75, maxHp: 75, lastShotTime: 0
        },
        getDescription: (level) => `Placez une Tourelle (Niv ${level+1}). Dégâts: ${TURRET_BASE_DAMAGE + level * (IN_GAME_UPGRADES_CONFIG.find(u => u.id === 'turretDamage')?.valuePerLevel || 15)}, Portée: ${(GRID_SIZE * TURRET_BASE_RANGE_FACTOR).toFixed(0)}` // Description initiale
    },
    { // NOUVEL ITEM : BANQUE
        id: 'bank', name: 'Banque de Ressources', desc: 'Génère du Cash passivement.',
        costBase: 400, costFactor: 2.0, level: 0,
        type: 'building',
        buildingData: {
            type: 'bank',
            cashPerInterval: 10,
            interval: 1000, // 1 secondes
            icon: '🏦', color: '#228B22', hp: 100, maxHp: 100, lastGenTime: 0
        },
        getDescription: (level) => `Placez une Banque (Niv ${level+1}). ${10 + level*5}💲 / 20s.`
    },
    {
        id: 'repairBaseShop', name: 'Kit de Réparation Noyau', desc: 'Soigne le noyau de 75 PV.',
        costBase: 100, costFactor: 1.2, level: 0, maxLevel: 99, // Coût augmente à chaque achat
        effectKey: 'repairBase', effectValue: 75,
        type: 'consumable', // Reste achetable tant qu'on a l'argent
        getDescription: (level) => `Soigne le noyau de 75 PV.`
    },
    {
        id: 'unlockCubeDamage', name: 'Débloquer: Impact Destructeur', desc: "Permet d'améliorer les dégâts des cubes en jeu.",
        costBase: 250, costFactor: 1, level: 0, maxLevel: 1, type: 'unlock', unlocksUpgrade: 'cubeDamage'
    },
    { // Items pour débloquer/acheter les pouvoirs
        id: 'buyPushBackPower', name: 'Acheter: Onde de Choc', desc: "Débloque Onde de Choc (1 utilisation).",
        costBase: 250, costFactor: 1, level: 0, maxLevel: 5, // Peut être acheté plusieurs fois pour + de charges
        type: 'power_unlock', powerId: 'pushBack', initialUses: 1
    },
    {
        id: 'buyTurretOvercharge', name: 'Acheter: Surcharge Tourelles', desc: "Débloque Surcharge Tourelles (1 utilisation).",
        costBase: 350, costFactor: 1, level: 0, maxLevel: 5,
        type: 'power_unlock', powerId: 'turretOvercharge', initialUses: 1
    }
];

// In-Game Upgrades
export const IN_GAME_UPGRADES_CONFIG = [
    {
        id: 'cubeHealth', name: 'Blindage Cubes', descTemplate: "PV max des cubes +{value}%.",
        costBase: 50, costFactor: 1.6, level: 0, maxLevel: 10,
        effectKey: 'cubeMaxHpPercentBonus', valuePerLevel: 10,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    {
        id: 'turretDamage', name: 'Munitions Surpuissantes', descTemplate: "Dégâts des tourelles +{value}.",
        costBase: 100, costFactor: 1.6, level: 0, maxLevel: 10,
        effectKey: 'turretDamageBonus', valuePerLevel: 15,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    {
        id: 'turretFireRate', name: 'Mécanisme Accéléré',
        descTemplate: "Délai de tir des tourelles réduit de {value}%.",
        costBase: 120, costFactor: 1.7, level: 0, maxLevel: 5,
        effectKey: 'turretFireRateMultiplier', valuePerLevel: 0.92, // Réduit le délai de 8%
        getValue: function(level) { return Math.pow(this.valuePerLevel, level); },
        getValueForDisplay: function(level) { return ((1 - Math.pow(this.valuePerLevel, level)) * 100).toFixed(0); },
        isUnlocked: true
    },
    {
        id: 'baseTurretDamage', name: 'Puissance du Noyau', descTemplate: "Dégâts du tir du Noyau +{value}.",
        costBase: 80, costFactor: 1.6, level: 0, maxLevel: 10,
        effectKey: 'baseTurretDamageBonus', valuePerLevel: 10,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    {
        id: 'baseTurretFireRate', name: 'Focalisation du Noyau',
        descTemplate: "Délai de tir du Noyau réduit de {value}%.",
        costBase: 100, costFactor: 1.7, level: 0, maxLevel: 5,
        effectKey: 'baseTurretFireRateMultiplier', valuePerLevel: 0.90,
        getValue: function(level) { return Math.pow(this.valuePerLevel, level); },
        getValueForDisplay: function(level) { return ((1 - Math.pow(this.valuePerLevel, level)) * 100).toFixed(0); },
        isUnlocked: true
    },
    {
        id: 'cubeDamage', name: 'Impact Destructeur', descTemplate: "Dégâts des cubes +{value}.",
        costBase: 75, costFactor: 1.7, level: 0, maxLevel: 5,
        effectKey: 'cubeDamageBonus', valuePerLevel: 2,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: false // Doit être débloqué
    },
    {
        id: 'coreRegen', name: 'Auto-Réparation Noyau', descTemplate: "Régénère +{value} PV/min au Noyau.",
        costBase: 150, costFactor: 1.9, level: 0, maxLevel: 3,
        effectKey: 'coreRegenPerMin', valuePerLevel: 5,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
];

// Pouvoirs Activables
export const POWERS_CONFIG = [
    {
        id: 'pushBack', name: 'Onde de Choc', description: "Repousse les ennemis proches du Noyau.",
        cooldown: 45000, duration: 0, icon: '💨', isUnlocked: false,
        effectRadius: GRID_SIZE * 8, pushStrength: GRID_SIZE * 6
    },
    {
        id: 'turretOvercharge', name: 'Surcharge Tourelles', description: "Vitesse d'attaque des tourelles x2 pendant 10s.",
        cooldown: 60000, duration: 10000, icon: '🔥', isUnlocked: false,
        fireRateMultiplierEffect: 0.5
    }
];

// Power-ups (Dropables)
export const POWERUP_TYPES = [
    { icon: '🧊', color: '#c0c0f0', type: 'cubes', amountFn: (wave) => 8 + Math.floor(wave*0.5) }, // Moins de cubes par powerup
    { icon: '💲', color: '#f0f0c0', type: 'cash', amountFn: (wave) => 20 + wave * 3 },
    { icon: '🛠️', color: '#c0f0c0', type: 'base_heal', amountFn: () => Math.floor(BASE_MAX_HEALTH * 0.08) }, // Moins de soin
];

export const HIGH_SCORES_KEY = 'cubeBaseDefenseHighScores';
export const RULES_TEXT = `RÈGLES - CUBE BASE DEFENSE: ...
🎯 OBJECTIF: Protégez le Noyau Précieux au centre de la carte !
Si le Noyau est détruit, la partie est finie.

🔧 GAMEPLAY:
• Maintenir Clic Gauche & Glisser: Dessiner des cubes.
• Clic Gauche Simple: Placer un bâtiment sélectionné du Shop.
• Clic Droit: Détruire un cube (récupère 1 cube) / Annuler placement bâtiment.
• WASD: Déplacer la caméra. Vous ne pouvez pas traverser vos propres constructions.
• P / Echap: Mettre le jeu en Pause / Ouvrir menu / Annuler actions.
• Shop (Menu Pause): Achetez des bâtiments et des déblocages.
• Améliorations (En Jeu): Augmentez les stats de vos cubes et du noyau.

💣 ENNEMIS:
• Les ennemis ont des points de vie et infligent des dégâts à vos cubes, bâtiments et au Noyau.
• Détruire des ennemis rapporte du Score et du Cash.

📈 PROGRESSION:
• Survivez aux vagues pour gagner des cubes et du Cash bonus.
• Complétez des objectifs pour des récompenses.

Bonne chance, Commandant !`;