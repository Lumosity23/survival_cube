// js/config.js

// Game Mechanics & Balancing
export const GRID_SIZE = 40;
export const BASE_MAX_HEALTH = 250;
export const INITIAL_CUBES = 25; // Un peu plus de cubes au début
export const INITIAL_CASH = 7500;  // Un peu plus de cash au début
export const CAMERA_SPEED = 5;
export const BASE_CORE_TURRET_INITIAL_DAMAGE = 50;
export const BASE_CORE_TURRET_INITIAL_RANGE = GRID_SIZE * 15;
export const BASE_CORE_TURRET_INITIAL_FIRE_RATE = 500; // ms
export const OBSTACLE_SPAWN_RATE_BASE = 2500; // Ralentir un peu au début
export const OBSTACLE_SPAWN_RATE_DIFFICULTY_FACTOR = 70;
export const OBSTACLE_SPAWN_MIN_RATE = 250; // Limite inférieure plus basse pour fin de partie
export const POWERUP_SPAWN_CHANCE_BASE = 0.001;
export const POWERUP_SPAWN_CHANCE_TIME_FACTOR = 0.000005;
export const POWERUP_DESPAWN_TIME = 15000;
export const WAVE_DURATION = 40;
export const CUBE_BASE_HP = 20; // Augmenter un peu la vie de base des cubes
// TURRET STATS (Base values, can be overridden by buildingData in SHOP_ITEMS_CONFIG)
export const TURRET_BASE_RANGE_FACTOR = 10; // Multiplie GRID_SIZE
export const TURRET_BASE_DAMAGE = 20;
export const TURRET_BASE_FIRE_RATE = 250; //ms

// Colors & Styles
export const COLOR_GRID = '#3a3a3a';
export const COLOR_BASE_HEALTHY = '#40E0D0';
export const COLOR_BASE_DAMAGED = '#FFD700';
export const COLOR_BASE_CRITICAL = '#FF6347';
export const COLOR_CUBE_STANDARD = '#d0d0d0';
export const COLOR_CUBE_REINFORCED = '#A9A9A9'; // Utilisé si cubeMaxHpPercentBonus > 0
export const COLOR_OBSTACLE_DEFAULT = 'rgb(80,30,30)';
export const COLOR_OBSTACLE_GIANT = 'rgb(150,40,40)';
export const COLOR_OBSTACLE_FAST = 'rgb(80,60,100)';

// Objectives
export const MAX_ACTIVE_OBJECTIVES = 3;
// export const objectiveDifficultyScalar = (wave) => Math.pow(wave, 0.5) * Math.log1p(wave); // Courbe douce
export const objectiveDifficultyScalar = (wave) => wave * 1.0 + Math.pow(Math.max(0, wave - 1), 1.3); // Encore un ajustement

export const ALL_OBJECTIVES_TEMPLATES = [
    {
        idBase: 'survive_X_sec',
        textFn: (val) => `Survivre ${val}s`,
        targetFn: (wave) => Math.floor(45 + (wave * 10) + objectiveDifficultyScalar(wave) * 15), // Base + par vague + scalaire
        currentKey: 'survivalTime', reward: 'cash',
        rewardAmountFn: (val, wave) => Math.floor(val * 0.2 + wave * 10)
    },
    {
        idBase: 'destroy_X_obstacles',
        textFn: (val) => `Détruire ${val} ennemis`,
        targetFn: (wave) => Math.floor(10 + (wave * 5) + objectiveDifficultyScalar(wave) * 5),
        currentKey: 'obstaclesDestroyed', reward: 'cubes',
        rewardAmountFn: (val, wave) => Math.floor(val/3 + wave + 2)
    },
    {
        idBase: 'earn_X_cash',
        textFn: (val) => `Gagner ${val}💲`,
        targetFn: (wave) => Math.floor(100 + (wave * 40) + objectiveDifficultyScalar(wave) * 50),
        currentKey: 'cashEarnedThisGame', reward: 'cubes',
        rewardAmountFn: (val, wave) => Math.floor(val/30 + wave * 2 + 2)
    },
    {
        idBase: 'reach_wave_X',
        textFn: (val) => `Atteindre Vague ${val}`,
        targetFn: (wave) => wave + 1 + Math.floor(wave/3), // Celui-ci est ok, il se base directement sur la vague suivante
        currentKey: 'wave', reward: 'cash',
        rewardAmountFn: (val, wave) => val * 15 + wave * 8
    },
];

