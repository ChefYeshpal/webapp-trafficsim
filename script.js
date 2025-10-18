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

// Get a random color from the given paletter
function getRandomColor() {
    return carColors[Math.floor(Math.random() * carColors.length)];
}

// Get random direction
function getRandomDirection() {
    const directions = ['north', 'south', 'east', 'west'];
    return directions[Math.floor(Math.random() * directions.length)];
}

// Create a new car (optionally specify direction)
function spawnCar(direction = null) {
    const dir = direction || getRandomDirection();

    // Respect per-lane spawn allowance and max capacity
    if (!laneAllowedToSpawn[dir]) return null;
    if (lanes[dir].length >= 6) {
        laneAllowedToSpawn[dir] = false;
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
    carElement.style.transform = `rotate(${config.rotation}deg)`;
    
    const container = document.querySelector('.intersection-container');
    if (!container) return null;
    container.appendChild(carElement);
    
    // Create car object
    const baseSpeed = 1 + Math.random() * 1;
    // Start with currentSpeed 0 and then ease into target (baseSpeed)
    carElement.style.opacity = '0';

    const car = {
        id: id,
        element: carElement,
        direction: dir,
        config: config,
        position: config.axis === 'x' ? config.points[0].x : config.points[0].y,
        baseSpeed: baseSpeed,
        currentSpeed: 0,
        targetSpeed: baseSpeed,
        accelFactor: 0.12,
        stopped: false,
        desiredGap: 50,
        fadeState: {
            fadingIn: true,
            fadingOut: false,
            opacity: 0,
            duration: 250, 
            startTime: performance.now()
        }
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
function shouldStop(car, predictedSpeed = null) {
    // Cars heading north/south should observe the opposite signal (i.e., the light on the far side)
    // north cars look at 'south' light, south cars look at 'north' light. East/west remain unchanged.
    const observedLightForDirection = (dir => {
        if (dir === 'north') return 'south';
        if (dir === 'south') return 'north';
        return dir;
    })(car.direction);
    const lightState = trafficLights[observedLightForDirection];
    const stopPosition = car.config.axis === 'x' ? car.config.stopPos.x : car.config.stopPos.y;
    
    // Red light means stop
    if (lightState === 'red') {
        const axis = car.config.axis;
        const currentPos = car.position;
        const speedToUse = predictedSpeed !== null ? predictedSpeed : (car.currentSpeed || car.speed || 0);
        
        // Check if car is approaching the stop line (using predicted speed)
        if (axis === 'x') {
            if (car.direction === 'east' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
                return true;
            } else if (car.direction === 'west' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            }
        } else { // axis === 'y'
            if (car.direction === 'south' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            } else if (car.direction === 'north' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
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
            if (a.config.axis === 'x') {
                // east increases x, west decreases x
                if (direction === 'east') return b.position - a.position; // front is larger x
                return a.position - b.position; // west: front is smaller x
            } else { // 'y'
                // north increases y, south decreases y
                if (direction === 'north') return b.position - a.position; // front is larger y
                return a.position - b.position; // south: front is smaller y
            }
        });

        for (let i = 0; i < laneCars.length; i++) {
            const car = laneCars[i];

            // Determine front car (if any)
            const frontCar = i === 0 ? null : laneCars[i - 1];

            // Movement & stopping logic with easing
            // Use baseSpeed as the predicted movement for approach checks
            const predictedSpeed = car.baseSpeed;

            // Reset targetSpeed to base by default; will be zeroed if stopped
            car.targetSpeed = car.baseSpeed;

            // First, check red light stopping behavior at intersection
            if (shouldStop(car, predictedSpeed)) {
                car.stopped = true;
                car.targetSpeed = 0;
                const stopPos = car.config.axis === 'x' ? car.config.stopPos.x : car.config.stopPos.y;
                car.position = stopPos;
            } else {
                car.stopped = false;

                // Tentative movement using predictedSpeed for collision checks
                let proposedPos = car.position;
                if (car.direction === 'east' || car.direction === 'north') {
                    proposedPos += predictedSpeed;
                } else {
                    proposedPos -= predictedSpeed;
                }

                // If there is a car ahead, ensure we don't get closer than desiredGap
                if (frontCar) {
                    const distanceBetween = Math.abs(frontCar.position - proposedPos);
                    const minAllowed = car.desiredGap;
                    if (distanceBetween <= minAllowed) {
                        // Stay behind front car at min gap and stop
                        if (frontCar.position > proposedPos) {
                            proposedPos = frontCar.position - minAllowed;
                        } else {
                            proposedPos = frontCar.position + minAllowed;
                        }
                        car.targetSpeed = 0;
                        car.stopped = true;
                    }
                }

                // Update position based on currentSpeed (which will be eased toward targetSpeed below)
                car.nextProposedPosition = proposedPos;
            }

            // Ease currentSpeed towards targetSpeed
            car.currentSpeed += (car.targetSpeed - car.currentSpeed) * car.accelFactor;
            const speedThisFrame = car.currentSpeed;

            // If we have a nextProposedPosition from collision checks, prefer it
            if (car.hasOwnProperty('nextProposedPosition')) {
                // Move toward nextProposedPosition but not overshoot
                const desired = car.nextProposedPosition;
                // If moving in increasing direction
                if (car.direction === 'east' || car.direction === 'north') {
                    const maxMove = speedThisFrame;
                    car.position = Math.min(desired, car.position + maxMove);
                } else {
                    const maxMove = speedThisFrame;
                    car.position = Math.max(desired, car.position - maxMove);
                }
                delete car.nextProposedPosition;
            } else {
                // Normal movement
                if (car.direction === 'east' || car.direction === 'north') {
                    car.position += speedThisFrame;
                } else {
                    car.position -= speedThisFrame;
                }
            }

            // Update visual position
            if (car.config.axis === 'x') {
                car.element.style.left = car.position + 'px';
            } else {
                car.element.style.top = car.position + 'px';
            }

            // Fading Logic
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

            // Check if car should start fading out
            const containerEdge = (car.config.axis === 'x')
                ? (car.direction === 'east' ? 600 : 0)
                : (car.direction === 'north' ? 600 : 0);
            
            const fadeOutStartDistance = 90;
            let distToEdge;
            if (car.direction === 'east' || car.direction === 'north') {
                distToEdge = containerEdge - car.position;
            } else {
                distToEdge = car.position - containerEdge;
            }

            if (!fade.fadingOut && distToEdge <= fadeOutStartDistance) {
                fade.fadingOut = true;
                fade.startTime = now;
                fade.duration = 500;
            }

            if (fade.fadingOut) {
                const elapsed = now - fade.startTime;
                if (elapsed < fade.duration) {
                    fade.opacity = 1 - (elapsed / fade.duration);
                } else {
                    fade.opacity = 0;
                }
            }
            
            car.element.style.opacity = Math.max(0, Math.min(1, fade.opacity)).toString();

            // Remove car when fully faded out
            if (fade.fadingOut && fade.opacity <= 0) {
                removeCar(car);
            } else {
                // Safety net removal if car goes way off screen
                const safetyMargin = 80;
                if ((car.direction === 'east' || car.direction === 'north') && car.position > containerEdge + safetyMargin) {
                    removeCar(car);
                } else if ((car.direction === 'west' || car.direction === 'south') && car.position < containerEdge - safetyMargin) {
                    removeCar(car);
                }
            }
        }
    });
}

// (viewport-scaling removed, game uses fixed layout; fade-out behavior remains)

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

