class BrainSave {
    constructor(key, fileName, brain, y) {
        this.key = key;
        this.fileName = fileName;
        this.brain = brain;
        this.maxY = y;
    }
}

const gameplayCanvas = document.getElementById("gameCanvas");
const networkCanvas = document.getElementById("networkCanvas");
const gameplayCtx = gameplayCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const settingsPanel = document.getElementById("settingsPanel");

const brainsDropdown = document.getElementById("brainSaves");

const autoRestartCheckbox = document.getElementById("autoRestartCheckbox");
const autoChangeCar = document.getElementById("autoChangeCheckbox");
const autoSaveCheckbox = document.getElementById("autoSaveCheckbox");
const aiCars = document.getElementById("aiCars");
const carId = document.getElementById("carId");

const timerCheckbox = document.getElementById("timerCheckbox");
const resetGameAt = document.getElementById("resetGameAt");

const brainSaveName = document.getElementById("brainSaveName");
const numOfRays = document.getElementById("numOfRays");
const numOfLayers = document.getElementById("numOfLayers");
const numOfNeurons = document.getElementById("numOfNeurons");

gameplayCanvas.width = 200;
networkCanvas.width = 600;

checkLocalStorage();
let currentBrainSave = JSON.parse(localStorage.getItem(0));

const road = new Road(gameplayCanvas.width / 2, gameplayCanvas.width * 0.9);
let brainSaves = [];
let cars = [];
let traffic = [];
let currentCar = null;

let initialTime = Date.now();
let timePassed = 0;
let lastUpdate = Date.now();
for (let i = 0; i < localStorage.length; i++) {
    try
    {
        const brainSave = JSON.parse(localStorage.getItem(localStorage.key(i)));
        brainSaves.push(brainSave);
        brainsDropdown.innerHTML += '<option value=' + brainSave.key + '>' + brainSave.fileName + '</option>';
    }catch(e)
    {
        console.log("Save corrupted, skipping");
    }
}
if(brainSaves.length == 0)
{
    console.log("All saves corrupted, resetting data");
    localStorage.clear();
    const defaultBrainSave = new BrainSave(0, "Default", new NeuralNetwork([5, 5, 4]), 0);
    localStorage.setItem(0, JSON.stringify(defaultBrainSave));
    brainSaves.push(defaultBrainSave);
    brainsDropdown.innerHTML += '<option value=' + defaultBrainSave.key + '>' + defaultBrainSave.fileName + '</option>';
}
brainsDropdown.value = 0;

init();
update();

function checkLocalStorage()
{
    if(localStorage.length > 0 && localStorage.getItem(0) == null) {
        localStorage.clear();
    }
    
    if (localStorage.length == 0) {
        localStorage.setItem(0, JSON.stringify(new BrainSave(0, "Default", new NeuralNetwork([5, 5, 4]), 0)));
    }
}

function createBrain() {
    if(brainSaveName.value == "") {
        alert("name cannot be empty"); return;
    }

    if(brainSaves.find(brain => brain.fileName == brainSaveName.value)) {
        alert("name taken"); 
        return;
    }
    const maxId = brainSaves.reduce((prev, current) => +current.key > +prev.key ? current : prev).key + 1;    

    let layers = [+numOfRays.value];
    for (let i = 0; i < +numOfLayers.value; i++) {
        layers.push(+numOfNeurons.value);
    }
    layers.push(4);
    const newBrainSave = new BrainSave(maxId, brainSaveName.value, new NeuralNetwork(layers), 0);
    currentBrainSave = newBrainSave;
    brainSaves.push(newBrainSave);
    brainsDropdown.innerHTML += '<option value=' + maxId + '>' + brainSaveName.value + '</option>';
    brainsDropdown.value = maxId;
    localStorage.setItem(maxId, JSON.stringify(currentBrainSave));
    init();
}

function changeBrain() {
    currentBrainSave = JSON.parse(localStorage.getItem(localStorage.key(brainsDropdown.value)));
    init();
}

function startTimer() {
    timePassed = 0;
    initialTime = Date.now();
}

function generateTraffic(numOfCars) {
    traffic = [];
    for (let i = 0; i <= numOfCars; i++) {
        let lane = Math.floor(Math.random() * 3);
        let ranValue = Math.random() * 0.5 + 1;
        let y = 1 - Math.floor(Math.random() * 2);
        traffic.push(new Car(road.getLaneCenter(lane), -300 * i + (y * -300), 30, 50 * ranValue, "TRAFFIC", 2 * ranValue))
    }
}

