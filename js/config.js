// js/config.js
export const GRID_SIZE = 40;
export const BASE_MAX_HEALTH = 250;
export const INITIAL_CUBES = 0; // On ne place pas de cubes pour l'instant
export const INITIAL_CASH = 50; // Un peu de cash pour démarrer (pour futures améliorations du noyau)
export const CAMERA_SPEED = 5;


export const HIGH_SCORES_KEY = {}

// Wave Configuration
export const PREPARATION_TIME_FIRST_WAVE = 1000; // 60 secondes
export const PREPARATION_TIME_BASE = 5000;     // 20 secondes pour les vagues suivantes
export const PREPARATION_TIME_PER_WAVE_INCREMENT = 1000; // +1s par vague (après la 1ère)

// Enemy Base Stats (ajusté pour le noyau seul au début)
export const ENEMY_HP_FROM_SIZE_FACTOR = 1.5; // Moins de PV par taille au début
export const ENEMY_HP_WAVE_MULTIPLIER_BASE = 0.8;
export const ENEMY_HP_WAVE_MULTIPLIER_INCREMENT = 0.12;
export const ENEMY_HP_DIFFICULTY_MULTIPLIER = 0.04;
export const ENEMY_DAMAGE_FROM_SIZE_FACTOR = 0.15;
export const ENEMY_DAMAGE_DIFFICULTY_FACTOR = 0.20;
export const ENEMY_DAMAGE_WAVE_FACTOR = 0.08;
export const ENEMY_DEFAULT_COLOR = 'rgb(200,60,60)';
export const ENEMY_GIANT_COLOR = 'rgb(220,80,80)'; // Sera plus différencié plus tard
export const ENEMY_FAST_COLOR = 'rgb(180,100,200)';

// Core Turret (Noyau) Stats de Base
export const BASE_CORE_TURRET_INITIAL_DAMAGE = 4; // Dégâts du noyau
export const BASE_CORE_TURRET_INITIAL_RANGE_FACTOR = 3.5; // x GRID_SIZE
export const BASE_CORE_TURRET_INITIAL_FIRE_RATE = 1500; // ms

export const RULES_TEXT = `Bienvenue, Opérateur !
- Le Noyau au centre est votre objectif de défense. Il tire automatiquement.
- Survivez aux vagues d'ennemis.
- Utilisez WASD pour déplacer la caméra (si activé).
- P / Echap pour mettre en Pause ou retourner au Menu.
Bonne chance !`;