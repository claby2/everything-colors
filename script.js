let output = document.getElementById('output');
let canvasHolder = document.getElementById('canvasHolder');
let imagePreview = document.getElementById('imagePreview');
let results = document.getElementById('results');
let drop = document.getElementById('drop');
let dropText = document.getElementById('dropText');
let dropInput = document.getElementById('dropInput');

function reset() {
    colorFreq = [[],[],[]];
    maxFreq = -1;
    while(imagePreview.childNodes[1] && imagePreview.removeChild(imagePreview.childNodes[1]));
    while(output.childNodes[1] && output.removeChild(output.childNodes[1]));
    while(canvasHolder.childNodes[1] && canvasHolder.removeChild(canvasHolder.childNodes[1]));
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
  
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
  
    if (max == min) {
        h = s = 0;
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
        switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        }
  
        h /= 6;
    }
  
    return [ h, s, l ];
}

function hslToRgb(h, s, l) {
    var r, g, b;
  
    if (s == 0) {
      r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
  
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
  
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
  
    return [ r * 255, g * 255, b * 255 ];
}

function sortImage(img) {
    let canvas = document.createElement('canvas');
    let width = canvas.width = img.naturalWidth;
    let height = canvas.height = img.naturalHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    let hslData = [];

    for(let i = 0; i < data.length; i+=4) {
        let hsl = rgbToHsl(data[i], data[i+1], data[i+2]);
        hslData.push([hsl[0], hsl[1], hsl[2], data[i+3]]);
    }

    hslData.sort((a, b) => {
        return a[0] - b[0];
    });

    for(let i = 0; i < data.length; i+=4) {
        let rgb = hslToRgb(hslData[i/4][0], hslData[i/4][1], hslData[i/4][2]);
        data[i] = rgb[0];
        data[i+1] = rgb[1];
        data[i+2] = rgb[2];
        data[i+3] = hslData[i/4][3];
    }

    ctx.putImageData(imageData, 0, 0);

    let canvasElement = document.createElement('img');
    canvasElement.src = canvas.toDataURL("image/png");

    output.appendChild(canvasElement);
}

let histogram = ((s) => {
    s.setup = ()=> {
        WIDTH = canvasHolder.getBoundingClientRect().width;
        HEIGHT = 300;
        let canvas = s.createCanvas(WIDTH, HEIGHT);
        canvas.parent('canvasHolder');
        colors = ["#FF0000", "#00FF00", "#0000FF"];
        s.noStroke();
        s.background("rgba(192, 222, 217, 0.25)");
        for(let i = 0; i < 3; i++) {
            s.fill(colors[i]);
            for(let j = 0; j < 256; j++) {
                let barHeight = colorFreq[i][j] == 0 ? 0 : (colorFreq[i][j]/maxFreq * WIDTH)/2;
                s.rect(j*(WIDTH/256), HEIGHT - barHeight, WIDTH/256, barHeight);
            }
        }
    };
});

function makeHistogram(img) {
    let canvas = document.createElement('canvas');
    let width = canvas.width = img.naturalWidth;
    let height = canvas.height = img.naturalHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 256; j++) {
            colorFreq[i].push(0);
        }
    }

    for(let i = 0; i < data.length; i+=4) {
        for(let j = 0; j < 3; j++) {
            colorFreq[j][data[i+j]] += 1;
        }
    }

    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 256; j++) {
            if(colorFreq[i][j] > maxFreq) {
                maxFreq = colorFreq[i][j];
            }
        }
    }

    let histogramCanvas = new p5(histogram);
}

function displayImage(files) {
    let img = document.createElement('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = function() {
        sortImage(img);     
        makeHistogram(img);   
    }
    imagePreview.appendChild(img);
}

document.ondrop = (event) => {
    results.style.display = 'flex';
    drop.style.margin = 0;
    event.preventDefault();
    reset();
    displayImage(event.dataTransfer.files)
}

document.ondragover = (event) => {event.preventDefault();};

document.ondragleave = (event) => {event.preventDefault();};

dropText.onclick = ()=> {
    dropInput.click();
};

dropInput.onchange = function() {
    results.style.display = 'flex';
    drop.style.margin = 0;
    reset();
    displayImage(this.files);
};