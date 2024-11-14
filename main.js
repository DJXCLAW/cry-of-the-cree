// HTML Loading Bar Setup
const loadingBarContainer = document.createElement('div');
loadingBarContainer.style.position = 'fixed';
loadingBarContainer.style.top = '50%';
loadingBarContainer.style.left = '50%';
loadingBarContainer.style.transform = 'translate(-50%, -50%)';
loadingBarContainer.style.width = '50%';
loadingBarContainer.style.backgroundColor = '#333';
loadingBarContainer.style.padding = '5px';
loadingBarContainer.style.zIndex = '20';

const loadingBar = document.createElement('div');
loadingBar.style.height = '20px';
loadingBar.style.width = '0%';
loadingBar.style.backgroundColor = '#00ff00';

loadingBarContainer.appendChild(loadingBar);
document.body.appendChild(loadingBarContainer);

// Variable Declarations
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const flashlight = new THREE.SpotLight(0xffffff, 2, 100, Math.PI / 4, 0.5, 2);
const loader = new THREE.GLTFLoader();
const controls = new THREE.PointerLockControls(camera, document.body);
const keys = {};
const movementSpeed = 1;
const raycaster = new THREE.Raycaster();
const forwardDirection = new THREE.Vector3();
let snowGround, wendigo;
let isWendigoChasing = false;
let gameOver = false; // Game-over flag
let totalAssetsToLoad = 2;
let assetsLoaded = 0;

// Wendigo Size Variable
const wendigoSize = 0.01;




// Shop Variables
let playerPoints = 0;
let health = 30;
const healthPrice = 10;
const healthIncrease = 5;
const speedUpgradeCosts = [20, 50, 80];
let currentSpeedLevel = 1;
let maxSpeedLevel = 4;

// Scene Setup
scene.background = new THREE.Color(0x000000);

// Camera Setup
camera.position.set(0, 1.8, 10);

// Renderer Setup
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting Setup
flashlight.position.set(0, 1, 10);
flashlight.target.position.set(0, 0, 0);
scene.add(flashlight);
scene.add(flashlight.target);

// Crosshair Setup
const crosshair = document.createElement('div');
crosshair.id = 'crosshair';
document.body.appendChild(crosshair);

// Crosshair Styles
const style = document.createElement('style');
style.innerHTML = `
#crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 2px;
    background-color: red;
    transform: translate(-50%, -50%);
}
#crosshair::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    width: 2px;
    height: 20px;
    background-color: red;
    transform: translateX(-50%);
}
`;
document.head.appendChild(style);

// Crosshair Position Update
let crosshairPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Default crosshair position (center)

// Update crosshair position on mouse move
document.addEventListener('mousemove', (event) => {
    crosshairPosition.x = event.clientX;
    crosshairPosition.y = event.clientY;
    crosshair.style.left = `${crosshairPosition.x - 10}px`;
    crosshair.style.top = `${crosshairPosition.y - 10}px`;
});

// Convert screen position to world direction based on crosshair
function getDirectionFromCrosshair() {
    const x = (crosshairPosition.x / window.innerWidth) * 2 - 1; 
    const y = -(crosshairPosition.y / window.innerHeight) * 2 + 1;
    
    const vector = new THREE.Vector3(x, y, -1); 
    vector.unproject(camera); 
    const direction = vector.sub(camera.position).normalize(); 

    return direction;
}

// Ray-cast based Wendigo Chase
function wendigoChase() {
    if (gameOver || !wendigo || !isWendigoChasing) return;

    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, wendigo.position).normalize();

    raycaster.set(wendigo.position, direction);
    const obstacles = raycaster.intersectObjects(scene.children, true);

    if (obstacles.length === 0 || obstacles[0].distance > 1.5) {
        wendigo.position.add(direction.multiplyScalar(0.05));
    }

    const distance = camera.position.distanceTo(wendigo.position);
    if (distance < 1.5) {
        triggerGameOver();
    }
}


// Adjust Wendigo speed over time
setInterval(() => {
    if (isWendigoChasing && !gameOver) {
        wendigo.position.add(direction.multiplyScalar(0.2 + (currentSpeedLevel * 0.3))); // Wendigo speeds up gradually
    }
}, 1000);




// Jump-scare Image Setup
const jumpscareImg = document.createElement('img');
jumpscareImg.src = 'https://cdn.glitch.global/c8de2782-11cd-4c27-a80b-cf07bd0d4af7/wendigo_by_coadou_day7mjz-fullview.jpg?v=1731079743810';
jumpscareImg.style.position = 'fixed';
jumpscareImg.style.top = '0';
jumpscareImg.style.left = '0';
jumpscareImg.style.width = '100vw';
jumpscareImg.style.height = '100vh';
jumpscareImg.style.zIndex = '10';
jumpscareImg.style.display = 'none';
document.body.appendChild(jumpscareImg);

// Asset Loading Progress Update
function updateLoadingProgress() {
    assetsLoaded += 1;
    const progressPercentage = (assetsLoaded / totalAssetsToLoad) * 100;
    loadingBar.style.width = `${progressPercentage}%`;
    if (progressPercentage === 100) {
        loadingBarContainer.style.display = 'none';
    }
}

// Load Snow Ground Model
loader.load(
    'https://cdn.glitch.global/c8de2782-11cd-4c27-a80b-cf07bd0d4af7/snow_raw_scan.glb?v=1731067981635',
    (gltf) => {
        snowGround = gltf.scene;
        snowGround.scale.set(50, 50, 50);
        snowGround.position.set(0, 0, 0);
        scene.add(snowGround);
        updateLoadingProgress();
    },
    (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        loadingBar.style.width = `${progress / 2}%`; 
    },
    (error) => console.error('An error occurred while loading the snow ground model:', error)
);


