// Initial state
const trafficLights = {
    north: 'red',
    south: 'red',
    east: 'green',
    west: 'green'
};

let cars = [];
let carIdCounter = 0;

// Collision system state
let crashState = {
    active: false,
    crashedCars: [],
    crashTime: 0,
    flickerStartTime: 0,
    isFlickering: false,
    recoveryMode: false,
    recoveryStartTime: 0
};

// Point system state
let pointsState = {
    score: 0,
    streak: 0,
    lastCarExitTime: 0,
    streakTimeout: 2000,
    isGameOver: false,
    achieved69: false
};

// Lane tracking
const lanes = {
    east: [],
    west: [],
    north: [],
    south: []
};

// prevent lane overcrowding by pausing spawns above threshold
const laneAllowedToSpawn = {
    east: true,
    west: true,
    north: true,
    south: true
};

let isPaused = false;
let spawnIntervalId = null;

// color gradients
const carColors = [
    'linear-gradient(135deg, #e74c3c, #c0392b)', 
    'linear-gradient(135deg, #3498db, #2980b9)', 
    'linear-gradient(135deg, #2ecc71, #27ae60)', 
    'linear-gradient(135deg, #f39c12, #d68910)', 
    'linear-gradient(135deg, #9b59b6, #8e44ad)', 
    'linear-gradient(135deg, #1abc9c, #16a085)', 
    'linear-gradient(135deg, #e67e22, #d35400)', 
    'linear-gradient(135deg, #34495e, #2c3e50)', 
];

// Paths separated into dedicated module 
const directionConfigs = vehiclePaths;

function getRandomColor() {
    return carColors[Math.floor(Math.random() * carColors.length)];
}

function getRandomDirection() {
    const directions = Object.keys(vehiclePaths);
    return directions[Math.floor(Math.random() * directions.length)];
}

function spawnCar(direction = null) {
    const dir = direction || getRandomDirection();

    // Prevents visual clutter
    const spawnLane = dir.split('-')[0];
    if (!laneAllowedToSpawn[spawnLane]) return null;
    if (lanes[spawnLane].length >= 6) {
        laneAllowedToSpawn[spawnLane] = false;
        return null;
    }
    
    // Check if spawn position would overlap with existing cars
    const config = vehiclePaths[dir];
    const spawnX = config.points[0].x;
    const spawnY = config.points[0].y;
    const carWidth = 40;
    const carHeight = 25;
    const minSpawnDistance = 50; 
    
    for (const existingCar of lanes[spawnLane]) {
        const dx = existingCar.position.x - spawnX;
        const dy = existingCar.position.y - spawnY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minSpawnDistance) {
            return null;
        }
    }

    // config already declared above, reuse it
    const color = getRandomColor();
    const id = `car-${carIdCounter++}`;
    
    const carElement = document.createElement('div');
    carElement.className = 'car';
    carElement.id = id;
    carElement.style.background = color;
    carElement.style.left = config.points[0].x + 'px';
    carElement.style.top = config.points[0].y + 'px';
    const rotation = Array.isArray(config.rotation) ? config.rotation[0] : config.rotation;
    carElement.style.transform = `rotate(${rotation}deg)`;

    const container = document.querySelector('.intersection-container');
    if (!container) return null;
    container.appendChild(carElement);
    
    // variable speed
    const baseSpeed = 1 + Math.random() * 1;
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
        accelFactor: 0.4, 
        stopped: false,
        desiredGap: 40,
        fadeState: {
            fadingIn: true,
            fadingOut: false,
            opacity: 0,
            duration: 250,
            startTime: performance.now()
        }
    };
    
    cars.push(car);
    lanes[spawnLane].push(car);
    updateLaneSpawnFlag(spawnLane);
    return car;
}

function removeCar(car) {
    car.element.remove();
    cars = cars.filter(c => c.id !== car.id);
    const laneArr = lanes[car.spawnLane];
    const idx = laneArr.findIndex(c => c.id === car.id);
    if (idx !== -1) laneArr.splice(idx, 1);
    updateLaneSpawnFlag(car.spawnLane);
}

