// WhiteEpoch - 3D Room Generator
// Powered by Three.js

// ============ SCENE SETUP ============
let scene, camera, renderer, controls;
let room, character;
const clock = new THREE.Clock();
let isAnimatingCharacter = false;

function initScene() {
    const canvas = document.getElementById('canvas');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050812);
    scene.fog = new THREE.Fog(0x050812, 50, 100);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 4);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Simple orbit-like controls
    setupControls();

    // Lighting
    setupLighting();

    // Initial room
    generateRoom("modern minimalist office with plants and natural light");

    // Animation loop
    animate();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.getElementById('generateBtn').addEventListener('click', handleGenerate);
    document.getElementById('promptInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGenerate();
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            animateCharacter();
        }
        if (e.key === 'r' || e.key === 'R') {
            resetView();
        }
    });

    // Mouse controls for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * 0.01);
            
            const xAxis = new THREE.Vector3(1, 0, 0);
            camera.position.applyAxisAngle(xAxis, -deltaY * 0.01);
            
            camera.lookAt(scene.position);
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Zoom with scroll
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const currentDistance = camera.position.length();
        const newDistance = currentDistance + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed);
        const direction = camera.position.clone().normalize();
        camera.position.copy(direction.multiplyScalar(Math.max(2, Math.min(15, newDistance))));
        camera.lookAt(scene.position);
    });
}

function setupControls() {
    // Simple camera controls (orbit-like behavior)
    window.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) { // Left mouse button
            const speedRotation = 0.005;
            const x = (e.movementX) * speedRotation;
            const y = (e.movementY) * speedRotation;

            const position = camera.position;
            const sphere = new THREE.Spherical().setFromVector3(position);
            
            sphere.theta -= x;
            sphere.phi -= y;
            sphere.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphere.phi));

            position.setFromSpherical(sphere);
            camera.lookAt(scene.position);
        }
    });
}

function setupLighting() {
    // Hemisphere light for ambient
    const hemiLight = new THREE.HemisphereLight(0x00d4ff, 0xff006e, 0.5);
    scene.add(hemiLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    // Point lights for ambiance
    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.5, 20);
    pointLight1.position.set(5, 3, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff006e, 0.3, 20);
    pointLight2.position.set(-5, 3, -5);
    scene.add(pointLight2);
}

// ============ ROOM GENERATION ============
function generateRoom(prompt) {
    // Show loading
    document.getElementById('loadingSpinner').style.display = 'flex';

    // Clear previous room
    if (room) {
        scene.remove(room);
    }

    // Simulate processing delay
    setTimeout(() => {
        room = new THREE.Group();
        scene.add(room);

        // Determine room type based on prompt keywords
        const roomType = detectRoomType(prompt);
        
        // Build room
        buildRoom(roomType);
        buildFurniture(roomType);
        buildDecorations(roomType);

        // Create or update character
        if (!character) {
            character = createCharacter();
            room.add(character);
        }

        // Update info panel
        updateRoomInfo(roomType, prompt);

        // Hide loading
        document.getElementById('loadingSpinner').style.display = 'none';

        // Reset view
        resetView();
    }, 800);
}

function detectRoomType(prompt) {
    const lower = prompt.toLowerCase();
    
    if (lower.includes('bedroom') || lower.includes('sleep') || lower.includes('bed')) return 'bedroom';
    if (lower.includes('tech') || lower.includes('computer') || lower.includes('futuristic')) return 'tech';
    if (lower.includes('lounge') || lower.includes('relax') || lower.includes('luxury')) return 'lounge';
    if (lower.includes('office') || lower.includes('work') || lower.includes('desk')) return 'office';
    
    return 'living';
}

function buildRoom(type) {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(15, 15);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: type === 'tech' ? 0x1a1f3a : type === 'bedroom' ? 0x3d2817 : 0x2a2a2a,
        roughness: 0.8,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Ceiling
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9
    });
    const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
    ceiling.position.y = 3;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    room.add(ceiling);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: type === 'tech' ? 0x0f1419 : type === 'bedroom' ? 0x2a2a2a : 0x1f1f1f,
        roughness: 0.9
    });

    // Back wall
    const wallGeometry = new THREE.PlaneGeometry(15, 3);
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -7.5;
    backWall.position.y = 1.5;
    backWall.receiveShadow = true;
    room.add(backWall);

    // Side walls
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 3), wallMaterial);
    sideWall.rotation.y = Math.PI / 2;
    sideWall.position.x = -7.5;
    sideWall.position.y = 1.5;
    sideWall.receiveShadow = true;
    room.add(sideWall);

    const sideWall2 = new THREE.Mesh(new THREE.PlaneGeometry(15, 3), wallMaterial);
    sideWall2.rotation.y = Math.PI / 2;
    sideWall2.position.x = 7.5;
    sideWall2.position.y = 1.5;
    sideWall2.receiveShadow = true;
    room.add(sideWall2);

    // Window (back wall)
    if (type !== 'tech') {
        const windowGeometry = new THREE.PlaneGeometry(3, 2);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            emissive: 0x4da6ff,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(0, 2, -7.4);
        room.add(window);
    }

    // Ambient glow for tech rooms
    if (type === 'tech') {
        const glowGeometry = new THREE.PlaneGeometry(15, 3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -7.4;
        glow.position.y = 1.5;
        room.add(glow);
    }
}

