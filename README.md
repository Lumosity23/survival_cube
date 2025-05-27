# Cube Base Defense  Verteidigungsspiel

![Cube Base Defense Gameplay Screenshot (Optionnel)](./screenshot.png) <!-- Remplace par un vrai screenshot si tu en as un -->

Cube Base Defense est un jeu de tower defense minimaliste et stimulant développé en HTML, CSS et JavaScript pur. Protégez votre noyau précieux contre des vagues d'ennemis de plus en plus redoutables en plaçant des cubes défensifs, en construisant des tourelles et en utilisant des pouvoirs spéciaux.

## 🎮 Comment Jouer

**Objectif :** Survivre le plus longtemps possible en empêchant les ennemis de détruire votre Noyau central.

**Contrôles :**
*   **Maintenir Clic Gauche & Glisser :** Dessiner une ligne de cubes défensifs.
*   **Clic Gauche Simple :** Placer un bâtiment (Tourelle, Générateur, Banque) sélectionné depuis le Shop.
*   **Clic Droit :** Détruire un cube (récupère 1 cube) / Vendre un bâtiment (récupère une partie du coût) / Annuler le placement d'un bâtiment en cours.
*   **WASD :** Déplacer la caméra sur la carte.
*   **P / Echap :** Mettre le jeu en Pause / Ouvrir le menu de pause / Annuler des actions.

**Mécaniques de Jeu :**
*   **Noyau Central :** Votre base principale. Si sa vie atteint zéro, la partie est terminée. Le Noyau possède également une capacité de tir défensif de base.
*   **Cubes :** Votre ressource défensive principale. Placez-les pour bloquer et endommager les ennemis.
*   **Ennemis :** Arrivent par vagues, chacun avec des points de vie et des dégâts. Leur nombre et leur force augmentent avec le temps et les vagues. Certains ennemis peuvent être plus rapides ou plus résistants.
*   **Cash ($) :** Gagné en détruisant des ennemis et en complétant des objectifs. Utilisé pour acheter des bâtiments dans le Shop et des améliorations en jeu.
*   **Shop (via Menu Pause) :** Achetez des bâtiments permanents comme des Générateurs de Cubes, des Tourelles, des Banques, ou débloquez des capacités/améliorations.
*   **Améliorations en Jeu (Panneau Latéral) :** Dépensez du Cash pendant la partie pour améliorer passivement la résistance de vos cubes, les dégâts de vos tourelles, la régénération du Noyau, etc.
*   **Pouvoirs (Panneau Latéral) :** Achetez des charges de pouvoirs spéciaux dans le Shop, puis activez-les en jeu avec un cooldown. Exemples : Onde de Choc, Surcharge des Tourelles.
*   **Objectifs :** Accomplissez des tâches dynamiques pour gagner des récompenses bonus en cubes ou en cash.
*   **Vagues :** La difficulté augmente à chaque nouvelle vague, introduisant potentiellement plus d'ennemis ou des ennemis plus forts.

## ✨ Fonctionnalités

*   Gameplay de type Tower Defense avec placement stratégique.
*   Difficulté progressive et vagues d'ennemis infinies.
*   Système de caméra déplaçable.
*   Shop pour acheter des structures défensives et des améliorations.
*   Panneau d'améliorations en jeu pour des bonus passifs.
*   Pouvoirs activables avec cooldowns pour des effets tactiques.
*   Objectifs dynamiques pour des défis supplémentaires.
*   Sauvegarde des meilleurs scores localement.
*   Développé en JavaScript vanille, HTML et CSS.

## 🛠️ Comment Lancer le Jeu Localement

1.  Clonez ce dépôt : `git clone [URL_DE_TON_REPO]`
2.  Naviguez jusqu'au dossier du projet : `cd cube-base-defense`
3.  Comme le jeu utilise des modules JavaScript (ES6 Modules), il doit être servi via un serveur HTTP local pour fonctionner correctement (l'ouverture directe de `index.html` dans le navigateur peut causer des erreurs CORS).
    *   **Avec Node.js et `http-server` (recommandé) :**
        *   Si vous n'avez pas Node.js, installez-le.
        *   Installez `http-server` globalement (une seule fois) : `npm install -g http-server`
        *   Depuis le dossier du projet, lancez : `http-server`
        *   Ouvrez l'adresse fournie (généralement `http://127.0.0.1:8080`) dans votre navigateur.
    *   **Avec l'extension "Live Server" de VS Code :**
        *   Ouvrez le dossier du projet dans VS Code.
        *   Faites un clic droit sur `index.html` et choisissez "Open with Live Server".
    *   **Avec Python :**
        *   Depuis le dossier du projet, lancez : `python -m http.server` (pour Python 3) ou `python -m SimpleHTTPServer` (pour Python 2).
        *   Ouvrez `http://localhost:8000` (ou le port indiqué) dans votre navigateur.

## 🚀 Technologies Utilisées

*   HTML5
*   CSS3
*   JavaScript (ES6+ Modules, Canvas API)

## 🔧 Pistes d'Amélioration Futures (TODO)

*   [ ] Plus de types d'ennemis avec des comportements uniques.
*   [ ] Plus de types de tourelles et de bâtiments (ex: ralentisseurs, lasers).
*   [ ] Système d'amélioration individuelle pour chaque tourelle placée.
*   [ ] Plus de pouvoirs spéciaux.
*   [ ] Améliorations graphiques (sprites, animations, effets de particules).
*   [ ] Effets sonores et musique.
*   [ ] Équilibrage plus fin de la difficulté et des coûts.
*   [ ] Options de configuration (difficulté de départ, etc.).
*   [ ] Système d'objectifs persistants entre les parties (méta-progression).

## 🤝 Contribution

Les suggestions et contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à proposer une pull request.
