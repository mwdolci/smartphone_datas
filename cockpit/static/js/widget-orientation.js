import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const container3D = document.getElementById("car3DContainer");
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
camera.position.set(0, 50, 300);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container3D.clientWidth, container3D.clientHeight);
container3D.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(light);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 3, 3);
scene.add(dirLight);

const loader = new GLTFLoader();
let car3D;

loader.load("assets/images/car.glb", gltf => {
    car3D = gltf.scene;
    car3D.scale.set(0.5, 0.5, 0.5);
    
    scene.add(car3D);
});

window.addEventListener("resize", () => {
    camera.aspect = container3D.clientWidth / container3D.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container3D.clientWidth, container3D.clientHeight);
});

function animate3D() {
    requestAnimationFrame(animate3D);
    renderer.render(scene, camera);
}
animate3D();

function updateCar3D(alpha, beta, gamma) {
    if (!car3D) return;

    const a = THREE.MathUtils.degToRad(smoothAlpha(alpha));
    const b = THREE.MathUtils.degToRad(smoothBeta(beta));
    const c = THREE.MathUtils.degToRad(smoothGamma(gamma));

    const euler = new THREE.Euler(-b, a + Math.PI, -c, 'ZYX');
    const targetQuat = new THREE.Quaternion().setFromEuler(euler);

    // lissage de la rotation
    car3D.quaternion.slerp(targetQuat, 0.1); 
}

// Expose la fonction pour le WebSocket
window.updateCar3D = updateCar3D;