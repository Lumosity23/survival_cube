// js/eventListeners.js
export function setupEventListeners(
    canvas, keys, lastMousePosRef, isMouseDownRef, // isMouseDownRef et lastMousePosRef non utilisés pour l'instant
    getMouseWorldPosFunc,
    handleCanvasMouseDownFunc, handleCanvasMouseUpFunc, handleCanvasMouseMovePaintFunc, handleCanvasContextMenuFunc, // Non utilisés pour l'instant
    handleKeyDownFunc, handleKeyUpFunc, handleResizeFunc,
    uiElements, callbacks
) {
    // Pas de listeners sur le canvas pour le placement pour cette version minimale
    // canvas.addEventListener('mousemove', ...);
    // canvas.addEventListener('mousedown', ...);
    // canvas.addEventListener('mouseup', ...);
    // canvas.addEventListener('contextmenu', ...);

    window.addEventListener('keydown', (e) => handleKeyDownFunc(e));
    window.addEventListener('keyup', (e) => handleKeyUpFunc(e));
    window.addEventListener('resize', handleResizeFunc);

    if(uiElements.startGameBtn) uiElements.startGameBtn.addEventListener('click', callbacks.startGame);
    if(uiElements.showRulesBtnMenu) uiElements.showRulesBtnMenu.addEventListener('click', callbacks.showRules); // Assurer que showRules est défini
    if(uiElements.restartGameBtn) uiElements.restartGameBtn.addEventListener('click', callbacks.restartGame);
    if(uiElements.goToMenuBtnGameOver) uiElements.goToMenuBtnGameOver.addEventListener('click', callbacks.goToMenu);
    if(uiElements.goToMenuBtnPause) uiElements.goToMenuBtnPause.addEventListener('click', callbacks.goToMenu);
    if(uiElements.resumeGameBtn) uiElements.resumeGameBtn.addEventListener('click', callbacks.resumeGame);
    if(uiElements.pauseButton) uiElements.pauseButton.addEventListener('click', callbacks.togglePause);
}