// Ray-cast to check for collision with the snow ground
function checkGroundCollision() {
    const rayOrigin = camera.position.clone();
    const rayDirection = new THREE.Vector3(0, -1, 0); // Ray going downwards
    raycaster.set(rayOrigin, rayDirection);

    const intersects = raycaster.intersectObjects([snowGround], true); // Check for intersection with the snow ground

    if (intersects.length > 0) {
        // Get the distance to the ground (intersection point)
        const groundDistance = intersects[0].distance;
        const playerHeight = camera.position.y;

        // If the player is too far above the ground (e.g., moving up a steep hill), prevent movement
        if (playerHeight - groundDistance > 1) {
            return false; // Block movement if too high above the ground
        }
    }
    return true; // Allow movement if the player is not too far from the ground
}

// Player Movement based on crosshair direction, with collision check
function handleMovement() {
    const direction = getDirectionFromCrosshair();

    if (keys['w'] || keys['arrowup']) {
        // Only move forward if there's no collision
        if (checkGroundCollision()) {
            camera.position.add(direction.multiplyScalar(movementSpeed * 0.1));
        }
    }

    if (keys['s'] || keys['arrowdown']) {
        // Only move backward if there's no collision
        if (checkGroundCollision()) {
            camera.position.add(direction.multiplyScalar(-movementSpeed * 0.1));
        }
    }

    if (keys['a'] || keys['arrowleft']) {
        const sidewaysDirection = new THREE.Vector3();
        sidewaysDirection.crossVectors(camera.up, direction).normalize();
        if (checkGroundCollision()) {
            camera.position.add(sidewaysDirection.multiplyScalar(-movementSpeed * 0.1));
        }
    }

    if (keys['d'] || keys['arrowright']) {
        const sidewaysDirection = new THREE.Vector3();
        sidewaysDirection.crossVectors(camera.up, direction).normalize();
        if (checkGroundCollision()) {
            camera.position.add(sidewaysDirection.multiplyScalar(movementSpeed * 0.1));
        }
    }
}





// Load Wendigo Model
loader.load(
    'https://cdn.glitch.global/c8de2782-11cd-4c27-a80b-cf07bd0d4af7/wendigo.glb?v=1731066920698',
    (gltf) => {
        wendigo = gltf.scene;
        wendigo.scale.set(wendigoSize, wendigoSize, wendigoSize);
        wendigo.position.set(0, -1, 50);
        scene.add(wendigo);
        updateLoadingProgress();

        setTimeout(() => {
            isWendigoChasing = true;
        }, 5000);
    },
    (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        loadingBar.style.width = `${50 + progress / 2}%`; 
    },
    (error) => console.error('An error occurred while loading the model:', error)
);

// Pointer Lock and Camera Controls
document.addEventListener('click', () => controls.lock());

// Movement Controls
document.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

// Player Movement based on crosshair direction, with collision check
function handleMovement() {
    const direction = getDirectionFromCrosshair();

    // Set the raycaster origin from the player's position, going downwards to check ground level
    const rayOrigin = camera.position.clone();
    const rayDirection = new THREE.Vector3(0, -1, 0); // Ray going downwards
    raycaster.set(rayOrigin, rayDirection);

    const intersects = raycaster.intersectObject(snowGround, true); // Check for intersection with snow ground

    if (intersects.length > 0) {
        const groundLevel = intersects[0].point.y; // Get the y-coordinate of the ground at the intersection point

        // Only allow movement along the X and Z axes, maintain fixed height above ground
        if (keys['w'] || keys['arrowup']) {
            camera.position.add(new THREE.Vector3(direction.x, 0, direction.z).normalize().multiplyScalar(movementSpeed * 0.2));
        }
        if (keys['s'] || keys['arrowdown']) {
            camera.position.add(new THREE.Vector3(-direction.x, 0, -direction.z).normalize().multiplyScalar(movementSpeed * 0.1));
        }
        if (keys['a'] || keys['arrowleft']) {
            const sidewaysDirection = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
            camera.position.add(new THREE.Vector3(sidewaysDirection.x, 0, sidewaysDirection.z).multiplyScalar(-movementSpeed * 0.1));
        }
        if (keys['d'] || keys['arrowright']) {
            const sidewaysDirection = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
            camera.position.add(new THREE.Vector3(sidewaysDirection.x, 0, sidewaysDirection.z).multiplyScalar(movementSpeed * 0.1));
        }

        // Keep the player at the ground level
        camera.position.y = groundLevel + 1.8; // Adjust height above ground
    }
}


// Trigger Game Over
function triggerGameOver() {
    gameOver = true;
    jumpscareImg.style.display = 'block'; // Display jumpscare image
}

// Handle Shop Functionality
function openShop() {
    if (playerPoints >= healthPrice) {
        health += healthIncrease;
        playerPoints -= healthPrice;
    }
    // Speed Upgrade Handling
    if (playerPoints >= speedUpgradeCosts[currentSpeedLevel - 1] && currentSpeedLevel < maxSpeedLevel) {
        movementSpeed += 0.5;
        currentSpeedLevel++;
        playerPoints -= speedUpgradeCosts[currentSpeedLevel - 1];
    }
}

// Animation Loop
function animate() {
    if (!gameOver) {
        requestAnimationFrame(animate);
        flashlight.position.copy(camera.position);
        flashlight.target.position.copy(camera.getWorldDirection(new THREE.Vector3()).add(camera.position));

        handleMovement();
        wendigoChase();
        renderer.render(scene, camera);
    }
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Listen for Enter Key to Access Shop
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        openShop();
    }
});
