const gameOverResponses = [
    "oh mah gawd! mah baby!!",
    "we lost a very old soul that day...",
    "that'll buff right out... right?",
    "well, THAT just happened",
    "insurance companies HATE this one trick",
    "another one bites the dust",
    "whoopsie daisy!",
    "not your finest moment, chief",
    "physics: 1, you: 0",
    "I can't believe you've done this",
    "the speed limit is a suggestion, they said",
    "call the amberlamps!",
    "narrator: it was at this moment they knew... they did a fuggie wuggie",
    "red means stop, remember?",
    "that's gonna be expensive",
    "maybe traffic management isn't your calling",
    "at least nobody was hurt... in this simulation",
    "oof size: LARGE",
    "you had ONE job",
    "traffic lights are merely a suggestion, apparently",
    "you successfully passed",
    "you're the best",
    "Never submit passwords through Google Forms.",
];

function getRandomGameOverResponse() {
    return gameOverResponses[Math.floor(Math.random() * gameOverResponses.length)];
}

window.showGameOverResponses = function() {
    console.log(`gameover: Total game over responses available: ${gameOverResponses.length}`);
    console.log('gameover: All responses:');
    gameOverResponses.forEach((response, index) => {
        console.log(`  ${index}: "${response}"`);
    });
    return gameOverResponses.length;
};


window.testGameOver = function(responseIndex) {
    console.log('gameover: Testing game over screen...');
    

    if (typeof pointsState !== 'undefined') {
        pointsState.score = -1;
        pointsState.isGameOver = false; 
        
        if (responseIndex !== undefined) {
            const originalFunction = window.getRandomGameOverResponse;
            
            if (responseIndex >= 0 && responseIndex < gameOverResponses.length) {
                console.log(`gameover: Using response #${responseIndex}: "${gameOverResponses[responseIndex]}"`);
                window.getRandomGameOverResponse = function() {
                    return gameOverResponses[responseIndex];
                };
                
                triggerGameOver();
                
                setTimeout(() => {
                    window.getRandomGameOverResponse = originalFunction;
                }, 100);
            } else {
                console.error(`gameover: Invalid response index! Must be between 0 and ${gameOverResponses.length - 1}`);
                console.log('gameover: Use showResponseCount() to see all available responses');
                return;
            }
        } else {
            console.log('gameover: Using random response');
            triggerGameOver();
        }
    } else {
        console.error('gameover: Game not initialized yet! Wait for the page to load.');
    }
};

console.log('gameover: Test Functions Available:');
console.log('  - testGameOver()           : Trigger game over with random response');
console.log('  - testGameOver(5)          : Trigger game over with response #5');
console.log('  - showResponseCount()      : Show total number of responses');
