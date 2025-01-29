const flaskAd = 'http://127.0.0.1:5502/'
const locationErrorPopup = document.getElementById("locationErrorPopup");
const boxErrorPopup = document.getElementById("boxErrorPopup");

let state = ["none"]
// state = "none"
function peek(){
    return state[state.length-1]
}
function init() {
    fetch(flaskAd+'init', {method: 'POST'}) 
    
}
window.onload = init;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};


function resetDB(){
    if(confirm('Are you sure?')) {
        fetch(flaskAd+'reset', {method: 'POST'});
        init();
    }
}


function printDB(){
    fetch(flaskAd+'print').then(response => response.text())  // Use .text() to read plain text
    .then(data => {
      console.log(data);
    })
}


function addLocation(){
    window.scrollTo(top)
    
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'visible';
    document.getElementById("barcodeLocationInput").value = "";
    locationErrorPopup.style.visibility = 'hidden';
    
    boxErrorPopup.style.visibility = 'hidden';
    document.getElementById("barcodeLocationInput").focus();
    let div = document.getElementById("locationsSelect")
    document.getElementById("locationSubmit").onclick = submitLocationBarcode
    div.innerHTML = `<div id='add' class='mini'>
                        <button onClick='generateNewLocationBarcode()'>
                            <p id="plus">+</p>
                            <p id="text">Add new location</p>
                        </button>
                    </div>`
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        div.innerHTML += 
        `<div class='mini'>
            <button onClick='processLocationSubmissionBarcode(${location.barcode})'>
                <img src='${location.image}'>
                <p id='name'>${location.name}</p>
                <p id='code'>${location.barcode}</p>
            </button>
        </div>`
      }
    })
}

function generateNewLocationBarcode(){
    processLocationSubmissionBarcode(Math.floor(Math.random()*(Math.pow(10, 12)))); 
}

