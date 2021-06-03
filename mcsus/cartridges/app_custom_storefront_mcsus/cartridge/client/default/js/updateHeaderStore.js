
var StoreJson = localStorage.getItem("currentStore");
if (StoreJson !== '') {
    try {
        var StorePickup = JSON.parse(StoreJson);
        var storeAddress = StorePickup.address1 + ' ' + StorePickup.stateCode + ' ' + StorePickup.phone;
        $('.set-your-store').text(StorePickup.address1);
    } catch (error) {

    }
}