// Point system functions
function awardPoints() {
    if (pointsState.isGameOver) return;
    
    const currentTime = performance.now();
    const timeSinceLastExit = currentTime - pointsState.lastCarExitTime;
    
    // Check for streak continuation
    if (timeSinceLastExit < pointsState.streakTimeout && pointsState.lastCarExitTime > 0) {
        pointsState.streak++;
    } else {
        pointsState.streak = 1;
    }
    
    const basePoints = 1;
    const bonusPoints = Math.floor(pointsState.streak / 4); // Bonus and shit
    const totalPoints = basePoints + bonusPoints;
    
    pointsState.score += totalPoints;
    pointsState.lastCarExitTime = currentTime;
    
    updateScoreDisplay();
    
    if (bonusPoints > 0) {
        showBonusIndicator(bonusPoints);
    }
}

function deductPoints(amount) {
    pointsState.score -= amount;
    pointsState.streak = 0; // Reset streak on crash
    updateScoreDisplay();
    
    // Check for game over
    if (pointsState.score < 0 && !pointsState.isGameOver) {
        triggerGameOver();
    }
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('scoreDisplay');
    if (scoreElement) {
        scoreElement.textContent = pointsState.score;
        
        scoreElement.classList.remove('score-change');
        void scoreElement.offsetWidth; // Force reflow
        scoreElement.classList.add('score-change');
    }
    
    const streakElement = document.getElementById('streakDisplay');
    if (streakElement && pointsState.streak > 1) {
        streakElement.textContent = `x${pointsState.streak} streak!`;
        streakElement.style.display = 'block';
    } else if (streakElement) {
        streakElement.style.display = 'none';
    }
    
    // 69 achievement, you're a noice person if you're reading this ;)
    if (pointsState.score === 69 && !pointsState.achieved69) {
        pointsState.achieved69 = true;
        trigger69Achievement();
    }
}

function showBonusIndicator(bonus) {
    const bonusElement = document.getElementById('bonusIndicator');
    if (bonusElement) {
        bonusElement.textContent = `+${bonus} BONUS!`;
        bonusElement.style.display = 'block';
        bonusElement.classList.remove('bonus-appear');
        void bonusElement.offsetWidth; // Force reflow
        bonusElement.classList.add('bonus-appear');
        
        setTimeout(() => {
            bonusElement.style.display = 'none';
        }, 1500);
    }
}

// Just for console
function trigger69Achievement() {
    
    isPaused = true;
    
    setTimeout(() => {
        alert('noice');
        
        isPaused = false;
    }, 100);

    console.log('Nice! You reached 69 points ;)');
}

function triggerGameOver() {
    pointsState.isGameOver = true;
    isPaused = true;
    
    if (spawnIntervalId) {
        clearInterval(spawnIntervalId);
    }
    
    // Show game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'flex';
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = pointsState.score;
        }
        
        // Display random crash response
        const responseElement = document.getElementById('gameOverResponse');
        if (responseElement && typeof getRandomGameOverResponse === 'function') {
            const randomResponse = getRandomGameOverResponse();
            responseElement.textContent = `"${randomResponse}"`;
        }
    }
    
    console.log('GAME OVER! Final score:', pointsState.score);
}

function restartGame() {
    // Reset game state
    pointsState.score = 0;
    pointsState.streak = 0;
    pointsState.lastCarExitTime = 0;
    pointsState.isGameOver = false;
    isPaused = false;
    
    // Clear all cars
    cars.forEach(car => car.element.remove());
    cars = [];
    Object.keys(lanes).forEach(direction => {
        lanes[direction] = [];
    });
    
    // Reset crash state
    crashState.active = false;
    crashState.crashedCars = [];
    crashState.isFlickering = false;
    crashState.recoveryMode = false;
    document.body.classList.remove('crash-active');
    
    // Hide game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
    }
    
    // Update displays
    updateScoreDisplay();
    
    // Restart spawning
    startCarSpawning();
    
    console.log('Game restarted!');
}

