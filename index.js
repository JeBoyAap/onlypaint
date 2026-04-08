const canvas = document.getElementById("drawing-canvas")
const context = canvas.getContext("2d")
const canvas_background_color = "#f0f0f0" //keep in hex

//control panel inputs
    //tools
const cursorButton = document.getElementById("cursor-button")
const pencileButton = document.getElementById("pencil-button")
const eraserButton = document.getElementById("eraser-button")
const brushButton = document.getElementById("brush-button")
const bucketButton = document.getElementById("bucket-button")
const pipetButton = document.getElementById("pipet-button")

    //shapes
const lineButton = document.getElementById("line-button")
const rectButton = document.getElementById("rect-button")

    //other
const clearButton = document.getElementById("clear-canvas-button")
const colorInput = document.getElementById("color-input")

const penSizeInput = document.getElementById("pen-size-input")

const undoButton = document.getElementById("undo-button")
const redoButton = document.getElementById("redo-button")

const downloadButton = document.getElementById("download-button")


let isDrawing = false
let currentMode = "cursor"
let startX, startY, lineSnapshot, rectSnapshot;

function initCanvas() {
    resizeCanvas()
    setBackgroundColor()
    setCursor()
}

function setBackgroundColor() {
    context.fillStyle = canvas_background_color
    context.fillRect(0, 0, canvas.width, canvas.height)
}

function resizeCanvas() {
    saveSnapshot()
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight * 0.75;
    setBackgroundColor()
    undo()
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


// Mode management
function setMode(mode) {
    currentMode = mode

    if (mode === "pencil") {
        setPenSize()
        setStrokeColor()
    } else if (mode === "brush") {
        context.lineWidth = 10
        setStrokeColor()
    } else if (mode === "eraser") {
        setPenSize()
        context.strokeStyle = canvas_background_color
        context.fillStyle = canvas_background_color
    }
}

function setCursor() { setMode("cursor") }
function setPencil() { setMode("pencil") }
function setEraser() { setMode("eraser") }
function setBrush()  { setMode("brush")  }
function setBucket() { setMode("bucket") }
function setPipet()  { setMode("pipet")  }
function setLine() { setMode("line") }
function setRect() { setMode("rect") }

function isDrawingMode() {
    return currentMode === "pencil" || currentMode === "eraser" || currentMode === "brush" || currentMode === "line" || currentMode === "rect"
}


// Undo/redo functionality
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


// Drawing logic
function draw(e) {
    if (!isDrawing || !isDrawingMode()) return

    if (currentMode === "line") {
        context.putImageData(lineSnapshot, 0, 0)  // restore clean canvas
        context.beginPath()
        context.moveTo(startX, startY)
        context.lineTo(e.offsetX, e.offsetY)
        context.stroke()
        return
    }

    if (currentMode === "rect") {
        context.putImageData(rectSnapshot, 0, 0)  // restore clean canvas
        context.beginPath()
        context.rect(startX, startY, e.offsetX - startX, e.offsetY - startY)
        context.stroke()
        return
    }

    context.lineTo(e.offsetX, e.offsetY)
    context.stroke()
}


// Bucket logic
function bucketFill(e) {
    saveSnapshot()

    const startX = Math.floor(e.offsetX);
    const startY = Math.floor(e.offsetY);

    const fillColor = hexToRgb(colorInput.value);

    let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    let data = imageData.data

    const startI = toArrayIndex(startX, startY)
    const startColor = [data[startI], data[startI+1], data[startI+2]]

    if (startColor.toString() === fillColor.toString()) return;

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
    if ((currentX + 1 < canvas.width) && sameColor(data, currentX + 1, currentY, startColor))
        neighbours.push(toArrayIndex(currentX + 1, currentY));
    if ((currentX - 1 >= 0) && sameColor(data, currentX - 1, currentY, startColor))
        neighbours.push(toArrayIndex(currentX - 1, currentY));
    if ((currentY + 1 < canvas.height) && sameColor(data, currentX, currentY + 1, startColor))
        neighbours.push(toArrayIndex(currentX, currentY + 1));
    if ((currentY - 1 >= 0) && sameColor(data, currentX, currentY - 1, startColor))
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
    data[pixelIndex] = fillColor[0]
    data[pixelIndex + 1] = fillColor[1]
    data[pixelIndex + 2] = fillColor[2]
    return data
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16)
    const g = parseInt(hex.slice(3,5), 16)
    const b = parseInt(hex.slice(5,7), 16)
    return [r, g, b]
}

function toArrayIndex(x, y) {
    return (y * canvas.width + x) * 4;
}


//pipet logic
function setPipetColor(e) {
    const pixel = context.getImageData(e.offsetX, e.offsetY, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    colorInput.value = hex;
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}


// Event listeners
let fillAfterTimeout = null
let pointerPosition = [null, null]

canvas.addEventListener("pointerdown", (e) => {
    startX = e.offsetX;
    startY = e.offsetY;
    
    if (currentMode === "pipet") {
        setPipetColor(e)
    }

    if (currentMode === "line") {
        lineSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (currentMode === "rect") {
        rectSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (!isDrawingMode()) return;

    isDrawing = true;
    saveSnapshot()
    context.beginPath()
    context.moveTo(e.offsetX, e.offsetY)
    fillAfterTimeout = setTimeout(() => {
        const distance = Math.hypot(pointerPosition[0] - startX, pointerPosition[1] - startY)
        if (distance <= 1) {
            context.fillRect(
                startX - penSizeInput.value / 2,
                startY - penSizeInput.value / 2,
                penSizeInput.value,
                penSizeInput.value
            )
        }
    }, 200)
});
canvas.addEventListener("pointerup", (e) => {
    isDrawing = false
    if (currentMode === "bucket") bucketFill(e);
});
canvas.addEventListener("pointerleave", () => isDrawing = false);
canvas.addEventListener("pointermove", (e) => {
    pointerPosition = [e.offsetX, e.offsetY]
    clearTimeout(fillAfterTimeout)
    draw(e)
});

// Control panel
    //tools
cursorButton.addEventListener("click", setCursor)
pencileButton.addEventListener("click", setPencil)
eraserButton.addEventListener("click", setEraser)
brushButton.addEventListener("click", setBrush)
bucketButton.addEventListener("click", setBucket)
pipetButton.addEventListener("click", setPipet)

    //shapes
lineButton.addEventListener("click", setLine)
rectButton.addEventListener("click", setRect)

    //other
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

window.addEventListener('resize', resizeCanvas);


// Toggle active tool button styling
const toolButtons = document.querySelectorAll('.tools, .shapes');
toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// Preset colors
document.querySelectorAll('.color-preset').forEach(button => {
    button.addEventListener('click', () => {
        colorInput.value = rgbToHex(
            ...button.style.backgroundColor.match(/\d+/g).map(Number)
        )
        setStrokeColor()
    })
})

initCanvas()