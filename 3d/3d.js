let graph = document.getElementById('graph');
let imagePreview = document.getElementById('imagePreview');

function reset() {
    while(imagePreview.firstChild && imagePreview.removeChild(imagePreview.firstChild));
    while(graph.firstChild && graph.removeChild(graph.firstChild));
}

function getImageData(img) {
    let canvas = document.createElement('canvas');
    let width = canvas.width = img.naturalWidth;
    let height = canvas.height = img.naturalHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return (ctx.getImageData(0, 0, width, height)).data;
}

function downscaleImage(img) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    canvas.height = canvas.width * (img.naturalHeight / img.naturalWidth);

    let oc = document.createElement('canvas');
    let octx = oc.getContext('2d');

    oc.width = img.naturalWidth*0.5;
    oc.height = img.naturalHeight*0.5;

    octx.drawImage(img, 0, 0, oc.width, oc.height);
    octx.drawImage(oc, 0, 0, oc.width*0.5, oc.height*0.5);
    ctx.drawImage(oc, 0, 0, oc.width*0.5, oc.height*0.5, 0, 0, canvas.width, canvas.height);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    return data;
}

function graphImage(img) {
    let data = downscaleImage(img);

    let x = [];
    let y = [];
    let z = [];

    for(let i = 0; i < data.length; i += 4) {
        x.push(data[i]);
        y.push(data[i + 1]);
        z.push(data[i + 2]);
    }

    console.log(x.length, y.length, z.length);

    let trace = {
        x: x,
        y: y,
        z: z,
        mode: 'markers',
        type: 'scatter3d'
    }

    let layout = {
        margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 0
        },
    }

    Plotly.newPlot(graph, [trace], layout);
}

function displayImage(files) {
    let img = document.createElement('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = function() {
        graphImage(img);
    }
    imagePreview.appendChild(img);
}

document.ondrop = (event) => {
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
    reset();
    displayImage(this.files);
};