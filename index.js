const canvas = document.getElementById("drawing-canvas")
const context = canvas.getContext("2d")
const canvas_background_color = "#f0f0f0" //keep in hex

//control panel inputs
const clearButton = document.getElementById("clear-canvas-button")
const colorInput = document.getElementById("color-input")
const pencileButton = document.getElementById("pencil-button")
const penSizeInput = document.getElementById("pen-size-input")
const eraserButton = document.getElementById("eraser-button")

const undoButton = document.getElementById("undo-button")
const redoButton = document.getElementById("redo-button")


let isDrawing = false;
let pencilMode = true

function initCanvas() {
    resizeCanvas()
    canvas.style.background = canvas_background_color;
}

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight * 0.75;
}

function draw(e) {
    mousePosition = [e.offsetX, e.offsetY]

    if (!isDrawing) return;
    context.lineTo(mousePosition[0], mousePosition[1])
    context.stroke()
}

function clearCanvas() {
    saveSnapshot()
    setStrokeColor()
    context.clearRect(0, 0, canvas.width, canvas.height)
}

function setStrokeColor() {
    context.beginPath()
    context.strokeStyle = colorInput.value
    context.fillStyle = colorInput.value
}

function setPencil () {
    pencilMode = true
    setStrokeColor()
}
function setPenSize() {
    context.beginPath()
    context.lineWidth = penSizeInput.value
}

function setEraser() {
    pencilMode = false
    context.strokeStyle = canvas_background_color
}

//undo redo fuctionality
let undoStack = []
let redoStack = []

function saveSnapshot() {
    if (undoStack.length > 100) undoStack.shift()
    undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height))
    redoStack.length = 0
}

function undo() {
    if (undoStack.length === 0) return
    redoStack.push(context.getImageData(0, 0, canvas.width, canvas.height))
    const snapshot = undoStack.pop()
    context.putImageData(snapshot, 0, 0)
}

function redo() {
    if (redoStack.length === 0) return
    undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height))
    const snapshot = redoStack.pop()
    context.putImageData(snapshot, 0, 0)
}




//Event listeners

//Mouse events
mouseStartPosition = [null, null]
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    saveSnapshot()
    context.beginPath()
    context.moveTo(e.offsetX, e.offsetY)
    if (pencilMode == true) fillAfterTimeout = setTimeout(() => context.fillRect(mousePosition[0] - 1/2 * penSizeInput.value, mousePosition[1] - 1/2 * penSizeInput.value, penSizeInput.value, penSizeInput.value), 200) //.2 seconds
});
canvas.addEventListener("mouseup", () => isDrawing = false);
canvas.addEventListener("mouseleave", () => isDrawing = false);
canvas.addEventListener("mousemove", (e) => {
    clearTimeout(fillAfterTimeout)                                  //temp solution for drawing in place, change to using mouse up and a distance check
    draw(e)
});

//Controlpanel interactions
clearButton.addEventListener("click", clearCanvas)
colorInput.addEventListener("input", setStrokeColor)
pencileButton.addEventListener("click", setPencil)
penSizeInput.addEventListener("input", setPenSize)
eraserButton.addEventListener("click", setEraser);
undoButton.addEventListener("click", undo)
redoButton.addEventListener("click", redo)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") undo();
    if (e.ctrlKey && e.key === "y") redo();
});

//other events
window.addEventListener('resize', resizeCanvas);


initCanvas()
setPenSize()
setStrokeColor()
