const flaskAd = 'http://127.0.0.1:5502/'
function init() {
    fetch(flaskAd+'init', {method: 'POST'}) 
    updateLocations()
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
    document.getElementById("barcodeInput").focus();
    // document.getElementById("barcodeInput").value = "";
    let div = document.getElementById("locationsSelect")
    div.innerHTML = `<div id='add' class='loc'>
    <button onClick='generateNewBarcode()'><p>+</p></button>
    <p>Add new location</p>
    </div>`
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        // console.log(location)
        div.innerHTML += 
        `<div class='loc'>
            <button onClick='processSubmissionBarcode(${location.barcode})'><img src='/resources/imageTemplate.png'></button>
            <p>${location.name}</p>
            <p id='code'>${location.barcode}</p>
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
    return `https://barcode.orcascan.com/?type=code39&data=${code}&format=jpeg&text=${code}`;
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

async function finishLocation(code){
    fetch(flaskAd+`write_location/${code}/${document.getElementById("nameInput").value}/${document.getElementById("descriptionInput").value}/${"codes"}`, {method: 'POST'})
    fetch(flaskAd+'print').then(response => response.text())  // Use .text() to read plain text
    .then(data => {
      console.log(data);
    })
    document.getElementById("locationInfo").style.visibility = 'hidden'
    document.getElementById("locationPopup").style.visibility = 'hidden'

}

function updateLocations(){
    let div = document.getElementById("locations")
    div.innerHTML = "<p class='title'>LOCATIONS</p>"
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        // console.log(location)
        div.innerHTML += 
        `<div class='location' id='${location.barcode}'>
            <img class='locArrowSVG' onClick='processSubmissionBarcode(${location.barcode})' src='/resources/edit-button-svgrepo-com.png'>
            <div class='imgHead'>
                <div class='images'>
                    <img class='locImg' src='/resources/imageTemplate.png'>
                </div>
                <div class='header'>
                    <div class='locName'>
                        <p>${location.name}</p>
                    </div>
                    <p class='locBarcode'>${location.barcode}</p>
                </div>
                
            </div>
            <p class='locDescription'>${location.description}</p>
        </div>`
      }
    })
}


function resetDB(){
    fetch(flaskAd+'reset', {method: 'POST'});
    init();
}

function exitPopup(){
    document.getElementById("locationBarcode").style.visibility = 'hidden'
    document.getElementById("locationInfo").style.visibility = 'hidden'
    document.getElementById("locationPopup").style.visibility = 'hidden'
}
