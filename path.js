const vehiclePaths = {
    east: {
        points: [
            { x: 10, y: 250 },
            { x: 600, y: 250 }
        ],
        stopPos: { x: 180, y: 250 },
        rotation: 0,
        axis: 'x'
    },
    'east-north': {
        points: [
            { x: 10, y: 250 },
            { x: 300, y: 250 },
            { x: 300, y: -40 }
        ],
        stopPos: { x: 180, y: 250 },
        rotation: [0, -90],
        axis: ['x', 'y'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    'east-south': {
        points: [
            { x: 10, y: 250 },
            { x: 260, y: 250 },
            { x: 260, y: 600 }
        ],
        stopPos: { x: 180, y: 250 },
        rotation: [0, 90],
        axis: ['x', 'y'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    west: {
        points: [
            { x: 560, y: 325 },
            { x: -40, y: 325 }
        ],
        stopPos: { x: 390, y: 325 },
        rotation: 180,
        axis: 'x'
    },
    'west-south': {
        points: [
            { x: 560, y: 325 },
            { x: 260, y: 325 },
            { x: 260, y: 600 }
        ],
        stopPos: { x: 390, y: 325 },
        rotation: [180, 90],
        axis: ['x', 'y'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    'west-north': {
        points: [
            { x: 560, y: 325 },
            { x: 300, y: 325 },
            { x: 300, y: -40 }
        ],
        stopPos: { x: 390, y: 325 },
        rotation: [180, -90],
        axis: ['x', 'y'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    north: {
        points: [
            { x: 250, y: 10 },
            { x: 260, y: 600 }
        ],
        stopPos: { x: 260, y: 180 },
        rotation: 90,
        axis: 'y'
    },
    'north-west': {
        points: [
            { x: 250, y: 10 },
            { x: 250, y: 325 },
            { x: -40, y: 325 }
        ],
        stopPos: { x: 250, y: 180 },
        rotation: [90, 180],
        axis: ['y', 'x'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    'north-east': {
        points: [
            { x: 250, y: 10 },
            { x: 250, y: 250 },
            { x: 600, y: 250 }
        ],
        stopPos: { x: 250, y: 180 },
        rotation: [90, 0],
        axis: ['y', 'x'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    south: {
        points: [
            { x: 310, y: 560 },
            { x: 300, y: -40 }
        ],
        stopPos: { x: 300, y: 390 },
        rotation: -90,
        axis: 'y'
    },
    'south-east': {
        points: [
            { x: 310, y: 560 },
            { x: 310, y: 250 },
            { x: 600, y: 250 }
        ],
        stopPos: { x: 310, y: 390 },
        rotation: [-90, 0],
        axis: ['y', 'x'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    },
    'south-west': {
        points: [
            { x: 310, y: 560 },
            { x: 310, y: 325 },
            { x: -40, y: 325 }
        ],
        stopPos: { x: 310, y: 390 },
        rotation: [-90, 180],
        axis: ['y', 'x'],
        blinker: { enabled: true, position: 'front', offsetY: -12 }
    }
};



/**
 * Attaches a blinker to a car element based on the path configuration.
 * @param {HTMLElement} carElement - The car DOM element to attach the blinker to.
 * @param {Object} pathConfig - The configuration object for the car's path.
 * @returns {HTMLElement|null} - The created blinker element, or null if no blinker is needed.
 */
function createBlinker(carElement, pathConfig) {
    if (!pathConfig || !pathConfig.blinker || !pathConfig.blinker.enabled) {
        return null;
    }

    // Create the blinker element (a tiny glowing div)
    const blinker = document.createElement('div');
    blinker.className = 'blinker front'; // CSS handles the blinking animation
    
    // Position the blinker vertically on the car
    // offsetY determines how high/low it sits (negative = above car top)
    if (typeof pathConfig.blinker.offsetY === 'number') {
        blinker.style.top = `${pathConfig.blinker.offsetY}px`;
    }
    
    // Attach it to the car (it'll move and rotate with the car)
    carElement.appendChild(blinker);
    
    return blinker;
}
