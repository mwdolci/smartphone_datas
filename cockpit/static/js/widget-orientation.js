import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let lastAlpha = 0;
let lastBeta = 0;
let lastGamma = 0;
let lastUpdate2D = 0;
const interval2D = 100; // ms, limite la fréquence pour la 2D

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

function updateCar2D(alpha, beta, gamma) {
    const now = Date.now();
    if (now - lastUpdate2D < interval2D) return; // ignore si trop rapide -> evite saccades
    lastUpdate2D = now;

    const carTop = document.getElementById("carTop");
    const carSide = document.getElementById("carSide");
    const carBack = document.getElementById("carBack");

    const smoothAlphaValue = jumpAlpha(alpha);
    const smoothBetaValue  = jumpBeta(beta);
    const smoothGammaValue = jumpGamma(gamma);

    carTop.style.transform  = `rotateZ(${-smoothAlphaValue}deg)`;
    carSide.style.transform = `rotateZ(${-smoothBetaValue}deg)`;
    carBack.style.transform = `rotateZ(${smoothGammaValue}deg)`; 
}

// Conteneur 3D
const container3D = document.getElementById("car3DContainer");
const scene = new THREE.Scene();
scene.background = null;

// Caméra
const camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000); // Caméra perspective (FOV, aspect ratio, near, far)
camera.position.set(0, 50, 300); // Positionne la caméra ( x, y, z )

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Renderer avec transparence (antialias pour lisser les bords des objets)
renderer.setSize(container3D.clientWidth, container3D.clientHeight); // Taille du renderer
container3D.appendChild(renderer.domElement); // Ajoute le renderer au conteneur

// Lumières de la scène
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5); // Lumière ambiante
scene.add(light); 

// Lumière directionnelle
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 3, 3); // Positionne la lumière
scene.add(dirLight);

// Chargement du modèle 3D
const loader = new GLTFLoader();
let car3D;

// Chargement du modèle 3D de la voiture
loader.load("assets/images/car.glb", gltf => {
    car3D = gltf.scene;
    car3D.scale.set(0.5, 0.5, 0.5); // Ajuste l'échelle du modèle
    
    scene.add(car3D);
});

// Gère le redimensionnement de la fenêtre
window.addEventListener("resize", () => {
    camera.aspect = container3D.clientWidth / container3D.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container3D.clientWidth, container3D.clientHeight);
});

// Animation de la scène 3D
function animate3D() {
    requestAnimationFrame(animate3D);   // Boucle d'animation
    renderer.render(scene, camera);     // Rendu de la scène
}
animate3D();

// Met à jour l'orientation de la voiture 3D
function updateCar3D(alpha, beta, gamma) {
    if (!car3D) return;

    const a = THREE.MathUtils.degToRad(jumpAlpha(alpha));
    const b = THREE.MathUtils.degToRad(jumpBeta(beta));
    const c = THREE.MathUtils.degToRad(jumpGamma(gamma));

    const euler = new THREE.Euler(-b, a + Math.PI, -c, 'ZYX'); // Ordre des rotations
    const targetQuat = new THREE.Quaternion().setFromEuler(euler); // Crée un quaternion à partir des angles d'Euler (quaternion = indique une rotation dans l'espace 3D)

    car3D.quaternion.copy(targetQuat);
}

// Expose la fonction pour le WebSocket
window.updateCar2D = updateCar2D; // Permet d'appeler updateCar2D depuis d'autres fichiers JS
window.updateCar3D = updateCar3D; // Permet d'appeler updateCar3D depuis d'autres fichiers JS