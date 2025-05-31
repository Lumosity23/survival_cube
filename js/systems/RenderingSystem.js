// js/systems/RenderingSystem.js
import * as Config from '../config.js';
import * as GameState from '../core/GameState.js';

function drawGrid(ctx, camera, canvasWidth, canvasHeight, gs, viewBounds) {
    ctx.strokeStyle = "rgba(0, 128, 255, 0.08)"; ctx.lineWidth = 0.5;
    for (let gx = Math.floor(viewBounds.minX / gs) * gs; gx < viewBounds.maxX; gx += gs) {
        ctx.beginPath(); ctx.moveTo(gx, viewBounds.minY); ctx.lineTo(gx, viewBounds.maxY); ctx.stroke();
    }
    for (let gy = Math.floor(viewBounds.minY / gs) * gs; gy < viewBounds.maxY; gy += gs) {
        ctx.beginPath(); ctx.moveTo(viewBounds.minX, gy); ctx.lineTo(viewBounds.maxX, gy); ctx.stroke();
    }
}

function drawBaseCoreVisuals(ctx, baseCore) {
    if (!baseCore || typeof baseCore.health !== 'number') return;
    const coreHealthRatio = Math.max(0, baseCore.health / Config.BASE_MAX_HEALTH);
    const coreColorStop1 = coreHealthRatio > 0.6 ? '#00d0e0' : (coreHealthRatio > 0.3 ? '#ee9900' : '#ee4055');
    const coreColorStop2 = coreHealthRatio > 0.6 ? '#00aabb' : (coreHealthRatio > 0.3 ? '#cc7700' : '#bb2033');
    ctx.shadowBlur = 15; ctx.shadowColor = coreColorStop1;
    let coreGradient = ctx.createRadialGradient(baseCore.x, baseCore.y, baseCore.radius * 0.5, baseCore.x, baseCore.y, baseCore.radius);
    coreGradient.addColorStop(0, coreColorStop1); coreGradient.addColorStop(1, coreColorStop2);
    ctx.fillStyle = coreGradient;
    ctx.beginPath(); ctx.arc(baseCore.x, baseCore.y, baseCore.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('CORE', baseCore.x, baseCore.y + 4);

    if (baseCore.shootingTarget) {
        ctx.beginPath(); ctx.moveTo(baseCore.x, baseCore.y); ctx.lineTo(baseCore.shootingTarget.x, baseCore.shootingTarget.y);
        ctx.strokeStyle = 'rgba(180, 220, 255, 0.9)'; ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(180, 220, 255, 0.7)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(220, 240, 255, 0.9)'; ctx.beginPath(); ctx.arc(baseCore.shootingTarget.x, baseCore.shootingTarget.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawPlayerReticle(ctx, canvasWidth, canvasHeight) {
    ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 1;
    ctx.shadowBlur = 4; ctx.shadowColor = '#00aaff';
    ctx.beginPath(); ctx.arc(canvasWidth / 2, canvasHeight / 2, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(canvasWidth / 2, canvasHeight / 2, 12, 0, Math.PI * 2); ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1.0;
    ctx.beginPath(); ctx.moveTo(canvasWidth / 2 - 4, canvasHeight / 2); ctx.lineTo(canvasWidth / 2 + 4, canvasHeight / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(canvasWidth / 2, canvasHeight / 2 - 4); ctx.lineTo(canvasWidth / 2, canvasHeight / 2 + 4); ctx.stroke();
    ctx.shadowBlur = 0;
}

export function renderGame(ctx, camera, gameElements, baseCore, gameStats, uiState) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // 1. Nettoyer avec le fond de base NORMAL
    ctx.fillStyle = '#101018'; // Ton fond de canvas normal
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // L'EFFET DE BORDURE EST GÉRÉ PAR CSS ET LE DIV #gameScreenBorderEffect
    // ON NE DESSINE PLUS d'overlay rouge plein écran ici.

    ctx.save();
    ctx.translate(canvasWidth / 2 - camera.x, canvasHeight / 2 - camera.y);

    const gs = Config.GRID_SIZE;
    const viewBounds = {
        minX: camera.x - canvasWidth/2 - gs, maxX: camera.x + canvasWidth/2 + gs,
        minY: camera.y - canvasHeight/2 - gs, maxY: camera.y + canvasHeight/2 + gs,
    };

    // 2. Dessiner les éléments du jeu
    drawGrid(ctx, camera, canvasWidth, canvasHeight, gs, viewBounds);
    drawBaseCoreVisuals(ctx, baseCore); // Noyau

    // Pour cette étape, on se concentre sur le noyau et les ennemis
    gameElements.obstacles.forEach(obstacleObject => {
        if (typeof obstacleObject.render === 'function') {
            obstacleObject.render(ctx, viewBounds); // camera non nécessaire si coords monde
        }
    });

    // Pas de cubes, bâtiments, powerups, fantôme de placement pour l'instant

    ctx.restore();

    // Réticule joueur
    drawPlayerReticle(ctx, canvasWidth, canvasHeight);
}