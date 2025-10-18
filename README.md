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
- 15 Oct 2025
    - Fixed a lil game mechanic, cars look at the signal oppposite to them for go-nogo
    - Tried to add some turning functionality, didn't seem to work really
        - It was taking entire U-turns for some reason, and the direction arrows weren't working well enough either.
        - Maybe will need to make a seperate JS script for this?
        - Will do it tmrw
- 16 Oct 2025
    - I, for the past hour, have been trying to ADD A TURNING BULLSHIT into this, but do you know how hard it is? Honestly, I dont. It's too hard.
    - Changed the fade out animation for the vehicles, should fade out smoother now
    - Created a dedicated file for path functions, should maybe make it easier for me now?
    - That's all that was really done, nothing new
- 17 Oct 2025
    - The turning shit finally works, it took another hour to set it up but basically:
        - the car uses the getRandomDirection for an updated 12 paths, and randomly turns left or right.
        - It's a little buggy, but oh well... it works aint it? I'm not gonna touch it.
    - Added blinkers, it's just a basic circle beside the cars for now but will update it later on to look more "blinker like"
- 18 Oct 2025
    - Updated the commments to use the idea of "why" rather than "how it works"
    - Removed the fade out effect, cars just cross the border now
    - Cars cannot overtake one another anymore
    - Fixed the car spinny thing that occured right after some turned
        - Just changed E-N rotation to [0, 270]
        - It was [0 -90] before, so the problem was probably that it spun to 90 deg first then kept going until it aligned and could go forwards
    - Fixed overlapping of cars
        - Cars kept overlapping after taking turn for somereason, apparently I gotta make sure it ALWAYS reads the distance from the cars...
    - 