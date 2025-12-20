/**
 * Widget Batterie - Visualisation détaillée de la batterie
 * Affiche le niveau, l'état de charge, et les statistiques
 */

class BatteryWidget {
    constructor() {
        // Références aux éléments DOM
        this.statusIndicator = document.getElementById('battery-status-indicator');
        this.statusText = document.getElementById('battery-status-text');
        this.batteryFill = document.getElementById('battery-fill');
        this.percentValue = document.getElementById('battery-percent-value');
        this.levelValue = document.getElementById('battery-level-value');
        this.chargingLabel = document.getElementById('battery-charging-label');
        this.stateElement = document.getElementById('battery-state');
        this.timeElement = document.getElementById('battery-time');
        this.healthElement = document.getElementById('battery-health');
        this.techElement = document.getElementById('battery-tech');
        this.tempElement = document.getElementById('battery-temp');
        this.voltageElement = document.getElementById('battery-voltage');
        this.currentElement = document.getElementById('battery-current');
        this.capacityElement = document.getElementById('battery-capacity');
        
        // État actuel
        this.currentLevel = 0;
        this.isCharging = false;
        
        console.log('[Batterie] Widget initialisé');
    }
    
    /**
     * Mise à jour des données de batterie depuis WebSocket
     */
    updateBatteryData(data) {
        console.log('[Batterie] Données reçues:', data);
        
        // Mise à jour du statut
        this.updateStatus(true);
        
        // Niveau de batterie
        const level = data.level || data.percentage || 0;
        this.updateLevel(level);
        
        // État de charge
        const charging = data.charging || data.isCharging || false;
        this.updateChargingState(charging);
        
        // Temps restant
        if (data.chargingTime !== undefined || data.dischargingTime !== undefined) {
            const time = charging ? data.chargingTime : data.dischargingTime;
            this.updateTime(time);
        }
        
        // Détails supplémentaires
        if (data.health !== undefined) {
            this.healthElement.textContent = data.health + '%';
        }
        
        if (data.technology) {
            this.techElement.textContent = data.technology;
        }
        
        if (data.temperature !== undefined) {
            this.tempElement.textContent = (data.temperature / 10).toFixed(1) + ' °C';
        }
        
        if (data.voltage !== undefined) {
            this.voltageElement.textContent = (data.voltage / 1000).toFixed(2) + ' V';
        }
        
        if (data.current !== undefined) {
            this.currentElement.textContent = data.current + ' mA';
        }
        
        if (data.capacity !== undefined) {
            this.capacityElement.textContent = data.capacity + ' mAh';
        }
    }
    
    /**
     * Mise à jour du niveau de batterie
     */
    updateLevel(level) {
        this.currentLevel = level;
        
        // Mise à jour de la barre de remplissage
        if (this.batteryFill) {
            this.batteryFill.style.width = level + '%';
            
            // Couleur selon le niveau
            if (level > 50) {
                this.batteryFill.style.background = 'linear-gradient(180deg, #4caf50, #45a049)';
            } else if (level > 20) {
                this.batteryFill.style.background = 'linear-gradient(180deg, #ff9800, #f57c00)';
            } else {
                this.batteryFill.style.background = 'linear-gradient(180deg, #ef4444, #dc2626)';
            }
        }
        
        // Mise à jour des valeurs affichées
        if (this.percentValue) {
            this.percentValue.textContent = Math.round(level);
        }
        
        if (this.levelValue) {
            this.levelValue.textContent = Math.round(level);
        }
    }
    
    /**
     * Mise à jour de l'état de charge
     */
    updateChargingState(charging) {
        this.isCharging = charging;
        
        if (this.chargingLabel) {
            if (charging) {
                this.chargingLabel.textContent = '⚡ En charge';
                this.chargingLabel.style.color = '#4caf50';
            } else {
                this.chargingLabel.textContent = '🔋 Décharge';
                this.chargingLabel.style.color = 'rgba(255, 255, 255, 0.5)';
            }
        }
        
        if (this.stateElement) {
            this.stateElement.textContent = charging ? 'En charge' : 'Sur batterie';
        }
        
        // Animation de charge
        if (this.batteryFill) {
            if (charging) {
                this.batteryFill.style.animation = 'charging-pulse 2s ease-in-out infinite';
            } else {
                this.batteryFill.style.animation = 'none';
            }
        }
    }
    
    /**
     * Mise à jour du temps restant
     */
    updateTime(seconds) {
        if (!this.timeElement) return;
        
        if (seconds === Infinity || seconds === -1 || seconds === null) {
            this.timeElement.textContent = 'Calcul en cours...';
            return;
        }
        
        if (seconds < 60) {
            this.timeElement.textContent = 'Moins d\'une minute';
            return;
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            this.timeElement.textContent = `${hours}h ${minutes}min`;
        } else {
            this.timeElement.textContent = `${minutes} min`;
        }
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
}

// Initialisation du widget
let batteryWidget;

document.addEventListener('DOMContentLoaded', () => {
    batteryWidget = new BatteryWidget();
    console.log('[Batterie] Widget prêt');
});

// Fonction globale pour mise à jour depuis webSocket.js
window.updateBattery = function(data) {
    if (batteryWidget) {
        batteryWidget.updateBatteryData(data);
    } else {
        console.warn('[Batterie] Widget pas encore initialisé');
    }
};