function buildFurniture(type) {
    if (type === 'office' || type === 'tech') {
        // Desk
        const deskLegs = new THREE.BoxGeometry(0.1, 0.7, 0.1);
        const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        
        const legPositions = [[-0.8, 0, -0.5], [0.8, 0, -0.5], [-0.8, 0, 0.5], [0.8, 0, 0.5]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(deskLegs, metalMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            leg.receiveShadow = true;
            room.add(leg);
        });

        const deskTop = new THREE.BoxGeometry(1.8, 0.05, 1.2);
        const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.6 });
        const desk = new THREE.Mesh(deskTop, deskMaterial);
        desk.position.y = 0.75;
        desk.castShadow = true;
        desk.receiveShadow = true;
        room.add(desk);

        // Monitor
        if (type === 'tech') {
            const screenGeometry = new THREE.BoxGeometry(0.5, 0.35, 0.05);
            const screenMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                emissive: 0x00d4ff,
                emissiveIntensity: 0.3
            });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(0, 1.1, 0);
            screen.castShadow = true;
            room.add(screen);
        }

        // Chair
        const chairSeatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6);
        const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const chairSeat = new THREE.Mesh(chairSeatGeometry, chairMaterial);
        chairSeat.position.set(0, 0.5, 2);
        chairSeat.castShadow = true;
        chairSeat.receiveShadow = true;
        room.add(chairSeat);

        // Chair back
        const chairBackGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
        const chairBack = new THREE.Mesh(chairBackGeometry, chairMaterial);
        chairBack.position.set(0, 0.8, 1.7);
        chairBack.castShadow = true;
        chairBack.receiveShadow = true;
        room.add(chairBack);
    }

    if (type === 'bedroom') {
        // Bed
        const bedGeometry = new THREE.BoxGeometry(2, 0.3, 1.5);
        const bedMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6b47 });
        const bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(-3, 0.15, 0);
        bed.castShadow = true;
        bed.receiveShadow = true;
        room.add(bed);

        // Pillow
        const pillowGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.5);
        const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3 });
        const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow.position.set(-3, 0.35, -0.5);
        pillow.castShadow = true;
        room.add(pillow);
    }

    if (type === 'lounge') {
        // Sofa
        const sofaGeometry = new THREE.BoxGeometry(2.5, 0.8, 1);
        const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
        const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
        sofa.position.set(0, 0.4, -2);
        sofa.castShadow = true;
        sofa.receiveShadow = true;
        room.add(sofa);

        // Coffee table
        const tableGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.8);
        const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2d44 });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(0, 0.15, 0);
        table.castShadow = true;
        table.receiveShadow = true;
        room.add(table);
    }

    if (type === 'living') {
        // Sofa
        const sofaGeometry = new THREE.BoxGeometry(2.5, 0.7, 1);
        const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a });
        const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
        sofa.position.set(-1, 0.35, -2);
        sofa.castShadow = true;
        sofa.receiveShadow = true;
        room.add(sofa);

        // TV Stand
        const tvGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
        const tvMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a });
        const tvStand = new THREE.Mesh(tvGeometry, tvMaterial);
        tvStand.position.set(2, 0.25, -3);
        tvStand.castShadow = true;
        tvStand.receiveShadow = true;
        room.add(tvStand);
    }
}

