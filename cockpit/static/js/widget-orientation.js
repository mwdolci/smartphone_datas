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

// Normalisation du modèle 3D
function normalizeModel(model, targetSize = 150) {
    // Calcul de la bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    // Ajuste l'échelle pour unifier la taille
    const scaleFactor = targetSize / maxDim;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Recalcul de la bounding box après l'échelle
    box.setFromObject(model);

    // Centre horizontalement (X et Z)
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;

    // Aligne le bas du modèle sur Y = 0
    const minY = box.min.y;
    model.position.y -= minY; 
}

// Sélecteur de modèle
const model2DImages = {
    "car.glb": {
        top: "assets/images/car_top_2.png",
        side: "assets/images/car_side_2.png",
        back: "assets/images/car_back_2.png"
    },
    "car_3.glb": {
        top: "assets/images/car_top_3.png",
        side: "assets/images/car_side_3.png",
        back: "assets/images/car_back_3.png"
    },
    "car_5.glb": {
        top: "assets/images/car_top_5.png",
        side: "assets/images/car_side_5.png",
        back: "assets/images/car_back_5.png"
    }
    ,
    "Moto_2.glb": {
        top: "assets/images/moto_top_2.png",
        side: "assets/images/moto_side_2.png",
        back: "assets/images/moto_back_2.png"
    },
    "Trotinette_2.glb": {
        top: "assets/images/trotinette_top_2.png",
        side: "assets/images/trotinette_side_2.png",
        back: "assets/images/trotinette_back_2.png"
    },
    "Jet.glb": {
        top: "assets/images/jet_top.png",
        side: "assets/images/jet_side.png",
        back: "assets/images/jet_back.png"
    },
    "Rover.glb": {
        top: "assets/images/rover_top.png",
        side: "assets/images/rover_side.png",
        back: "assets/images/rover_back.png"
    },    
    "Smartphone.glb": {
        top: "assets/images/smartphone_top.png",
        side: "assets/images/smartphone_side.png",
        back: "assets/images/smartphone_back.png"
    }
};

function updateCar2DImages(modelName) {
    const images = model2DImages[modelName];
    if (!images) return;

    const carTop = document.getElementById("carTop");
    const carSide = document.getElementById("carSide");
    const carBack = document.getElementById("carBack");

    if (carTop) carTop.src = images.top;
    if (carSide) carSide.src = images.side;
    if (carBack) carBack.src = images.back;
}

// Configuration des modèles avec leurs rotations initiales et positions de caméra
const modelConfigs = {
    "car.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },  // en degrés
        cameraPosition: { x: 0, y: 50, z: 300 }
    },
    "car_3.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 50, z: 300 }
    }
    ,
    "car_5.glb": {
        initialRotation: { x: 10, y: 210, z: 0 },
        cameraPosition: { x: 0, y: 60, z: 300 }
    },
    "Moto_2.glb": {
        initialRotation: { x: 10, y: 210, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 350 }
    },
    "Trotinette_2.glb": {
        initialRotation: { x: 10, y: 300, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 600 }
    },
    "Jet.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 300 }
    },
    "Rover.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 600 }
    }
    ,
    "Smartphone.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 600 }
    }
};

// Gère le changement de modèle
const selector = document.getElementById("modelSelector");

// Écouteur d'événement pour le changement de modèle
selector.addEventListener("change", () => {
    const modelPath = "assets/images/" + selector.value;

    if (car3D) {
        scene.remove(car3D);
        car3D = null;
    }

    loader.load(modelPath, gltf => {
        car3D = gltf.scene;

        // Normalisation (taille, centrage, sol)
        normalizeModel(car3D, 200);

        // Appliquer la rotation initiale spécifique
        const config = modelConfigs[selector.value];
        if (config && config.initialRotation) {
            const deg = config.initialRotation;
            car3D.rotation.set(
                THREE.MathUtils.degToRad(deg.x),
                THREE.MathUtils.degToRad(deg.y),
                THREE.MathUtils.degToRad(deg.z)
            );
        }

        scene.add(car3D);

        // Ajuste la caméra si spécifié
        if (config && config.cameraPosition) {
            camera.position.set(
                config.cameraPosition.x,
                config.cameraPosition.y,
                config.cameraPosition.z
            );
            camera.lookAt(0, 0, 0); // oriente la caméra vers le centre
        }
    });

    updateCar2DImages(selector.value);
});

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