/**
 * Widget Météo - Affiche les données météo en temps réel basées sur la position GPS
 * Utilise l'API OpenWeatherMap
 */

class WeatherWidget {
    constructor() {
        // Clé API OpenWeatherMap
        this.apiKey = 'b65b650c6b25d8a0e00bb975c11b94f7';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        
        // Dernière position connue
        this.lastPosition = null;
        
        // Interval de mise à jour (10 minutes)
        this.updateInterval = 600000; // 10 minutes en millisecondes
        this.updateTimer = null;
        
        // Limite de fréquence des appels API (max 1 par minute)
        this.lastApiCall = 0;
        this.apiCallCooldown = 60000; // 1 minute en millisecondes
        
        // Références aux éléments DOM
        this.elements = {
            loading: document.getElementById('meteo-loading'),
            error: document.getElementById('meteo-error'),
            errorMsg: document.getElementById('meteo-error-msg'),
            content: document.getElementById('meteo-content'),
            cityName: document.getElementById('meteo-city-name'),
            country: document.getElementById('meteo-country'),
            temperature: document.getElementById('meteo-temperature'),
            iconImg: document.getElementById('meteo-icon-img'),
            description: document.getElementById('meteo-desc'),
            feelsLike: document.getElementById('meteo-feels-like'),
            humidity: document.getElementById('meteo-humidity'),
            wind: document.getElementById('meteo-wind'),
            pressure: document.getElementById('meteo-pressure'),
            visibility: document.getElementById('meteo-visibility'),
            sunrise: document.getElementById('meteo-sunrise'),
            sunset: document.getElementById('meteo-sunset'),
            update: document.getElementById('meteo-update'),
            coordinates: document.getElementById('meteo-coordinates')
        };
        
        console.log('[Météo] Widget initialisé');
    }
    
    /**
     * Mise à jour de la position GPS (appelée par webSocket.js)
     */
    updatePosition(latitude, longitude) {
        console.log(`[Météo] Nouvelle position GPS reçue: ${latitude}, ${longitude}`);
        
        // Vérifie si la position a changé significativement (>1km)
        if (this.lastPosition) {
            const distance = this.calculateDistance(
                this.lastPosition.lat,
                this.lastPosition.lon,
                latitude,
                longitude
            );
            
            // Si déplacement < 1km et dernière MAJ < 10min, ne pas mettre à jour
            if (distance < 1 && (Date.now() - this.lastApiCall) < this.updateInterval) {
                console.log(`[Météo] Position similaire (${distance.toFixed(2)}km), pas de mise à jour`);
                return;
            }
        }
        
        // Sauvegarde la position
        this.lastPosition = { lat: latitude, lon: longitude };
        
        // Met à jour les coordonnées affichées
        if (this.elements.coordinates) {
            this.elements.coordinates.textContent = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
        
        // Récupère les données météo
        this.fetchWeatherData(latitude, longitude);
    }
    
    /**
     * Calcule la distance entre deux points GPS (en km)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Récupère les données météo depuis l'API OpenWeatherMap
     */
    async fetchWeatherData(latitude, longitude) {
        // Limite de fréquence des appels API
        const now = Date.now();
        if (now - this.lastApiCall < this.apiCallCooldown) {
            console.log('[Météo] Cooldown API actif, attente...');
            return;
        }
        
        this.lastApiCall = now;
        
        // Affiche le chargement
        this.showLoading();
        
        try {
            const url = `${this.baseUrl}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&lang=fr`;
            
            console.log(`[Météo] Appel API: ${url.replace(this.apiKey, 'HIDDEN')}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[Météo] Données reçues:', data);
            
            // Affiche les données
            this.displayWeatherData(data);
            
            // Programme la prochaine mise à jour automatique
            this.scheduleNextUpdate();
            
        } catch (error) {
            console.error('[Météo] Erreur lors de la récupération:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * Affiche les données météo
     */
    displayWeatherData(data) {
        // Ville et pays
        this.elements.cityName.textContent = data.name || '—';
        this.elements.country.textContent = data.sys?.country || '—';
        
        // Température
        const temp = Math.round(data.main.temp);
        this.elements.temperature.textContent = temp;
        
        // Icône météo
        if (data.weather && data.weather[0]) {
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            this.elements.iconImg.src = iconUrl;
            this.elements.iconImg.style.display = 'block';
            this.elements.iconImg.alt = data.weather[0].description;
            
            // Description
            const description = data.weather[0].description;
            this.elements.description.textContent = description.charAt(0).toUpperCase() + description.slice(1);
        }
        
        // Température ressentie
        this.elements.feelsLike.textContent = `${Math.round(data.main.feels_like)} °C`;
        
        // Humidité
        this.elements.humidity.textContent = `${data.main.humidity} %`;
        
        // Vent (conversion m/s vers km/h)
        const windSpeed = (data.wind.speed * 3.6).toFixed(1);
        this.elements.wind.textContent = `${windSpeed} km/h`;
        
        // Pression
        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
        
        // Visibilité (conversion mètres vers km)
        const visibility = (data.visibility / 1000).toFixed(1);
        this.elements.visibility.textContent = `${visibility} km`;
        
        // Lever et coucher du soleil
        if (data.sys) {
            this.elements.sunrise.textContent = this.formatTime(data.sys.sunrise);
            this.elements.sunset.textContent = this.formatTime(data.sys.sunset);
        }
        
        // Heure de mise à jour
        this.elements.update.textContent = new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Affiche le contenu
        this.showContent();
    }
    
    /**
     * Formate un timestamp Unix en heure locale
     */
    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Programme la prochaine mise à jour automatique
     */
    scheduleNextUpdate() {
        // Annule le timer précédent s'il existe
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        // Programme une nouvelle mise à jour dans 10 minutes
        this.updateTimer = setTimeout(() => {
            if (this.lastPosition) {
                console.log('[Météo] Mise à jour automatique programmée');
                this.fetchWeatherData(this.lastPosition.lat, this.lastPosition.lon);
            }
        }, this.updateInterval);
    }
    
    /**
     * Affiche l'état de chargement
     */
    showLoading() {
        this.elements.loading.style.display = 'block';
        this.elements.error.style.display = 'none';
        this.elements.content.style.display = 'none';
    }
    
    /**
     * Affiche le contenu météo
     */
    showContent() {
        this.elements.loading.style.display = 'none';
        this.elements.error.style.display = 'none';
        this.elements.content.style.display = 'block';
    }
    
    /**
     * Affiche une erreur
     */
    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.error.style.display = 'block';
        this.elements.content.style.display = 'none';
        this.elements.errorMsg.textContent = message;
    }
}

// Initialisation du widget
let weatherWidget;

document.addEventListener('DOMContentLoaded', () => {
    weatherWidget = new WeatherWidget();
    console.log('[Météo] Widget prêt');
});

// Fonction globale pour mise à jour depuis webSocket.js
window.updateWeather = function(latitude, longitude) {
    if (weatherWidget) {
        weatherWidget.updatePosition(latitude, longitude);
    } else {
        console.warn('[Météo] Widget pas encore initialisé');
    }
};
