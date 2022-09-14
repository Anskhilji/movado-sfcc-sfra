
'use strict';

/**
 * Resource helper
 *
 */

/**
 * Get the client-side resources of a given page
 * @param {string} pageContext : The page context which need to be render
 * @returns {Object} resources : An objects key key-value pairs holding the resources
 */
function getResources(pageContext) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');

    var resources = {
        BOPIS_STORE_FETCHING_ERROR: Resource.msg('store.pickup.search.result.error', 'storePickUp', null),
        BOPIS_STORE_AVAILABLE_TEXT: Resource.msg('store.pickup.search.available.text', 'storePickUp', null),
        BOPIS_STORE_CART_ERROR: Resource.msg('store.pickup.cart.error', 'storePickUp', null),
        PICKUP_FROM_STORE: session.privacy.pickupFromStore || false,
    };
    return resources;
}

module.exports = {
    getResources: getResources
};
