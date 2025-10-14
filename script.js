let currentLight = 'red';
const car = document.getElementById('car1');
function changeLight() {
    ['red', 'yellow', 'green'].forEach(l => document.getElementById(l).classList.remove('active'));
if(currentLight==='red') {
    currentLight = 'green';
} else if(currentLight==='green') {
    currentLight = 'yellow';
} else {
    currentLight = 'red';
}
document.getElementById(currentLight).classList.add('active');
moveCar();
}
function moveCar() {
    if(currentLight==='green') {
        car.style.left = '250px'; // car moves
    } else {
        car.style.left = '30px'; // car stops
    }
}

// On start
changeLight();