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


// поиск группы шариков одного цвета
function findGroup(x, y, visited, group) {
    const color = grid[x][y].color;
    if(!color || visited[x][y]) return; // если шарик пуст или уже проверен, функция завершается
    visited[x][y] = true; // параметр, определяющий отмеченный шарик
    group.push({x, y}); // добавляем новые шарики вместо исчезнувшей группы

    // направления смещения по сетке
    const directions = [
        {dx: 1, dy: 0},
        {dx: -1, dy: 0},
        {dx: 0, dy: 1},
        {dx: 0, dy: -1},
    ];

    // перебираем каждый элемент массива directions
    for (const {dx, dy} of directions) {
        let nx = x + dx; // координата x c учетом направления
        let ny = y + dy;
        // проверки: координаты не выходят за границы сетки и соседний шарик совпадает по цвету
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && grid[nx][ny].color === color) {
            findGroup(nx, ny, visited, group);
        }
    }
}

window.addEventListener('click', (event) => {
    event.preventDefault();
    // Vector2 создаст объект с полями (х, у),для к-ых можно задать любые значения 
    const mouse = new THREE.Vector2(); // объект для хранение нормализованных координат клика в двумерном пространстве
    // переводим пиксельную систему в систему координат отрисовки three.js
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; 
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // raycaster = луч, который выходит из камеры и проходит через точку клика
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    // переменная для проверки того, с какими объектами пересекается луч
    const intersects = raycaster.intersectObjects(scene.children, true); // берем луч и применяем метод ко всем объектам сцены
    // если лучи пересекаются хотя бы с одним объектом, т. е. объект intersects не пустой
    if(intersects.length > 0) {
        // положим в переменную clickObject первый объект, встреченный на пути луча, индекс[0] т.к. это первый клик
        const clickObject = intersects[0].object;
        // получаем данные о местоположении кликнутого объекта
        const position =  clickObject.position;
        
        // вычисляем к какой ячейке сетки относится данный объект
        const x = Math.round((position.x + (gridSize * spacing) / 2 - spacing / 2) / spacing);
        const y = Math.round((position.y + (gridSize * spacing) / 2 - spacing / 2) / spacing);

        // создаем таблицу с размерами gridSizexgridSize, где каждая ячейка будет содержать значение false, чтобы отслеживать какие шарики уже проверены
        const visited = Array.from({length: gridSize}, () => Array(gridSize).fill(false));
        // создаем пустой массив для групп шариков одного цвета
        const group = [];
        findGroup(x, y, visited, group); // вызываем функцию поиска групп шариков одного цвета
        // если кол-во шаров в массиве больше 3, то
        if(group.length >= 3) {
            group.forEach(({x, y}) => {
                scene.remove(grid[x][y].sphere); // удаляем шарики из сцены
                grid[x][y] = null; // удаляем шарики из общего массива
            });

            // сдвигаем оставшиеся шары вниз
            for (let column = 0; column < gridSize; column++) {
                let emptyRow = gridSize - 1;
                //обратный шаг для смещения снизу вверх
                for(let row = gridSize - 1; row >= 0; row--) {
                    // если шарик в текущей ячейке
                    if (grid[column][row]) {
                        // если строчка шарика не совпадает с пустой строкой, то его надо переместить
                        if(row !== emptyRow) {
                            grid[column][emptyRow] = grid[column][row]; // перемещаем шар вниз в пустую строчку
                            grid[column][row] = null; // очищаем предыдущую позицию
                            grid[column][emptyRow].sphere.position.y = emptyRow * spacing - (gridSize * spacing) / 2 + spacing / 2; // обновляем трехмерную позицию шарика на оси y
                        }
                        emptyRow--; // следующая пустая строка выше на одну позицию
                    }
                }
                // заполняем пустые места сетки новыми шариками
                while (emptyRow >= 0) {
                    const color = colors[Math.floor(Math.random() * colors.length)]; // присваивание рандомного цвета 
                    // создание сферы
                    const geometry = new THREE.SphereGeometry( ballSize, 32, 32 );
                    const material = new THREE.MeshStandardMaterial( {color} );
                    const sphere = new THREE.Mesh( geometry, material );
                    sphere.position.set(
                        column * spacing - (gridSize * spacing) / 2 + spacing / 2,
                        emptyRow * spacing - (gridSize * spacing) / 2 + spacing / 2,
                        0
                    );
                    scene.add( sphere );
                    grid[column][emptyRow] = {sphere, color};
                    emptyRow--;
                }
            }
        }
    }
});

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