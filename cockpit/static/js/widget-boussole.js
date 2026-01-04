/**
 * CompassRenderer
 * ----------------
 * Rend un compas HTML en utilisant les angles d’Euler fournis par les capteurs
 * (alpha, beta, gamma). Applique :
 *   - une correction de déclinaison magnétique
 *   - un offset manuel
 *   - un filtrage LPF pour lisser le heading
 *   - une interpolation shortest‑path pour éviter les sauts à ±180°
 *
 * Le renderer met à jour :
 *   - l’aiguille (rotation CSS)
 *   - l’affichage du heading filtré
 *   - l’affichage de la source et du tilt
 *
 * Architecture :
 *   → aucune logique de capteur ici
 *   → uniquement du rendu + filtrage
 */
class CompassRenderer {
    constructor() {
        // Références DOM
        this.needle = document.getElementById('needle');
        this.headingEl = document.getElementById('heading');
        this.sourceEl = document.getElementById('source');
        this.tiltEl = document.getElementById('tilt');
        this.statusEl = document.getElementById('status');

        // Corrections appliquées au heading brut
        this.declinaisonDeg = 0; // Correction magnétique
        this.headingOffset = 0;  // Offset manuel cockpit

        // Filtrage du heading
        this.prevHeading = null;     // Dernière valeur filtrée
        this.filterStrength = 0.15;  // LPF (0.05 = lent, 0.3 = rapide)
    }

    /**
     * Normalise un angle dans [0, 360)
     */
    clampDeg(d) {
        return (d % 360 + 360) % 360;
    }

    /**
     * Interpolation shortest‑path entre deux angles.
     * Empêche les sauts brutaux lorsque l’angle traverse ±180°.
     *
     * Exemple :
     *   prev = 350°, next = 10° → delta = +20° (pas -340°)
     */
    smoothAngle(prev, next) {
        let delta = next - prev;

        // Ramène delta dans [-180, +180]
        delta = ((delta + 180) % 360 + 360) % 360 - 180;

        // LPF : interpolation pondérée
        return prev + delta * this.filterStrength;
    }

    /**
     * Met à jour le compas à partir des angles filtrés (alpha, beta, gamma).
     * Applique :
     *   - calcul du heading via matrice Euler
     *   - correction déclinaison + offset
     *   - interpolation anti‑saut
     *   - filtrage LPF
     *   - mise à jour DOM
     */
    renderHeading(smoothAlphaValue, smoothBetaValue, smoothGammaValue, source = '') {

        // Heading brut issu des angles d’Euler
        const heading = this.computeHeadingFromEuler(
            smoothAlphaValue,
            smoothBetaValue,
            smoothGammaValue
        );

        // Heading corrigé
        const rawHdg = this.clampDeg(heading + this.declinaisonDeg + this.headingOffset);

        // Initialisation du filtre
        if (this.prevHeading === null) {
            this.prevHeading = rawHdg;
        }

        // Anti‑saut + LPF
        const filteredHdg = this.smoothAngle(this.prevHeading, rawHdg);
        this.prevHeading = filteredHdg;

        // Affichage du tilt
        const tiltText = `β=${smoothBetaValue.toFixed(0)}°, γ=${smoothGammaValue.toFixed(0)}°`;

        // Mise à jour DOM
        this.needle.style.transform = `translate(-50%,-90%) rotate(${filteredHdg}deg)`;
        this.headingEl.textContent = filteredHdg.toFixed(0);
        this.tiltEl.textContent = tiltText || '—';
        this.sourceEl.textContent = source;
    }

    /**
     * Met à jour le statut affiché sous le compas.
     */
    setStatus(text, cls = '') {
        this.statusEl.textContent = text;
        this.statusEl.className = cls;
    }

    /**
     * Calcule le heading à partir des angles d’Euler (alpha, beta, gamma).
     * Utilise la matrice de rotation standard Z-X'-Y''.
     *
     * Retourne un heading en degrés dans [-180, +180].
     */
    computeHeadingFromEuler(alpha, beta, gamma) {
        const toRad = d => d * Math.PI / 180;

        const _alpha = toRad(alpha);
        const _beta  = toRad(beta);
        const _gamma = toRad(gamma);

        const cA = Math.cos(_alpha), sA = Math.sin(_alpha);
        const cB = Math.cos(_beta),  sB = Math.sin(_beta);
        const cG = Math.cos(_gamma), sG = Math.sin(_gamma);

        // Éléments de la matrice de rotation
        const m11 = cA * cG - sA * sB * sG;
        const m12 = -cB * sA;

        // Heading = atan2(m12, m11)
        return Math.atan2(m12, m11) * 180 / Math.PI;
    }
}

// Export global
window.CompassRenderer = CompassRenderer;