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

const downloadButton = document.getElementById("download-button")


let isDrawing = false
let pencilMode = true

function initCanvas() {
    resizeCanvas()
    setBackgroundColor()
    setPencil()
}

function setBackgroundColor () {
    context.fillStyle = canvas_background_color
    context.fillRect(0, 0, canvas.width, canvas.height)    
}

function resizeCanvas() {
    saveSnapshot()
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight * 0.75;
    setBackgroundColor()
    undo() //loads last snapshot
    setPenSize()
    setStrokeColor()
}

function draw(e) {
    pointerPosition = [e.offsetX, e.offsetY]

    if (!isDrawing) return;
    context.lineTo(pointerPosition[0], pointerPosition[1])
    context.stroke()
}

function clearCanvas() {
    saveSnapshot()
    setStrokeColor()
    context.clearRect(0, 0, canvas.width, canvas.height)
    initCanvas()
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

function downloadCanvas() {
    const link = document.createElement("a")
    link.download = "drawing.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
}



//Event listeners

//pointer events
fillAfterTimeout = null
pointerStartPosition = [null, null]
canvas.addEventListener("pointerdown", (e) => {
    isDrawing = true;
    saveSnapshot()
    context.beginPath()
    context.moveTo(e.offsetX, e.offsetY)
    if (pencilMode == true) fillAfterTimeout = setTimeout(() => context.fillRect(pointerPosition[0] - 1/2 * penSizeInput.value, pointerPosition[1] - 1/2 * penSizeInput.value, penSizeInput.value, penSizeInput.value), 200) //.2 seconds
});
canvas.addEventListener("pointerup", () => isDrawing = false);
canvas.addEventListener("pointerleave", () => isDrawing = false);
canvas.addEventListener("pointermove", (e) => {
    clearTimeout(fillAfterTimeout)                                  //temp solution for drawing in place, change to using pointer up and a distance check
    draw(e)
});

//Controlpanel interactions
clearButton.addEventListener("click", clearCanvas)
colorInput.addEventListener("input", setStrokeColor)
pencileButton.addEventListener("click", setPencil)
penSizeInput.addEventListener("input", setPenSize)
eraserButton.addEventListener("click", setEraser)

undoButton.addEventListener("click", undo)
redoButton.addEventListener("click", redo)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") undo();
    if (e.ctrlKey && e.key === "y") redo();
});

downloadButton.addEventListener("click", downloadCanvas)

//other events
window.addEventListener('resize', resizeCanvas);


initCanvas()
