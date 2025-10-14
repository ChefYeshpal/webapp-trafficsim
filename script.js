// Traffic light states: green = go, red = stop
const trafficLights = {
    north: 'red',
    south: 'red',
    east: 'green',
    west: 'green'
};

// Array to store active cars
let cars = [];
let carIdCounter = 0;

// Per-lane tracking to enforce limits and spacing
const lanes = {
    east: [],
    west: [],
    north: [],
    south: []
};

// Spawn control per-lane (hysteresis): pause when >6, resume when <=3
const laneAllowedToSpawn = {
    east: true,
    west: true,
    north: true,
    south: true
};

// Global pause state
let isPaused = false;
let spawnIntervalId = null;

// Random color palette for cars
const carColors = [
    'linear-gradient(135deg, #e74c3c, #c0392b)', // red
    'linear-gradient(135deg, #3498db, #2980b9)', // blue
    'linear-gradient(135deg, #2ecc71, #27ae60)', // green
    'linear-gradient(135deg, #f39c12, #d68910)', // orange
    'linear-gradient(135deg, #9b59b6, #8e44ad)', // purple
    'linear-gradient(135deg, #1abc9c, #16a085)', // teal
    'linear-gradient(135deg, #e67e22, #d35400)', // dark orange
    'linear-gradient(135deg, #34495e, #2c3e50)', // dark blue
];

// Direction configurations
const directionConfigs = {
    east: {
        startPos: { left: 10, top: 250 },
        stopPos: { left: 180, top: 250 },
        endPos: { left: 590, top: 250 },
        rotation: 0,
        axis: 'left'
    },
    west: {
        startPos: { left: 590, top: 325 },
        stopPos: { left: 390, top: 325 },
        endPos: { left: 10, top: 325 },
        rotation: 0,
        axis: 'left'
    },
    north: {
        startPos: { left: 260, top: 10 },
        stopPos: { left: 260, top: 180 },
        endPos: { left: 260, top: 590 },
        rotation: 90,
        axis: 'top'
    },
    south: {
        startPos: { left: 300, top: 590 },
        stopPos: { left: 300, top: 390 },
        endPos: { left: 300, top: 10 },
        rotation: 90,
        axis: 'top'
    }
};

// Get random color
function getRandomColor() {
    return carColors[Math.floor(Math.random() * carColors.length)];
}

// Get random direction
function getRandomDirection() {
    const directions = ['north', 'south', 'east', 'west'];
    return directions[Math.floor(Math.random() * directions.length)];
}

// Create a new car
// Create a new car (optionally specify direction)
function spawnCar(direction = null) {
    const dir = direction || getRandomDirection();

    // Respect per-lane spawn allowance and max capacity
    if (!laneAllowedToSpawn[dir]) return null;
    if (lanes[dir].length >= 6) {
        laneAllowedToSpawn[dir] = false;
        return null;
    }

    const config = directionConfigs[dir];
    const color = getRandomColor();
    const id = `car-${carIdCounter++}`;
    
    // Create car element
    const carElement = document.createElement('div');
    carElement.className = 'car';
    carElement.id = id;
    carElement.style.background = color;
    carElement.style.left = config.startPos.left + 'px';
    carElement.style.top = config.startPos.top + 'px';
    carElement.style.transform = `rotate(${config.rotation}deg)`;
    
    const container = document.querySelector('.intersection-container');
    if (!container) return null;
    container.appendChild(carElement);
    
    // Create car object
    const car = {
        id: id,
        element: carElement,
        direction: dir,
        config: config,
        position: config.axis === 'left' ? config.startPos.left : config.startPos.top,
        speed: 1 + Math.random() * 1, // Random speed between 1-2
        stopped: false,
        desiredGap: 50 // px gap to keep from car ahead
    };
    
    cars.push(car);
    lanes[dir].push(car);
    updateLaneSpawnFlag(dir);
    return car;
}

// Remove car from game
function removeCar(car) {
    car.element.remove();
    cars = cars.filter(c => c.id !== car.id);
    // Remove from lane tracking
    const laneArr = lanes[car.direction];
    const idx = laneArr.findIndex(c => c.id === car.id);
    if (idx !== -1) laneArr.splice(idx, 1);
    updateLaneSpawnFlag(car.direction);
}

// Check if car should stop at intersection
function shouldStop(car) {
    const lightState = trafficLights[car.direction];
    const stopPosition = car.config.axis === 'left' ? car.config.stopPos.left : car.config.stopPos.top;
    
    // Red light means stop
    if (lightState === 'red') {
        const axis = car.config.axis;
        const currentPos = car.position;
        
        // Check if car is approaching the stop line
        if (axis === 'left') {
            if (car.direction === 'east' && currentPos < stopPosition && currentPos + car.speed >= stopPosition) {
                return true;
            } else if (car.direction === 'west' && currentPos > stopPosition && currentPos - car.speed <= stopPosition) {
                return true;
            }
        } else { // axis === 'top'
            if (car.direction === 'south' && currentPos > stopPosition && currentPos - car.speed <= stopPosition) {
                return true;
            } else if (car.direction === 'north' && currentPos < stopPosition && currentPos + car.speed >= stopPosition) {
                return true;
            }
        }
        
        // If already stopped at the stop line
        if (car.stopped && Math.abs(currentPos - stopPosition) < 5) {
            return true;
        }
    }
    
    return false;
}

