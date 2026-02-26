const canvas = document.getElementById("drawing-canvas")
const context = canvas.getContext("2d")
const canvas_height = 700
const canvas_width = 1250
const canvas_background_color = "rgb(240, 240, 240)"

//control panel inputs
const clearButton = document.getElementById("clear-canvas-button")
const colorInput = document.getElementById("color-input")
const penSizeInput = document.getElementById("pen-size-input")

//TEMP save / restore for testing
const undoButton = document.getElementById("undo-button")
const redoButton = document.getElementById("redo-button")


let isDrawing = false;

let mouseStartPosition = [null, null]

function initCanvas() {
    canvas.height = canvas_height;
    canvas.width = canvas_width;
    canvas.style.background = canvas_background_color;
}

function draw(e) {
    mousePosition = [e.offsetX, e.offsetY]

    if (!isDrawing) return;

    context.lineTo(mousePosition[0], mousePosition[1])
    context.stroke()
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height)
}

function setStrokeColor() {
    context.beginPath()
    context.strokeStyle = colorInput.value
}

function setPenSize() {
    context.beginPath()
    context.lineWidth = penSizeInput.value
}


//undo redo fuctionality

let undoStack = []
let redoStack = []

function saveSnapshot() {
    canvasRestorePoint = context.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.push(canvasRestorePoint)
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
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    saveSnapshot()
    context.beginPath()
    context.moveTo(e.offsetX, e.offsetY)
});
canvas.addEventListener("mouseup", () => isDrawing = false);
canvas.addEventListener("mouseleave", () => isDrawing = false);
canvas.addEventListener("mousemove", draw);

//Controlpanel interactions
clearButton.addEventListener("click", clearCanvas)
colorInput.addEventListener("input", setStrokeColor)
penSizeInput.addEventListener("input", setPenSize)

undoButton.addEventListener("click", undo)
redoButton.addEventListener("click", redo)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") undo();
    if (e.ctrlKey && e.key === "y") redo();
});


initCanvas();