async function submitLocationBarcode(){
    let input = document.getElementById('barcodeLocationInput').value
    if(input.match(/^[0-9]+$/) == null){
        locationErrorPopup.style.visibility = locationErrorPopup.style.visibility == 'visible'?'hidden':  'visible';
    }else{
        locationErrorPopup.style.visibility = 'hidden';
        await fetch(flaskAd+`pull_location/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        processLocationSubmissionBarcode(input)
        
    })
        
    }
}

async function processLocationSubmissionBarcode(code){
    state.push("loc")
    imageChange = false;
    window.scrollTo(top)
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'hidden';
    document.getElementById("locationInfo").style.visibility = 'visible';
    document.getElementById("includeLocationName").checked = false;
    boxCodes = []
    await fetch(flaskAd+`pull_location/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        document.getElementById("locationNameInput").value = data.name;
        document.getElementById("locationDescriptionInput").value = data.description;
        document.getElementById("locationFinishDiv").innerHTML = `<button id="history" onClick="locationHistoryPopup(${code})">View History</button> 
        <button id="finish" onClick="finishLocation(${code})">finish</button>`
        document.getElementById("locationPrintDiv").innerHTML = `<button id="print"onClick="printLocationBarcode(${code})">print barcode</button>
                        <input type="checkbox" id="includeLocationName">
                        <label id="includeNameLabel">Include Name</label><br>`
        document.getElementById("locationImgButtonDiv").innerHTML = `<button id="imgButton" onClick="camera(${code})">Add/Change Image</button>`
        document.getElementById("locImg").src = data.image != ""?data.image:"/resources/imageTemplate.png";
        boxCodes = data.boxcode.split(",")
        
    })
    list = document.getElementById("boxesListSelectSub");
    list.innerHTML = "";
    for(const boxcode of boxCodes){
        if(boxcode !== ''){
            await fetch(flaskAd+`pull_box/${boxcode}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
            .then(data => {
                list.innerHTML += `<div class='mini'>
                                    <button onclick="processBoxSubmissionBarcode(${boxcode}, ${code})">
                                        <img src='${data.image}'>
                                        <p id='name'>${data.name}</p>
                                        <p id='code'>${data.barcode}</p>
                                    </button>
                                </div>`
            })
        }
    }
    
    document.getElementById("locationBarcodeImg").src = getBarcodeSrc(code)+`L${code}`;
    
}

async function locationHistoryPopup(code){
    document.getElementById("locationHistoryPopup").style.visibility = 'visible';
    div = document.getElementById("locationHistoryDiv");
    div.innerHTML = `<div id="titleDiv"><p class='title'>History</p></div>
        <div id="headerEntry" class="entry">
            <b id='imageDiv' class='subEntry'>Image</b>
            <b id='nameDiv' class='subEntry'>Name</b>
            <b id='descDiv' class='subEntry'>Description</b>
            <b id='boxDiv' class='subEntry'>Boxes</b>
            <b id='timeDiv' class='subEntry'>Time</b>
            <b id='versDiv' class='subEntry'>Version</b>
        </div>`
    await fetch(flaskAd+`pull_location_history/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        for(const loc of data.locations){
            div.innerHTML += `<div id="headerEntry" class="entry">
                <img id='imageDiv' class='subEntry' src='${loc.image}'>
                <p id='nameDiv' class='subEntry'>${loc.name}</p>
                <p id='descDiv' class='subEntry'>${loc.description}</p>
                <p id='boxDiv' class='subEntry'>${loc.boxcode}</p>
                <p id='timeDiv' class='subEntry'>${loc.time}</p>
                <p id='versDiv' class='subEntry'>${loc.vers}</p>
            </div>`
        }

    });
}

let imageChange = false;
async function finishLocation(code){
    let im = document.getElementById("locImg").src
    const data = {
        "barcode": code,
        "name": document.getElementById("locationNameInput").value,
        "description": document.getElementById("locationDescriptionInput").value,
        "boxcode": "",
        "image": document.getElementById("locImg").src,
        "imageChange": imageChange?'y':'n'
    };
    await fetch(flaskAd+`write_location`, {method: 'POST', headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(data =>  {
      exitLocationPopup();
      try{
        updateLocations();
      }catch(error){
        console.log("nothing :)")
      }
    })
}



async function addBox(){
    
    window.scrollTo(top)
    boxErrorPopup.style.visibility = 'hidden';
    document.getElementById("boxPopup").style.visibility = 'visible';
    document.getElementById("boxBarcode").style.visibility = 'visible';
    document.getElementById("barcodeBoxInput").value = "";
    document.getElementById("barcodeBoxInput").focus();
    let div = document.getElementById("boxesSelect");
    div.innerHTML = `<div id='add' class='mini'>
                        <button onClick='generateNewBoxBarcode()'>
                            <p id="plus">+</p>
                            <p id="text">Add new box</p>
                        </button>
                    </div>`
    
    await fetch(flaskAd+'pull_all_boxes').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const box of data.boxes){
        div.innerHTML += 
        `<div class='mini'>
            <button onClick='processBoxSubmissionBarcode(${box.barcode}, ${box.locationcode})'>
                <img src='${box.image}'>
                <p id='name'>${box.name}</p>
                <p id='code'>${box.barcode}</p>
                <p id='location'>@ L${box.locationcode}</p>
            </button>
        </div>`
      }
    })
}
function generateNewBoxBarcode(){
    createNewBox(Math.floor(Math.random()*(Math.pow(10, 12))));
}
async function submitBoxBarcode(){
    let code = document.getElementById('barcodeBoxInput').value
    if(code.match(/^[0-9]+$/) == null){
        boxErrorPopup.style.visibility = boxErrorPopup.style.visibility == 'visible'?'hidden':  'visible';
    }else{
        boxErrorPopup.style.visibility = 'hidden';
        await fetch(flaskAd+`pull_box/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        if(data.vers == ""){
            createNewBox(code);
        }else{
            processBoxSubmissionBarcode(code, data.locationcode);
        }
    })
    }
}
async function createNewBox(code){
    window.scrollTo(top)
    locationErrorPopup.style.visibility = 'hidden';
    document.getElementById("locationSubmit").onclick = () => submitLocationForBox(code)
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'visible';
    document.getElementById("barcodeLocationInput").value = "";
    document.getElementById("barcodeLocationInput").focus();
    let div = document.getElementById("locationsSelect")
    div.innerHTML = ``
    document.getElementById("TitleText").innerText = 'Select a Location for B' + code 
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        
        div.innerHTML += 
        `<div class='mini'>
            <button onClick='processBoxSubmissionBarcode(${code}, ${location.barcode})'>
                <img src='${location.image}'>
                <p id='name'>${location.name}</p>
                <p id='code'>${location.barcode}</p>
            </button>
        </div>`
      }
    })
}
async function submitLocationForBox(boxcode){
    let code = document.getElementById('barcodeLocationInput').value
    if(code.match(/^[0-9]+$/) == null){
        locationErrorPopup.style.visibility = locationErrorPopup.style.visibility == 'visible'?'hidden':  'visible';
    }else{
        locationErrorPopup.style.visibility = 'hidden';
        await fetch(flaskAd+`pull_location/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        if(data.vers == ""){
            locationErrorPopup.style.visibility = locationErrorPopup.style.visibility == 'visible'?'hidden':  'visible';
        }else{
            processBoxSubmissionBarcode(boxcode, code);
        }
    })
    }
}
async function processBoxSubmissionBarcode(code, locationCode){
    state.push("box")
    imageChange = false;
    window.scrollTo(top)
    exitLocationPopup()
    document.getElementById("boxPopup").style.visibility = 'visible';
    document.getElementById("boxBarcode").style.visibility = 'hidden';
    boxErrorPopup.style.visibility = 'hidden'
    locationErrorPopup.style.visibility = 'hidden'
    document.getElementById("boxInfo").style.visibility = 'visible';
    document.getElementById("changeLocationButton").onclick = () => changeLocation(code)
    document.getElementById("includeBoxName").checked = false;
    document.getElementById("TitleText").innerText = 'Select a Location' + code 
    
    await fetch(flaskAd+`pull_box/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        document.getElementById("boxNameInput").value = data.name;
        // document.getElementById("descriptionInput").value = data.description;
        document.getElementById("boxFinishDiv").innerHTML = `<button id="history" onClick="boxHistoryPopup(${code})">View History</button> 
        <button id="finish" onClick="finishBox(${code}, false)">finish</button>`
        document.getElementById("boxPrintDiv").innerHTML = `<button id="print"onClick="printBoxBarcode(${code})">print barcode</button>
                        <input type="checkbox" id="includeBoxName">
                        <label id="includeNameLabel">Include Name and Location</label><br>`
        document.getElementById("imgButtonDiv").innerHTML = `<button id="imgButton" onClick="camera(${code})">Add/Change Image</button>`
        document.getElementById("boxImg").src = data.image != ""?data.image:"/resources/imageTemplate.png";
        document.getElementById("boxVolumeSlider").value = data.volume != ""?data.volume:0;
        document.getElementById("boxSize").value = data.size != ""?data.size:"Small";
    })
    
    await fetch(flaskAd+`pull_location/${locationCode}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        console.log(locationCode)
        document.getElementById("boxLocationInner").innerHTML = 
        `<div class='images'>
            <img class='locImg' src='${data.image}'>
        </div>
        <div class='header'>
            <p id='boxLocName' class='locName'>${data.name}</p>
            <p id='boxLocBarcode' class='locBarcode'>${data.barcode}</p>
            <p class='locDescription'>${data.description}</p>
        </div>`
        document.getElementById("boxLocationInner").onclick = () => processLocationSubmissionBarcode(locationCode)
    })
    document.getElementById("boxBarcodeImg").src = getBarcodeSrc(code)+`B${code}`;
    
}
async function changeLocationForBox(boxcode){
    let code = document.getElementById('barcodeLocationInput').value
    if(code.match(/^[0-9]+$/) == null){
        locationErrorPopup.style.visibility = locationErrorPopup.style.visibility == 'visible'?'hidden':  'visible';
    }else{
        locationErrorPopup.style.visibility = 'hidden';
        await fetch(flaskAd+`pull_location/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        if(data.vers == ""){
            locationErrorPopup.style.visibility = locationErrorPopup.style.visibility == 'visible'?'hidden':  'visible';
        }else{
            editLocationBoxSubmissionBarcode(boxcode, code);
        }
    })
    }
}
async function editLocationBoxSubmissionBarcode(code, locationCode){
    window.scrollTo(top)
    exitLocationPopup();
    document.getElementById("boxPopup").style.visibility = 'visible';
    document.getElementById("boxBarcode").style.visibility = 'hidden';
    boxErrorPopup.style.visibility = 'hidden'
    locationErrorPopup.style.visibility = 'hidden'
    document.getElementById("boxInfo").style.visibility = 'visible';
    document.getElementById("changeLocationButton").onclick = () => changeLocation(code)
    // document.getElementById("includeBoxName").checked = false;
    await fetch(flaskAd+`pull_location/${locationCode}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        document.getElementById("boxLocationInner").innerHTML = 
        `<div class='images'>
            <img class='locImg' src='${data.image}'>
        </div>
        <div class='header'>
            <p id='boxLocName' class='locName'>${data.name}</p>
            <p id='boxLocBarcode' class='locBarcode'>${data.barcode}</p>
            <p id='boxLocDescription' class='locDescription'>${data.description}</p>
        </div>`
    })
    // document.getElementById("boxBarcodeImg").src = getBarcodeSrc(code)+`B${code}`;
    
}

