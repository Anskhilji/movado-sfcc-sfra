/**
* Purpose: Sends SCA Information to Listrak
*/
var Site = require('dw/system/Site');
var Product = require('*/cartridge/scripts/objects/ltkProduct.js');
var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper.js');

/**
 * Object to represent a cart with details.
 * */
function SCACart() {
    this.FirstName = null;
    this.LastName = null;
    this.Email = null;
    this.Stage = null;
    this.OrderNumber = '';
    this.Total = null;
    this.Meta1 = null;
    this.Meta2 = null;
    this.Token = null;
    this.CartLink = null;
    this.ClearCart = false;
    this.Source = null;
    this.Items = [];
}

/**
 * Object to represent a cart item with details.
 * @param {*} sku product sku
 * @param {*} quantity product qty
 * @param {*} price product price
 * @param {*} name product name
 */
function SCAItem(sku, quantity, price, name, ltkProductPrice) {
    this.Sku = sku;
    this.Quantity = quantity;
    this.Price = price;
    this.Name = name;
    this.ImageUrl = null;
    this.LinkUrl = null;
    this.Size = null;
    this.Meta1 = null;
    this.Meta2 = null;
    this.Meta3 = ltkProductPrice; //this is the price with currency symbol [MSS-1450]
}

/**
 * Object that holds methods to hold and prepare cart data.
 * */
function _SessionTracker() {
	/* Cart object that actually holds all of the cart properties and items. */
    this.Cart = new SCACart();

	// Load settings needed for SCA
    this.CustomViewType = Site.getCurrent().getCustomPreferenceValue('Listrak_ProductImageViewType');
    this.UseAbsoluteImageURLs = Site.getCurrent().getCustomPreferenceValue('Listrak_UseAbsoluteImageURLs');
    this.UseAbsoluteProductURLs = Site.getCurrent().getCustomPreferenceValue('Listrak_UseAbsoluteProductURLs');

	/* Sets basic customer information. */
    _SessionTracker.prototype.SetCustomer = function (email, firstname, lastname) {
        if (email) { this.Cart.Email = email; }
        if (firstname) { this.Cart.FirstName = firstname; }
        if (lastname) { this.Cart.LastName = lastname; }
    };

    /* Adds a cart item to the cart item array with the most basic information required. */
    _SessionTracker.prototype.AddItem = function (sku, quantity, price, name) {
        this.Cart.Items.push(new SCAItem(sku, quantity, price, name));
    };

    /* Adds a cart item to the cart item array with the most basic information plus links. */
    _SessionTracker.prototype.AddItemWithLinks = function (sku, quantity, price, name, imageurl, linkurl, ltkProductPrice) {
        try {
            var _ni = new SCAItem(sku, quantity, price, name);
            _ni.ImageUrl = imageurl.toString();
            _ni.LinkUrl = linkurl.toString();
            _ni.Meta3 = ltkProductPrice.toString();
            this.Cart.Items.push(_ni);
        } catch (ex) {
            this.parent.Exception.Submit(ex, 'Add Item With Links');
        }
    };

    /* Adds an expanded cart item to the cart item array (non-essential attributes). */
    _SessionTracker.prototype.AddItemEx = function (item) {
        this.Cart.Items.push(item);
    };

    /* Sets the clear cart flag to active. */
    _SessionTracker.prototype.ClearCart = function () {
    	this.Cart.ClearCart = true;
    };

    /* Function to serialize and encode SCA cart and cart items for consumption via client side script. */
    _SessionTracker.prototype.Serialize = function () {
    	return encodeURI(JSON.stringify(this.Cart));
    };

    /* Loads the cart contents and prepares it for submission. */
    _SessionTracker.prototype.LoadBasket = function (Basket) {
    	/* Check to see if this is an authenticated customer and get info from there. */
    	if (Basket == null)    	{
    		return false;
    	}

        var customer = Basket.getCustomer();
        if (customer) {
        	if (customer.profile)        	{
    		    this.Cart.FirstName = customer.profile.firstName;
    		    this.Cart.LastName = customer.profile.lastName;
    		    this.Cart.Email = customer.profile.email;
        	}
        } else {
        	this.Cart.FirstName = Basket.customerName;
        }

    	/* If basket.customEmail has a value it trumps anything from the customer object. */
    	if (Basket.customerEmail !== '' && Basket.customerEmail !== null)    		{ this.Cart.Email = Basket.customerEmail; }

        if (Basket.billingAddress != null) {
        	this.Cart.FirstName = Basket.billingAddress.firstName;
        	this.Cart.LastName = Basket.billingAddress.lastName;
        }


    	/* Set the order values. */
        this.Cart.Total = Basket.getAdjustedMerchandizeTotalNetPrice().value || Basket.getMerchandizeTotalNetPrice().value;

        /* If there is no order number, add the cart items. */
        if (this.Cart.OrderNumber.length === 0)    	{
        	var orderItems = Basket.getAllProductLineItems();
        	var index = 0;
        	for (index = 0; index < orderItems.length; index++)        	{
        		var orderItem = orderItems[index];
        		var product = orderItem.getProduct();
        		if (product != null)        		{
        			var prd = new Product.ltkProduct();
        			prd.LoadProduct(product);

        			var sku = prd.sku;
        			var qty = orderItem.quantity.value;
                    var price = ltkHelper.getProductPrice(orderItem.product, undefined, true);
        			var name = orderItem.lineItemText;
                    var ltkProductPrice = ltkHelper.getProductPrice(orderItem.product); //Get price with symbol [MSS-1450]


        			/* Image URL. */
        			var imageurl = prd.imageURL;

        			/* Link URL. */
        			var linkurl = prd.linkURL;

        			/* Add the cart item to the array of cart items. */
        			this.AddItemWithLinks(sku, qty, price, name, imageurl, linkurl, ltkProductPrice);
        		}
        	}
    	}

        /* If we got to this point, our cart was loaded successfully. */
        return true;
    };
}
exports._SessionTracker = _SessionTracker;
