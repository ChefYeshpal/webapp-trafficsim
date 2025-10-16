const vehiclePaths = {
    east: {
        points: [
            { x: 10, y: 250 },
            { x: 600, y: 250 }
        ],
        stopPos: { x: 180, y: 250 },
        rotation: 0,
        axis: 'x' // Primary axis of movement
    },
    west: {
        points: [
            { x: 560, y: 325 },
            { x: -40, y: 325 }
        ],
        stopPos: { x: 390, y: 325 },
        rotation: 180, // Visually, the car sprite is already facing left/right
        axis: 'x'
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
    south: {
        points: [
            { x: 300, y: 560 },
            { x: 300, y: -40 }
        ],
        stopPos: { x: 300, y: 390 },
        rotation: -90,
        axis: 'y'
    }
};