// Collision detection
function detectCollision(car1, car2) {
    const carWidth = 40;
    const carHeight = 25;
    
    // Get bounding boxes
    const box1 = {
        x: car1.position.x,
        y: car1.position.y,
        width: carWidth,
        height: carHeight
    };
    
    const box2 = {
        x: car2.position.x,
        y: car2.position.y,
        width: carWidth,
        height: carHeight
    };
    
    const overlapX = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x));
    const overlapY = Math.max(0, Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y));
    
    // Consider it a crash if overlap is more than 50% of car area
    const overlapArea = overlapX * overlapY;
    const carArea = carWidth * carHeight;
    const overlapPercentage = overlapArea / carArea;
    
    if (overlapPercentage <= 0.5) return false;
    
    // ONLY consider it a valid crash if collision is in area
    // Adding this cuz cars overlapping in spawn were acting up, gotta teach em a lesson
    const intersectionBounds = {
        left: 240,
        right: 360,
        top: 240,
        bottom: 360
    };
    
    // Check for car is at least partially in the intersection
    const car1InIntersection = (
        box1.x < intersectionBounds.right &&
        box1.x + box1.width > intersectionBounds.left &&
        box1.y < intersectionBounds.bottom &&
        box1.y + box1.height > intersectionBounds.top
    );
    
    const car2InIntersection = (
        box2.x < intersectionBounds.right &&
        box2.x + box2.width > intersectionBounds.left &&
        box2.y < intersectionBounds.bottom &&
        box2.y + box2.height > intersectionBounds.top
    );
    
    return car1InIntersection && car2InIntersection;
}

// Check for collisions between all cars
function checkForCollisions() {
    if (crashState.active) return;
    
    for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
            if (detectCollision(cars[i], cars[j])) {
                triggerCrash([cars[i], cars[j]]);
                return;
            }
        }
    }
}

// crash sequence
function triggerCrash(crashedCars) {
    crashState.active = true;
    crashState.crashedCars = crashedCars;
    crashState.crashTime = performance.now();
    crashState.isFlickering = false;
    
    crashedCars.forEach(car => {
        car.crashed = true;
        car.element.style.border = '2px solid red';
    });
    
    deductPoints(5);
    
    document.body.classList.add('crash-active');
    
    const crashAlert = document.getElementById('crashAlert');
    if (crashAlert) {
        crashAlert.style.display = 'block';
        crashAlert.offsetHeight;
        crashAlert.style.opacity = '1';
    }
    
    console.log('crash: Cars involved:', crashedCars.map(c => c.id));
}


function updateCrashState() {
    if (!crashState.active) return;
    
    const currentTime = performance.now();
    const timeSinceCrash = currentTime - crashState.crashTime;
    
    // 5 sec timer
    if (timeSinceCrash < 5000) {
        return;
    }
    
    if (!crashState.isFlickering) {
        crashState.isFlickering = true;
        crashState.flickerStartTime = currentTime;
    }
    
    const flickerDuration = 1500;
    const timeSinceFlicker = currentTime - crashState.flickerStartTime;
    
    if (timeSinceFlicker < flickerDuration) {
        const flickerInterval = 150;
        const flickerCycle = Math.floor(timeSinceFlicker / flickerInterval);
        const isVisible = flickerCycle % 2 === 0;
        
        crashState.crashedCars.forEach(car => {
            if (car.element) {
                car.element.style.opacity = isVisible ? '1' : '0.2';
            }
        });
    } else {
        // Remove crashed cars and immediately start fade-out
        if (!crashState.recoveryMode) {
            crashState.crashedCars.forEach(car => {
                if (cars.includes(car)) {
                    removeCar(car);
                }
            });
            
            const crashAlert = document.getElementById('crashAlert');
            if (crashAlert) {
                crashAlert.style.opacity = '0';
                setTimeout(() => {
                    crashAlert.style.display = 'none';
                }, 50);
            }
            
            // Red screen thingy
            document.body.classList.remove('crash-active');
            
            crashState.recoveryMode = true;
            crashState.recoveryStartTime = currentTime;
            crashState.active = false;
            crashState.crashedCars = [];
            crashState.isFlickering = false;

            console.log('crash: Cars removed, red screen fading out...');
        }
    }
}

