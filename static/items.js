async function init() {
    await fetch(flaskAd+'init', {method: 'POST'});
    
    updateItems();
    
}
window.onload = init;
window.onbeforeunload = function () {
    fetch(flaskAd+'quit')
};


async function updateItems(){
    let div = document.getElementById("items")
    
    div.innerHTML =
    `<div id='AddButtonDiv'>
        <button onClick='addItem()'>
            <div id='PlusSDiv'>
                <p>+</p>
            </div>
            <div id='TextSDiv'>
                <p>Add New Item</p>
            </div>
        </button>
    </div>`;
    await fetch(flaskAd+'pull_all_items').then(response => response.json())  // Use .text() to read plain text
    .then(async data => {
        //<p class='boxLocation'>${box.locationcode}</p>
      for(const item of data.items){
        // console.log(location.image)
        locName = 0
        await fetch(flaskAd+`pull_box/${item.boxcode}`).then(response => response.json())  // Use .text() to read plain text
        .then(async box => {
            boxName = box.name
            await fetch(flaskAd+`pull_location/${box.locationcode}`).then(response => response.json())  // Use .text() to read plain text
            .then(async loc => {
            locName = loc.name
      })
      })
        div.innerHTML += 
        `<div class='itemy ${item.quantity <= item.alert?'a':''}' id='${item.barcode}'>
            <div class='images'>
                <img class='itemImg' src='${item.image}'>
            </div>
            <div class='header'>
                <p class='itemName'>${item.name}</p>
                <p class='itemBarcode'>${item.barcode}</p>
                <p class='itemDescription'>${item.description}</p>
                <p class='itemBox'>in _${boxName}_@${locName}</p>
                <p class='itemName'>${item.quantity} remaining</p>
            </div>
            <div class='itemArrowDiv'>
                <div class='itemArrowSVG'>
                    <img onClick='processItemSubmissionBarcode(${item.barcode}, ${item.boxcode})' src='/resources/edit-button-svgrepo-com.png'>
                </div>
            </div>
        </div>`
      }
    })
    
}
