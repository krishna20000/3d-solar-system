const canvas = document.querySelector('#solar-system');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 120);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0x000000, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Soft light
scene.add(ambientLight);

// Point light at sun's position
const sunLight = new THREE.PointLight(0xffffff, 2.5, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Texture loader
const loader = new THREE.TextureLoader();
const texturePath = (name) => `assets/${name}.jpg`;

// Create the Sun with fallback if texture is missing
loader.load(
  texturePath('sun'),
  (texture) => {
    const sunMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 64, 64), sunMaterial);
    // Enhance the sun's appearance with a glow
    const sunGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.3 });
    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(8, 64, 64), sunGlowMaterial);
    sun.add(sunGlow);
    scene.add(sun);
  },
  undefined,
  () => {
    // Fallback if texture fails
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 64, 64), sunMaterial);
    scene.add(sun);
  }
);

// Starfield
const starGeo = new THREE.BufferGeometry();
const starCount = 10000;
const positions = [];

for (let i = 0; i < starCount; i++) {
  positions.push((Math.random() - 0.5) * 2000);
  positions.push((Math.random() - 0.5) * 2000);
  positions.push((Math.random() - 0.5) * 2000);
}

starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
const starField = new THREE.Points(starGeo, starMaterial);
scene.add(starField);

// Store planets for animation and controls in the correct order
const planetNames = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
const planets = new Array(planetNames.length);

function createPlanet(radius, name, distance, speed, index) {
  loader.load(
    texturePath(name),
    (texture) => {
      const material = new THREE.MeshStandardMaterial({ map: texture });
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { name };
      mesh.position.x = distance;
      scene.add(mesh);
      planets[index] = { planet: mesh, distance, speed, angle: Math.random() * Math.PI * 2, name };
      if (name === 'saturn') {
        loader.load('https://threejs.org/examples/textures/saturnringcolor.jpg', (saturnRingTexture) => {
          const saturnRingGeometry = new THREE.RingGeometry(10, 16, 64);
          const saturnRingMaterial = new THREE.MeshBasicMaterial({ map: saturnRingTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
          const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
          saturnRing.rotation.x = Math.PI / 2.2;
          saturnRing.position.copy(mesh.position);
          mesh.add(saturnRing);
        });
      }
    },
    undefined,
    () => {
      // Fallback if texture fails
      const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { name };
      mesh.position.x = distance;
      scene.add(mesh);
      planets[index] = { planet: mesh, distance, speed, angle: Math.random() * Math.PI * 2, name };
    }
  );
}

// Create planets in the correct order and index
createPlanet(0.38 * 3, 'mercury', 10, parseFloat(document.getElementById('mercury-speed').value), 0);
createPlanet(0.95 * 3, 'venus', 16, parseFloat(document.getElementById('venus-speed').value), 1);
createPlanet(1 * 3, 'earth', 22, parseFloat(document.getElementById('earth-speed').value), 2);
createPlanet(0.53 * 3, 'mars', 28, parseFloat(document.getElementById('mars-speed').value), 3);
createPlanet(11.2 * 3, 'jupiter', 40, parseFloat(document.getElementById('jupiter-speed').value), 4);
createPlanet(9.45 * 3, 'saturn', 55, parseFloat(document.getElementById('saturn-speed').value), 5);
createPlanet(4.0 * 3, 'uranus', 70, parseFloat(document.getElementById('uranus-speed').value), 6);
createPlanet(3.88 * 3, 'neptune', 85, parseFloat(document.getElementById('neptune-speed').value), 7);

// Update slider event listeners to update planet speeds
planetNames.forEach((name, i) => {
  document.getElementById(`${name}-speed`).addEventListener('input', e => {
    if (planets[i]) planets[i].speed = parseFloat(e.target.value);
  });
});

// --- Pause/Resume ---
let paused = false;
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

// --- Dark/Light Mode Toggle ---
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeToggle.textContent = document.body.classList.contains('light-mode') ? 'Dark Mode' : 'Light Mode';
});

// --- Hover Labels & Click Focus ---
const labelDiv = document.getElementById('label');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getIntersects(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(planets.filter(Boolean).map(p => p.planet));
}

renderer.domElement.addEventListener('mousemove', (event) => {
  const intersects = getIntersects(event);
  if (intersects.length > 0) {
    const planet = planets.find(p => p && p.planet === intersects[0].object);
    if (planet) {
      labelDiv.textContent = planet.name.charAt(0).toUpperCase() + planet.name.slice(1);
      labelDiv.style.display = 'block';
      labelDiv.style.left = `${event.clientX + 10}px`;
      labelDiv.style.top = `${event.clientY - 10}px`;
    }
  } else {
    labelDiv.style.display = 'none';
  }
});

renderer.domElement.addEventListener('mouseleave', () => {
  labelDiv.style.display = 'none';
});

renderer.domElement.addEventListener('click', (event) => {
  const intersects = getIntersects(event);
  if (intersects.length > 0) {
    const planet = planets.find(p => p && p.planet === intersects[0].object);
    if (planet) {
      // Smooth camera transition
      const target = planet.planet.position.clone();
      const camStart = camera.position.clone();
      const camEnd = target.clone().add(new THREE.Vector3(0, 8, 18));
      let t = 0;
      function animateCam() {
        t += 0.04;
        camera.position.lerpVectors(camStart, camEnd, t);
        controls.target.lerp(target, t);
        controls.update();
        if (t < 1) requestAnimationFrame(animateCam);
      }
      animateCam();
    }
  }
});

// --- Animate orbits (with pause) ---
function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    planets.forEach(p => {
      if (p) {
        p.angle += p.speed;
        p.planet.position.x = p.distance * Math.cos(p.angle);
        p.planet.position.z = p.distance * Math.sin(p.angle);
      }
    });
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
