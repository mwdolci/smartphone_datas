/**
 * Charge un fichier HTML et l'insère dans un conteneur donné.
 *
 * Fonction :
 *   → aucune logique métier ici
 *   → uniquement un loader générique pour widgets HTML externes
 *
 * @param {string} file - Chemin du fichier HTML à charger (ex: "orientation3D.html")
 * @param {string} containerId - ID du conteneur cible où injecter le HTML
 */
function loadWidget(file, containerId) {
  fetch(file) // Charge le fichier HTML via HTTP
    .then(response => {
      if (!response.ok) {
        // Gestion explicite des erreurs HTTP
        throw new Error("Erreur de chargement : " + response.status);
      }
      return response.text(); // Convertit la réponse en texte HTML
    })
    .then(html => {
      // Injection du contenu dans le conteneur cible
      document.getElementById(containerId).innerHTML = html;
    })
    .catch(error => {
      // Log technique + fallback visuel
      console.error("Erreur lors du chargement du widget :", error);
      document.getElementById(containerId).innerHTML =
        "<p>Impossible de charger le widget.</p>";
    });
}

/**
 * Affiche ou masque la section debug.
 *
 * Fonction :
 *   → toggle simple basé sur une classe CSS
 *   → met aussi à jour la flèche d’indication (► / ▼)
 */
function toggleDebug() {
    const content = document.getElementById('debugContent');
    const arrow = document.querySelector('.title-arrow');

    // Sécurité : éléments manquants
    if (!content || !arrow) {
        console.error("Éléments debugContent ou title-arrow introuvables !");
        return;
    }

    // Bouton pour la visibilité
    content.classList.toggle('hidden');

    // Mise à jour de la flèche
    arrow.textContent = content.classList.contains('hidden') ? "►" : "▼";
}

/**
 * Gestion globale des clics sur la page.
 *
 * Objectif :
 *   - détecter les clics sur les boutons fullscreen
 *   - basculer le widget associé en mode plein écran
 *   - bloquer/débloquer le scroll de la page
 *
 * Architecture :
 *   → un seul listener global
 *   → détection via delegation (matches)
 */
document.addEventListener('click', (e) => {

    // Vérifie si l'élément cliqué est un bouton fullscreen
    if (e.target.matches('.fullscreen-btn')) {
        const btn = e.target;

        // Trouve le widget parent (sécurité incluse)
        const widget = btn.closest('.widget');
        if (!widget) return;

        // Active/désactive le mode fullscreen
        const isFullscreen = widget.classList.toggle('fullscreen');

        // Bloque le scroll de la page en fullscreen
        document.body.style.overflow = isFullscreen ? 'hidden' : '';
    }
});
