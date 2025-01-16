const flaskAd = 'http://127.0.0.1:5502/'
function init() {
    fetch(flaskAd+'init', {method: 'POST'}) 
}
window.onload = init;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};


// let barcodeUrl;
function addLocation(){
    window.scrollTo(top)
    // console.log("trig");
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'visible';
    document.getElementById("barcodeInput").value = "";
    document.getElementById("barcodeInput").focus();
    // document.getElementById("barcodeInput").value = "";
    let div = document.getElementById("locationsSelect")
    div.innerHTML = `<div id='add' class='mini'>
                        <button onClick='generateNewBarcode()'>
                            <p id="plus">+</p>
                            <p id="text">Add new location</p>
                        </button>
                    </div>`
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        // console.log(location)
        div.innerHTML += 
        `<div class='mini'>
            <button onClick='processSubmissionBarcode(${location.barcode})'>
                <img src='${location.image}'>
                <p id='name'>${location.name}</p>
                <p id='code'>${location.barcode}</p>
            </button>
        </div>`
      }
    })
}

function generateNewBarcode(){
    processSubmissionBarcode(Math.floor(Math.random()*(Math.pow(10, 12))));
    
}

function submitBarcode(){
    
    processSubmissionBarcode(document.getElementById('barcodeInput').value)
}
async function processSubmissionBarcode(code){
    imageChange = false;
    window.scrollTo(top)
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'hidden';
    document.getElementById("locationInfo").style.visibility = 'visible';
    await fetch(flaskAd+`pull_location/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        document.getElementById("nameInput").value = data.name;
        document.getElementById("descriptionInput").value = data.description;
        document.getElementById("finishDiv").innerHTML = ` <button id="finish" onClick="finishLocation(${code})">finish</button>`
        document.getElementById("printDiv").innerHTML = `<button id="print"onClick="printBarcode(${code})">print barcode</button>`
        document.getElementById("imgButtonDiv").innerHTML = `<button id="imgButton" onClick="camera(${code})">Add/Change Image</button>`
        document.getElementById("locImg").src = data.image != ""?data.image:"/resources/imageTemplate.png";
    })
    
    document.getElementById("barcodeImg").src = getBarcodeSrc(code);
    div = document.getElementById("historyDiv");
    div.innerHTML = '';
    isHistory = false
    await fetch(flaskAd+`pull_location_history/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        for(const loc of data.locations){
            div.innerHTML += `<div id="headerEntry" class="entry">
                <p id='nameDiv' class='subEntry'>${loc.name}</p>
                <p id='descDiv' class='subEntry'>${loc.description}</p>
                <p id='boxDiv' class='subEntry'>${loc.boxcode}</p>
                <p id='timeDiv' class='subEntry'>${loc.time}</p>
                <p id='versDiv' class='subEntry'>${loc.vers}</p>
            </div>`
            isHistory = true;
        }

    });
    if(isHistory){
        div.innerHTML = `<div id="titleDiv"><p class='title'>History</p></div>
        <div id="headerEntry" class="entry">
            <b id='nameDiv' class='subEntry'>Name</b>
            <b id='descDiv' class='subEntry'>Description</b>
            <b id='boxDiv' class='subEntry'>Boxes</b>
            <b id='timeDiv' class='subEntry'>Time</b>
            <b id='versDiv' class='subEntry'>Version</b>
        </div>` + div.innerHTML;
    }
}

function getBarcodeSrc(code){
    return `https://barcode.orcascan.com/?type=code128&data=${code}&format=jpeg&text=${code}`;
}

function printBarcode(code){
    var imageUrl = getBarcodeSrc(code)
    var printWindow = window.open('', '_blank', 'width=600,height=600');
  
    // Insert the image into the new window
    printWindow.document.write('<html><head><title>Print Image</title></head><body>');
    printWindow.document.write('<img src="' + imageUrl + '" style="width:100%;height:auto;"/>');
    printWindow.document.write('</body></html>');
    
    // Wait for the image to load before triggering the print dialog
    printWindow.document.close();  // This is important to finish the document setup
    printWindow.onload = function() {
    printWindow.print();  // Trigger the print dialog
    printWindow.close();  // Optionally close the window after printing
  };
}

let imageChange = false;
async function finishLocation(code){
    let im = document.getElementById("locImg").src
    console.log(im);
    const data = {
        "barcode": code,
        "name": document.getElementById("nameInput").value,
        "description": document.getElementById("descriptionInput").value,
        "boxcode": "none",
        "image": document.getElementById("locImg").src,
        "imageChange": imageChange?'y':'n'
    };
    fetch(flaskAd+`write_location`, {method: 'POST', headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(data => {
      console.log(data);
    })
    document.getElementById("locationInfo").style.visibility = 'hidden'
    document.getElementById("locationPopup").style.visibility = 'hidden'
}




function resetDB(){
    fetch(flaskAd+'reset', {method: 'POST'});
    init();
}

function printDB(){
    fetch(flaskAd+'print').then(response => response.text())  // Use .text() to read plain text
    .then(data => {
      console.log(data);
    })
}
function exitLocationPopup(){
    document.getElementById("locationBarcode").style.visibility = 'hidden'
    document.getElementById("locationInfo").style.visibility = 'hidden'
    document.getElementById("locationPopup").style.visibility = 'hidden'
}
function exitCameraPopup(){
    document.getElementById("cameraPopup").style.visibility = 'hidden'
    document.getElementById("camera").style.visibility = 'hidden';
    document.getElementById("confirm").style.visibility = 'hidden';
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
        track.stop();
    });
    video.srcObject = null;
}

function camera(code){
    document.getElementById("cameraPopup").style.visibility = 'visible';
    document.getElementById("camera").style.visibility = 'visible';
    startup();
}

// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.

const width = 320; // We will scale the photo width to this
let height = 0; // This will be computed based on the input stream
// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

let streaming = false;

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.

let video = null;
let canvas = null;
let startButton = null;



function startup() {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    startButton = document.getElementById("start-button");

    navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
        video.srcObject = stream;
        video.play();
    })
    .catch((err) => {
        console.error(`An error occurred: ${err}`);
    });

    video.addEventListener(
    "canplay",
    (ev) => {
        if (!streaming) {
        height = video.videoHeight / (video.videoWidth / width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
            height = width / (4 / 3);
        }

        video.setAttribute("width", width);
        video.setAttribute("height", height);
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        streaming = true;
        }
    },
    false,
    );

    startButton.addEventListener(
    "click",
    (ev) => {
        takePicture();
        ev.preventDefault();
    },
    false,
    );
}

// Fill the photo with an indication that none has been
// captured.

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.

function takePicture() {
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const data = canvas.toDataURL("image/png");
    document.getElementById("camera").style.visibility = 'hidden';
    document.getElementById("confirm").style.visibility = 'visible';
        // photo.setAttribute("src", data);
        // downloadImage(data, 'image.png');
}

function retake(){
    document.getElementById("camera").style.visibility = 'visible';
    document.getElementById("confirm").style.visibility = 'hidden';
}

function save(){
    const data = canvas.toDataURL("image/png");
    document.getElementById("locImg").src = data;
    imageChange = true;
    exitCameraPopup();
}
// Set up our event listener to run the startup process
// once loading is complete.
// window.addEventListener("load", startup, false);