async function finishBox(code){
    let im = document.getElementById("locImg").src
    const data = {
        "barcode": code,
        "name": document.getElementById("boxNameInput").value,
        "volume": document.getElementById("boxVolumeSlider").value,
        "size":  document.getElementById("boxSize").value,
        "locationcode": document.getElementById("boxLocBarcode").innerText,
        "itemcode": "",
        "image": document.getElementById("boxImg").src,
        "imageChange": imageChange?'y':'n'
                    
    };
    await fetch(flaskAd+`write_box`, {method: 'POST', headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(data =>  {
      exitBoxPopup();
      try{
        updateBoxes();
      }catch(error){
        console.log("nothing :)")
      }
    })
}

async function boxHistoryPopup(code){
    document.getElementById("boxHistoryPopup").style.visibility = 'visible';
    div = document.getElementById("boxHistoryDiv");
    div.innerHTML = `<div id="titleDiv"><p class='title'>History</p></div>
    <div id="headerEntry" class="entry">
        <b id='imageDiv' class='subEntry'>Image</b>
        <b id='nameDiv' class='subEntry'>Name</b>
        <b id='volumeDiv' class='subEntry'>Volume</b>
        <b id='sizeDiv' class='subEntry'>Size</b>
        <b id='locationDiv' class='subEntry'>Location</b>
        <b id='itemDiv' class='subEntry'>Items</b>
        <b id='timeDiv' class='subEntry'>Time</b>
        <b id='versDiv' class='subEntry'>Version</b>
    </div>`
    await fetch(flaskAd+`pull_box_history/${code}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        for(const box of data.boxes){
            div.innerHTML += `<div id="headerEntry" class="entry">
            <img id='imageDiv' class='subEntry' src='${box.image}'>
            <p id='nameDiv' class='subEntry'>${box.name}</p>
            <p id='volumeDiv' class='subEntry'>${box.volume}</p>
            <p id='sizeDiv' class='subEntry'>${box.size}</p>
            <p id='locationDiv' class='subEntry'>${box.locationcode}</p>
            <p id='itemDiv' class='subEntry'>${box.itemcode}</p>
            <p id='timeDiv' class='subEntry'>${box.time}</p>
            <p id='versDiv' class='subEntry'>${box.vers}</p>
        </div>`
        }

    });
}
async function changeLocation(code){
    window.scrollTo(top)
    locationErrorPopup.style.visibility = 'hidden';
    document.getElementById("locationSubmit").onclick = () => changeLocationForBox(code)
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'visible';
    document.getElementById("barcodeLocationInput").value = "";
    document.getElementById("barcodeLocationInput").focus();
    let div = document.getElementById("locationsSelect")
    div.innerHTML = ``
    document.getElementById("TitleText").innerText = 'Select a Location for B' + code 
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        
        div.innerHTML += 
        `<div class='mini'>
            <button onClick='editLocationBoxSubmissionBarcode(${code}, ${location.barcode})'>
                <img src='${location.image}'>
                <p id='name'>${location.name}</p>
                <p id='code'>${location.barcode}</p>
            </button>
        </div>`
      }
    })
}

function getBarcodeSrc(code){
    return `https://barcode.orcascan.com/?type=code128&data=${code}&format=jpeg&text=`;    
}

function printLocationBarcode(code){
    var imageUrl = getBarcodeSrc(code)+ `L${code}` + (document.getElementById("includeLocationName").checked?`_${document.getElementById("locationNameInput").value}`:``);
    var printWindow = window.open('', '_blank', 'width=600,height=600');

    printWindow.document.write('<html><head><title>Print Image</title></head><body>');
    printWindow.document.write('<img src="' + imageUrl + '" style="width:100%;height:auto;"/>');
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();  
    printWindow.onload = function() {
    printWindow.print();
    printWindow.close(); 
  };
}
function printBoxBarcode(code){
    var imageUrl = getBarcodeSrc(code)+ `B${code}` + (document.getElementById("includeBoxName").checked?`_${document.getElementById("boxNameInput").value}_@L_${document.getElementById("boxLocName").innerText}`:``);
    var printWindow = window.open('', '_blank', 'width=600,height=600');

    printWindow.document.write('<html><head><title>Print Image</title></head><body>');
    printWindow.document.write('<img src="' + imageUrl + '" style="width:100%;height:auto;"/>');
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();  
    printWindow.onload = function() {
    printWindow.print();
    printWindow.close(); 
  };
}


function exitLocationPopup(){
    if(peek() === 'loc'){
        state.pop()
    }
    document.getElementById("locationBarcode").style.visibility = 'hidden'
    document.getElementById("locationInfo").style.visibility = 'hidden'
    document.getElementById("locationPopup").style.visibility = 'hidden'
    locationErrorPopup.style.visibility = 'hidden'
}
function exitBoxPopup(){
    document.getElementById("boxBarcode").style.visibility = 'hidden'
    document.getElementById("boxInfo").style.visibility = 'hidden'
    document.getElementById("boxPopup").style.visibility = 'hidden'
    boxErrorPopup.style.visibility = 'hidden'
    if(peek() === 'box'){
        state.pop()
    }
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
function exitLocationHistoryPopup(){
    document.getElementById("locationHistoryPopup").style.visibility = 'hidden';
}

function exitBoxHistoryPopup(){
    document.getElementById("boxHistoryPopup").style.visibility = 'hidden';
}




function camera(){
    document.getElementById("cameraPopup").style.visibility = 'visible';
    document.getElementById("camera").style.visibility = 'visible';
    startup();
}

const width = 320;
let height = 0;
let streaming = false;
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

function takePicture() {
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const data = canvas.toDataURL("image/png");
    document.getElementById("camera").style.visibility = 'hidden';
    document.getElementById("confirm").style.visibility = 'visible';
}

function retake(){
    document.getElementById("camera").style.visibility = 'visible';
    document.getElementById("confirm").style.visibility = 'hidden';
}

function save(){
    const data = canvas.toDataURL("image/png");
    document.getElementById(peek()+"Img").src = data;
    imageChange = true;
    exitCameraPopup();
}