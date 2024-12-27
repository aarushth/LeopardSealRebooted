const flaskAd = 'http://127.0.0.1:5502/'
function codeAddress() {
    fetch(flaskAd+'init', {method: 'POST'}) 
    console.log("loaded")  
    updateLocations()
}
window.onload = codeAddress;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};

let barcode;
// let barcodeUrl;
function addLocation(){
    // console.log("trig");
    document.getElementById("locationPopup").style.visibility = 'visible';
    document.getElementById("locationBarcode").style.visibility = 'visible';
    document.getElementById("barcodeInput").focus();
    document.getElementById("barcodeInput").value = "";
}

function generateNewBarcode(){
    barcode = Math.floor(Math.random()*(Math.pow(10, 12)))
    document.getElementById("locationBarcode").style.visibility = 'hidden';
    document.getElementById("locationInfo").style.visibility = 'visible'
    document.getElementById("barcodeImg").src = getBarcodeSrc(barcode);
}

function submitBarcode(){
    document.getElementById("locationBarcode").style.visibility = 'hidden';
    document.getElementById("locationInfo").style.visibility = 'visible'
    barcode = document.getElementById('barcodeInput').value
    fetch(flaskAd+`pull_location/${barcode}`, {method: 'GET'}).then(response => response.json())  // Use .text() to read plain text
    .then(data => {
        console.log('Data:', data);
        document.getElementById("nameInput").value = data.name
        document.getElementById("descriptionInput").value = data.description
    })
    document.getElementById("barcodeImg").src = getBarcodeSrc(barcode);
}

function getBarcodeSrc(code){
    return `https://barcode.orcascan.com/?type=code39&data=${code}&format=jpeg&text=${code}`;
}
function printBarcode(){
    var imageUrl = getBarcodeSrc(barcode)
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

async function finishLocation(){
    fetch(flaskAd+`write_location/${barcode}/${document.getElementById("nameInput").value}/${document.getElementById("descriptionInput").value}/${"codes"}`, {method: 'POST'})
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
            <img class='locArrowSVG' onClick='expandLocation(${location.barcode})' src='/resources/right-arrow-svgrepo-com.png'>
            <div class='imgHead'>
                <div class='images'>
                    <div class='locImg'>image will go here</div>
                    <div class='locBarcodeStuff'>
                        <img class='locBarcodeImg' src='${getBarcodeSrc(location.barcode)}'>
                        <button class='locPrintButton' onClick="printBarcode()">print barcode</button>
                    </div>
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

function expandLocation(code){
    // console.log("clicked:" + code);
    barcode = code;
    document.getElementById(code).classList.toggle("expanded")
}