// Shop Items (Pour le menu Shop principal)
export const SHOP_ITEMS_CONFIG = [
    {
        id: 'cubeGenerator', name: 'Générateur de Cubes', desc: 'Placez-le pour +X cube/Ys.',
        costBase: 200, costFactor: 1.8, level: 0, maxLevel: 3,
        type: 'building',
        buildingData: { type: 'generator', productionRate: 1, interval: 10000, icon: '⚙️', color: '#ADD8E6', hp: 50, maxHp: 50 },
        getDescription: (level) => `Placez un Générateur (Niv ${level+1}). ${1 + level} cube(s)/10s.`
    },
    { // NOUVEL ITEM : TOURELLE
        id: 'turret', name: 'Tourelle de Défense', desc: 'Tire automatiquement sur les ennemis à portée.',
        costBase: 150, costFactor: 1.7, level: 0, maxLevel: 5, // Les niveaux pourraient augmenter la portée/dégâts/cadence
        type: 'building',
        buildingData: {
            type: 'turret',
            range: GRID_SIZE * TURRET_BASE_RANGE_FACTOR,
            damage: TURRET_BASE_DAMAGE,
            fireRate: TURRET_BASE_FIRE_RATE,             
            icon: '🎯',
            color: '#FF8C00',           // Orange foncé
            hp: 75,
            maxHp: 75,
            lastShotTime: 0             // Pour gérer la cadence de tir
        },
        getDescription: (level) => `Placez une Tourelle (Niv ${level+1}). Dégâts: ${5 + level * 2}, Portée: ${GRID_SIZE * (4 + level * 0.5)}`
    },
    {
        id: 'repairBaseShop', name: 'Kit de Réparation Noyau', desc: 'Soigne le noyau de 75 PV (usage unique par achat).',
        costBase: 100, costFactor: 1, level: 0, maxLevel: 1,
        effectKey: 'repairBase', effectValue: 75,
        type: 'consumable'
    },
    {
        id: 'unlockCubeDamage', name: 'Débloquer: Impact Destructeur', desc: "Permet d'améliorer les dégâts des cubes en jeu.",
        costBase: 250, costFactor: 1, level: 0, maxLevel: 1,
        type: 'unlock',
        unlocksUpgrade: 'cubeDamage'
    },
    {
        id: 'buyPushBackPower', name: 'Acheter: Onde de Choc', desc: "Débloque le pouvoir Onde de Choc (1 utilisation).",
        costBase: 300, costFactor: 1, level: 0, maxLevel: 1, // Achat unique pour obtenir 1 charge ou débloquer
        type: 'power_unlock', // Nouveau type
        powerId: 'pushBack',
        initialUses: 1
    },
    {
        id: 'buyTurretOvercharge', name: 'Acheter: Surcharge Tourelles', desc: "Débloque Surcharge Tourelles (1 utilisation).",
        costBase: 400, costFactor: 1, level: 0, maxLevel: 1,
        type: 'power_unlock',
        powerId: 'turretOvercharge',
        initialUses: 1
    }
];

