function init() {
    fetch(flaskAd+'init', {method: 'POST'});
    
    updateLocations();
}
window.onload = init;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};


async function updateLocations(){
    let div = document.getElementById("locations")
    
    div.innerHTML =
    `<div id='AddButtonDiv'>
        <button onClick='addLocation()'>
            <div id='PlusSDiv'>
                <p>+</p>
            </div>
            <div id='TextSDiv'>
                <p>Add New Location</p>
            </div>
        </button>
    </div>`;
    await fetch(flaskAd+'pull_all_locations').then(response => response.json())  // Use .text() to read plain text
    .then(data => {
      for(const location of data.locations){
        // console.log(location.image)
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
            <div class='locArrowDiv'>
                <div class='locArrowSVG'>
                    <img onClick='processLocationSubmissionBarcode(${location.barcode})' src='/resources/edit-button-svgrepo-com.png'>
                </div>
            </div>
        </div>`
      }
    })
}