function updateRecoveryState() {
    if (!crashState.recoveryMode) return;
    
    const currentTime = performance.now();
    const timeSinceRecovery = currentTime - crashState.recoveryStartTime;
    
    if (timeSinceRecovery >= 1500) {
        crashState.recoveryMode = false;
        console.log('crash: Recovery done, screen to normal');
    }
}

function shouldStop(car, predictedSpeed = null) {
    // N/S cars observe far-side light to simulate real traffic signal placement
    const observedLightForDirection = (dir => {
        if (dir === 'north') return 'south';
        if (dir === 'south') return 'north';
        return dir;
    })(car.spawnLane);
    const lightState = trafficLights[observedLightForDirection];
    
    const axis = Array.isArray(car.config.axis) ? car.config.axis[0] : car.config.axis;
    const stopPosition = axis === 'x' ? car.config.stopPos.x : car.config.stopPos.y;
    
    if (lightState === 'red') {
        const currentPos = axis === 'x' ? car.position.x : car.position.y;
        const speedToUse = predictedSpeed !== null ? predictedSpeed : (car.currentSpeed || car.speed || 0);
        
        // Prediction prevents overshooting the stop line
        if (axis === 'x') {
            if (car.spawnLane === 'east' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
                return true;
            } else if (car.spawnLane === 'west' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            }
        } else {
            if (car.spawnLane === 'south' && currentPos > stopPosition && currentPos - speedToUse <= stopPosition) {
                return true;
            } else if (car.spawnLane === 'north' && currentPos < stopPosition && currentPos + speedToUse >= stopPosition) {
                return true;
            }
        }
        
        if (car.stopped && Math.abs(currentPos - stopPosition) < 5) {
            return true;
        }
    }
    
    return false;
}

