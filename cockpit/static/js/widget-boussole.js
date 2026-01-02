class CompassRenderer {
    constructor() {
        this.needle = document.getElementById('needle');
        this.headingEl = document.getElementById('heading');
        this.sourceEl = document.getElementById('source');
        this.tiltEl = document.getElementById('tilt');
        this.statusEl = document.getElementById('status');

        this.declinaisonDeg = 0;
        this.headingOffset = 0;

        // 🔥 Nouveau : heading filtré
        this.prevHeading = null;
        this.filterStrength = 0.15; // LPF (0.05 = très lent, 0.3 = rapide)
    }

    clampDeg(d) {
        return (d % 360 + 360) % 360;
    }

    // 🔥 Fonction anti-saut : interpolation shortest-path
    smoothAngle(prev, next) {
        let delta = next - prev;

        // Ramène delta dans [-180, +180]
        delta = ((delta + 180) % 360 + 360) % 360 - 180;

        return prev + delta * this.filterStrength;
    }

    renderHeading(smoothAlphaValue, smoothBetaValue, smoothGammaValue, source = '') {

        const heading = this.computeHeadingFromEuler(
            smoothAlphaValue,
            smoothBetaValue,
            smoothGammaValue
        );

        const rawHdg = this.clampDeg(heading + this.declinaisonDeg + this.headingOffset);

        // 🔥 Initialisation du filtre
        if (this.prevHeading === null) {
            this.prevHeading = rawHdg;
        }

        // 🔥 Anti-saut + LPF
        const filteredHdg = this.smoothAngle(this.prevHeading, rawHdg);
        this.prevHeading = filteredHdg;

        const tiltText = `β=${smoothBetaValue.toFixed(0)}°, γ=${smoothGammaValue.toFixed(0)}°`;

        this.needle.style.transform = `translate(-50%,-90%) rotate(${filteredHdg}deg)`;
        this.headingEl.textContent = filteredHdg.toFixed(0);
        this.tiltEl.textContent = tiltText || '—';
        this.sourceEl.textContent = source;
    }

    setStatus(text, cls = '') {
        this.statusEl.textContent = text;
        this.statusEl.className = cls;
    }

    computeHeadingFromEuler(alpha, beta, gamma) {
        const toRad = d => d * Math.PI / 180;

        const _alpha = toRad(alpha);
        const _beta  = toRad(beta);
        const _gamma = toRad(gamma);

        const cA = Math.cos(_alpha), sA = Math.sin(_alpha);
        const cB = Math.cos(_beta),  sB = Math.sin(_beta);
        const cG = Math.cos(_gamma), sG = Math.sin(_gamma);

        const m11 = cA * cG - sA * sB * sG;
        const m12 = -cB * sA;

        return Math.atan2(m12, m11) * 180 / Math.PI;
    }
}

window.CompassRenderer = CompassRenderer;
