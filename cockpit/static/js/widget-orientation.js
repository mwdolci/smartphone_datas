import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let lastUpdate2D = 0;
const interval2D = 100; // ms, limite la fréquence pour la 2D

// Met à jour l'orientation de la voiture 2D
function updateCar2D(alpha, beta, gamma) {
    const now = Date.now();
    if (now - lastUpdate2D < interval2D) return; // ignore si trop rapide -> evite saccades
    lastUpdate2D = now;

    const carTop = document.getElementById("carTop");
    const carSide = document.getElementById("carSide");
    const carBack = document.getElementById("carBack");

    carTop.style.transform  = `rotateZ(${-alpha}deg)`;
    carSide.style.transform = `rotateZ(${-beta}deg)`;
    carBack.style.transform = `rotateZ(${gamma}deg)`; 
}

// Conteneur 3D
const container3D = document.getElementById("car3DContainer");
const scene = new THREE.Scene();
scene.background = null;

// Normalisation du modèle 3D
function normalizeModel(model, targetSize = 150) {
    // Calcul du bounding box
    const box = new THREE.Box3().setFromObject(model); // Crée une boîte englobante autour du modèle (THREE permet de manipuler des objets 3D)
    const size = new THREE.Vector3(); // Vecteur pour stocker la taille
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z); // Trouve la dimension maximale

    // Ajuste l'échelle pour unifier la taille
    const scaleFactor = targetSize / maxDim; // Calcule le facteur d'échelle
    model.scale.set(scaleFactor, scaleFactor, scaleFactor); // Applique l'échelle au modèle

    // Recalcul de la bounding box après l'échelle
    box.setFromObject(model);

    // Centre horizontalement (X et Z)
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;

    // Aligne le bas du modèle sur Y = 0
    const minY = box.min.y;
    model.position.y -= minY; // Déplace le modèle vers le haut pour que le bas soit à Y=0
}

// Dictionnaire des images 2D pour chaque modèle 3D
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
    "Boat.glb": {
        top: "assets/images/boat_top.png",
        side: "assets/images/boat_side.png",
        back: "assets/images/boat_back.png"
    },  
    "Smartphone.glb": {
        top: "assets/images/smartphone_top.png",
        side: "assets/images/smartphone_side.png",
        back: "assets/images/smartphone_back.png"
    }
};

// Met à jour les images 2D en fonction du modèle sélectionné
function updateCar2DImages(modelName) {
    const images = model2DImages[modelName]; // Récupère les images correspondantes
    if (!images) return; // Si pas d'images définies, quitte la fonction

    // Met à jour les sources des images
    const carTop = document.getElementById("carTop");
    const carSide = document.getElementById("carSide");
    const carBack = document.getElementById("carBack");

    // Met à jour les images à partir du chemin construit via le dictionnaire
    if (carTop) carTop.src = images.top; 
    if (carSide) carSide.src = images.side;
    if (carBack) carBack.src = images.back;
}

// Dictionnaire des configurations des modèles avec leurs rotations initiales, positions de caméra et offsets si 3D mal orienté nativement
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
        cameraPosition: { x: 0, y: 60, z: 300 },
        rotationOffset: { x: 0, y: 180, z: 0 } //offset le modèle 3D est nativement mal orienté
    },
    "Moto_2.glb": {
        initialRotation: { x: 10, y: 210, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 350 },
        rotationOffset: { x: 0, y: 180, z: 0 } //offset le modèle 3D est nativement mal orienté
    },
    "Trotinette_2.glb": {
        initialRotation: { x: 10, y: 300, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 600 },
        rotationOffset: { x: 0, y: 270, z: 0 } //offset le modèle 3D est nativement mal orienté
    },
    "Jet.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 300 }
    },
    "Rover.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 600 }
    },
    "Boat.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 500 }
    },
    "Smartphone.glb": {
        initialRotation: { x: 10, y: 30, z: 0 },
        cameraPosition: { x: 0, y: 100, z: 600 },
        rotationOffset: { x: 90, y: 180, z: 0 } //offset le modèle 3D est nativement mal orienté
    }
};