function moveCars() {
    checkForCollisions();
    
    updateCrashState();
    
    updateRecoveryState();
    
    if (crashState.active) {
        cars.forEach(car => {
            car.targetSpeed = 0;
            car.currentSpeed = 0;
        });
        return;
    }
    
    // ascending order for cars count
    Object.keys(lanes).forEach(direction => {
        const laneCars = lanes[direction];
        
        // Sort by path progress: higher pathSegment = further ahead, then by position within segment
        laneCars.sort((a, b) => {
            // compare by path segment (further along the path = in front)
            if (a.pathSegment !== b.pathSegment) {
                return b.pathSegment - a.pathSegment;
            }
            
            // If on same segment, sort by position along current axis AND direction of travel
            const aAxis = Array.isArray(a.config.axis) ? a.config.axis[a.pathSegment] : a.config.axis;
            const bAxis = Array.isArray(b.config.axis) ? b.config.axis[b.pathSegment] : b.config.axis;
            
            const aPos = aAxis === 'x' ? a.position.x : a.position.y;
            const bPos = bAxis === 'x' ? b.position.x : b.position.y;

            // Determine actual direction of movement based on path
            const aNextPoint = a.config.points[a.pathSegment + 1];
            const bNextPoint = b.config.points[b.pathSegment + 1];
            
            if (aNextPoint && bNextPoint && aAxis === bAxis) {
                const aCurrentPoint = a.config.points[a.pathSegment];
                const bCurrentPoint = b.config.points[b.pathSegment];
                
                if (aAxis === 'x') {
                    const aMovingRight = aNextPoint.x > aCurrentPoint.x;
                    return aMovingRight ? (bPos - aPos) : (aPos - bPos);
                } else {
                    const aMovingDown = aNextPoint.y > aCurrentPoint.y;
                    return aMovingDown ? (bPos - aPos) : (aPos - bPos);
                }
            }

            // Fallback
            if (direction === 'east') return bPos - aPos;
            if (direction === 'west') return aPos - bPos;
            if (direction === 'north') return bPos - aPos;
            if (direction === 'south') return aPos - bPos;
            return 0;
        });

        for (let i = 0; i < laneCars.length; i++) {
            const car = laneCars[i];
            const frontCar = i === 0 ? null : laneCars[i - 1];
            const predictedSpeed = car.baseSpeed;

            car.targetSpeed = car.baseSpeed;
            
            // spacing and stuff b/w cars
            if (frontCar) {
                // calc actual distance between cars using euclidean distance
                const dx = frontCar.position.x - car.position.x;
                const dy = frontCar.position.y - car.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // prevent clipping
                const effectiveGap = (frontCar.pathSegment > 0 || car.pathSegment > 0) 
                    ? car.desiredGap * 1.3 
                    : car.desiredGap;

                // speed control to prevent overlaps
                if (distance < effectiveGap * 0.9) {
                    car.targetSpeed = 0; 
                } else if (distance < effectiveGap * 1.1) {
                    car.targetSpeed = Math.min(car.targetSpeed, frontCar.currentSpeed * 0.6);
                } else if (distance < effectiveGap * 1.3) {
                    car.targetSpeed = Math.min(car.targetSpeed, frontCar.currentSpeed * 0.85);
                } else if (distance < effectiveGap * 1.5) {
                    car.targetSpeed = Math.min(car.targetSpeed, frontCar.currentSpeed * 1.0);
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
                
            } else {
                let currentSegment = car.config.points[car.pathSegment];
                let nextSegment = car.config.points[car.pathSegment + 1];

                if (!nextSegment) {
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
                            moved = true;
                        }
                    } else {
                        const direction = Math.sign(nextSegment.y - currentSegment.y);
                        car.position.y += direction * speedThisFrame;
                        if ((direction > 0 && car.position.y >= nextSegment.y) || (direction < 0 && car.position.y <= nextSegment.y)) {
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

            
            car.element.style.opacity = '1'; 
            delete car.fadeState; 

            if (car.position.x > 650 || car.position.x < -50 || car.position.y > 650 || car.position.y < -50) {
                if (!car.crashed) {
                    awardPoints();
                }
                removeCar(car);
            }
        }
    });
}

// Hysteresis prevents spawn flickering at threshold boundary
function updateLaneSpawnFlag(direction) {
    const count = lanes[direction].length;
    if (count > 6) {
        laneAllowedToSpawn[direction] = false;
    } else if (count <= 3) {
        laneAllowedToSpawn[direction] = true;
    }
}

// Syncs DOM state with data state on load
function initializeTrafficLights() {
    for (const direction in trafficLights) {
        const lightElement = document.querySelector(`.traffic-light.${direction}`);
        if (trafficLights[direction] === 'red') {
            lightElement.classList.add('red');
        }
    }
}

function toggleLight(direction) {
    const lightElement = document.querySelector(`.traffic-light.${direction}`);
    
    if (trafficLights[direction] === 'red') {
        trafficLights[direction] = 'green';
        lightElement.classList.remove('red');
    } else {
        trafficLights[direction] = 'red';
        lightElement.classList.add('red');
    }
}

function gameLoop() {
    if (!isPaused) moveCars();
    requestAnimationFrame(gameLoop);
}

// Randomness and interval prevent uniform traffic patterns
function startCarSpawning() {
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(() => {
        if (isPaused) return;
        if (Math.random() < 0.8) {
            spawnCar();
        }
    }, 2000);
}

initializeTrafficLights();
updateScoreDisplay();
startCarSpawning();
gameLoop();

// Show dialogue box on game load
window.addEventListener('load', () => {
    const dialogueBox = document.getElementById('dialogueBox');
    const startGameBtn = document.getElementById('startGameBtn');

    if (dialogueBox && startGameBtn) {
        dialogueBox.style.display = 'flex';
        isPaused = true; // Pause the game until the user starts

        startGameBtn.addEventListener('click', () => {
            dialogueBox.classList.add('fade-out');
            setTimeout(() => {
                dialogueBox.style.display = 'none';
                isPaused = false; // Resume the game
            }, 500); // Match the duration of the fade-out animation
        });
    }
});

const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
        pauseBtn.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
    });
}