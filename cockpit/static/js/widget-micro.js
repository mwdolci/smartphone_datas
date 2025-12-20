/**
 * Widget Microphone - Visualisation audio en temps réel
 * Affiche les niveaux sonores et décibels reçus via WebSocket
 */

class MicrophoneWidget {
    constructor() {
        // Références aux éléments DOM
        this.canvas = document.getElementById('micro-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.statusIndicator = document.getElementById('micro-status-indicator');
        this.statusText = document.getElementById('micro-status-text');
        this.dbValue = document.getElementById('micro-db-value');
        this.meterFill = document.getElementById('micro-meter-fill');
        this.minValue = document.getElementById('micro-min');
        this.avgValue = document.getElementById('micro-avg');
        this.maxValue = document.getElementById('micro-max');
        this.freqValue = document.getElementById('micro-freq');
        
        // Mode de visualisation
        this.visualizationMode = 'bars'; // bars, wave, circle
        
        // Historique pour la visualisation
        this.audioHistory = [];
        this.maxHistoryLength = 100;
        
        // Statistiques
        this.stats = {
            min: 0,
            max: 0,
            avg: 0,
            count: 0,
            sum: 0
        };
        
        // Animation
        this.animationId = null;
        this.lastValue = 0;
        this.smoothValue = 0;
        
        // Initialisation
        this.initCanvas();
        this.initControls();
        this.startAnimation();
        
        console.log('[Micro] Widget initialisé');
    }
    
    /**
     * Initialise le canvas
     */
    initCanvas() {
        if (!this.canvas || !this.ctx) {
            console.error('[Micro] Canvas non disponible');
            return;
        }
        
        // Adapte la taille au conteneur
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth || 400;
            this.canvas.height = 300;
        }
        
        // Fond transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Initialise les contrôles
     */
    initControls() {
        // Boutons de mode de visualisation
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.visualizationMode = e.target.dataset.mode;
                console.log(`[Micro] Mode de visualisation: ${this.visualizationMode}`);
            });
        });
    }
    
    /**
     * Mise à jour des données audio depuis WebSocket
     * @param {Object} data - Données audio du smartphone
     */
    updateAudioData(data) {
        console.log('[Micro] Données reçues:', data);
        
        // Extraction des valeurs
        const db = data.decibels || data.volume || data.level || 0;
        const frequency = data.frequency || 0;
        
        // Mise à jour du statut
        this.updateStatus(true);
        
        // Mise à jour de la valeur affichée
        this.updateValue(db);
        
        // Mise à jour de la fréquence
        if (this.freqValue) {
            this.freqValue.textContent = `${Math.round(frequency)} Hz`;
        }
        
        // Ajout à l'historique
        this.audioHistory.push(db);
        if (this.audioHistory.length > this.maxHistoryLength) {
            this.audioHistory.shift();
        }
        
        // Mise à jour des statistiques
        this.updateStats(db);
    }
    
    /**
     * Mise à jour du statut de connexion
     */
    updateStatus(connected) {
        if (this.statusIndicator && this.statusText) {
            if (connected) {
                this.statusIndicator.style.color = '#4caf50';
                this.statusText.textContent = 'Connecté';
                this.statusText.style.color = '#4caf50';
            } else {
                this.statusIndicator.style.color = '#ef4444';
                this.statusText.textContent = 'Déconnecté';
                this.statusText.style.color = '#ef4444';
            }
        }
    }
    
    /**
     * Mise à jour de la valeur affichée
     */
    updateValue(db) {
        // Lissage de la valeur pour animation fluide
        this.lastValue = db;
        
        // Affichage de la valeur
        if (this.dbValue) {
            this.dbValue.textContent = Math.round(db);
        }
        
        // Mise à jour de la barre de niveau (0-100 dB)
        if (this.meterFill) {
            const percentage = Math.min(100, Math.max(0, (db / 100) * 100));
            this.meterFill.style.width = percentage + '%';
            
            // Couleur selon le niveau
            if (db < 30) {
                this.meterFill.style.background = '#4caf50'; // Vert
            } else if (db < 60) {
                this.meterFill.style.background = '#ff9800'; // Orange
            } else {
                this.meterFill.style.background = '#ef4444'; // Rouge
            }
        }
    }
    
    /**
     * Mise à jour des statistiques
     */
    updateStats(value) {
        this.stats.count++;
        this.stats.sum += value;
        this.stats.avg = this.stats.sum / this.stats.count;
        
        if (this.stats.count === 1 || value < this.stats.min) {
            this.stats.min = value;
        }
        if (this.stats.count === 1 || value > this.stats.max) {
            this.stats.max = value;
        }
        
        // Affichage
        if (this.minValue) {
            this.minValue.textContent = `${Math.round(this.stats.min)} dB`;
        }
        if (this.avgValue) {
            this.avgValue.textContent = `${Math.round(this.stats.avg)} dB`;
        }
        if (this.maxValue) {
            this.maxValue.textContent = `${Math.round(this.stats.max)} dB`;
        }
    }
    
    /**
     * Démarre l'animation de visualisation
     */
    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Dessine la visualisation
     */
    draw() {
        if (!this.ctx) return;
        
        // Lissage de la valeur
        this.smoothValue += (this.lastValue - this.smoothValue) * 0.15;
        
        // Effacer le canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner selon le mode
        switch (this.visualizationMode) {
            case 'bars':
                this.drawBars();
                break;
            case 'wave':
                this.drawWave();
                break;
            case 'circle':
                this.drawCircle();
                break;
        }
    }
    
    /**
     * Mode Barres verticales
     */
    drawBars() {
        const barCount = 50;
        const barWidth = this.canvas.width / barCount;
        const historySlice = this.audioHistory.slice(-barCount);
        
        for (let i = 0; i < historySlice.length; i++) {
            const value = historySlice[i];
            const barHeight = (value / 100) * this.canvas.height;
            const x = i * barWidth;
            const y = this.canvas.height - barHeight;
            
            // Couleur selon le niveau
            let color;
            if (value < 30) {
                color = `rgba(76, 175, 80, ${0.5 + (value / 100) * 0.5})`;
            } else if (value < 60) {
                color = `rgba(255, 152, 0, ${0.5 + (value / 100) * 0.5})`;
            } else {
                color = `rgba(239, 68, 68, ${0.5 + (value / 100) * 0.5})`;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
        
        // Ligne de référence
        this.drawReferenceLine();
    }
    
    /**
     * Mode Onde
     */
    drawWave() {
        if (this.audioHistory.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#4caf50';
        this.ctx.lineWidth = 2;
        
        const step = this.canvas.width / (this.audioHistory.length - 1);
        
        for (let i = 0; i < this.audioHistory.length; i++) {
            const value = this.audioHistory[i];
            const x = i * step;
            const y = this.canvas.height - (value / 100) * this.canvas.height;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Remplissage sous la courbe
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        this.ctx.fill();
        
        // Ligne de référence
        this.drawReferenceLine();
    }
    
    /**
     * Mode Cercle radial
     */
    drawCircle() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 20;
        
        // Cercle central
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fill();
        
        // Cercles de référence
        for (let i = 1; i <= 3; i++) {
            const radius = (maxRadius / 3) * i;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Visualisation radiale
        const bars = 64;
        const angleStep = (Math.PI * 2) / bars;
        
        for (let i = 0; i < bars; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const historyIndex = Math.floor((i / bars) * this.audioHistory.length);
            const value = this.audioHistory[historyIndex] || this.smoothValue;
            const barLength = (value / 100) * maxRadius;
            
            const x1 = centerX + Math.cos(angle) * 10;
            const y1 = centerY + Math.sin(angle) * 10;
            const x2 = centerX + Math.cos(angle) * (10 + barLength);
            const y2 = centerY + Math.sin(angle) * (10 + barLength);
            
            // Couleur selon le niveau
            let color;
            if (value < 30) {
                color = `rgba(76, 175, 80, ${0.5 + (value / 100) * 0.5})`;
            } else if (value < 60) {
                color = `rgba(255, 152, 0, ${0.5 + (value / 100) * 0.5})`;
            } else {
                color = `rgba(239, 68, 68, ${0.5 + (value / 100) * 0.5})`;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }
    
    /**
     * Dessine une ligne de référence
     */
    drawReferenceLine() {
        const referenceLevel = 50; // 50 dB
        const y = this.canvas.height - (referenceLevel / 100) * this.canvas.height;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Label
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('50 dB', 5, y - 5);
    }
    
    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = {
            min: 0,
            max: 0,
            avg: 0,
            count: 0,
            sum: 0
        };
        this.audioHistory = [];
    }
}

// Initialisation du widget
let microphoneWidget;

document.addEventListener('DOMContentLoaded', () => {
    microphoneWidget = new MicrophoneWidget();
    console.log('[Micro] Widget prêt');
});

// Fonction globale pour mise à jour depuis webSocket.js
window.updateMicrophone = function(data) {
    if (microphoneWidget) {
        microphoneWidget.updateAudioData(data);
    } else {
        console.warn('[Micro] Widget pas encore initialisé');
    }
};