// Gère le changement de modèle
const selector = document.getElementById("modelSelector");

// Écouteur d'événement pour le changement de modèle
selector.addEventListener("change", () => {
    const modelPath = "assets/images/" + selector.value; // Chemin du modèle 3D sélectionné

    // Supprime l'ancien modèle 3D de la scène
    if (car3D) {
        scene.remove(car3D);
        car3D = null;
    }

    // Charge le nouveau modèle 3D (gltf=format pour modèles 3D)
    loader.load(modelPath, gltf => {
        car3D = gltf.scene; // Récupère le modèle 3D

        // Normalisation (taille, centrage, sol)
        normalizeModel(car3D, 200);

        // Appliquer la rotation initiale spécifique pour garantie une bonne vue au départ
        const config = modelConfigs[selector.value];
        if (config && config.initialRotation) {
            const deg = config.initialRotation;
            car3D.rotation.set(
                THREE.MathUtils.degToRad(deg.x),
                THREE.MathUtils.degToRad(deg.y),
                THREE.MathUtils.degToRad(deg.z)
            );
        }

        scene.add(car3D); // Ajoute le modèle à la scène

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

    updateCar2DImages(selector.value); // Met à jour aussi les images 2D
});

// Caméra
const camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000); // Caméra perspective (FOV, aspect ratio, near, far)
camera.position.set(0, 50, 300); // Positionne la caméra ( x, y, z )

// Renderer (affichage)
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
const loader = new GLTFLoader(); // Loader pour les fichiers glTF, permet de charger des modèles 3D
let car3D;

// Premier choix à la création de la page
selector.value = "car.glb";
selector.dispatchEvent(new Event("change"));

// Gère le redimensionnement de la fenêtre
window.addEventListener("resize", () => {
    camera.aspect = container3D.clientWidth / container3D.clientHeight; // Met à jour le ratio d'aspect
    camera.updateProjectionMatrix(); // Met à jour la matrice de projection (ça recalcul la vue)
    renderer.setSize(container3D.clientWidth, container3D.clientHeight); // Met à jour la taille du renderer
});

// Animation de la scène 3D
function animate3D() {
    requestAnimationFrame(animate3D);   // Boucle d'animation (permet d'appeler la fonction à chaque frame -> 1 frame = 1/60s environ)
    renderer.render(scene, camera);     // Rendu de la scène
}
animate3D();

// Met à jour l'orientation de la voiture 3D
function updateCar3D(alpha, beta, gamma) {
    if (!car3D) return; // Si le modèle 3D n'est pas encore chargé, quitte la fonction

    // Convertit les angles de degrés à radians
    const a = THREE.MathUtils.degToRad(alpha);
    const b = THREE.MathUtils.degToRad(beta);
    const c = THREE.MathUtils.degToRad(gamma);

    const euler = new THREE.Euler(-b, a + Math.PI, -c, 'ZYX'); // Ordre des rotations (euler = rotation autour des axes X, Y, Z)
    const targetQuat = new THREE.Quaternion().setFromEuler(euler); // Crée un quaternion à partir des angles d'Euler (un quaternion est une façon de représenter une rotation en 3D)

    // Applique l'offset d'orientation si défini (corrige les modèles mal orientés nativement)
    const config = modelConfigs[selector.value];
    if (config && config.rotationOffset) {
        const offset = config.rotationOffset; // Récupère l'offset
        const offsetQuat = new THREE.Quaternion().setFromEuler( // Crée un quaternion pour l'offset
            new THREE.Euler(
                THREE.MathUtils.degToRad(offset.x),
                THREE.MathUtils.degToRad(offset.y),
                THREE.MathUtils.degToRad(offset.z)
            )
        );
        targetQuat.multiply(offsetQuat); // Applique l'offset au quaternion cible
    }

    car3D.quaternion.copy(targetQuat); // Met à jour la rotation du modèle 3D
}

// Expose la fonction pour le WebSocket
window.updateCar2D = updateCar2D; // Permet d'appeler updateCar2D depuis d'autres fichiers JS
window.updateCar3D = updateCar3D; // Permet d'appeler updateCar3D depuis d'autres fichiers JS