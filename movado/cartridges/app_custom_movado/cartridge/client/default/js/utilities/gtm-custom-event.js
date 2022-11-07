var updateDataLayer = function (string) {
    dataLayer.map(function (item, index, arr) {
        if (item.event && item.event === string) {
            delete arr[index];
        }
    });
};

$('body').on('product:afterAddToCart', function (evt, data) {
    if ($('[data-action]').data('action') == 'Product-Show' && data && data.addCartGtmArray) {
        updateDataLayer('addToCart');
        var gtmCartData = data.addCartGtmArray ? data.addCartGtmArray : '';
        dataLayer.push({
            event: 'addToCart',
            ecommerce: {
                currencyCode: gtmCartData.currency,
                add: {
                    actionField: {
                        list: gtmCartData.list
                    },
                    products: [{
                        id: gtmCartData.id,
                        name: gtmCartData.name,
                        price: gtmCartData.price,
                        category: gtmCartData.category,
                        variant: gtmCartData.variant
                    }]
                }
            }
        });
    } else if ($('[data-action]').data('action') == 'Search-Show' && data && data.addCartGtmArray) {
        updateDataLayer('addToCart');
        var gtmCartData = data.addCartGtmArray ? data.addCartGtmArray : '';
        dataLayer.push({
            event: 'addToCart',
            ecommerce: {
                currencyCode: gtmCartData.currency,
                add: {
                    actionField: {
                        list: gtmCartData.list
                    },
                    products: [{
                        id: gtmCartData.id,
                        name: gtmCartData.name,
                        price: gtmCartData.price,
                        category: gtmCartData.category,
                        variant: gtmCartData.variant
                    }]
                }
            }
        });
    }
});
