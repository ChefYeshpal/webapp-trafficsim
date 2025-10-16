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
// Now we have two sub-lanes per direction: inner (straight) and outer (right turn)
const lanes = {
    east: { inner: [], outer: [] },
    west: { inner: [], outer: [] },
    north: { inner: [], outer: [] },
    south: { inner: [], outer: [] }
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

// Direction configurations with two lanes each
const directionConfigs = {
    east: {
        inner: { // straight traffic - inner lane
            startPos: { left: 10, top: 250 }, // inner lane (closer to intersection center)
            stopPos: { left: 180, top: 250 },
            endPos: { left: 600, top: 250 },
            rotation: 0,
            axis: 'left'
        },
        outer: { // right turn traffic - outer lane
            startPos: { left: 10, top: 290 }, // outer lane (farther from center)
            stopPos: { left: 180, top: 290 },
            endPos: { left: 600, top: 290 },
            rotation: 0,
            axis: 'left'
        }
    },
    west: {
        inner: { // straight traffic - inner lane
            startPos: { left: 560, top: 350 },
            stopPos: { left: 390, top: 350 },
            endPos: { left: -40, top: 350 },
            rotation: 0,
            axis: 'left'
        },
        outer: { // right turn traffic - outer lane
            startPos: { left: 560, top: 305 },
            stopPos: { left: 390, top: 305 },
            endPos: { left: -40, top: 305 },
            rotation: 0,
            axis: 'left'
        }
    },
    north: {
        inner: { // straight traffic - inner lane
            startPos: { left: 300, top: 10 },
            stopPos: { left: 300, top: 180 },
            endPos: { left: 300, top: 600 },
            rotation: 90,
            axis: 'top'
        },
        outer: { // right turn traffic - outer lane
            startPos: { left: 255, top: 10 },
            stopPos: { left: 255, top: 180 },
            endPos: { left: 255, top: 600 },
            rotation: 90,
            axis: 'top'
        }
    },
    south: {
        inner: { // straight traffic - inner lane
            startPos: { left: 320, top: 560 },
            stopPos: { left: 320, top: 390 },
            endPos: { left: 320, top: -40 },
            rotation: 90,
            axis: 'top'
        },
        outer: { // right turn traffic - outer lane
            startPos: { left: 285, top: 560 },
            stopPos: { left: 285, top: 390 },
            endPos: { left: 285, top: -40 },
            rotation: 90,
            axis: 'top'
        }
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

// Get random turn intention (straight or right for now)
function getRandomTurn() {
    // 60% straight, 20% right, 20% left
    const r = Math.random();
    if (r < 0.6) return 'straight';
    if (r < 0.8) return 'right';
    return 'left';
}

// Calculate turn destination based on current direction and turn type
function getTurnDestination(direction, turn) {
    if (turn === 'straight') return null;
    // Mapping for right and left turns
    const rightMap = {
        'north': 'west',
        'south': 'east',
        'east': 'south',
        'west': 'north'
    };
    const leftMap = {
        'north': 'east',
        'south': 'west',
        'east': 'north',
        'west': 'south'
    };
    return turn === 'right' ? rightMap[direction] : leftMap[direction];
}

// Create a new car
// Create a new car (optionally specify direction)
function spawnCar(direction = null) {
    const dir = direction || getRandomDirection();
    const turn = getRandomTurn();
    // Lane assignment: inner = straight, outer = turning lane (left or right depending on approach)
    const lane = turn === 'straight' ? 'inner' : 'outer';

    // Respect per-lane spawn allowance and max capacity
    if (!laneAllowedToSpawn[dir]) return null;
    const totalCars = lanes[dir].inner.length + lanes[dir].outer.length;
    if (totalCars >= 6) {
        laneAllowedToSpawn[dir] = false;
        return null;
    }

    const config = directionConfigs[dir][lane];
    const color = getRandomColor();
    const id = `car-${carIdCounter++}`;
    
    // Create car element
    const carElement = document.createElement('div');
    carElement.className = 'car';
    carElement.id = id;
    carElement.setAttribute('data-turn', turn);
    carElement.style.background = color;
    carElement.style.left = config.startPos.left + 'px';
    carElement.style.top = config.startPos.top + 'px';
    carElement.style.transform = `rotate(${config.rotation}deg)`;

    // Add blinker class for turning cars so CSS can animate it
    if (turn === 'left') carElement.classList.add('blinker-left');
    if (turn === 'right') carElement.classList.add('blinker-right');
    
    const container = document.querySelector('.intersection-container');
    if (!container) return null;
    container.appendChild(carElement);
    
    // Create car object
    const baseSpeed = 1 + Math.random() * 1; // Random base speed between 1-2
    // Start with currentSpeed 0 and ease into target (baseSpeed)
    carElement.style.opacity = '0';
    // small delay so CSS transition can animate opacity
    requestAnimationFrame(() => carElement.style.opacity = '1');

    const car = {
        id: id,
        element: carElement,
        direction: dir,
        lane: lane,
        turn: turn,
        config: config,
        position: config.axis === 'left' ? config.startPos.left : config.startPos.top,
        crossPosition: config.axis === 'left' ? config.startPos.top : config.startPos.left,
        baseSpeed: baseSpeed,
        currentSpeed: 0,
        targetSpeed: baseSpeed,
        accelFactor: 0.12, // acceleration smoothing
        stopped: false,
        desiredGap: 50, // px gap to keep from car ahead
        turning: false,
        turnProgress: 0,
        turnDestination: getTurnDestination(dir, turn)
    };
    
    cars.push(car);
    lanes[dir][lane].push(car);
    updateLaneSpawnFlag(dir);
    return car;
}

// Remove car from game
function removeCar(car) {
    car.element.remove();
    cars = cars.filter(c => c.id !== car.id);
    // Remove from lane tracking
    const laneArr = lanes[car.direction][car.lane];
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
    const stopPosition = car.config.axis === 'left' ? car.config.stopPos.left : car.config.stopPos.top;
    
    // Red light means stop
    if (lightState === 'red') {
        const axis = car.config.axis;
        const currentPos = car.position;
        const speedToUse = predictedSpeed !== null ? predictedSpeed : (car.currentSpeed || car.speed || 0);
        
        // Check if car is approaching the stop line (using predicted speed)
        if (axis === 'left') {
            if (car.direction === 'east' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
                return true;
            } else if (car.direction === 'west' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            }
        } else { // axis === 'top'
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
    // For each direction and lane, process cars front-to-back to maintain spacing
    Object.keys(lanes).forEach(direction => {
        ['inner', 'outer'].forEach(laneType => {
            const laneCars = lanes[direction][laneType];
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

                // Check if car should start turning
                if (!car.turning && car.turn === 'right') {
                    const intersectionStart = car.config.axis === 'left' ? 210 : 210;
                    const intersectionEnd = car.config.axis === 'left' ? 390 : 390;
                    
                    if (car.config.axis === 'left') {
                        if (direction === 'east' && car.position >= intersectionStart && car.position < intersectionEnd) {
                            car.turning = true;
                            car.turnProgress = 0;
                        } else if (direction === 'west' && car.position <= intersectionEnd && car.position > intersectionStart) {
                            car.turning = true;
                            car.turnProgress = 0;
                        }
                    } else {
                        if (direction === 'north' && car.position >= intersectionStart && car.position < intersectionEnd) {
                            car.turning = true;
                            car.turnProgress = 0;
                        } else if (direction === 'south' && car.position <= intersectionEnd && car.position > intersectionStart) {
                            car.turning = true;
                            car.turnProgress = 0;
                        }
                    }
                }

                // Determine front car (if any)
                const frontCar = i === 0 ? null : laneCars[i - 1];

                // Movement & stopping logic with easing
                const predictedSpeed = car.baseSpeed;

                // Reset targetSpeed to base by default; will be zeroed if stopped
                car.targetSpeed = car.baseSpeed;

                if (car.turning) {
                    // Handle turning animation
                    car.turnProgress += 0.025; // Control turn speed

                    if (car.turnProgress >= 1) {
                        car.turnProgress = 1;
                        car.turning = false;
                        // finalize turn: update direction to destination
                        const newDir = car.turnDestination || car.direction;
                        const oldDir = car.direction;
                        // Remove from old lane array
                        const oldLaneArr = lanes[oldDir][car.lane];
                        const idxOld = oldLaneArr.findIndex(c => c.id === car.id);
                        if (idxOld !== -1) oldLaneArr.splice(idxOld, 1);

                        // By default after a turn, car goes straight in the appropriate inner lane
                        const newLane = 'inner';
                        car.direction = newDir;
                        car.lane = newLane;
                        car.turn = 'straight';
                        car.turnDestination = null;
                        car.element.setAttribute('data-turn', 'straight');
                        car.element.classList.remove('blinker-left', 'blinker-right');

                        // Add to new lane array
                        lanes[newDir][newLane].push(car);

                        // Align car to lane center for new direction
                        const newConfig = directionConfigs[newDir][newLane];
                        if (newConfig.axis === 'left') {
                            car.position = car.element.offsetLeft = newConfig.stopPos.left + 10; // just past intersection
                            car.crossPosition = car.element.offsetTop = newConfig.startPos.top;
                        } else {
                            car.position = car.element.offsetTop = newConfig.stopPos.top + 10;
                            car.crossPosition = car.element.offsetLeft = newConfig.startPos.left;
                        }
                    }

                    const t = car.turnProgress;
                    const easeT = t * t * (3 - 2 * t); // Smoothstep easing

                    // Choose arc parameters depending on turn direction and approach
                    let centerX = 300, centerY = 300, startAngle = 0, endAngle = 0, radius = 100;
                    const isLeftTurn = car.turn === 'left';

                    if (direction === 'east') {
                        if (isLeftTurn) {
                            // east -> north (left)
                            centerX = 390; centerY = 320; startAngle = Math.PI; endAngle = -Math.PI/2; radius = 115;
                        } else {
                            // east -> south (right)
                            centerX = 390; centerY = 275; startAngle = Math.PI; endAngle = Math.PI/2; radius = 115;
                        }
                    } else if (direction === 'west') {
                        if (isLeftTurn) {
                            // west -> south (left)
                            centerX = 210; centerY = 280; startAngle = 0; endAngle = Math.PI/2; radius = 115;
                        } else {
                            // west -> north (right)
                            centerX = 210; centerY = 335; startAngle = 0; endAngle = -Math.PI/2; radius = 115;
                        }
                    } else if (direction === 'north') {
                        if (isLeftTurn) {
                            // north -> east (left)
                            centerX = 255; centerY = 390; startAngle = -Math.PI/2; endAngle = 0; radius = 115;
                        } else {
                            // north -> west (right)
                            centerX = 300; centerY = 390; startAngle = -Math.PI/2; endAngle = Math.PI; radius = 115;
                        }
                    } else if (direction === 'south') {
                        if (isLeftTurn) {
                            // south -> west (left)
                            centerX = 320; centerY = 210; startAngle = Math.PI/2; endAngle = Math.PI; radius = 115;
                        } else {
                            // south -> east (right)
                            centerX = 275; centerY = 210; startAngle = Math.PI/2; endAngle = 0; radius = 115;
                        }
                    }

                    const angle = startAngle + (endAngle - startAngle) * easeT;
                    const newLeft = centerX + Math.cos(angle) * radius;
                    const newTop = centerY + Math.sin(angle) * radius;

                    car.element.style.left = newLeft + 'px';
                    car.element.style.top = newTop + 'px';

                    // Update rotation for smooth turn (face tangent)
                    const rotation = (angle * 180 / Math.PI) + 90;
                    car.element.style.transform = `rotate(${rotation}deg)`;

                    // Update position tracking
                    if (car.config.axis === 'left') {
                        car.position = newLeft;
                        car.crossPosition = newTop;
                    } else {
                        car.position = newTop;
                        car.crossPosition = newLeft;
                    }
                } else {
                    // Normal straight-line movement
                    // First, check red light stopping behavior at intersection
                    if (shouldStop(car, predictedSpeed)) {
                        car.stopped = true;
                        car.targetSpeed = 0;
                        const stopPos = car.config.axis === 'left' ? car.config.stopPos.left : car.config.stopPos.top;
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
                        if (frontCar && !frontCar.turning) {
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
                        const desired = car.nextProposedPosition;
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
                    if (car.config.axis === 'left') {
                        car.element.style.left = car.position + 'px';
                        car.element.style.top = car.crossPosition + 'px';
                    } else {
                        car.element.style.top = car.position + 'px';
                        car.element.style.left = car.crossPosition + 'px';
                    }
                }

                // Fade-out logic
                const containerEdge = (car.config.axis === 'left')
                    ? (car.direction === 'east' ? 600 : 0)
                    : (car.direction === 'north' ? 600 : 0);

                const disappearInsideMargin = 10;
                const fadeDistance = 100;

                const disappearPoint = (car.direction === 'east' || car.direction === 'north')
                    ? (containerEdge - disappearInsideMargin)
                    : (containerEdge + disappearInsideMargin);

                const carWidth = 40;
                const carHeight = 25;
                let frontPos;
                if (car.config.axis === 'left') {
                    frontPos = (car.direction === 'east') ? (car.position + carWidth) : car.position;
                } else {
                    frontPos = (car.direction === 'north') ? (car.position + carHeight) : car.position;
                }

                let distToDisappear;
                if (car.direction === 'east' || car.direction === 'north') {
                    distToDisappear = disappearPoint - frontPos;
                } else {
                    distToDisappear = frontPos - disappearPoint;
                }

                let opacity = 1;
                if (distToDisappear >= fadeDistance) {
                    opacity = 1;
                } else if (distToDisappear > 0 && distToDisappear < fadeDistance) {
                    opacity = Math.max(0, distToDisappear / fadeDistance);
                } else if (distToDisappear <= 0) {
                    opacity = 0;
                }
                car.element.style.opacity = opacity.toString();

                // Remove car when fully faded
                const safetyRemovalMargin = 80;
                if (opacity <= 0) {
                    removeCar(car);
                } else if ((car.direction === 'east' || car.direction === 'north') && car.position > containerEdge + safetyRemovalMargin) {
                    removeCar(car);
                } else if ((car.direction === 'west' || car.direction === 'south') && car.position < containerEdge - safetyRemovalMargin) {
                    removeCar(car);
                }
            }
        });
    });
}

// (viewport-scaling removed — game uses fixed layout; fade-out behavior remains)

// Update whether a lane is allowed to spawn based on count and hysteresis
function updateLaneSpawnFlag(direction) {
    const count = lanes[direction].inner.length + lanes[direction].outer.length;
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
            const allowed = directions.filter(d => {
                const total = lanes[d].inner.length + lanes[d].outer.length;
                return laneAllowedToSpawn[d] && total < 6;
            });
            const pool = allowed.length ? allowed : directions.filter(d => {
                const total = lanes[d].inner.length + lanes[d].outer.length;
                return total < 6;
            });
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

