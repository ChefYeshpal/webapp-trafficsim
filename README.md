# webapp-trafficsim
A traffic light manager simulator

This project is for week 6 of [siege](https://siege.hackclub.com), with the theme being "Signal". The initial idea is to make something akin to ["intersection controller"](https://play.google.com/store/apps/details?id=se.shadowtree.software.trafficbuilder&hl=en_GB&pli=1).
Although, it will probably be much much simpler, with less logic involved as I currently dont have much knowledge in how to add driving logic to something that's on web. The reason why I prefer making things that can be displayed on web is, because it is much much simpler to test and deploy it in such a way that other's can test it as welll (looking at you stonemasons ;D)

## Things to do

- Add roads
- A traffic signal thing
    - Red and green will be there, the user will control the red and green lights
    - If the user makes a lane wait too long, then the drivers may crash into one another in an act of road rage
    - Also, will need to add a system so that the crashed cars automatically get removed after some time (5secs)
- Cars
    - They should get indicators
        - a left arrow means they wanna go to left
        - a right arrow means they wanna go to right
        - no special thing means they wanna go straight
    - Should become rash the longer they wait

## Devlog

- 14 Oct 2025
    - Created repository and coned
    - Updated README
    - Made the basic files (html, css, and js)
    - Added a game container
        - Has the game play inside of it, I think it would make it simpler to code and all
        - Added a pause button that stops the spawning of cars
    - Updated car mechanics
        - Cars spawn inside the game container, fading in from the edge
        - Cars despawn just before hitting the container edge, fading out
        - Cars are randomly spawned in at random intervals
        - Cars can have random colours
    - Was trying to make it so that the entire square game window fits just inside the browser window, will need to look at how to do that tho...