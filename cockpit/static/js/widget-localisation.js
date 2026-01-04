/**
 * MapRenderer
 * -----------
 * Classe responsable de l'affichage d'une carte et du suivi d'une position GPS.
 *
 * Responsabilités :
 *   - créer et configurer la carte
 *   - afficher un marqueur représentant la position courante
 *   - tracer le chemin parcouru via une polyline
 *   - centrer automatiquement la carte sur la dernière position
 *   - fournir des méthodes pour mise à jour et reset
 *
 * Architecture :
 *   → aucune logique réseau ici
 *   → WebSocket ou autre source externe appelle updatePosition(lat, lon)
 *   → MapRenderer ne fait que rendre l’état courant
 */
class MapRenderer {
    constructor(mapElementId) {

        // --- 1) Création de la carte ---
        // Vue initiale centrée sur Berne (exemple)
        this.map = L.map(mapElementId, {}).setView([46.946536, 7.444987], 13);

        // --- 2) Fond de carte (OpenStreetMap) ---
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(this.map);

        // --- 3) Marqueur représentant la position actuelle ---
        this.marker = L.marker([46.946536, 7.444987]).addTo(this.map);

        // --- 4) Tracé du chemin parcouru ---
        this.path = L.polyline([], {
            color: 'red',
            weight: 4
        }).addTo(this.map);

        // Dernière position connue (null tant qu’aucune mise à jour)
        this.lastLatLng = null;
    }

    /**
     * Met à jour la position sur la carte.
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     *
     * Actions :
     *   - déplace le marqueur
     *   - ajoute la position au tracé
     *   - sauvegarde la dernière position
     *   - recentre la carte automatiquement
     */
    updatePosition(lat, lon) {
        const latlng = [lat, lon];

        // Déplace le marqueur
        this.marker.setLatLng(latlng);

        // Ajoute la position au tracé
        this.path.addLatLng(latlng);

        // Sauvegarde interne
        this.lastLatLng = latlng;

        // Centre la carte sur la nouvelle position
        this.center();
    }

    /**
     * Efface complètement le tracé (polyline).
     */
    resetPath() {
        this.path.setLatLngs([]);
    }

    /**
     * Centre la carte sur la dernière position connue.
     * Ne fait rien si aucune position n’a encore été reçue.
     */
    center() {
        if (this.lastLatLng) {
            this.map.setView(this.lastLatLng);
        }
    }
}

// Expose la classe globalement pour utilisation cockpit/WebSocket
window.MapRenderer = MapRenderer;

document.addEventListener("DOMContentLoaded", () => {

    // Création de l’objet carte
    const mapRenderer = new MapRenderer("map_geo");

    // Fonction globale appelée par WebSocket
    window.updateMapPosition = (lat, lon) => {
        mapRenderer.updatePosition(lat, lon);
    };

    // Bouton "reset" pour effacer le tracé
    const btnReset = document.getElementById("btnResetTrace");
    btnReset.addEventListener("click", () => {
        mapRenderer.resetPath();
    });

    // Version globale
    window.resetMapPath = () => {
        mapRenderer.resetPath();
    };
});
