let dropText = document.getElementById('dropText');
let dropInput = document.getElementById('dropInput');
let canvasHolder = document.getElementById('alpha-canvasHolder');

let tempButton = document.getElementById('tempButton');

var selectorPosition = [];

function reset() {
    selectorPosition = [];
}

function rgbToYUV(r, g, b) {
    let y, u, v;
    y = 0.257 * r + 0.504 * g + 0.098 * b + 16;
    u = -0.148 * r - 0.291 * g + 0.439 * b + 128;
    v = 0.439 * r - 0.368 * g - 0.071 * b + 128;
    return [y, u, v];
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function imgToCanvas(img) {
    let canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    let width = canvas.width = img.naturalWidth;
    let height = canvas.height = img.naturalHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    let canvasOverlay = document.createElement('canvas');
    canvasOverlay.width = img.naturalWidth;
    canvasOverlay.height = img.naturalHeight;

    canvasOverlay.setAttribute('id', 'overlay');

    return {
        canvas: canvas,
        overlay: canvasOverlay
    };
}

function draw(e) {
    if(canvasHolder.firstChild) {

        let canvasOverlay = canvasHolder.childNodes[1];
        let ctx = canvasOverlay.getContext('2d');
        var pos = getMousePos(canvasOverlay, e);

        if(selectorPosition.length > 0) {
            let width = canvasOverlay.width;
            let height = canvasOverlay.height;
            canvasHolder.removeChild(canvasOverlay);

            canvasOverlay = document.createElement('canvas');
            canvasOverlay.width = width;
            canvasOverlay.height = height;

            canvasOverlay.setAttribute('id', 'overlay');

            canvasHolder.appendChild(canvasOverlay);
            ctx = canvasOverlay.getContext('2d');

            canvasHolder.appendChild(canvasOverlay);


            console.log("yeet");
        }

        selectorPosition[0] = pos.x;
        selectorPosition[1] = pos.y;

        ctx.fillStyle = "#FACADE";
        ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
    }
}

canvasHolder.addEventListener('click', draw, false);

function displayCanvas(canvas, canvasOverlay) {
    while(canvasHolder.firstChild && canvasHolder.removeChild(canvasHolder.firstChild));
    canvasHolder.appendChild(canvas);
    canvasHolder.appendChild(canvasOverlay);
}

function displayImage(files) {
    let img = document.createElement('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = function() {
        displayCanvas(imgToCanvas(img).canvas, imgToCanvas(img).overlay);
    }
}

var dx = [0, 0, 1, -1, 1, 1, -1, -1];
var dy = [1, -1, 0, 0, 1, -1, 1, -1];

var visited = [];
var condensedData = [];

function dfs(y, x, width, height, oy, ou, ov, intensity) {
    if(visited[y*width + x]) return;
    visited[y*width + x] = 1;

    for(let i = 0; i < 4; i++) {
        let nx = x + dx[i];
        let ny = y + dy[i];

        if(nx < 0 || ny < 0) continue;
        if(nx >= width || ny >= height) continue;
        if(visited[ny*width + nx]) continue;

        let yuv = rgbToYUV(condensedData[ny*width + nx][0], condensedData[ny*width + nx][1], condensedData[ny*width + nx][2]);
        if(Math.sqrt(Math.pow((yuv[0] - oy), 2) + Math.pow((yuv[1] - ou), 2) + Math.pow((yuv[2] - ov), 2)) > intensity) continue;

        dfs(ny, nx, width, height, oy, ou, ov, intensity);
    }
}

tempButton.addEventListener('click', ()=> {
    instantAlpha(50);
})

function instantAlpha(value) {
    if(selectorPosition.length > 0) {

        visited = [];
        condensedData = [];

        let stack = [];
        let pixelData = [];

        let canvas = canvasHolder.firstChild;
        let width = canvas.width;
        let height = canvas.height;
        let ctx = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;

        let originalX = Math.round(selectorPosition[0]);
        let originalY = Math.round(selectorPosition[1]);

        stack.push([originalX, originalY]);

        for(let i = 0; i < data.length; i+= 4) {
            pixelData = [];

            pixelData[0] = data[i];
            pixelData[1] = data[i+1];
            pixelData[2] = data[i+2];

            condensedData.push(pixelData);
        }

        for(let i = 0; i < condensedData.length; i++) {
            visited[i] = 0;
        }

        let yuv = rgbToYUV(condensedData[originalY*width + originalX][0], condensedData[originalY*width + originalX][1], condensedData[originalY*width + originalX][2]);

        let oy = yuv[0];
        let ou = yuv[1];
        let ov = yuv[2];

        let intensity = value/100;

        while(stack !== undefined && stack.length > 0) {
            var cx = stack[stack.length-1][0];
            var cy = stack[stack.length-1][1];

            visited[cy*width + cx] = 1;
            stack.pop();
            for(let i = 0; i < 4; i++) {
                var nx = cx + dx[i];
                var ny = cy + dy[i];

                if(nx < 0 || ny < 0) continue;
                if(nx >= width || ny >= height) continue;
                if(visited[ny*width + nx]) continue;
                yuv = rgbToYUV(condensedData[ny*width + nx][0], condensedData[ny*width + nx][1], condensedData[ny*width + nx][2]);
                if(Math.sqrt(Math.pow((yuv[0] - oy), 2) + Math.pow((yuv[1] - ou), 2) + Math.pow((yuv[2] - ov), 2)) > intensity) continue;
                stack.push([nx, ny]);
            }
        }

        let canvasOverlay = canvasHolder.childNodes[1];
        let ctxOverlay = canvasOverlay.getContext('2d');
        ctxOverlay.fillStyle = "#FACADE";
        for(let i = 0; i < visited.length; i++) {
            if(visited[i] == 1) {
                ctxOverlay.fillRect(i%width, i/width, 1, 1);
            }
        }
    }
}

document.ondrop = (event) => {
    event.preventDefault();
    displayImage(event.dataTransfer.files);
    reset();
}

document.ondragover = (event) => {event.preventDefault();};

document.ondragleave = (event) => {event.preventDefault();};

dropText.onclick = ()=> {
    dropInput.click();
};

dropInput.onchange = function() {
    displayImage(this.files);
    reset();
};