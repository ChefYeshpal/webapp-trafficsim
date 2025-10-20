# webapp-trafficsim
A traffic light manager simulator

This project is for week 6 of [siege](https://siege.hackclub.com), with the theme being "Signal". The initial idea is to make something akin to ["intersection controller"](https://play.google.com/store/apps/details?id=se.shadowtree.software.trafficbuilder&hl=en_GB&pli=1).
Although, it will probably be much much simpler, with less logic involved as I currently dont have much knowledge in how to add driving logic to something that's on web. The reason why I prefer making things that can be displayed on web is, because it is much much simpler to test and deploy it in such a way that other's can test it as welll (looking at you stonemasons ;D)

## Demo

**[Watch Demo Video](./assets/demo.mp4)** (gotta download it, gh doesn't support vid embeds!?!??!??!)


## Things to do

- A traffic signal thing
    - If the user makes a lane wait too long, then the drivers may crash into one another in an act of road rage (x)
- Cars
    - They should get indicators
        - a left arrow means they wanna go to left (x)
        - a right arrow means they wanna go to right (x) 
        - no special thing means they wanna go straight (x)
    - Should become rash the longer they wait (x)

- Add more maps
    - Maybe draw some? I dunno... (x)


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
    - Blinker system doeBsn't really work for some reason...
- 19 Oct 2025
    - Added collision checking system
        - Crash is only registered if cars overlap a certain bit
        - It is also only registered in the area of intersection between the two roads, otherwise one can get a game over cause of some weird bugs I probably didn't find
        - Added console logs for crashes, could help in debugging later on ig
        - Added red screen for notifying crash
        - Cars also shouldn't spawn upon one another (at least in my testing)
    - Added point system
        - The cars that leave the game container constitute one point
        - If many cars leave together at once, then you get nice multipliers
        - In case of crashes, you lose 5 points
    - Added game over system
    - Getting 69 points gives a noice dialogue box
    - Added test functions to use in console to check if responses are properly shown
    - Added a initial dialogue box to explain how the game works
    - Added dynamic spawn rates, depend on your score really

## For the reviewers...

Okay, so I'm learning how to properly comment in my code, and I really wanna thank i-am-unknown-81514525 for telling me **how** to actually comment on code, previously I was going on the philosophy of "what this does", but from now on I will change it to the philosophy of "why I'm doing this". 


I also want to address the fact that this is a super simple game for someone who did it in 10 hours, and I know, it is. Most of the time, I was actually held back due to logic issues (like turning and blinker) which I for the best of me couldn't understand how to code into this. Initially I had plannned for this to have more features but really by the end of it I kind of ran out of time, and couldn't really add them.


Another thing to address was, when you check the commit history, you may see 2 names, "ChefYeshpal" and "valkarie", both are me, just on different workstations. I am currently trying to set up github cli on my linux (valkarie) workstation, however I request you to give a blind eye to it for this week as it's encountering some problems for some reason.

## Where was ai used?

- Originally I used AI in the css part, but after getting a warning from stonemasons I've re-written most of the css myself again
- I think this constitutes for less than 30% of the overall code, considering how it's all just css

## Update: Regarding the AI issue

I was told that the css looked very much "AI like" and there was some code in the JS which they think was AI generated, because of that I have changed the css, and also removed some of the js logic (not a lot though). I hope this is enough for the reviewers to consider this project to be less than 30% AI, even though I haven't used it as much.