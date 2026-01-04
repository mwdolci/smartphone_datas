/**
 * Configuration du module microphone.
 *
 * Architecture cockpit‑driven :
 *   → Ce module ne gère que la capture, l’analyse et l’envoi des données audio.
 *   → Aucune logique UI ici : uniquement du traitement Web Audio API.
 */
const AUDIO_CONFIG = {
    // Intervalle d'envoi des données (ms)
    sendInterval: 100, // 10 fois par seconde
    
    // Paramètres Web Audio API
    fftSize: 256,
    smoothingTimeConstant: 0.8
};

// Variables globales internes au module
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let sendTimer = null;

/**
 * Initialise la capture audio du microphone.
 *
 * Étapes :
 *   1. Demande d’accès au microphone (getUserMedia)
 *   2. Création du contexte audio
 *   3. Création d’un analyseur FFT
 *   4. Connexion du flux micro → analyseur
 *   5. Allocation du buffer de données
 *   6. Démarrage de l’envoi périodique des données
 *
 * @returns {Promise<boolean>} true si initialisation réussie, false sinon
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
        
        // Création de l'analyseur FFT
        analyser = audioContext.createAnalyser();
        analyser.fftSize = AUDIO_CONFIG.fftSize;
        analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;
        
        // Connexion du micro à l'analyseur
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        // Allocation du buffer pour les données FFT
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        console.log('[Micro] Analyseur audio initialisé');
        
        // Démarrage de l'envoi périodique
        startSendingAudioData();
        
        return true;

    } catch (error) {
        console.error('[Micro] Erreur d\'initialisation:', error);
        
        // Messages utilisateur selon le type d’erreur
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
 * Calcule un niveau sonore approximatif en décibels.
 *
 * Méthode :
 *   - Récupère les amplitudes FFT (0–255)
 *   - Calcule la moyenne
 *   - Convertit en une échelle 0–100 dB (approximation visuelle)
 *
 * @returns {number} Niveau sonore estimé en dB
 */
function calculateDecibels() {
    if (!analyser || !dataArray) return 0;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Moyenne des amplitudes
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Conversion simplifiée en dB
    const decibels = (average / 255) * 100;
    
    return Math.round(decibels);
}

/**
 * Calcule la fréquence dominante du signal audio.
 *
 * Méthode :
 *   - Analyse FFT
 *   - Recherche du bin avec amplitude maximale
 *   - Conversion index → fréquence en Hz
 *
 * @returns {number} Fréquence dominante estimée en Hz
 */
function calculateDominantFrequency() {
    if (!analyser || !dataArray) return 0;
    
    analyser.getByteFrequencyData(dataArray);
    
    let maxValue = 0;
    let maxIndex = 0;
    
    // Recherche du pic d’amplitude
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
        }
    }
    
    // Conversion index → fréquence
    const nyquist = audioContext.sampleRate / 2;
    const frequency = (maxIndex * nyquist) / dataArray.length;
    
    return Math.round(frequency);
}

/**
 * Démarre l’envoi périodique des données audio via WebSocket.
 *
 * Données envoyées :
 *   - decibels : niveau sonore estimé
 *   - frequency : fréquence dominante
 *   - timestamp : horodatage
 *
 * Envoi toutes les AUDIO_CONFIG.sendInterval ms.
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
        
        const message = {
            capteur: 'micro',
            data: data
        };
        
        ws.send(JSON.stringify(message));
        
        // Log occasionnel
        if (Math.random() < 0.1) {
            console.log(`[Micro] Envoi: ${decibels} dB, ${frequency} Hz`);
        }
        
    }, AUDIO_CONFIG.sendInterval);
    
    console.log('[Micro] Envoi des données démarré');
}

/**
 * Arrête proprement la capture audio et libère les ressources.
 *
 * Étapes :
 *   - Arrêt du timer d’envoi
 *   - Déconnexion du microphone
 *   - Fermeture du contexte audio
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
