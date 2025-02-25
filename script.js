// Инициализация сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({antialias: true}); // параметр antialias: true сглаживает пиксели
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// параметры игры (создание и позиционирование шаров рандомного цвета)
const gridSize = 8;    // создание сетки
const ballSize = 0.5;  // относительный размер шарика
const spacing = 1.2;   // относительное расстояние между шариками (1.2 - 2 * ballSize = реальный размер между шариками)
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // массив цветов для шариков

const grid = []; // массив для вывода шариков

for( let x = 0; x < gridSize; x++) {
    grid[x] = [];
    for (let y = 0;  y < gridSize; y++) {
        const color = colors[Math.floor(Math.random() * colors.length)]; // присваивание рандомного цвета из массива
        // создание сферы
        const sphereGeometry = new THREE.SphereGeometry( ballSize, 32, 32 );
        const sphereMaterial = new THREE.MeshStandardMaterial( {color} );
        const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.position.set(
            x * spacing - (gridSize * spacing) / 2 + spacing / 2,
            y * spacing - (gridSize * spacing) / 2 + spacing / 2,
            0
        );
        scene.add( sphere );
        grid[x][y] = {sphere, color};
    }
}

// освещение
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 2, 1).normalize(); 
scene.add(directionalLight);

//  анимация отрисовки
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});