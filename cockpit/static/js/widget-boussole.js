(function() {
  const needle = document.getElementById('needle');
  const headingEl = document.getElementById('heading');
  const sourceEl = document.getElementById('source');
  const tiltEl = document.getElementById('tilt');
  const statusEl = document.getElementById('status');
  const noteEl = document.getElementById('note');
  const btnPerm = document.getElementById('btnPerm');
  const btnRecal = document.getElementById('btnRecal');

  // Réglages
  let declinaisonDeg = 0; // facultatif: corrige Nord magnétique -> Nord vrai (si vous connaissez la valeur locale)
  let headingOffset = 0;  // pour recalibrage manuel
  let usingMagnetometer = false;
  let usingDO = false;

  const toDeg = r => r * 180/Math.PI;
  const toRad = d => d * Math.PI/180;
  const clampDeg = d => (d%360 + 360) % 360;

  function setStatus(text, cls='') {
    statusEl.textContent = text;
    statusEl.className = cls;
  }

  function renderHeading(deg, tiltInfo='') {
    const hdg = clampDeg(deg + declinaisonDeg + headingOffset);
    needle.style.transform = `translate(-50%,-90%) rotate(${hdg}deg)`;
    headingEl.textContent = hdg.toFixed(0);
    tiltEl.textContent = tiltInfo || '—';
  }

  async function startMagnetometer() {
    if (!('Magnetometer' in window)) return false;
    try {
      const sensor = new Magnetometer({ frequency: 30 }); // ~30 Hz
      sensor.addEventListener('reading', () => {
        // Champ magnétique en microteslas (x vers Est, y vers Nord, z vers ciel selon certains repères)
        const { x, y, z } = sensor;

        // Calcul azimut projeté au plan horizontal (compensation approximative si z != 0)
        // Angle vers le nord (y), positif dans le sens horaire depuis le nord:
        // heading = atan2(x, y) (selon convention Android) puis conversion
        // NB: Les conventions d’axes peuvent varier; on privilégie l’orientation visuelle et un recalibrage utilisateur.
        let heading = clampDeg(toDeg(Math.atan2(x, y))); // 0° ≡ Nord
        renderHeading(heading, `|B|≈${Math.hypot(x,y,z).toFixed(1)}µT`);
      });
      sensor.addEventListener('error', (event) => {
        setStatus(`Magnetometer erreur: ${event.error?.name || event.name}`, 'err');
      });
      sensor.start();
      usingMagnetometer = true;
      sourceEl.textContent = 'Magnetometer';
      setStatus('Lecture capteur magnétique…', 'ok');
      return true;
    } catch (e) {
      setStatus(`Magnetometer indisponible (${e.message})`, 'warn');
      return false;
    }
  }

  function startDeviceOrientation() {
    if (!('DeviceOrientationEvent' in window)) return false;

    // iOS peut fournir webkitCompassHeading (0° = Nord, sens horaire)
    let hasWebkitCompass = false;

    window.addEventListener('deviceorientation', (ev) => {
      usingDO = true;
      sourceEl.textContent = 'DeviceOrientation';

      // Chemin 1: Safari iOS legacy
      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
        hasWebkitCompass = true;
        const heading = ev.webkitCompassHeading; // déjà en degrés, 0 = Nord
        renderHeading(heading, `acc:${(ev.webkitCompassAccuracy ?? '?')}°`);
        setStatus('Lecture orientation (iOS webkitCompassHeading)…', 'ok');
        return;
      }

      // Chemin 2: alpha/bêta/gamma (Euler)
      // alpha = rotation autour de z (0..360), bêta autour de x (inclinaison), gamma autour de y (roulis)
      // On veut l’azimut horizontal ("compass heading").
      let { alpha, beta, gamma } = ev; // en degrés
      if (alpha == null || beta == null || gamma == null) {
        setStatus('DeviceOrientation sans alpha/beta/gamma', 'warn');
        return;
      }

      // Convertir en radians
      const _alpha = toRad(alpha);
      const _beta  = toRad(beta);
      const _gamma = toRad(gamma);

      // Calcul de l’azimut corrigé de l’inclinaison (formule standard W3C draft)
      // ref: https://w3c.github.io/deviceorientation/#worked-example
      const cA = Math.cos(_alpha), sA = Math.sin(_alpha);
      const cB = Math.cos(_beta),  sB = Math.sin(_beta);
      const cG = Math.cos(_gamma), sG = Math.sin(_gamma);

      // Direction de l’axe "nord" projeté au plan horizontal
      const m11 = cA * cG - sA * sB * sG;
      const m12 = -cB * sA;
      const headingRad = Math.atan2(m12, m11);
      const headingDeg = clampDeg(toDeg(headingRad));

      const tiltText = `β=${beta.toFixed(0)}°, γ=${gamma.toFixed(0)}°`;
      renderHeading(headingDeg, tiltText);
      setStatus('Lecture orientation (alpha/beta/gamma)…', 'ok');
    }, { passive: true });

    return true;
  }

  async function init() {

    // Sur Android/Chrome: on peut démarrer directement (mais garder le bouton pour iOS)
    // On tente un démarrage auto gracieux:
    try {
      const ua = navigator.userAgent || '';
      const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (!isiOS) {
        const startedMag = await startMagnetometer();
        if (!startedMag) startDeviceOrientation();
      }
    } catch(e) {/* ignore */}
  }

  init();
})();