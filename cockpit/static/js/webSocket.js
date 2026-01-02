document.addEventListener("DOMContentLoaded", () => {
    let lastAlpha = 0;
    let lastBeta = 0;
    let lastGamma = 0;
    const compass = new CompassRenderer();
    const ws = new WebSocket("wss://smartphone-datas.onrender.com");

    // Affiche les logs dans la page
    function log(msg) {
        const pre = document.getElementById('logOutput');
        pre.textContent += msg + "\n";      // Ajoute le message au contenu existant
        pre.scrollTop = pre.scrollHeight;   // Scroll automatique vers le bas
    }

    // Gestion WebSocket
    ws.onopen = () => log("WebSocket ouverte !");
    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        log("Reçu : " + JSON.stringify(msg));
        const data = msg.data;

        if (msg.type === "offer") {
            console.log('[WebSocket] Offre WebRTC reçue');
            if (typeof window.handleCameraOffer === 'function') {
                window.handleCameraOffer(msg.offer, ws);
            }
            return; // Arrêter le traitement, ne pas aller dans le switch
        }
    
        if (msg.type === "ice") {
            console.log('[WebSocket] Candidat ICE reçu');
            if (typeof window.handleCameraIce === 'function') {
                window.handleCameraIce(msg.candidate);
            }
            return; // Arrêter le traitement, ne pas aller dans le switch
        }

        switch (msg.capteur) {
            case "gps":  
                document.getElementById('gpsOutput').textContent = JSON.stringify(data, null, 2);  
                
                // Mise à jour de la carte
                window.updateMapPosition(data.latitude, data.longitude);
                
                // Mise à jour du widget météo
                if (typeof window.updateWeather === 'function') {
                    window.updateWeather(data.latitude, data.longitude);
                }
                
                break;
                
            case "accelerometre": 
                document.getElementById('accelOutput').textContent = JSON.stringify(data, null, 2); 
                break;
                
            case "orientation":
                document.getElementById('orientationOutput').textContent = JSON.stringify(data, null, 2);

                const alpha = data.alpha || 0;		// rotation Z
                const beta  = data.beta  || 0;   	// rotation X
                const gamma = data.gamma || 0;   	// rotation Y

                const smoothAlphaValue = jumpAlpha(alpha);
                const smoothBetaValue  = jumpBeta(beta);
                const smoothGammaValue = jumpGamma(gamma);

                // --- Voiture 2D et 3D ---
                updateCar2D(smoothAlphaValue, smoothBetaValue, smoothGammaValue);
                updateCar3D(smoothAlphaValue, smoothBetaValue, smoothGammaValue);

                // --- Boussole ---
                compass.renderHeading(
                    alpha,
                    beta,
                    gamma,
                    "Smartphone orientation"
                );

                compass.setStatus("pret", "status-ok");

                break;

            case "battery": 
                document.getElementById('batteryOutput').textContent = JSON.stringify(data, null, 2);
                
                if (typeof window.updateBattery === 'function') {
                    window.updateBattery(data);
                }
                
                break;
                
            case "micro": 
                document.getElementById('microOutput').textContent = JSON.stringify(data, null, 2);
                
                // Mise à jour du widget microphone 
                if (typeof window.updateMicrophone === 'function') {
                    window.updateMicrophone(data);
                }
                
                break;
                
            case "camera": 
                document.getElementById('cameraVideo').title = "Streaming"; 
                break;
                
            case "time": 
                document.getElementById('timeOutput').textContent = JSON.stringify(data, null, 2); 
                
                const [h, m, s] = data.localeTime.split(":").map(Number);
                clock.setTime(h, m, s);

                break;
                
            case "network": 
                document.getElementById('networkOutput').textContent = JSON.stringify(data, null, 2);
                
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

    // Permet d'éviter les sauts brusques d'angles
    function jumpAlpha(alpha) {
        let diff = alpha - lastAlpha;
        if (diff > 180) alpha -= 360;
        if (diff < -180) alpha += 360;
        lastAlpha = alpha;
        return alpha;
    }

    // Permet d'éviter les sauts brusques d'angles
    function jumpBeta(beta) {
        let diff = beta - lastBeta;
        if (diff > 180) beta -= 360;
        if (diff < -180) beta += 360;
        lastBeta = beta;
        return beta;
    }

    // Permet d'éviter les sauts brusques d'angles
    function jumpGamma(gamma) {
        let diff = gamma - lastGamma;
        if (diff > 180) gamma -= 360;
        if (diff < -180) gamma += 360;
        lastGamma = gamma;
        return gamma;
    }

});