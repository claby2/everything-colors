let dropText = document.getElementById('dropText');
let dropInput = document.getElementById('dropInput');
let inputOne = document.getElementById('inputOne');
let inputTwo = document.getElementById('inputTwo');
let output = document.getElementById('output');

var images = [];

function getImageData(img, minWidth, minHeight) {
    let canvas = document.createElement('canvas');
    let width = canvas.width = minWidth;
    let height = canvas.height = minHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return (ctx.getImageData(0, 0, width, height)).data;
}

function xorBlend() {
    let minHeight = Math.min(images[0].naturalHeight, images[1].naturalHeight);
    let minWidth = Math.min(images[0].naturalWidth, images[1].naturalWidth);

    let imageDataOne = getImageData(images[0], minWidth, minHeight);
    let imageDataTwo = getImageData(images[1], minWidth, minHeight);

    let canvas = document.createElement('canvas');
    let width = canvas.width = minWidth;
    let height = canvas.height = minHeight;
    let ctx = canvas.getContext('2d');
    let imageData = ctx.getImageData(0, 0, minWidth, minHeight);
    let data = imageData.data; //Modify data;

    for(let i = 0; i < height*width*4; i++) {
        if(i%3 != 0) {
            data[i] = imageDataOne[i] ^ imageDataTwo[i];
        } else {
            data[i] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    let canvasElement = document.createElement('img');
    canvasElement.src = canvas.toDataURL("image/png");
    output.appendChild(canvasElement);
}

function displayImage(files) {
    if(inputOne.childNodes[1] && inputTwo.childNodes[1]) {
        images = [];
        while(output.firstChild && output.removeChild(output.firstChild));
        while(inputOne.childNodes[1] && inputOne.removeChild(inputOne.childNodes[1]));
        while(inputTwo.childNodes[1] && inputTwo.removeChild(inputTwo.childNodes[1]));
    }
    let img = document.createElement('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = function() {
        images.push(img);
        if(!inputOne.childNodes[1]) {   
            inputOne.appendChild(img);
        } else {
            inputTwo.appendChild(img);
    
            // Depending on blend mode...
    
            xorBlend();
            
        }
    };
}

document.ondrop = (event) => {
    event.preventDefault();
    displayImage(event.dataTransfer.files);
}

document.ondragover = (event) => {event.preventDefault();};

document.ondragleave = (event) => {event.preventDefault();};

dropText.onclick = ()=> {
    dropInput.click();
};

dropInput.onchange = function() {
    displayImage(this.files);
};