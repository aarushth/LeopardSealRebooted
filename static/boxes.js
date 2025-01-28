function init() {
    fetch(flaskAd+'init', {method: 'POST'});
    
    updateBoxes();
}
window.onload = init;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};


async function updateBoxes(){
    let div = document.getElementById("boxes")
    
    div.innerHTML =
    `<div id='AddButtonDiv'>
        <button onClick='addBox()'>
            <div id='PlusSDiv'>
                <p>+</p>
            </div>
            <div id='TextSDiv'>
                <p>Add New Box</p>
            </div>
        </button>
    </div>`;
    await fetch(flaskAd+'pull_all_boxes').then(response => response.json())  // Use .text() to read plain text
    .then(async data => {
        //<p class='boxLocation'>${box.locationcode}</p>
      for(const box of data.boxes){
        // console.log(location.image)
        locName = 0
        await fetch(flaskAd+`pull_location/${box.locationcode}`).then(response => response.json())  // Use .text() to read plain text
        .then(data => {
            locName = data.name
      })
        div.innerHTML += 
        `<div class='boxy' id='${box.barcode}'>
            <div class='images'>
                <img class='boxImg' src='${box.image}'>
            </div>
            <div class='header'>
                <p class='boxName'>${box.name}</p>
                <p class='boxBarcode'>${box.barcode}</p>
                <p class='boxLocation'>@Loc_${box.locationcode}</p>
            </div>
            <div class='boxArrowDiv'>
                <div class='boxArrowSVG'>
                    <img onClick='processBoxSubmissionBarcode(${box.barcode}, ${box.locationcode})' src='/resources/edit-button-svgrepo-com.png'>
                </div>
            </div>
        </div>`
      }
    })
    
}
