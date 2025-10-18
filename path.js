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
        rotation: [0, 270],
        axis: ['x', 'y']
    },
    'east-south': {
        points: [
            { x: 10, y: 250 },
            { x: 260, y: 250 },
            { x: 260, y: 600 }
        ],
        stopPos: { x: 180, y: 250 },
        rotation: [0, 90],
        axis: ['x', 'y']
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
        axis: ['x', 'y']
    },
    'west-north': {
        points: [
            { x: 560, y: 325 },
            { x: 300, y: 325 },
            { x: 300, y: -40 }
        ],
        stopPos: { x: 390, y: 325 },
        rotation: [180, -90],
        axis: ['x', 'y']
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
        axis: ['y', 'x']
    },
    'north-east': {
        points: [
            { x: 250, y: 10 },
            { x: 250, y: 250 },
            { x: 600, y: 250 }
        ],
        stopPos: { x: 250, y: 180 },
        rotation: [90, 0],
        axis: ['y', 'x']
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
        axis: ['y', 'x']
    },
    'south-west': {
        points: [
            { x: 310, y: 560 },
            { x: 310, y: 325 },
            { x: -40, y: 325 }
        ],
        stopPos: { x: 310, y: 390 },
        rotation: [-90, 180],
        axis: ['y', 'x']
    }
};