// In-Game Upgrades (Pour le panneau d'améliorations en jeu)
export const IN_GAME_UPGRADES_CONFIG = [
    {
        id: 'cubeHealth', name: 'Blindage Cubes', descTemplate: "PV max des cubes +{value}%.",
        costBase: 50, costFactor: 1.6, level: 0, maxLevel: 100,
        effectKey: 'cubeMaxHpPercentBonus', valuePerLevel: 10,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    { // Amélioration pour les tourelles (exemple)
        id: 'turretDamage', name: 'Munitions Surpuissantes', descTemplate: "Dégâts des tourelles +{value}.",
        costBase: 10, costFactor: 1.6, level: 0, maxLevel: 10, // Plus de niveaux
        effectKey: 'turretDamageBonus', valuePerLevel: 15, // <<<<<<<<<<<<<<<<< +15 dégâts par niveau (50 -> 65 -> 80 ... -> 50 + 10*15 = 200)
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    {
        id: 'turretFireRate', name: 'Mécanisme Accéléré', descTemplate: "Vitesse de tir des tourelles +{value}%.",
        costBase: 12, costFactor: 1.7, level: 0, maxLevel: 5,
        effectKey: 'turretFireRateMultiplier', // Nouveau gameStats
        valuePerLevel: 0.92, // Chaque niveau réduit le délai de 8% (0.92)
        getValue: function(level) { return Math.pow(this.valuePerLevel, level); }, // Multiplicateur total
        isUnlocked: true,
        // Pour afficher le % d'amélioration : (1 - Math.pow(0.92, level)) * 100
        descTemplate: "Délai de tir des tourelles réduit de {value}%.", // Modifier pour afficher le %
        getValueForDisplay: function(level) { return ((1 - Math.pow(this.valuePerLevel, level)) * 100).toFixed(0); }
    },
    {
        id: 'cubeDamage', name: 'Impact Destructeur', descTemplate: "Dégâts des cubes +{value}.",
        costBase: 20, costFactor: 1.7, level: 0, maxLevel: 100,
        effectKey: 'cubeDamageBonus', valuePerLevel: 10,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: false
    },
    {
        id: 'coreRegen', name: 'Auto-Réparation Noyau', descTemplate: "Régénère +{value} PV/min au Noyau.",
        costBase: 15, costFactor: 1.9, level: 0, maxLevel: 50,
        effectKey: 'coreRegenPerMin', valuePerLevel: 5,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    {
        id: 'baseTurretDamage',
        name: 'Puissance du Noyau',
        descTemplate: "Dégâts du tir du Noyau +{value}.",
        costBase: 10, costFactor: 1.7, level: 0, maxLevel: 50,
        effectKey: 'baseTurretDamageBonus', valuePerLevel: 10,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
    {
        id: 'baseTurretFireRate',
        name: 'Cadence du Noyau',
        descTemplate: "Vitesse de tir du Noyau améliorée de {value}%.", // Diminue le délai
        costBase: 12, costFactor: 1.8, level: 0, maxLevel: 30,
        effectKey: 'baseTurretFireRateMultiplier', valuePerLevel: 0.9, // Multiplie le délai par 0.9 (plus petit = plus rapide)
        getValue: function(level) { return Math.pow(this.valuePerLevel, level); }, // Ex: 0.9^0=1, 0.9^1=0.9, 0.9^2=0.81
        getValueForDisplay: function(level) { return ((1 - Math.pow(this.valuePerLevel, level)) * 100).toFixed(0); },
        isUnlocked: true
    },
    {
        id: 'baseTurretRange',
        name: 'Portée du Noyau',
        descTemplate: "Portée du tir du Noyau +{value}.",
        costBase: 14, costFactor: 1.9, level: 0, maxLevel: 20,
        effectKey: 'baseTurretRangeBonus', valuePerLevel: 1,
        getValue: function(level) { return level * this.valuePerLevel; },
        isUnlocked: true
    },
];

export const POWERS_CONFIG = [
    {
        id: 'pushBack',
        name: 'Onde de Choc',
        description: "Repousse les ennemis proches du Noyau.",
        cost: 300, // Coût d'achat initial dans le Shop principal pour débloquer/obtenir le premier usage
        cooldown: 25000, // 45 secondes
        duration: 0, // Effet instantané
        icon: '💨',
        isUnlocked: false, // Doit être acheté dans le shop
        lastUsedTime: 0,
        usesLeft: 0, // Ou un nombre d'utilisations si acheté comme consommable
        effectRadius: GRID_SIZE * 10, // Rayon de l'onde de choc
        pushStrength: GRID_SIZE * 8   // Distance de recul
    },
    {
        id: 'turretOvercharge',
        name: 'Surcharge Tourelles',
        description: "Augmente la vitesse d'attaque de toutes les tourelles pendant 10s.",
        cost: 400,
        cooldown: 60000, // 1 minute
        duration: 10000, // 10 secondes
        icon: '🔥',
        isUnlocked: false,
        lastUsedTime: 0,
        usesLeft: 0,
        fireRateMultiplierEffect: 0.1 // Divise le délai par 2 (x2 vitesse)
    }
    // ... autres pouvoirs
];


// Power-ups
export const POWERUP_TYPES = [
    { icon: '🧊', color: '#c0c0f0', type: 'cubes', amountFn: (wave) => 10 + wave },
    { icon: '💲', color: '#f0f0c0', type: 'cash', amountFn: (wave) => 30 + wave * 5 },
    { icon: '🛠️', color: '#c0f0c0', type: 'base_heal', amountFn: () => Math.floor(BASE_MAX_HEALTH * 0.1) },
];

// Storage
export const HIGH_SCORES_KEY = 'cubeBaseDefenseHighScores';

// Textes (pour faciliter la traduction ou la modification)
export const RULES_TEXT = `RÈGLES - CUBE BASE DEFENSE:
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