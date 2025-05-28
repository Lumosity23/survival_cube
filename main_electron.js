// main_electron.js
const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path'); // Utiliser le préfixe node: pour les modules natifs

function createWindow() {
    // Crée la fenêtre du navigateur.
    const mainWindow = new BrowserWindow({
        width: 1280, // Largeur initiale de la fenêtre
        height: 720, // Hauteur initiale de la fenêtre
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Optionnel, pour une meilleure sécurité/intégration
            nodeIntegration: false, // Désactivé par défaut pour la sécurité, ton jeu est purement front-end
            contextIsolation: true, // Activé par défaut, bonne pratique
            devTools: true // Activer les outils de développement (F12) par défaut, utile pour le débogage
        },
        icon: path.join(__dirname, 'icon.png') // Optionnel: chemin vers l'icône de ton application
    });

    // et charger le index.html de l'application.
    mainWindow.loadFile('index.html'); // Charge ton jeu

    // mainWindow.maximize(); // Démarre en plein écran maximisé (optionnel)
    // mainWindow.setFullScreen(true); // Vrai plein écran (optionnel)

    // Ouvrir les outils de développement (DevTools).
    // mainWindow.webContents.openDevTools(); // Tu peux le commenter pour la version de distribution

    // Supprimer le menu par défaut d'Electron (Fichier, Edition, etc.) pour un look plus "jeu"
    Menu.setApplicationMenu(null);
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigation.
// Certaines APIs peuvent être utilisées uniquement après cet événement.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        // Sur macOS, il est commun de recréer une fenêtre dans l'application quand
        // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres d'ouvertes.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS. Dans ce cas, il est courant
// pour les applications et leur barre de menu de rester actives jusqu'à ce que l'utilisateur
// quitte explicitement avec Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Dans ce fichier, tu peux inclure le reste du code spécifique au
// processus principal de ton application. Tu peux également le mettre dans des
// fichiers séparés et les importer ici.