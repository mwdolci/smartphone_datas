/**
 * Widget Caméra - Affichage du flux vidéo en direct
 * Utilise WebRTC pour recevoir le flux du smartphone
 */
class CameraWidget {
    constructor() {
        this.statusIndicator = document.getElementById('camera-status-indicator');
        this.statusText = document.getElementById('camera-status-text');
        this.videoElement = document.getElementById('cameraStream');
        this.overlay = document.getElementById('camera-overlay');
        this.qualityElement = document.getElementById('camera-quality');
        this.stateElement = document.getElementById('camera-state');
        
        this.peerConnection = null;
        
        console.log('[Caméra] Widget initialisé');
        console.log('[Caméra] Element vidéo:', this.videoElement);
        
        // Events vidéo
        if (this.videoElement) {
            this.videoElement.addEventListener('loadedmetadata', () => {
                console.log('[Caméra] ✅ Métadonnées chargées');
                const w = this.videoElement.videoWidth;
                const h = this.videoElement.videoHeight;
                console.log('[Caméra] Résolution:', w + 'x' + h);
                if (this.qualityElement) {
                    this.qualityElement.textContent = w + 'x' + h;
                }
            });
            
            this.videoElement.addEventListener('play', () => {
                console.log('[Caméra] ✅ Lecture démarrée');
                this.hideOverlay();
                this.updateState('En cours');
            });
            
            this.videoElement.addEventListener('error', (e) => {
                console.error('[Caméra] ❌ Erreur vidéo:', e);
            });
        }
        
        this.updateStatus(false, 'En attente...');
    }
    
    /**
     * Traiter l'offre WebRTC
     */
    async handleOffer(offer, ws) {
        console.log('[Caméra] 📥 Réception offre WebRTC');
        
        try {
            // Créer la connexion si elle n'existe pas
            if (!this.peerConnection) {
                console.log('[Caméra] Création PeerConnection...');
                this.peerConnection = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ]
                });
                
                // Recevoir les pistes
                this.peerConnection.ontrack = (event) => {
                    console.log('[Caméra] ✅ Piste reçue !');
                    console.log('[Caméra] Streams:', event.streams);
                    
                    if (event.streams && event.streams[0]) {
                        console.log('[Caméra] Attribution stream à la vidéo...');
                        this.videoElement.srcObject = event.streams[0];
                        
                        // Forcer la lecture
                        this.videoElement.play().then(() => {
                            console.log('[Caméra] ✅ Lecture forcée réussie');
                            this.hideOverlay();
                            this.updateStatus(true, 'Streaming');
                            this.updateState('Streaming');
                        }).catch(err => {
                            console.error('[Caméra] ❌ Erreur lecture:', err);
                        });
                    }
                };
                
                // ICE candidates
                this.peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log('[Caméra] 📤 Envoi ICE candidate');
                        ws.send(JSON.stringify({
                            type: 'ice',
                            candidate: event.candidate
                        }));
                    }
                };
                
                // État connexion
                this.peerConnection.onconnectionstatechange = () => {
                    const state = this.peerConnection.connectionState;
                    console.log('[Caméra] État connexion:', state);
                    
                    if (state === 'connected') {
                        this.updateStatus(true, 'Connecté');
                    } else if (state === 'failed' || state === 'disconnected') {
                        this.updateStatus(false, 'Déconnecté');
                        this.showOverlay();
                    }
                };
            }
            
            // Définir la description distante
            console.log('[Caméra] Définition remote description...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('[Caméra] ✅ Remote description définie');
            
            // Créer la réponse
            console.log('[Caméra] Création answer...');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('[Caméra] ✅ Answer créée');
            
            // Envoyer la réponse
            ws.send(JSON.stringify({
                type: 'answer',
                answer: answer
            }));
            console.log('[Caméra] ✅ Answer envoyée');
            
            this.updateStatus(true, 'Négociation...');
            
        } catch (error) {
            console.error('[Caméra] ❌ Erreur WebRTC:', error);
            this.updateStatus(false, 'Erreur');
            this.updateState('Erreur: ' + error.message);
        }
    }
    
    /**
     * Traiter un candidat ICE
     */
    async handleIceCandidate(candidate) {
        console.log('[Caméra] 📥 Réception ICE candidate');
        
        if (this.peerConnection) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[Caméra] ✅ ICE candidate ajouté');
            } catch (error) {
                console.error('[Caméra] ❌ Erreur ICE:', error);
            }
        } else {
            console.warn('[Caméra] ⚠️ PeerConnection pas encore créée');
        }
    }
    
    hideOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
    
    showOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
    }
    
    updateState(state) {
        if (this.stateElement) {
            this.stateElement.textContent = state;
        }
    }
    
    updateStatus(connected, message = null) {
        if (this.statusIndicator && this.statusText) {
            if (connected) {
                this.statusIndicator.style.color = '#4caf50';
                this.statusText.textContent = message || 'Connecté';
                this.statusText.style.color = '#4caf50';
            } else {
                this.statusIndicator.style.color = '#ef4444';
                this.statusText.textContent = message || 'Déconnecté';
                this.statusText.style.color = '#ef4444';
            }
        }
    }
}

// Initialisation
let cameraWidget;

document.addEventListener('DOMContentLoaded', () => {
    cameraWidget = new CameraWidget();
    console.log('[Caméra] Widget prêt');
});

// Fonctions globales
window.handleCameraOffer = function(offer, ws) {
    console.log('[Global] handleCameraOffer appelé');
    if (cameraWidget) {
        cameraWidget.handleOffer(offer, ws);
    } else {
        console.error('[Global] ❌ cameraWidget pas initialisé !');
    }
};

window.handleCameraIce = function(candidate) {
    console.log('[Global] handleCameraIce appelé');
    if (cameraWidget) {
        cameraWidget.handleIceCandidate(candidate);
    } else {
        console.error('[Global] ❌ cameraWidget pas initialisé !');
    }
};