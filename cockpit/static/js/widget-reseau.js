/**
 * Widget Réseau - Visualisation de l'état réseau du smartphone
 */

class NetworkWidget {
    constructor() {
        // Références DOM
        this.statusIndicator = document.getElementById('network-status-indicator');
        this.statusText = document.getElementById('network-status-text');
        this.typeIcon = document.getElementById('network-icon');
        this.typeName = document.getElementById('network-type-name');
        this.qualityLabel = document.getElementById('network-quality-label');
        this.downlink = document.getElementById('network-downlink');
        this.rtt = document.getElementById('network-rtt');
        this.saveData = document.getElementById('network-savedata');
        this.signalQuality = document.getElementById('network-signal-quality');
        this.lastUpdate = document.getElementById('network-last-update');
        this.canvas = document.getElementById('network-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Historique pour le graphique
        this.rttHistory = [];
        this.maxHistoryLength = 30;
        
        // État actuel
        this.currentType = null;
        
        console.log('[Réseau] Widget initialisé');
    }
    
    /**
     * Mise à jour des données réseau
     */
    updateNetworkData(data) {
        console.log('[Réseau] Données reçues:', data);
        
        // Mise à jour du statut
        this.updateStatus(true);
        
        // Type de connexion
        const effectiveType = data.effectiveType || '—';
        this.updateConnectionType(effectiveType);
        
        // Vitesse de téléchargement
        let downlinkValue = data.downlink;
        if (typeof downlinkValue === 'string') {
            downlinkValue = parseFloat(downlinkValue.replace(' Mbps', ''));
        }
        this.updateDownlink(downlinkValue);
        
        // RTT (latence)
        let rttValue = data.rtt;
        if (typeof rttValue === 'string') {
            rttValue = parseInt(rttValue.replace(' ms', ''));
        }
        this.updateRTT(rttValue);
        
        // Économie de données
        const saveDataEnabled = data.saveData || false;
        if (this.saveData) {
            this.saveData.textContent = saveDataEnabled ? 'Activée' : 'Désactivée';
            this.saveData.style.color = saveDataEnabled ? '#ff9800' : '#4caf50';
        }
        
        // Qualité globale
        this.updateQuality(effectiveType, rttValue, downlinkValue);
        
        // Dernière mise à jour
        if (this.lastUpdate) {
            const now = new Date();
            this.lastUpdate.textContent = now.toLocaleTimeString();
        }
        
        // Graphique
        this.updateGraph();
    }
    
    /**
     * Mise à jour du type de connexion
     */
    updateConnectionType(type) {
        this.currentType = type;
        
        if (this.typeName) {
            this.typeName.textContent = this.getConnectionName(type);
        }
        
        if (this.typeIcon) {
            this.typeIcon.textContent = this.getConnectionIcon(type);
        }
    }
    
    /**
     * Nom lisible de la connexion
     */
    getConnectionName(type) {
        const names = {
            'slow-2g': '2G Lent',
            '2g': '2G',
            '3g': '3G',
            '4g': '4G / LTE',
            '5g': '5G',
            'wifi': 'WiFi',
            'ethernet': 'Ethernet'
        };
        return names[type] || type.toUpperCase();
    }
    
    /**
     * Icône selon le type
     */
    getConnectionIcon(type) {
        const icons = {
            'slow-2g': '📶',
            '2g': '📶',
            '3g': '📡',
            '4g': '📡',
            '5g': '🚀',
            'wifi': '📶',
            'ethernet': '🔌'
        };
        return icons[type] || '📡';
    }
    
    /**
     * Mise à jour de la vitesse de téléchargement
     */
    updateDownlink(value) {
        if (this.downlink && value !== undefined && value !== null) {
            this.downlink.textContent = value.toFixed(1);
        }
    }
    
    /**
     * Mise à jour du RTT
     */
    updateRTT(value) {
        if (this.rtt && value !== undefined && value !== null) {
            this.rtt.textContent = Math.round(value);
            
            // Ajouter à l'historique
            this.rttHistory.push(value);
            if (this.rttHistory.length > this.maxHistoryLength) {
                this.rttHistory.shift();
            }
        }
    }
    
    /**
     * Mise à jour de la qualité globale
     */
    updateQuality(type, rtt, downlink) {
        let quality = 0; // 0-5
        let qualityText = 'Inconnue';
        
        // Qualité basée sur le type
        const typeScores = {
            'slow-2g': 1,
            '2g': 2,
            '3g': 3,
            '4g': 4,
            '5g': 5,
            'wifi': 4,
            'ethernet': 5
        };
        quality = typeScores[type] || 3;
        
        // Ajustement selon RTT
        if (rtt < 50) quality = Math.min(5, quality + 1);
        else if (rtt > 200) quality = Math.max(1, quality - 1);
        
        // Ajustement selon downlink
        if (downlink > 10) quality = Math.min(5, quality + 1);
        else if (downlink < 1) quality = Math.max(1, quality - 1);
        
        // Texte de qualité
        const qualityTexts = ['Très mauvaise', 'Mauvaise', 'Moyenne', 'Bonne', 'Très bonne', 'Excellente'];
        qualityText = qualityTexts[quality] || 'Inconnue';
        
        // Mise à jour des barres
        for (let i = 1; i <= 5; i++) {
            const bar = document.getElementById('bar' + i);
            if (bar) {
                if (i <= quality) {
                    bar.classList.add('active');
                    // Couleur selon qualité
                    if (quality <= 2) {
                        bar.style.background = '#ef4444';
                    } else if (quality <= 3) {
                        bar.style.background = '#ff9800';
                    } else {
                        bar.style.background = '#4caf50';
                    }
                } else {
                    bar.classList.remove('active');
                }
            }
        }
        
        // Label de qualité
        if (this.qualityLabel) {
            this.qualityLabel.textContent = qualityText;
        }
        
        if (this.signalQuality) {
            this.signalQuality.textContent = quality + '/5';
        }
    }
    
    /**
     * Mise à jour du graphique RTT
     */
    updateGraph() {
        if (!this.ctx || this.rttHistory.length < 2) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Effacer
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Échelle
        const maxRtt = Math.max(...this.rttHistory, 100);
        const step = width / (this.maxHistoryLength - 1);
        
        // Ligne
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#4caf50';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.rttHistory.length; i++) {
            const x = i * step;
            const y = height - (this.rttHistory[i] / maxRtt) * height;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Remplissage
        this.ctx.lineTo(width, height);
        this.ctx.lineTo(0, height);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        this.ctx.fill();
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

// Initialisation
let networkWidget;

document.addEventListener('DOMContentLoaded', () => {
    networkWidget = new NetworkWidget();
    console.log('[Réseau] Widget prêt');
});

// Fonction globale pour webSocket.js
window.updateNetwork = function(data) {
    if (networkWidget) {
        networkWidget.updateNetworkData(data);
    } else {
        console.warn('[Réseau] Widget pas encore initialisé');
    }
};