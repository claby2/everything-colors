let imagePreview = document.getElementById("imagePreview");
let outputText = document.getElementById("output-text");
let progressBarMax = document.getElementById("progressBar-max");
let progressBar = document.getElementById("progressBar");

function reset() {
    progressBar.style.width = "0px";
    while(imagePreview.firstChild && imagePreview.removeChild(imagePreview.firstChild));
    while(outputText.firstChild && outputText.removeChild(outputText.firstChild));
}

function readImage(img) {
    Tesseract.recognize(
        img,
        'eng',
        { logger: m =>{
            if(m.status === "recognizing text") {
                progressBar.style.width = (m.progress * 300) + "px";
            }
        }}
      ).then(({ data: { text } }) => {
        let p = document.createElement('p');
        p.innerText = text;
        outputText.appendChild(p);
      })
}

function displayImage(files) {
    let img = document.createElement('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = function() {
        readImage(img);
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