// Move all cars
function moveCars() {
    // For each lane, process cars front-to-back to maintain spacing
    Object.keys(lanes).forEach(direction => {
        const laneCars = lanes[direction];
        // Sort by position along movement axis: front-most first
        laneCars.sort((a, b) => {
            if (a.config.axis === 'left') {
                // east increases left, west decreases left
                if (direction === 'east') return b.position - a.position; // front is larger left
                return a.position - b.position; // west: front is smaller left
            } else {
                // north increases top, south decreases top
                if (direction === 'north') return b.position - a.position; // front is larger top
                return a.position - b.position; // south: front is smaller top
            }
        });

        for (let i = 0; i < laneCars.length; i++) {
            const car = laneCars[i];

            // Determine front car (if any)
            const frontCar = i === 0 ? null : laneCars[i - 1];

            // First, check red light stopping behavior at intersection
            if (shouldStop(car)) {
                car.stopped = true;
                const stopPos = car.config.axis === 'left' ? car.config.stopPos.left : car.config.stopPos.top;
                car.position = stopPos;
            } else {
                // Movement logic
                car.stopped = false;

                // Calculate tentative movement
                let proposedPos = car.position;
                if (car.direction === 'east' || car.direction === 'north') {
                    proposedPos += car.speed;
                } else {
                    proposedPos -= car.speed;
                }

                // If there is a car ahead, ensure we don't get closer than desiredGap
                if (frontCar) {
                    const gap = Math.abs(frontCar.position - proposedPos) - (car.config.axis === 'left' ? 40 : 25);
                    // compute distance between front car and proposed position (subtract car length approx)
                    const distanceBetween = Math.abs(frontCar.position - proposedPos);
                    const minAllowed = car.desiredGap;
                    if (distanceBetween <= minAllowed) {
                        // Don't move forward; stay behind front car at min gap
                        if (frontCar.position > proposedPos) {
                            // front car is ahead in increasing direction
                            proposedPos = frontCar.position - minAllowed;
                        } else {
                            proposedPos = frontCar.position + minAllowed;
                        }
                        car.stopped = true;
                    }
                }

                car.position = proposedPos;
            }

            // Clamp visual position to intersection container (0..600)
            const containerMin = 0;
            const containerMax = 600;
            if (car.config.axis === 'left') {
                // Ensure car stays inside horizontal bounds
                car.position = Math.max(containerMin, Math.min(containerMax - 40, car.position)); // 40 = car width
                car.element.style.left = car.position + 'px';
            } else {
                // Ensure car stays inside vertical bounds
                car.position = Math.max(containerMin, Math.min(containerMax - 25, car.position)); // 25 = car height
                car.element.style.top = car.position + 'px';
            }

            // Remove car if it's completely outside the container area (failsafe)
            if (car.position <= containerMin || car.position >= containerMax) {
                // Keep cars inside — but if something went wrong, remove as failsafe
                // We'll only remove if the car is stuck exactly at an extreme and there are many cars.
                if (lanes[car.direction].length > 8) removeCar(car);
            }
        }
    });
}

// Update whether a lane is allowed to spawn based on count and hysteresis
function updateLaneSpawnFlag(direction) {
    const count = lanes[direction].length;
    if (count > 6) {
        laneAllowedToSpawn[direction] = false;
    } else if (count <= 3) {
        laneAllowedToSpawn[direction] = true;
    }
}

// Initialize traffic lights on page load
function initializeTrafficLights() {
    for (const direction in trafficLights) {
        const lightElement = document.querySelector(`.traffic-light.${direction}`);
        if (trafficLights[direction] === 'red') {
            lightElement.classList.add('red');
        }
    }
}

// Toggle traffic light when clicked
function toggleLight(direction) {
    const lightElement = document.querySelector(`.traffic-light.${direction}`);
    
    // Toggle between red and green
    if (trafficLights[direction] === 'red') {
        trafficLights[direction] = 'green';
        lightElement.classList.remove('red');
    } else {
        trafficLights[direction] = 'red';
        lightElement.classList.add('red');
    }
}

// Game loop
function gameLoop() {
    if (!isPaused) moveCars();
    // always schedule next frame to keep responsiveness for resume
    requestAnimationFrame(gameLoop);
}

// Spawn cars at random intervals
function startCarSpawning() {
    // clear existing if called again
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(() => {
        if (isPaused) return;
        // Try spawn with 80% probability
        if (Math.random() < 0.8) {
            // Choose a direction but prefer allowed lanes
            const directions = ['north', 'south', 'east', 'west'];
            const allowed = directions.filter(d => laneAllowedToSpawn[d] && lanes[d].length < 6);
            const pool = allowed.length ? allowed : directions.filter(d => lanes[d].length < 6);
            const poolFinal = pool.length ? pool : directions; // fallback
            const dir = poolFinal[Math.floor(Math.random() * poolFinal.length)];
            spawnCar(dir);
        }
    }, 2000);
}

// Start the game
initializeTrafficLights();
startCarSpawning();
gameLoop();

// Pause/resume button wiring
const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
        pauseBtn.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
        // spawning checks isPaused, so no extra handling needed for timers
    });
}

