/**
 * SMARTPHONE - Capture et envoi des données audio
 * 
 * Ce code capture le niveau audio du microphone et l'envoie via WebSocket
 * 
 * OPTION 1: Ajouter ce code dans smartphone/smartphone.html (entre <script> tags)
 * OPTION 2: Créer un fichier smartphone/microphone.js et l'importer
 * OPTION 3: Ajouter directement dans la console du smartphone pour tester
 */

// Configuration
const AUDIO_CONFIG = {
    // Intervalle d'envoi des données (ms)
    sendInterval: 100, // 10 fois par seconde
    
    // Paramètres Web Audio API
    fftSize: 256,
    smoothingTimeConstant: 0.8
};

// Variables globales
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let sendTimer = null;

/**
 * Initialise la capture audio
 */
async function initMicrophone() {
    try {
        console.log('[Micro] Demande d\'accès au microphone...');
        
        // Demande d'accès au microphone
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        console.log('[Micro] Accès au microphone accordé');
        
        // Création du contexte audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Création de l'analyseur
        analyser = audioContext.createAnalyser();
        analyser.fftSize = AUDIO_CONFIG.fftSize;
        analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;
        
        // Connexion du micro à l'analyseur
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        // Tableau pour stocker les données
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        console.log('[Micro] Analyseur audio initialisé');
        
        // Démarrage de l'envoi des données
        startSendingAudioData();
        
        return true;
    } catch (error) {
        console.error('[Micro] Erreur d\'initialisation:', error);
        
        // Affichage d'un message d'erreur à l'utilisateur
        if (error.name === 'NotAllowedError') {
            alert('Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
        } else if (error.name === 'NotFoundError') {
            alert('Aucun microphone détecté sur cet appareil.');
        } else {
            alert('Erreur lors de l\'initialisation du microphone: ' + error.message);
        }
        
        return false;
    }
}

/**
 * Calcule le niveau sonore en décibels
 */
function calculateDecibels() {
    if (!analyser || !dataArray) return 0;
    
    // Récupération des données de fréquence
    analyser.getByteFrequencyData(dataArray);
    
    // Calcul de la moyenne
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Conversion en décibels (approximation)
    // 0-255 → 0-100 dB (simplifié pour la visualisation)
    const decibels = (average / 255) * 100;
    
    return Math.round(decibels);
}

/**
 * Calcule la fréquence dominante
 */
function calculateDominantFrequency() {
    if (!analyser || !dataArray) return 0;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Trouve l'index de la fréquence avec l'amplitude maximale
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
        }
    }
    
    // Conversion de l'index en fréquence (Hz)
    // Formule: freq = (index * sampleRate) / fftSize
    const nyquist = audioContext.sampleRate / 2;
    const frequency = (maxIndex * nyquist) / dataArray.length;
    
    return Math.round(frequency);
}

/**
 * Démarre l'envoi périodique des données audio
 */
function startSendingAudioData() {
    if (sendTimer) {
        clearInterval(sendTimer);
    }
    
    sendTimer = setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('[Micro] WebSocket non connecté');
            return;
        }
        
        // Calcul des données audio
        const decibels = calculateDecibels();
        const frequency = calculateDominantFrequency();
        
        // Préparation du message
        const data = {
            decibels: decibels,
            frequency: frequency,
            timestamp: Date.now()
        };
        
        // Envoi via WebSocket
        const message = {
            capteur: 'micro',
            data: data
        };
        
        ws.send(JSON.stringify(message));
        
        // Log occasionnel (1 fois sur 10)
        if (Math.random() < 0.1) {
            console.log(`[Micro] Envoi: ${decibels} dB, ${frequency} Hz`);
        }
        
    }, AUDIO_CONFIG.sendInterval);
    
    console.log('[Micro] Envoi des données démarré');
}

/**
 * Arrête la capture audio
 */
function stopMicrophone() {
    if (sendTimer) {
        clearInterval(sendTimer);
        sendTimer = null;
    }
    
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    console.log('[Micro] Capture audio arrêtée');
}

// ==================================================================
// INTÉGRATION DANS SMARTPHONE.HTML
// ==================================================================
// 
// MÉTHODE 1: Bouton manuel
// Ajoutez ce HTML dans smartphone.html:
// 
// <button id="startMicroBtn" onclick="initMicrophone()">
//     Démarrer le microphone
// </button>
// 
// MÉTHODE 2: Démarrage automatique
// Ajoutez ceci dans l'événement DOMContentLoaded existant:
// 
// document.addEventListener('DOMContentLoaded', () => {
//     // Attendre que WebSocket soit connecté
//     setTimeout(() => {
//         if (ws && ws.readyState === WebSocket.OPEN) {
//             initMicrophone();
//         }
//     }, 1000);
// });
// 
// MÉTHODE 3: Intégration avec les autres capteurs
// Si vous avez déjà un système de boutons pour activer les capteurs,
// ajoutez un bouton "Micro" qui appelle initMicrophone()
// 
// ==================================================================
