// js/game_elements/Obstacle.js
import * as Config from '../config.js';

// Factory function pour créer des objets obstacle
// Assure-toi que 'speed' est bien le dernier argument attendu
export function createObstacleObject(x, y, vx, vy, hp, maxHp, damage, radius, color, specialType, scoreValue, cashValue, speed) {
    return {
        x: x,
        y: y,
        vx: vx, // Sera recalculé par AISystem, mais on peut l'initialiser
        vy: vy, // Sera recalculé par AISystem
        hp: hp,
        maxHp: maxHp,
        damage: damage,
        radius: radius,
        color: color,
        specialType: specialType,
        scoreValue: scoreValue,
        cashValue: cashValue,
        speed: speed, // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ASSIGNATION IMPORTANTE
        
        render(ctx, viewBounds) {
            if (this.x + this.radius < viewBounds.minX || this.x - this.radius > viewBounds.maxX ||
                this.y + this.radius < viewBounds.minY || this.y - this.radius > viewBounds.maxY) {
                return; // Hors champ
            }

            let enemyColor = this.color;
            let glowColor = this.color;

            if(this.specialType === 'giant' || this.specialType === 'boss') {
                enemyColor = Config.ENEMY_GIANT_COLOR; glowColor = '#ff3355';
            } else if (this.specialType === 'fast' || this.specialType === 'mini_boss') {
                enemyColor = Config.ENEMY_FAST_COLOR; glowColor = '#ee00ee';
            } else {
                glowColor = '#ff7700';
            }

            ctx.shadowBlur = 8; ctx.shadowColor = glowColor;
            ctx.fillStyle = enemyColor;
            ctx.beginPath();
            const angle = Math.atan2(this.vy || 0, this.vx || 0.001);
            ctx.moveTo(this.x + this.radius * Math.cos(angle), this.y + this.radius * Math.sin(angle));
            ctx.lineTo(this.x + this.radius * 0.5 * Math.cos(angle + Math.PI * 2/3), this.y + this.radius * 0.5 * Math.sin(angle + Math.PI * 2/3));
            ctx.lineTo(this.x + this.radius * 0.5 * Math.cos(angle - Math.PI * 2/3), this.y + this.radius * 0.5 * Math.sin(angle - Math.PI * 2/3));
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            if (this.hp < this.maxHp) {
                const hpPercent = Math.max(0, this.hp / this.maxHp);
                ctx.fillStyle = hpPercent > 0.6 ? '#00dd77' : hpPercent > 0.3 ? '#ccbb00' : '#cc3344';
                ctx.fillRect(this.x - this.radius, this.y - this.radius - 7, this.radius * 2 * hpPercent, 4);
                ctx.strokeStyle = 'rgba(10,10,15,0.7)'; ctx.lineWidth = 0.5;
                ctx.strokeRect(this.x - this.radius, this.y - this.radius - 7, this.radius * 2, 4);
            }
        }
    };
}