function generateAICars(numOfCars) {
    cars = [];
    for (let i = 0; i < numOfCars; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", 4, +numOfRays.value));
    }
    currentCar = cars[0];
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(JSON.stringify(currentBrainSave.brain));
        if (i > 0) {
            NeuralNetwork.mutate(cars[i].brain, 0.5);
        }
    }
}

function save() {
    currentBrainSave.brain = currentCar.brain;
    currentBrainSave.maxY = currentCar.y;
    localStorage.setItem(currentBrainSave.key, JSON.stringify(currentBrainSave));
}

function resetBrain() {
    NeuralNetwork.mutate(currentBrainSave.brain);
    init();
}

function deleteBrain() {
    localStorage.removeItem(currentBrainSave.key);
    checkLocalStorage();
    currentBrainSave = JSON.parse(localStorage.getItem(0));
    brainSaves = [];
    brainsDropdown.innerHTML = "";
    for (let i = 0; i < localStorage.length; i++) {
        const brainSave = JSON.parse(localStorage.getItem(localStorage.key(i)));
        brainSaves.push(brainSave);
        brainsDropdown.innerHTML += '<option value=' + brainSave.key + '>' + brainSave.fileName + '</option>';
    }
    init();
}

function clearBrains() {
    localStorage.clear();
    localStorage.setItem(0, JSON.stringify(new BrainSave(0, "Default", new NeuralNetwork([5, 5, 4]), 0)));
    currentBrainSave = JSON.parse(localStorage.getItem(0));
    brainSaves = [];
    brainsDropdown.innerHTML = "";
    for (let i = 0; i < localStorage.length; i++) {
        const brainSave = JSON.parse(localStorage.getItem(localStorage.key(i)));
        brainSaves.push(brainSave);
        brainsDropdown.innerHTML += '<option value=' + brainSave.key + '>' + brainSave.fileName + '</option>';
    }
    init();
}

function init() {
    generateAICars(+aiCars.value);
    generateTraffic(200);

    initialTime = Date.now();
    timePassed = 0;
}

function autoSave() {
    if (currentCar.y > currentBrainSave.maxY) {
        save();
    }
}

function nextOrPreviousCar(next) {
    let index = cars.indexOf(currentCar);
    if (next)
        index++;
    else
        index--;
    if (index < 0)
        index = 0;
    else if (index >= cars.length)
        index = cars.length - 1;
    currentCar = cars[index];
}

function restart() {
    if (autoSaveCheckbox.checked) {
        autoSave();
    }
    init();
    requestAnimationFrame(update);
}

function update(time) {
    now = Date.now();
    dt = now - lastUpdate;
    lastUpdate = now;

    activeCars = cars.filter(car => car.damaged == false).length / cars.length;

    if (autoRestartCheckbox.checked && activeCars < 0.1) {
        restart();
        return;
    }

    //updating physics
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, [], dt);
    }
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic, dt);
    }

    //auto car change
    minY = Math.min(...cars.map(c => c.y));
    if (autoChangeCar.checked) {
        currentCar = cars.find(c => c.y == minY);
    }
    carId.textContent = cars.indexOf(currentCar);

    //updating canvas view
    gameplayCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    gameplayCtx.save();
    gameplayCtx.translate(0, -currentCar.y + gameplayCanvas.height * 0.7);

    //drawing
    road.draw(gameplayCtx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(gameplayCtx, "purple");
    }

    gameplayCtx.globalAlpha = 0.4;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(gameplayCtx, "black");
    }
    gameplayCtx.globalAlpha = 1;
    currentCar.draw(gameplayCtx, "black", true);

    if (timerCheckbox.checked) {
        timePassed = now - initialTime;
        gameplayCtx.font = "15px Arial black";
        gameplayCtx.fillStyle = "black";
        gameplayCtx.shadowColor = "white";
        gameplayCtx.shadowOffsetX = 1;
        gameplayCtx.shadowOffsetY = 1;
        gameplayCtx.fillText("Time elapsed: " + Math.floor(timePassed / 1000), 15, currentCar.y - gameplayCanvas.height * 0.7 + 17);
        if (timePassed >= resetGameAt.value * 1000) {
            restart();
            return;
        }
    }

    gameplayCtx.restore();

    networkCtx.lineDashOffset = -time / 50
    Visualizer.drawNetwork(networkCtx, currentCar.brain);

    requestAnimationFrame(update);
}
