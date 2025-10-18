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

// Direction configurations are now in path.js as vehiclePaths
const directionConfigs = vehiclePaths;

// Get random color
function getRandomColor() {
    return carColors[Math.floor(Math.random() * carColors.length)];
}

// Get random direction (with weighted probability for straight vs turning)
function getRandomDirection() {
    const directions = Object.keys(vehiclePaths);
    return directions[Math.floor(Math.random() * directions.length)];
}

// Create a new car
// Create a new car (optionally specify direction)
function spawnCar(direction = null) {
    const dir = direction || getRandomDirection();

    // Respect per-lane spawn allowance and max capacity
    const spawnLane = dir.split('-')[0];
    if (!laneAllowedToSpawn[spawnLane]) return null;
    if (lanes[spawnLane].length >= 6) {
        laneAllowedToSpawn[spawnLane] = false;
        return null;
    }

    const config = vehiclePaths[dir];
    const color = getRandomColor();
    const id = `car-${carIdCounter++}`;
    
    // Create car element
    const carElement = document.createElement('div');
    carElement.className = 'car';
    carElement.id = id;
    carElement.style.background = color;
    carElement.style.left = config.points[0].x + 'px';
    carElement.style.top = config.points[0].y + 'px';
    const rotation = Array.isArray(config.rotation) ? config.rotation[0] : config.rotation;
    carElement.style.transform = `rotate(${rotation}deg)`;

    // Add blinker using path config (from path.js)
    let blinker = null;
    if (config && config.blinker && config.blinker.enabled) {
        blinker = document.createElement('div');
        blinker.className = 'blinker front';
        if (typeof config.blinker.offsetY === 'number') {
            blinker.style.top = `${config.blinker.offsetY}px`;
        }
        carElement.appendChild(blinker);
    }

    const container = document.querySelector('.intersection-container');
    if (!container) return null;
    container.appendChild(carElement);
    
    // Create car object
    const baseSpeed = 1 + Math.random() * 1; // Random base speed between 1-2
    // Start with currentSpeed 0 and ease into target (baseSpeed)
    carElement.style.opacity = '0';

    const axis = Array.isArray(config.axis) ? config.axis[0] : config.axis;
    const car = {
        id: id,
        element: carElement,
        direction: dir,
        spawnLane: spawnLane,
        config: config,
        position: { x: config.points[0].x, y: config.points[0].y },
        pathSegment: 0,
        baseSpeed: baseSpeed,
        currentSpeed: 0,
        targetSpeed: baseSpeed,
        accelFactor: 0.4, // acceleration smoothing (high for very smooth response)
        stopped: false,
        desiredGap: 70, // px gap to keep from car ahead
        fadeState: {
            fadingIn: true,
            fadingOut: false,
            opacity: 0,
            duration: 250, // ms for fade
            startTime: performance.now()
        }
    };
    
    cars.push(car);
    lanes[spawnLane].push(car);
    updateLaneSpawnFlag(spawnLane);
    return car;
}

// Remove car from game
function removeCar(car) {
    car.element.remove();
    cars = cars.filter(c => c.id !== car.id);
    // Remove from lane tracking
    const laneArr = lanes[car.spawnLane];
    const idx = laneArr.findIndex(c => c.id === car.id);
    if (idx !== -1) laneArr.splice(idx, 1);
    updateLaneSpawnFlag(car.spawnLane);
}

