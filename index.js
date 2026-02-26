const canvas = document.getElementById("drawing-canvas")
const context = canvas.getContext("2d")
const canvas_height = 700
const canvas_width = 1250
const canvas_background_color = "#f0f0f0"

//control panel inputs
const clearButton = document.getElementById("clear-canvas-button")
const colorInput = document.getElementById("color-input")
const penSizeInput = document.getElementById("pen-size-input")

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

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    context.beginPath()
    context.moveTo(e.offsetX, e.offsetY)
});
canvas.addEventListener("mouseup", () => isDrawing = false);
canvas.addEventListener("mouseleave", () => isDrawing = false);
canvas.addEventListener("mousemove", draw);

clearButton.addEventListener("click", clearCanvas)
colorInput.addEventListener("input", setStrokeColor)
penSizeInput.addEventListener("input", setPenSize)

initCanvas();