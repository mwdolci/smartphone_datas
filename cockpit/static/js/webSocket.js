/**
 * Gestion centrale des capteurs envoyés par le smartphone via WebSocket.
 *
 * Architecture cockpit‑driven :
 *   - Ce fichier ne contient aucune logique métier : uniquement du dispatch.
 *   - Chaque capteur met à jour son widget dédié (carte, météo, boussole, etc.).
 *   - Les fonctions externes (updateCar2D, updateWeather, updateBattery, etc.)
 *     sont appelées uniquement si elles existent.
 *
 * Fonctionnalités :
 *   - Connexion WebSocket au serveur smartphone-datas
 *   - Réception et affichage des données capteurs
 *   - Gestion WebRTC (offer / ICE)
 *   - Lissage des angles (anti‑saut ±180°)
 *   - Mise à jour de la boussole, voiture 2D/3D, horloge, carte, météo, etc.
 */

document.addEventListener("DOMContentLoaded", () => {

    // Dernières valeurs d’angles pour éviter les sauts brusques
    let lastAlpha = 0;
    let lastBeta = 0;
    let lastGamma = 0;

    // Boussole cockpit-friendly
    const compass = new CompassRenderer();

    // Connexion WebSocket au backend
    const ws = new WebSocket("wss://smartphone-datas.onrender.com");

    /**
     * Ajoute un message dans la zone de logs.
     */
    function log(msg) {
        const pre = document.getElementById('logOutput');
        pre.textContent += msg + "\n";
        pre.scrollTop = pre.scrollHeight; // Scroll automatique
    }

    // --- Gestion WebSocket ---

    ws.onopen = () => log("WebSocket ouverte !");

    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        log("Reçu : " + JSON.stringify(msg));

        const data = msg.data;

        // --- Gestion WebRTC : offres et ICE ---
        if (msg.type === "offer") {
            console.log('[WebSocket] Offre WebRTC reçue');
            if (typeof window.handleCameraOffer === 'function') {
                window.handleCameraOffer(msg.offer, ws);
            }
            return; // Stop ici, ne pas passer dans le switch
        }

        if (msg.type === "ice") {
            console.log('[WebSocket] Candidat ICE reçu');
            if (typeof window.handleCameraIce === 'function') {
                window.handleCameraIce(msg.candidate);
            }
            return;
        }

        // --- Dispatch des capteurs ---
        switch (msg.capteur) {

            case "gps":
                document.getElementById('gpsOutput').textContent =
                    JSON.stringify(data, null, 2);

                // Mise à jour carte
                window.updateMapPosition(data.latitude, data.longitude);

                // Mise à jour météo si widget chargé
                if (typeof window.updateWeather === 'function') {
                    window.updateWeather(data.latitude, data.longitude);
                }
                break;

            case "accelerometre":
                document.getElementById('accelOutput').textContent =
                    JSON.stringify(data, null, 2);
                break;

            case "orientation":
                document.getElementById('orientationOutput').textContent =
                    JSON.stringify(data, null, 2);

                // Angles bruts
                const alpha = data.alpha || 0; // rotation Z
                const beta  = data.beta  || 0; // rotation X
                const gamma = data.gamma || 0; // rotation Y

                // Lissage anti-saut ±180°
                const smoothAlphaValue = jumpAlpha(alpha);
                const smoothBetaValue  = jumpBeta(beta);
                const smoothGammaValue = jumpGamma(gamma);

                // Mise à jour voiture 2D/3D
                updateCar2D(smoothAlphaValue, smoothBetaValue, smoothGammaValue);
                updateCar3D(smoothAlphaValue, smoothBetaValue, smoothGammaValue);

                // Mise à jour boussole (heading)
                compass.renderHeading(
                    alpha,
                    beta,
                    gamma,
                    "Smartphone orientation"
                );

                compass.setStatus("pret", "status-ok");
                break;

            case "battery":
                document.getElementById('batteryOutput').textContent =
                    JSON.stringify(data, null, 2);

                if (typeof window.updateBattery === 'function') {
                    window.updateBattery(data);
                }
                break;

            case "micro":
                document.getElementById('microOutput').textContent =
                    JSON.stringify(data, null, 2);

                if (typeof window.updateMicrophone === 'function') {
                    window.updateMicrophone(data);
                }
                break;

            case "camera":
                document.getElementById('cameraVideo').title = "Streaming";
                break;

            case "time":
                document.getElementById('timeOutput').textContent =
                    JSON.stringify(data, null, 2);

                // Mise à jour horloge cockpit
                const [h, m, s] = data.localeTime.split(":").map(Number);
                clock.setTime(h, m, s);
                break;

            case "network":
                document.getElementById('networkOutput').textContent =
                    JSON.stringify(data, null, 2);

                if (typeof window.updateNetwork === 'function') {
                    window.updateNetwork(data);
                }
                break;

            default:
                break;
        }
    };

    ws.onerror = e => log("Erreur WebSocket : " + e);
    ws.onclose = e => log("WebSocket fermée.");

    /**
     * Envoie un capteur vers le serveur WebSocket.
     * Réessaie automatiquement si la connexion n’est pas encore ouverte.
     */
    function sendSensor(name, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ capteur: name, data }));
            log("Envoyé : " + name);
        } else {
            log("WebSocket pas ouverte pour " + name + ", réessai...");
            setTimeout(() => sendSensor(name, data), 500);
        }
    }

    // --- Fonctions anti-saut pour les angles ---
    // Empêchent les transitions brutales lorsque l’angle traverse ±180°

    function jumpAlpha(alpha) {
        let diff = alpha - lastAlpha;
        if (diff > 180) alpha -= 360;
        if (diff < -180) alpha += 360;
        lastAlpha = alpha;
        return alpha;
    }

    function jumpBeta(beta) {
        let diff = beta - lastBeta;
        if (diff > 180) beta -= 360;
        if (diff < -180) beta += 360;
        lastBeta = beta;
        return beta;
    }

    function jumpGamma(gamma) {
        let diff = gamma - lastGamma;
        if (diff > 180) gamma -= 360;
        if (diff < -180) gamma += 360;
        lastGamma = gamma;
        return gamma;
    }

});
