'use strict';

module.exports = {
    renderSCA: function (scaCart, listrakCountryCode) {
        var $clearFlag = $('.ltkClearFlag');
        var clearFlagUrl = $clearFlag.data('url');
        var sca = JSON.parse(decodeURI(scaCart));
        var ltkCountryCode = listrakCountryCode; //Country Code [MSS-1450]
        var clearUrl = clearFlagUrl;
        if (typeof _ltk === 'undefined') { return; }

        /* Add the basic SCA information. */
        if (sca != null) {
            /* Set the SCA parameters. */
            if (sca.Email != null) {
                _ltk.SCA.SetCustomer(sca.Email);
            }

            _ltk.SCA.FirstName = sca.FirstName;
            _ltk.SCA.LastName = sca.LastName;
            _ltk.SCA.CartLink = sca.CartLink;
            _ltk.SCA.Meta1 = sca.Meta1;
            _ltk.SCA.Meta2 = sca.Meta2;
            _ltk.SCA.Meta3 = ltkCountryCode; //Country Code [MSS-1450]

            /* If the order number is not null or empty string.. */
            if (sca.OrderNumber) {
                _ltk.SCA.OrderNumber = sca.OrderNumber;
            }

            _ltk.SCA.Source = sca.Source;
            _ltk.SCA.Stage = sca.Stage;
            _ltk.SCA.Total = sca.Total;
            var cartLink = '';
            /* If there are cart items, add them. */
            if (sca.Items.length > 0) {
                for (i = 0; i < sca.Items.length; i++) {
                    if (i > 0) { cartLink += ','; }
                    var item = new SCAItem(sca.Items[i].Sku, sca.Items[i].Quantity, sca.Items[i].Price, sca.Items[i].Name);
                    item.ImageUrl = sca.Items[i].ImageUrl;
                    item.LinkUrl = sca.Items[i].LinkUrl;
                    item.Meta1 = sca.Items[i].Meta1;
                    item.Meta2 = sca.Items[i].Meta2;
                    item.Meta3 = sca.Items[i].Meta3; //This is product Price in Local Currency [MSS-1450]
                    cartLink += sca.Items[i].Sku + '*' + sca.Items[i].Quantity;
                    /* Add the expanded cart item to the object for submission. */
                    _ltk.SCA.AddItemEx(item);
                }
                _ltk.SCA.CartLink = btoa(cartLink);
            }

            /* If clear cart, set it. */
            if (sca.ClearCart) {
                _ltk.SCA.ClearCart();
            }

            /* Submit the cart information. */
            _ltk.SCA.Submit();
        }

        /* Reset the SCA flag so we don't ship it up again unless it changes. */
        var path = clearUrl;
        jQuery.ajax({
            url: path,
            context: document,
            success: function () { }
        });
    },
}