// Check if car should stop at intersection
function shouldStop(car, predictedSpeed = null) {
    // Cars heading north/south should observe the opposite signal (i.e., the light on the far side)
    // north cars look at 'south' light, south cars look at 'north' light. East/west remain unchanged.
    const observedLightForDirection = (dir => {
        if (dir === 'north') return 'south';
        if (dir === 'south') return 'north';
        return dir;
    })(car.spawnLane);
    const lightState = trafficLights[observedLightForDirection];
    
    const axis = Array.isArray(car.config.axis) ? car.config.axis[0] : car.config.axis;
    const stopPosition = axis === 'x' ? car.config.stopPos.x : car.config.stopPos.y;
    
    // Red light means stop
    if (lightState === 'red') {
        const currentPos = axis === 'x' ? car.position.x : car.position.y;
        const speedToUse = predictedSpeed !== null ? predictedSpeed : (car.currentSpeed || car.speed || 0);
        
        // Check if car is approaching the stop line (using predicted speed)
        if (axis === 'x') {
            if (car.spawnLane === 'east' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
                return true;
            } else if (car.spawnLane === 'west' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            }
        } else { // axis === 'y'
            if (car.spawnLane === 'south' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            } else if (car.spawnLane === 'north' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
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
            const aPos = (Array.isArray(a.config.axis) ? a.position[a.config.axis[0]] : a.position);
            const bPos = (Array.isArray(b.config.axis) ? b.position[b.config.axis[0]] : b.position);

            if (direction === 'east') return bPos - aPos; // front is larger x
            if (direction === 'west') return aPos - bPos; // west: front is smaller x
            if (direction === 'north') return bPos - aPos; // front is larger y
            if (direction === 'south') return aPos - bPos; // south: front is smaller y
            return 0;
        });

        for (let i = 0; i < laneCars.length; i++) {
            const car = laneCars[i];
            const frontCar = i === 0 ? null : laneCars[i - 1];
            const predictedSpeed = car.baseSpeed;

            car.targetSpeed = car.baseSpeed;
            
            // Only check spacing in the initial approach segment (before intersection)
            // Once cars pass the intersection, let them flow freely
            if (frontCar && car.pathSegment === 0 && frontCar.pathSegment === 0) {
                const axis = Array.isArray(car.config.axis) ? car.config.axis[0] : car.config.axis;
                let distance;
                
                if (axis === 'x') {
                    distance = Math.abs(frontCar.position.x - car.position.x);
                } else {
                    distance = Math.abs(frontCar.position.y - car.position.y);
                }
                
                // Only slow down if really close
                if (distance < car.desiredGap * 0.8) {
                    car.targetSpeed = 0;
                } else if (distance < car.desiredGap * 1.2) {
                    car.targetSpeed = car.baseSpeed * 0.6;
                }
            }

            if (car.pathSegment === 0 && shouldStop(car, predictedSpeed)) {
                car.stopped = true;
                car.targetSpeed = 0;
                const axis = Array.isArray(car.config.axis) ? car.config.axis[0] : car.config.axis;
                if (axis === 'x') {
                    car.position.x = car.config.stopPos.x;
                } else {
                    car.position.y = car.config.stopPos.y;
                }
            } else {
                car.stopped = false;
            }

            car.currentSpeed += (car.targetSpeed - car.currentSpeed) * car.accelFactor;
            const speedThisFrame = car.currentSpeed;

            if (car.stopped) {
                // a stopped car does not move.
            } else {
                let currentSegment = car.config.points[car.pathSegment];
                let nextSegment = car.config.points[car.pathSegment + 1];

                if (!nextSegment) {
                    // End of path, continue moving straight to exit
                    const lastAxis = Array.isArray(car.config.axis) ? car.config.axis[car.config.axis.length - 1] : car.config.axis;
                    const lastRotation = Array.isArray(car.config.rotation) ? car.config.rotation[car.config.rotation.length - 1] : car.config.rotation;

                    if (lastAxis === 'x') {
                        car.position.x += Math.cos(lastRotation * Math.PI / 180) * speedThisFrame;
                    } else {
                        car.position.y += Math.sin(lastRotation * Math.PI / 180) * speedThisFrame;
                    }

                } else {
                    const axis = Array.isArray(car.config.axis) ? car.config.axis[car.pathSegment] : car.config.axis;
                    let moved = false;

                    if (axis === 'x') {
                        const direction = Math.sign(nextSegment.x - currentSegment.x);
                        car.position.x += direction * speedThisFrame;
                        if ((direction > 0 && car.position.x >= nextSegment.x) || (direction < 0 && car.position.x <= nextSegment.x)) {
                            // Don't snap position - let it overshoot naturally
                            // car.position.x = nextSegment.x;
                            moved = true;
                        }
                    } else { // axis === 'y'
                        const direction = Math.sign(nextSegment.y - currentSegment.y);
                        car.position.y += direction * speedThisFrame;
                        if ((direction > 0 && car.position.y >= nextSegment.y) || (direction < 0 && car.position.y <= nextSegment.y)) {
                            // Don't snap position - let it overshoot naturally
                            // car.position.y = nextSegment.y;
                            moved = true;
                        }
                    }

                    if (moved) {
                        car.pathSegment++;
                        if (Array.isArray(car.config.rotation)) {
                            const newRotation = car.config.rotation[car.pathSegment];
                            if (newRotation !== undefined) {
                                car.element.style.transform = `rotate(${newRotation}deg)`;
                            }
                        }
                    }
                }
            }

            car.element.style.left = car.position.x + 'px';
            car.element.style.top = car.position.y + 'px';

            const now = performance.now();
            const fade = car.fadeState;

            if (fade.fadingIn) {
                const elapsed = now - fade.startTime;
                if (elapsed < fade.duration) {
                    fade.opacity = elapsed / fade.duration;
                } else {
                    fade.opacity = 1;
                    fade.fadingIn = false;
                }
            }

            if (car.position.x > 650 || car.position.x < -50 || car.position.y > 650 || car.position.y < -50) {
                removeCar(car);
            } else {
                car.element.style.opacity = Math.max(0, Math.min(1, fade.opacity)).toString();
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
            // Get a random direction from all available paths
            spawnCar();
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

