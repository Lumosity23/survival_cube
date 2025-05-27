// js/eventListeners.js

export function setupEventListeners(
    canvas,
    keys,               // Direct reference to keys object in main.js
    lastMousePosRef,    // Object {x, y}
    isMouseDownRef,     // Object {value: boolean}
    getMouseWorldPosFunc, // La fonction elle-même
    handleCanvasMouseDownFunc,
    handleCanvasMouseUpFunc,
    handleCanvasMouseMovePaintFunc,
    handleCanvasContextMenuFunc,
    handleKeyDownFunc,
    handleKeyUpFunc,
    handleResizeFunc,
    uiElements,
    callbacks
) {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        lastMousePosRef.x = e.clientX - rect.left;
        lastMousePosRef.y = e.clientY - rect.top;
        if (isMouseDownRef.value) { // Accès via .value
            handleCanvasMouseMovePaintFunc(e); // Plus besoin de passer getMouseWorldPosFunc, il est dans main
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Clic gauche
            isMouseDownRef.value = true; // Mettre à jour la référence
            handleCanvasMouseDownFunc(e);  // Plus besoin de passer getMouseWorldPosFunc
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) { // Clic gauche
            isMouseDownRef.value = false; // Mettre à jour la référence
            handleCanvasMouseUpFunc(e);
        }
    });

    canvas.addEventListener('contextmenu', (e) => handleCanvasContextMenuFunc(e)); // Plus besoin de passer getMouseWorldPosFunc

    window.addEventListener('keydown', (e) => handleKeyDownFunc(e)); // keys est déjà une référence à l'objet de main.js
    window.addEventListener('keyup', (e) => handleKeyUpFunc(e));
    window.addEventListener('resize', handleResizeFunc);

    // Button Listeners
    uiElements.startGameBtn.addEventListener('click', callbacks.startGame);
    uiElements.showRulesBtnMenu.addEventListener('click', callbacks.showRules);
    uiElements.restartGameBtn.addEventListener('click', callbacks.restartGame);
    uiElements.goToMenuBtnGameOver.addEventListener('click', callbacks.goToMenu);
    uiElements.goToMenuBtnPause.addEventListener('click', callbacks.goToMenu);
    uiElements.resumeGameBtn.addEventListener('click', callbacks.resumeGame);
    uiElements.openShopPauseBtn.addEventListener('click', () => callbacks.openShop(true));
    uiElements.closeShopBtn.addEventListener('click', callbacks.closeShop);
    uiElements.shopButton.addEventListener('click', () => callbacks.openShop(false));
    uiElements.pauseButton.addEventListener('click', callbacks.togglePause);
}