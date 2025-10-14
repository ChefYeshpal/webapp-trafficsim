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
        startPos: { left: -50, top: 250 },
        stopPos: { left: 180, top: 250 },
        endPos: { left: 650, top: 250 },
        rotation: 0,
        axis: 'left'
    },
    west: {
        startPos: { left: 650, top: 325 },
        stopPos: { left: 390, top: 325 },
        endPos: { left: -50, top: 325 },
        rotation: 0,
        axis: 'left'
    },
    north: {
        startPos: { left: 260, top: -50 },
        stopPos: { left: 260, top: 180 },
        endPos: { left: 260, top: 650 },
        rotation: 90,
        axis: 'top'
    },
    south: {
        startPos: { left: 300, top: 650 },
        stopPos: { left: 300, top: 390 },
        endPos: { left: 300, top: -50 },
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
function spawnCar() {
    const direction = getRandomDirection();
    const config = directionConfigs[direction];
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
    
    document.querySelector('.intersection-container').appendChild(carElement);
    
    // Create car object
    const car = {
        id: id,
        element: carElement,
        direction: direction,
        config: config,
        position: config.axis === 'left' ? config.startPos.left : config.startPos.top,
        speed: 1 + Math.random() * 1, // Random speed between 1-2
        stopped: false
    };
    
    cars.push(car);
}

// Remove car from game
function removeCar(car) {
    car.element.remove();
    cars = cars.filter(c => c.id !== car.id);
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

// Prevent cars from overlapping by stopping them a few pixels before the car in front
function preventCarOverlap() {
    const carGroups = cars.reduce((groups, car) => {
        if (!groups[car.direction]) {
            groups[car.direction] = [];
        }
        groups[car.direction].push(car);
        return groups;
    }, {});

    for (const direction in carGroups) {
        const group = carGroups[direction];
        const config = directionConfigs[direction];
        const axis = config.axis;

        // Sort cars based on their position in the direction of movement
        group.sort((a, b) => (a.position - b.position) * (direction === 'east' || direction === 'south' ? 1 : -1));

        let carsAtSignal = 0; // Counter for cars at the signal

        for (let i = 0; i < group.length; i++) {
            const currentCar = group[i];
            const frontCar = group[i - 1]; // Car in front

            // Check if the car should stop at the signal
            const stopPosition = config.axis === 'left' ? config.stopPos.left - 10 : config.stopPos.top - 10; // Stop 10px before the signal
            const lightState = trafficLights[direction];

            if (lightState === 'red' && i === 0) {
                // First car in the lane stops at the signal
                if ((direction === 'east' || direction === 'north') && currentCar.position + currentCar.speed >= stopPosition) {
                    currentCar.stopped = true;
                    currentCar.position = stopPosition;
                    carsAtSignal++;
                } else if ((direction === 'west' || direction === 'south') && currentCar.position - currentCar.speed <= stopPosition) {
                    currentCar.stopped = true;
                    currentCar.position = stopPosition;
                    carsAtSignal++;
                } else {
                    currentCar.stopped = false;
                }
            }

            if (i > 0) {
                // Cars stop behind the car in front
                const distance = Math.abs(currentCar.position - frontCar.position);

                if (distance < 50 || frontCar.stopped) { // Minimum gap of 50px or if the front car is stopped
                    currentCar.stopped = true;
                    currentCar.position = frontCar.position - (direction === 'east' || direction === 'south' ? 50 : -50);
                } else {
                    currentCar.stopped = false;
                }
            }

            // Enforce a maximum of 5 cars at the signal
            if (lightState === 'red' && carsAtSignal >= 5) {
                removeCar(currentCar);
            }
        }
    }
}

// Enforce a maximum of 5 cars per lane
function enforceMaxCarsPerLane() {
    const carGroups = cars.reduce((groups, car) => {
        if (!groups[car.direction]) {
            groups[car.direction] = [];
        }
        groups[car.direction].push(car);
        return groups;
    }, {});

    for (const direction in carGroups) {
        const group = carGroups[direction];
        const config = directionConfigs[direction];
        const axis = config.axis;

        // Sort cars based on their position in the direction of movement
        group.sort((a, b) => (a.position - b.position) * (direction === 'east' || direction === 'south' ? 1 : -1));

        // Remove excess cars beyond the maximum allowed
        while (group.length > 5) {
            const carToRemove = group.shift(); // Remove the car furthest off-screen
            removeCar(carToRemove);
        }
    }
}

// Move all cars
function moveCars() {
    cars.forEach(car => {
        // Check if car should stop
        if (shouldStop(car)) {
            car.stopped = true;
            const stopPos = car.config.axis === 'left' ? car.config.stopPos.left : car.config.stopPos.top;
            car.position = stopPos;
        } else {
            car.stopped = false;
            
            // Move car in its direction
            if (car.direction === 'east' || car.direction === 'north') {
                car.position += car.speed;
            } else {
                car.position -= car.speed;
            }
        }
        
        // Update visual position
        if (car.config.axis === 'left') {
            car.element.style.left = car.position + 'px';
        } else {
            car.element.style.top = car.position + 'px';
        }
        
        // Remove car if it's off screen
        const endPos = car.config.axis === 'left' ? car.config.endPos.left : car.config.endPos.top;
        if (car.direction === 'east' || car.direction === 'north') {
            if (car.position > endPos) {
                removeCar(car);
            }
        } else {
            if (car.position < endPos) {
                removeCar(car);
            }
        }
    });
}

// Limit the number of cars piling up off-screen
function limitOffScreenPileup() {
    const carGroups = cars.reduce((groups, car) => {
        if (!groups[car.direction]) {
            groups[car.direction] = [];
        }
        groups[car.direction].push(car);
        return groups;
    }, {});

    for (const direction in carGroups) {
        const group = carGroups[direction];
        const config = directionConfigs[direction];
        const axis = config.axis;

        // Sort cars based on their position in the direction of movement
        group.sort((a, b) => (a.position - b.position) * (direction === 'east' || direction === 'south' ? 1 : -1));

        // Remove excess cars off-screen
        const maxOffScreenCars = 3; // Allow up to 3 cars off-screen
        let offScreenCount = 0;

        for (let i = 0; i < group.length; i++) {
            const car = group[i];
            const isOffScreen = (direction === 'east' && car.position < config.startPos.left) ||
                                (direction === 'west' && car.position > config.startPos.left) ||
                                (direction === 'north' && car.position < config.startPos.top) ||
                                (direction === 'south' && car.position > config.startPos.top);

            if (isOffScreen) {
                offScreenCount++;
                if (offScreenCount > maxOffScreenCars) {
                    removeCar(car);
                }
            }
        }
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
    preventCarOverlap();
    enforceMaxCarsPerLane();
    moveCars();
    requestAnimationFrame(gameLoop);
}

// Spawn cars at random intervals
function startCarSpawning() {
    setInterval(() => {
        // Spawn a car with 80% probability
        if (Math.random() < 0.8) {
            spawnCar();
        }
    }, 2000); // Check every 2 seconds
}

// Start the game
initializeTrafficLights();
startCarSpawning();
gameLoop();

