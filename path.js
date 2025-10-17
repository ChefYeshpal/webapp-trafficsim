const vehiclePaths = {
    east: {
        paths: [
            // Path 0: Straight through (east to west)
            {
                points: [
                    { x: 10, y: 250 },
                    { x: 600, y: 250 }
                ],
                stopPos: { x: 180, y: 250 }
            },
            // Path 1: Turn right (east to south)
            {
                points: [
                    { x: 10, y: 250 },
                    { x: 280, y: 250 }, // to intersection
                    { x: 290, y: 600 }  // turn right to south
                ],
                stopPos: { x: 180, y: 250 }
            }
        ],
        rotation: 0,
        axis: 'x'
    },
    west: {
        paths: [
            // Path 0: Straight through (west to east)
            {
                points: [
                    { x: 560, y: 325 },
                    { x: -40, y: 325 }
                ],
                stopPos: { x: 390, y: 325 }
            },
            // Path 1: Turn right (west to north)
            {
                points: [
                    { x: 560, y: 325 },
                    { x: 280, y: 325 }, // to intersection
                    { x: 270, y: -40 }  // turn right to north
                ],
                stopPos: { x: 390, y: 325 }
            }
        ],
        rotation: 180,
        axis: 'x'
    },
    north: {
        paths: [
            // Path 0: Straight through (north to south)
            {
                points: [
                    { x: 250, y: 10 },
                    { x: 260, y: 600 }
                ],
                stopPos: { x: 260, y: 180 }
            },
            // Path 1: Turn right (north to east)
            {
                points: [
                    { x: 250, y: 10 },
                    { x: 260, y: 280 }, // to intersection
                    { x: 600, y: 290 }  // turn right to east
                ],
                stopPos: { x: 260, y: 180 }
            }
        ],
        rotation: 90,
        axis: 'y'
    },
    south: {
        paths: [
            // Path 0: Straight through (south to north)
            {
                points: [
                    { x: 310, y: 560 },
                    { x: 300, y: -40 }
                ],
                stopPos: { x: 300, y: 390 }
            },
            // Path 1: Turn right (south to west)
            {
                points: [
                    { x: 310, y: 560 },
                    { x: 300, y: 280 }, // to intersection
                    { x: -40, y: 270 }  // turn right to west
                ],
                stopPos: { x: 300, y: 390 }
            }
        ],
        rotation: -90,
        axis: 'y'
    }
};
