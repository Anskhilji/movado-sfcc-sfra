'use strict'

var assert = require('chai').assert;
var chai = require('chai');
var gtmHelper = require('../../mocks/helper/gtmHelper');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('gtm',() => {

    describe('getCategoryTemplates',() => {

        it('1 : Authenticated, CGID exists, action = search show, page-type = category, page-Name = PLP',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : true,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'search-show',
                    urlQueryString : 'cgid=qwertyuiop.com'
                }
            };

            var productManager = {};
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productManager 
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));
        });

        it('2 :Unauthenticated',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'search-show',
                    urlQueryString : 'cgid=qwertyuiop.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('3 : Authenticated, CGID does not exists, action = search show, page-type = category, page-Name = PLP',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'qwerty.com',
                    urlQueryString : 'q=qwertyuiop.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });


        it('3b : Authenticated, CGID does not exists, action = search show, page-type = category, page-Name = PLP',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'qwerty.com',
                    urlQueryString : 'q=qwerty&uiop.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('4 : home-show section',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'home-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('5 : about section',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'qwerty.com',
                    urlQueryString : 'aboutqwertyui&op.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('6 : wizard-show',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'wizard-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('7 : account show',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'account-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var productMr = {

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('8 : product-show',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'product-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var product = {
                ID : {

                },
                name : {

                },
                priceModel : {
                    price : {
                        decimalValue : {

                        }
                    }
                },
                brand : {

                },
                custom : {
                    sg_baseunitvolume : {

                    },
                    sg_class : {

                    },
                    sg_varietal : {

                    },
                    sg_countryoforigin : {

                    },
                    sg_vintage : {

                    },
                    sg_appellation : {

                    }

                },
                UPC : {

                },
                bundledProducts : {
                    length : 0
                }
            }

            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('8b : product-show',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'product-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var product = {
                ID : {

                },
                name : {

                },
                priceModel : {
                    price : {
                        decimalValue : {

                        }
                    }
                },
                brand : {

                },
                custom : {
                    sg_baseunitvolume : {

                    },
                    sg_class : {

                    },
                    sg_varietal : {

                    },
                    sg_countryoforigin : {

                    },
                    sg_vintage : {

                    },
                    sg_appellation : {

                    }

                },
                UPC : {

                },
                bundledProducts : {
                    length : 1
                }
            }

            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('9 : login-show',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'login-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('10 : product-showquickview',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'product-showquickview',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var product = {
                ID : {

                },
                name : {

                },
                priceModel : {
                    price : {
                        decimalValue : {

                        }
                    }
                },
                brand : {

                },
                custom : {
                    sg_baseunitvolume : {

                    },
                    sg_class : {

                    },
                    sg_varietal : {

                    },
                    sg_countryoforigin : {

                    },
                    sg_vintage : {

                    },
                    sg_appellation : {

                    }

                },
                UPC : {

                },
                bundledProducts : {
                    length : 0
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('11 : cart-show',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'cart-show',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }

            var currentBasket = {
                allProductLineItems : {}
            }

            var basketMr  = {
                getCurrentBasket : function(){
                    return currentBasket;
                }
            };

            var cartCustomHelper = {};
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr,
                'dw/order/BasketMgr' : basketMr,
                '*/cartridge/scripts/cartCustomHelpers' : cartCustomHelper
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('12 : checkout',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'checkout',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });


        it('13 : order-confirm',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'order-confirm',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }

            var order = {
                merchandizeTotalNetPrice : {
                    decimalValue : {}
                },
                merchandizeTotalTax : {
                    decimalValue : {

                    }
                },
                shippingTotalNetPrice : {
                    decimalValue : {

                    }
                },
                merchandizeTotalGrossPrice : {
                    decimalValue : {

                    }
                },
                shipments : [{
                    shippingMethod : {
                        displayName : {

                        }
                    }
                },{
                    a : ''
                }],
                allProductLineItems : [{
                    length : 2,
                    product : '',
                    quantity : {
                        decimalValue : 2
                    }
                }]
            }

            var orderMr = {
                getOrder : function(param){
                    return order;
                }
            };
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr,
                'dw/order/OrderMgr' : orderMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('14 : wizard-getresults',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'wizard-getresults',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('15 : address-list',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'address-list',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('16 : account-editprofile',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'account-editprofile',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('17 : address-addaddress',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'address-addaddress',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('18 : account-editpassword',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'account-editpassword',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        it('19 : wizard-getresults',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'wizard-getresults',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
    
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        });
        

        it('20 : checkout-login',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'checkout-login',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('21 : address-editaddress',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'address-editaddress',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('22 : order-history',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'order-history',
                    urlQueryString : 'qwertyui&op.com'
                }
            }
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });

        it('23 : product-showquickview',() => {

            var req = {
                currentCustomer : {
                    raw : {
                        authenticated : false,
                        registered : true,
                        externallyAuthenticated : true
                    },
                    profile : {
                        customerNo : '12345'
                    }
                },
                querystring : {
                    urlAction : 'product-showquickview',
                    urlQueryString : 'qwertyui&op.com'
                }
            }

            var product  = {
                bundledProducts : {
                    length : 2
                }
            };

            var productManager = {
                getProduct : function() {
                    return product;
                }
            };
 
            var productMr = {
                getProduct : function(param){
                    return product;
                }

            }
 
            var gtm = proxyquire('../../../cartridges/int_gtm/cartridge/models/gtm',{
                'dw/web/Resource' : gtmHelper.resource,
                'dw/catalog/CatalogMgr' : gtmHelper.catalogMgr,
                'dw/catalog/ProductSearchModel' : gtmHelper.psModel,
                '*/cartridge/models/search/productSearch' : gtmHelper.pSearch,
                '*/cartridge/scripts/search/search' : gtmHelper.search,
                'dw/web/URLUtils' : gtmHelper.urlUtil,
                'dw/catalog/ProductMgr' : productMr
            });

            var result = new gtm(req);
            console.log('result : ' + JSON.stringify(result));

        });



        

    });

});