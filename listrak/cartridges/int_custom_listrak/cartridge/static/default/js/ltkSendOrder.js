/* eslint-disable no-useless-concat */
/* eslint-disable no-continue */
/* eslint-disable block-scoped-var */
/* eslint-disable consistent-return */
/* eslint-disable no-loop-func */
var orderIsSent = false;
(function (d) {
    if (document.addEventListener) document.addEventListener('ltkAsyncListener', d);
    else {
        e = document.documentElement; e.ltkAsyncProperty = 0; e.attachEvent('onpropertychange', function (e) {
            if (e.propertyName === 'ltkAsyncProperty') { d(); }
        });
    }
    if (!orderIsSent) {
        sendOrder();
    }
}(function () {
    if (!orderIsSent) {
        sendOrder();
    }
}));
function sendOrder() {
    var scriptVars = document.querySelector('script[src*="ltkSendOrder.js"]');
    var order = JSON.parse(decodeURI(scriptVars.getAttribute('ltk-data-order')));
    var sca = JSON.parse(decodeURI(scriptVars.getAttribute('ltk-data-sca')));
    var ltkCountryCode = scriptVars.getAttribute('ltk-data-countryCode'); //Get Counntry Code from isml [MSS-1450]
    var clearUrl = (scriptVars.getAttribute('ltk-data-url'));
    if (typeof order === 'undefined') {
        order = '';
    }
    if (typeof sca === 'undefined') {
        sca = '';
    }
    /* If the Order object is not null or empty, iterate the order items and call JS to ship data to Listrak. */
    if (order !== null) {
        /* Add the basic order information. */
        _ltk.Order.HandlingTotal = order.HandlingTotal;
        _ltk.Order.ItemTotal = order.ItemTotal;
        _ltk.Order.OrderNumber = order.OrderNumber;
        _ltk.Order.OrderTotal = order.OrderTotal;
        _ltk.Order.ShippingTotal = order.ShipTotal;
        _ltk.Order.TaxTotal = order.TaxTotal;
        _ltk.Order.Meta1 = ltkCountryCode;
        _ltk.Order.SetCustomer(order.EmailAddress, order.FirstName, order.LastName);

        /* If there are order items, add them to the object for submission. */
        if (order.OrderItems.length > 0) {
            for (i = 0; i < order.OrderItems.length; i++) {
                _ltk.Order.AddItem(order.OrderItems[i].Sku, order.OrderItems[i].Qty, order.OrderItems[i].Price);
            }
        }

		/* Submit the order information. */
        _ltk.Order.Submit();
    }

    /* If the SCA object is not null or empty, iterate through it and call JS to ship data to Listrak. */
    if (sca != null) {
        /* Set the SCA parameters. */
        _ltk.SCA.FirstName = sca.FirstName;
        _ltk.SCA.LastName = sca.LastName;
        _ltk.SCA.Email = sca.Email;
        _ltk.SCA.CartLink = sca.CartLink;
        _ltk.SCA.Meta1 = sca.Meta1;
        _ltk.SCA.Meta2 = sca.Meta2;
        _ltk.SCA.Meta3 = ltkCountryCode; //Country Code [MSS-1450]
        _ltk.SCA.OrderNumber = sca.OrderNumber;
        _ltk.SCA.Source = sca.Source;
        _ltk.SCA.Stage = sca.Stage;
        _ltk.SCA.Total = sca.Total;

        /* If there are cart items, add them. */
        if (sca.Items.length > 0) {
            for (i = 0; i < sca.Items.length; i++) {
                var item = new SCAItem(sca.Items[i].Sku, sca.Items[i].Quantity, sca.Items[i].Price, sca.Items[i].Name);
                item.ImageUrl = sca.Items[i].ImageUrl;
                item.LinkUrl = sca.Items[i].LinkUrl;
                item.Meta1 = sca.Items[i].Meta1;
                item.Meta2 = sca.Items[i].Meta2;

                /* Add the expanded cart item to the object for submission. */
                _ltk.SCA.AddItemEx(item);
            }
        }

        /* Submit the cart information. */
        _ltk.SCA.Submit();

        /* If clear cart, set it. */
        if (sca.ClearCart) {
            _ltk.SCA.ClearCart();
        }
    }

    /* Reset the Order flag so we don't ship it up again unless another order is placed. */
    var path = clearUrl;
    jQuery.ajax({
        url: path,
        context: document,
        success: function () { }
    });
    orderIsSent = true;
}
