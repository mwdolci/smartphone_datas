const ws = new WebSocket("wss://smartphone-datas.onrender.com");

let lastAlpha = 0;
let lastBeta = 0;
let lastGamma = 0;
const SMOOTH_FACTOR = 0.05; // plus petit = plus lisse

// Affiche les logs dans la page
function log(msg) {
    const pre = document.getElementById('logOutput');
    pre.textContent += msg + "\n";
    pre.scrollTop = pre.scrollHeight;
}

function smoothAlpha(alpha) {
    let diff = alpha - lastAlpha;

    // corrige les sauts > 180°
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // applique un lissage
    lastAlpha += diff * SMOOTH_FACTOR; // vitesse de lissage (0 = pas de mouvement, 1 = sans lissage)
    return lastAlpha;
}

function smoothBeta(beta) {
    let diff = beta - lastBeta;

    // corrige les sauts > 180°
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // applique un lissage
    lastBeta += diff * SMOOTH_FACTOR; // vitesse de lissage (0 = pas de mouvement, 1 = sans lissage)
    return lastBeta;
}

function smoothGamma(gamma) {
    let diff = gamma - lastGamma;

    // corrige les sauts > 180°
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // applique un lissage
    lastGamma += diff * SMOOTH_FACTOR; // vitesse de lissage (0 = pas de mouvement, 1 = sans lissage)
    return lastGamma;
}

// Gestion WebSocket
ws.onopen = () => log("WebSocket ouverte !");
ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    log("Reçu : " + JSON.stringify(msg));
    const data = msg.data;

    switch (msg.capteur) {
        case "gps": document.getElementById('gpsOutput').textContent = JSON.stringify(data, null, 2); break;
        case "accelerometre": document.getElementById('accelOutput').textContent = JSON.stringify(data, null, 2); break;
        case "orientation":
            document.getElementById('orientationOutput').textContent = JSON.stringify(data, null, 2);

            const carTop = document.getElementById("carTop");
            const carSide = document.getElementById("carSide");
            const carBack = document.getElementById("carBack");

            const alpha = data.alpha || 0;		// rotation Z
            const beta  = data.beta  || 0;   	// rotation X
            const gamma = data.gamma || 0;   	// rotation Y

            const smoothAlphaValue = smoothAlpha(alpha);
            const smoothGammaValue = smoothGamma(gamma);
            const smoothBetaValue  = smoothBeta(beta);

            carTop.style.transform = `rotateZ(${-smoothAlphaValue}deg)`;
            carSide.style.transform = `rotateZ(${-smoothBetaValue}deg)`;
            carBack.style.transform = `rotateZ(${smoothGammaValue}deg)`; 

            updateCar3D(alpha, beta, gamma);

            break;

        case "battery": document.getElementById('batteryOutput').textContent = JSON.stringify(data, null, 2); break;
        case "micro": document.getElementById('microOutput').textContent = JSON.stringify(data, null, 2); break;
        case "camera": document.getElementById('cameraVideo').title = "Streaming"; break;
        case "time": document.getElementById('timeOutput').textContent = JSON.stringify(data, null, 2); break;
        case "network": document.getElementById('networkOutput').textContent = JSON.stringify(data, null, 2); break;
        default: break;
    }
};

ws.onerror = e => log("Erreur WebSocket : " + e);
ws.onclose = e => log("WebSocket fermée.");

// Fonction pour envoyer les données depuis le smartphone
function sendSensor(name, data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ capteur: name, data }));
        log("Envoyé : " + name);
    } else {
        log("WebSocket pas ouverte pour " + name + ", réessai...");
        setTimeout(() => sendSensor(name, data), 500);
    }
}

// Toggle debug section
function toggleDebug() {
    const content = document.getElementById('debugContent');
    const arrow = document.querySelector('.title-arrow');

    if (!content || !arrow) {
        console.error("Éléments debugContent ou title-arrow introuvables !");
        return;
    }

    content.classList.toggle('hidden');
    arrow.textContent = content.classList.contains('hidden') ? "►" : "▼";
}

// Fullscreen button functionality
document.querySelectorAll('.fullscreen-btn').forEach(btn => {
btn.addEventListener('click', () => {
    const widget = btn.closest('.widget');
    const isFullscreen = widget.classList.toggle('fullscreen');

    // Bloquer/débloquer le scroll de la page
    if (isFullscreen) {
        document.body.style.overflow = 'hidden'; // plus de scroll
    } else {
        document.body.style.overflow = '';       // scroll normal
    }
});
});