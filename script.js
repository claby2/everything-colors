new ClipboardJS('.bucket');

let output = document.getElementById('output');
let canvasHolder = document.getElementById('canvasHolder');
let imagePreview = document.getElementById('imagePreview');
let results = document.getElementById('results');
let drop = document.getElementById('drop');
let dropText = document.getElementById('dropText');
let dropInput = document.getElementById('dropInput');
let paletteOutput = document.getElementById('paletteOutput');

function reset() {
    colorFreq = [[],[],[]];
    maxFreq = -1;
    while(imagePreview.childNodes[1] && imagePreview.removeChild(imagePreview.childNodes[1]));
    while(output.childNodes[1] && output.removeChild(output.childNodes[1]));
    while(canvasHolder.childNodes[1] && canvasHolder.removeChild(canvasHolder.childNodes[1]));
    while(paletteOutput.childNodes[1] && paletteOutput.removeChild(paletteOutput.childNodes[1]));
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

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
        colors = ["rgba(255, 0, 0, 0.4)", "rgba(0, 255, 0, 0.4)", "rgba(0, 0, 255, 0.4)"];
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

function recursiveSplit(colors, depth) {
    if(colors.length == 0) {
        return;
    }
    if(depth == 0) {
        colorBuckets.push(colors);
        return;
    }
    let min = [255, 255, 255];
    let max = [0, 0, 0];
    let ranges = [];

    for(let i = 0; i < colors.length; i += 4) {
        for(let j = 0; j < 3; j++) {
            min[j] = Math.min(min[j], colors[i][j]);
            max[j] = Math.max(max[j], colors[i][j]);
        }
    }

    ranges[0] = Math.abs(max[0] - min[0]);
    ranges[1] = Math.abs(max[1] - min[1]);
    ranges[2] = Math.abs(max[2] - min[2]);

    let max_range = Math.max(ranges[0], Math.max(ranges[1], ranges[2]));

    if(ranges[0] == max_range) {
        colors.sort((a, b) => {
            return a[0] - b[0];
        })
    } else if(ranges[1] == max_range) {
        colors.sort((a, b) => {
            return a[1] - b[1];
        })
    } else if(ranges[2] == max_range) {
        colors.sort((a, b) => {
            return a[2] - b[2];
        })
    }

    let median = Math.floor(colors.length / 2);

    recursiveSplit(colors.slice(0, median), depth - 1);
    recursiveSplit(colors.slice(median, colors.length), depth - 1);
}

function makePalette(img, depth) {
    let canvas = document.createElement('canvas');
    let width = canvas.width = img.naturalWidth;
    let height = canvas.height = img.naturalHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    let colors = [];

    for(let i = 0; i < data.length; i+= 4) {
        let pixel_arr = new Array(3);
        pixel_arr[0] = data[i];
        pixel_arr[1] = data[i+1];
        pixel_arr[2] = data[i+2];
        colors.push(pixel_arr);
    }

    recursiveSplit(colors, depth);
}

function getAverages() {
    let averages = [];
    for(let i = 0; i < colorBuckets.length; i++) {
        let totals = [0, 0, 0];
        for(let j = 0; j < colorBuckets[i].length; j++) {
            for(let k = 0; k < 3; k++) {
                totals[k] += colorBuckets[i][j][k];
            }
        }
        let average = [Math.floor(totals[0]/colorBuckets[i].length), Math.floor(totals[1]/colorBuckets[i].length), Math.floor(totals[2]/colorBuckets[i].length)];
        averages.push(average);
    }

    return averages;
}

function getColorName(hex) {
    return fetch('https://www.thecolorapi.com/id?hex=' + hex)
    .then(res => res.json())
    .then(color => color)
}

function displayImage(files) {
    let img = document.createElement('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = function() {
        colorBuckets = [];
        sortImage(img);     
        makeHistogram(img);
        makePalette(img, 2);
        let averages = [...new Set(getAverages().map(x => x.join(',')))].map(x => x.split(',').map(e => parseInt(e)));
        for(let i = 0; i < averages.length; i++) {
            let bucketHolder = document.createElement('div');
            bucketHolder.classList.add('bucketHolder');

            let copy = document.createElement('p');
            copy.innerText = 'COPY';
            copy.classList.add('copy');
            let bucketColor = rgbToHex(averages[i][0], averages[i][1], averages[i][2]);

            let bucket = document.createElement('div');
            bucket.classList.add('bucket');
            bucket.style.backgroundColor = bucketColor;

            bucket.setAttribute('data-clipboard-action', 'copy');
            bucket.setAttribute('data-clipboard-text', bucketColor);

            bucket.addEventListener('mouseenter', ()=>{copy.style.visibility = 'visible'});
            bucket.addEventListener('mouseleave', ()=>{copy.style.visibility = 'hidden'});
            copy.style.color = averages[i][0] + averages[i][1] + averages[i][2] >= (765)/2 ? "black" : "white";

            let colorName = document.createElement('p');
            colorName.classList.add('colorName');
            getColorName(bucketColor.substring(1)).then(color => {
                colorName.innerText = color.name.value;
            });

            bucket.appendChild(copy);
            bucketHolder.appendChild(bucket);
            bucketHolder.appendChild(colorName);

            paletteOutput.appendChild(bucketHolder);

        }
    }
    imagePreview.appendChild(img);
}

document.ondrop = (event) => {
    results.style.display = 'flex';
    drop.style.margin = 0;
    event.preventDefault();
    reset();
    displayImage(event.dataTransfer.files);
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

window.addEventListener("resize", ()=>{
    if(canvasHolder.childNodes[1]) {
        histogramCanvas.remove();
        let histogramCanvas = new p5(histogram);
    }
})