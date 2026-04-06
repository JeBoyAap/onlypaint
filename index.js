const canvas = document.getElementById("drawing-canvas")
const context = canvas.getContext("2d")
const canvas_background_color = "#f0f0f0" //keep in hex

//control panel inputs
const cursorButton = document.getElementById("cursor-button")
const pencileButton = document.getElementById("pencil-button")
const eraserButton = document.getElementById("eraser-button")
const brushButton = document.getElementById("brush-button")
const bucketButton = document.getElementById("bucket-button")
const textButton = document.getElementById("text-button")

const clearButton = document.getElementById("clear-canvas-button")
const colorInput = document.getElementById("color-input")

const penSizeInput = document.getElementById("pen-size-input")


const undoButton = document.getElementById("undo-button")
const redoButton = document.getElementById("redo-button")

const downloadButton = document.getElementById("download-button")


let isDrawing = false
let pencilMode = true

function initCanvas() {
    resizeCanvas()
    setBackgroundColor()
    setCursor()
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

function setPenSize() {
    context.beginPath()
    context.lineWidth = penSizeInput.value
}


//Tools
function setCursor () {
    pencilMode = false
    eraserMode = false
    bucketMode = false
}

function setPencil () {
    pencilMode = true
    eraserMode = false
    bucketMode = false
    setPenSize()
    setStrokeColor()
}

function setEraser() {
    pencilMode = false
    eraserMode = true
    bucketMode = false
    setPenSize()
    context.strokeStyle = canvas_background_color
}

function setBrush() {
    pencilMode = true
    eraserMode = false
    bucketMode = false
    context.lineWidth = 10
    setStrokeColor()
}

function setBucket() {          
    pencilMode = false
    eraserMode = false
    bucketMode = true
}

function setText() {            //todo
    pencilMode = false
    eraserMode = false
    bucketMode = false
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


//drawing logic
function draw(e) {
    pointerPosition = [e.offsetX, e.offsetY]

    if (!isDrawing && (!pencilMode || !eraserMode)) return;
    context.lineTo(pointerPosition[0], pointerPosition[1])
    context.stroke()
}


//bucket logic
function bucketFill(e) {
    saveSnapshot()

    const startX = Math.floor(e.offsetX);
    const startY = Math.floor(e.offsetY);
    
    const fillColor = hexToRgb(colorInput.value);

    let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    let data = imageData.data

    const startI = toArrayIndex(startX, startY)
    const startColor = [data[startI], data[startI+1], data[startI+2]]

    if (startColor.toString() == fillColor.toString()) return;

    const queue = [startI]
    const visited = new Set()

    while (queue.length > 0) {
        let currentPixelIndex = queue.pop()

        if (visited.has(currentPixelIndex)) continue
        visited.add(currentPixelIndex)

        data = colorInPixel(data, currentPixelIndex, fillColor)

        let currentX = (currentPixelIndex / 4) % canvas.width
        let currentY = Math.floor(currentPixelIndex / 4 / canvas.width);

        let currentNeighbours = findNeighbours(currentX, currentY, data, startColor)
        queue.push(...currentNeighbours)
    }

    imageData.data = data
    context.putImageData(imageData, 0, 0)
}

function findNeighbours(currentX, currentY, data, startColor) {
    const neighbours = []
    if ((currentX + 1 < canvas.width) && sameColor(data, currentX + 1, currentY, startColor)) //rechts
        neighbours.push(toArrayIndex(currentX + 1, currentY));
    if ((currentX - 1 > 0) && sameColor(data, currentX - 1, currentY, startColor)) //links
        neighbours.push(toArrayIndex(currentX - 1, currentY));
    if ((currentY + 1 < canvas.height) && sameColor(data, currentX, currentY + 1, startColor)) //boven
        neighbours.push(toArrayIndex(currentX, currentY + 1));
    if ((currentY - 1 > 0) && sameColor(data, currentX, currentY - 1, startColor)) //onder
        neighbours.push(toArrayIndex(currentX, currentY - 1));

    return neighbours
}

function sameColor(data, currentX, currentY, [r, g, b], tolerance = 100) {
    const i = toArrayIndex(currentX, currentY);
    return Math.abs(data[i]   - r) <= tolerance &&
           Math.abs(data[i+1] - g) <= tolerance &&
           Math.abs(data[i+2] - b) <= tolerance
}

function colorInPixel(data, pixelIndex, fillColor) {
    data[pixelIndex] = fillColor[0]     //r
    data[pixelIndex + 1] = fillColor[1] //g
    data[pixelIndex + 2] = fillColor[2] //b
    return data
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16)
    const g = parseInt(hex.slice(3,5), 16)
    const b = parseInt(hex.slice(5,7), 16)
    return [r, g, b]
}

function toArrayIndex(x,y) {
    return (y * canvas.width + x) * 4;
}

//Event listeners

//pointer events
fillAfterTimeout = null
pointerStartPosition = [null, null]
canvas.addEventListener("pointerdown", (e) => {
    if (!pencilMode && !eraserMode) return;
    isDrawing = true;
    saveSnapshot()
    context.beginPath()
    context.moveTo(e.offsetX, e.offsetY)
    if (pencilMode == true) fillAfterTimeout = setTimeout(() => context.fillRect(pointerPosition[0] - 1/2 * penSizeInput.value, pointerPosition[1] - 1/2 * penSizeInput.value, penSizeInput.value, penSizeInput.value), 200) //.2 seconds
});
canvas.addEventListener("pointerup", (e) => {
    isDrawing = false
    if (bucketMode) bucketFill(e);
});
canvas.addEventListener("pointerleave", () => isDrawing = false);
canvas.addEventListener("pointermove", (e) => {
    clearTimeout(fillAfterTimeout)                                  //temp solution for drawing in place, change to using pointer up and a distance check
    draw(e)
});

//Controlpanel interactions

cursorButton.addEventListener("click", setCursor)
pencileButton.addEventListener("click", setPencil)
eraserButton.addEventListener("click", setEraser)
brushButton.addEventListener("click", setBrush)
bucketButton.addEventListener("click", setBucket)
textButton.addEventListener("click", setText)


clearButton.addEventListener("click", clearCanvas)
colorInput.addEventListener("input", setStrokeColor)
penSizeInput.addEventListener("input", setPenSize)


undoButton.addEventListener("click", undo)
redoButton.addEventListener("click", redo)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") undo();
    if (e.ctrlKey && e.key === "y") redo();
});

downloadButton.addEventListener("click", downloadCanvas)

//other events
window.addEventListener('resize', resizeCanvas);


//toggle tools
const toolButtons = document.querySelectorAll('.tools');

toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

initCanvas()
