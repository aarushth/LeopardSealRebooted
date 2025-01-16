const flaskAd = 'http://127.0.0.1:5502/'
function init() {
    fetch(flaskAd+'init', {method: 'POST'});
    updateLocations();
}
window.onload = init;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};


function updateLocations(){
    let div = document.getElementById("locations")
    div.innerHTML = "";
    fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        // console.log(location)
        div.innerHTML += 
        `<div class='location' id='${location.barcode}'>
            <div class='images'>
                <img class='locImg' src='${location.image}'>
            </div>
            <div class='header'>
                <p class='locName'>${location.name}</p>
                <p class='locBarcode'>${location.barcode}</p>
                <p class='locDescription'>${location.description}</p>
            </div>
            <div class='locArrowSVG'>
                <img onClick='processSubmissionBarcode(${location.barcode})' src='/resources/edit-button-svgrepo-com.png'>
            </div>
        </div>`
      }
    })
}