function buildDecorations(type) {
    const decorGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    
    if (type === 'office') {
        // Plants
        const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const plant = new THREE.Mesh(decorGeometry, plantMaterial);
        plant.position.set(2, 0.2, 0);
        plant.castShadow = true;
        room.add(plant);

        const plant2 = new THREE.Mesh(decorGeometry, plantMaterial);
        plant2.position.set(-3, 0.2, 2);
        plant2.castShadow = true;
        room.add(plant2);
    }

    if (type === 'tech') {
        // Neon effects
        const neonGeometry = new THREE.BoxGeometry(0.1, 3, 6);
        const neonMaterial = new THREE.MeshBasicMaterial({
            color: 0xff006e,
            emissive: 0xff006e,
            emissiveIntensity: 0.5
        });
        const neon = new THREE.Mesh(neonGeometry, neonMaterial);
        neon.position.set(-7.3, 1.5, 0);
        room.add(neon);

        const neon2 = new THREE.Mesh(neonGeometry, neonMaterial);
        neon2.position.set(7.3, 1.5, 0);
        room.add(neon2);
    }

    // Generic decorative balls/orbs
    const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        metalness: 0.5
    });

    const orb = new THREE.Mesh(decorGeometry, lightMaterial);
    orb.position.set(3, 2, 3);
    orb.castShadow = true;
    room.add(orb);

    const orb2 = new THREE.Mesh(decorGeometry, lightMaterial);
    orb2.position.set(-3, 2, -3);
    orb2.castShadow = true;
    room.add(orb2);
}

// ============ CHARACTER CREATION ============
function createCharacter() {
    const character = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b9d });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    character.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.25;
    head.castShadow = true;
    character.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.06, 1.3, 0.12);
    character.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.06, 1.3, 0.12);
    character.add(rightEye);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, 0.8, 0);
    leftArm.castShadow = true;
    character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, 0.8, 0);
    rightArm.castShadow = true;
    character.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.1, 0.1, 0);
    leftLeg.castShadow = true;
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.1, 0.1, 0);
    rightLeg.castShadow = true;
    character.add(rightLeg);

    character.position.set(1, 0, 1);
    character.originalPosition = character.position.clone();

    return character;
}

function animateCharacter() {
    if (isAnimatingCharacter || !character) return;
    isAnimatingCharacter = true;

    const originalRotation = character.rotation.y;
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 0.5) {
            // Walk forward and wave
            const walkProgress = progress * 2;
            character.position.z -= walkProgress * 0.01;
            character.rotation.z = Math.sin(walkProgress * Math.PI * 4) * 0.2; // Sway
            
            // Wave arm
            const arms = character.children.filter((c, i) => i === 4 || i === 5);
            if (arms.length > 0) {
                arms[0].rotation.z = Math.sin(walkProgress * Math.PI * 8) * 0.8;
            }
        } else {
            // Walk back and relax
            const walkProgress = (progress - 0.5) * 2;
            character.position.z += walkProgress * 0.01;
            character.rotation.z = Math.sin(walkProgress * Math.PI * 4) * 0.1;
            
            const arms = character.children.filter((c, i) => i === 4 || i === 5);
            if (arms.length > 0) {
                arms[0].rotation.z = 0;
            }
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            character.rotation.z = 0;
            isAnimatingCharacter = false;
        }
    };

    animate();
}

function updateRoomInfo(type, prompt) {
    const infoPanel = document.getElementById('roomInfo');
    const typeNames = {
        office: '🖥️ Modern Office',
        bedroom: '🛏️ Cozy Bedroom',
        tech: '⚡ Tech Room',
        lounge: '🛋️ Luxury Lounge',
        living: '🏠 Living Room'
    };

    const descriptions = {
        office: 'A productive workspace with modern furniture, plants for freshness, and optimal lighting for focused work.',
        bedroom: 'A peaceful retreat with comfortable bedding, soft lighting, and a tranquil atmosphere for relaxation.',
        tech: 'A futuristic environment with neon accents, high-tech setup, and cutting-edge aesthetics.',
        lounge: 'An upscale relaxation space with premium furnishings, sophisticated lighting, and luxurious ambiance.',
        living: 'A welcoming common area with comfortable seating, entertainment setup, and warm lighting.'
    };

    infoPanel.innerHTML = `
        <p><strong>${typeNames[type]}</strong></p>
        <p>${descriptions[type]}</p>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-top: 1rem;">
            <em>"${prompt}"</em>
        </p>
        <p style="color: rgba(0, 212, 255, 0.8); font-size: 0.9rem; margin-top: 1rem;">
            ✨ Room generated successfully!
        </p>
    `;
}

// ============ EVENT HANDLERS ============
function handleGenerate() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (prompt.length > 0) {
        generateRoom(prompt);
    }
}

function resetView() {
    camera.position.set(0, 1.5, 4);
    camera.lookAt(scene.position);
}

function onWindowResize() {
    const canvas = document.getElementById('canvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', initScene);