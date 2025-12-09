/**
 * Charge un fichier HTML et l'insère dans un conteneur
 * @param {string} file - chemin du fichier HTML (ex: "orientation3D.html")
 * @param {string} containerId - id du conteneur cible (ex: "orientationWidget3D")
 */
function loadWidget(file, containerId) {
  fetch(file) // Utilisation de fetch pour charger le fichier HTML
    .then(response => {
      if (!response.ok) throw new Error("Erreur de chargement : " + response.status);
      return response.text();
    })
    .then(html => {
      document.getElementById(containerId).innerHTML = html; // Insère le contenu HTML dans le conteneur
    })
    .catch(error => {
      console.error("Erreur lors du chargement du widget :", error);
      document.getElementById(containerId).innerHTML = "<p>Impossible de charger le widget.</p>";
    });
