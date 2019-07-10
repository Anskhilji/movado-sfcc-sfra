'use strict';

var assert = require('chai').assert;
var mockShippingcustomHelper = require('../../../../../mocks/helpers/mockShippingcustomHelper');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('shippingCustomHelper',() => {

    describe('emptyAddress',() => {
        
        it('Returns a boolean indicating if the address is not empty',() => {

            var shipment = {
                shippingAddress : {
                    firstName : "Sanchit",
                    address1 : "123, baker street"
                }
            }
            
            var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});

            var isAddressNotEmpty = object.emptyAddress(shipment);

            assert.equal(isAddressNotEmpty,true);
        });

        it('Returns a boolean indicating if the address is empty',() => {

            var shipment = {
            }
            
            var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});

            var isAddressNotEmpty = object.emptyAddress(shipment);

            assert.equal(isAddressNotEmpty,false);
        });

    });

    describe('getCompanyName',() => {
        
        it('Returns null if address is not found',() => {

            var shipment = {};

            var customer = {};
            
            var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});
            
            var companyName = object.getCompanyName(shipment,customer);

            assert.equal(companyName,null);

        });

        it('Returns company name if address is found and addresses in customer address book are found',() => {

            var shipment = {
                shippingAddress : {
                    address1 : {
                        companyName : "CompanyName1"
                    },
                    countryCode : {
                        value : {
                                    equalsIgnoreCase : function(param1){
                                            return true;
                                    }
                                }
                      }
                }
            };

            var customer = {
                addressBook : {
                    addresses : [
                                    {
                                        address1 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        address2 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        city : {
                                                    equalsIgnoreCase : function(param1){
                                                        return true;
                                                    }
                                                },
                                        countryCode : {
                                                        value : {
                                                                    equalsIgnoreCase : function(param1){
                                                                            return true;
                                                                    }
                                                                }
                                                      },
                                        firstName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        lastName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                            }
                                                    },
                                        postalCode : {
                                                        equals : function(param1){
                                                            return true;
                                                        }
                                                    },
                                        stateCode : {
                                        equalsIgnoreCase : function(param1){
                                                return true;
                                }
                            }
                        }
                    ]
                }
            };
            
            var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});
            
            var companyName = object.getCompanyName(shipment,customer);

            assert.equal(companyName,null);
        });


        it('Does not returns company name if address is found and it is not an equivalent address',() => {

            var shipment = {
                shippingAddress : {
                    address1 : {
                        companyName : "CompanyName1"
                    },
                    countryCode : {
                        value : {
                                    equalsIgnoreCase : function(param1){
                                            return true;
                                    }
                                }
                      }
                }
            };

            var customer = {
                addressBook : {
                    addresses : [
                                    {
                                        address1 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        address2 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return false;
                                                        }
                                                    },
                                        city : {
                                                    equalsIgnoreCase : function(param1){
                                                        return true;
                                                    }
                                                },
                                        countryCode : {
                                                        value : {
                                                                    equalsIgnoreCase : function(param1){
                                                                            return true;
                                                                    }
                                                                }
                                                      },
                                        firstName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        lastName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                            }
                                                    },
                                        postalCode : {
                                                        equals : function(param1){
                                                            return true;
                                                        }
                                                    },
                                        stateCode : {
                                        equalsIgnoreCase : function(param1){
                                                return true;
                                }
                            }
                        }
                    ]
                }
            };
            
            var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});
            
            var companyName = object.getCompanyName(shipment,customer);

            assert.equal(companyName,null);
        });
    });

    describe('getAssociatedAddress',() => {
        
        it('Returns a matching id if a match is found in address',() => {

            var shipment = {
                shippingAddress : {
                    address1 : {
                        companyName : "CompanyName1"
                    },
                    countryCode : {
                        value : {
                                    equalsIgnoreCase : function(param1){
                                            return true;
                                    }
                                }
                      }
                }
            };

            var customer = {
                addressBook : {
                    addresses : [
                                    {
                                        address1 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        address2 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        city : {
                                                    equalsIgnoreCase : function(param1){
                                                        return true;
                                                    }
                                                },
                                        countryCode : {
                                                        value : {
                                                                    equalsIgnoreCase : function(param1){
                                                                            return true;
                                                                    }
                                                                }
                                                      },
                                        firstName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        lastName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                            }
                                                    },
                                        postalCode : {
                                                        equals : function(param1){
                                                            return true;
                                                        }
                                                    },
                                        stateCode : {
                                        equalsIgnoreCase : function(param1){
                                                return true;
                                        }
                                         },
                                         ID : "matchingID"
                        }
                    ]
                }
            };

            var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});

            var associatedAddress = object.getAssociatedAddress(shipment,customer);
            assert.equal(associatedAddress,"matchingID");
        });


        it('Does not return a matching id if address is not present',() => {

            var shipment = {};
            
            var customer = {
                addressBook : {
                    addresses : [
                                    {
                                        address1 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        address2 : {
                                                        companyName : "CompanyName1",
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        city : {
                                                    equalsIgnoreCase : function(param1){
                                                        return true;
                                                    }
                                                },
                                        countryCode : {
                                                        value : {
                                                                    equalsIgnoreCase : function(param1){
                                                                            return true;
                                                                    }
                                                                }
                                                      },
                                        firstName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                        }
                                                    },
                                        lastName : {
                                                        equalsIgnoreCase : function(param1){
                                                        return true;
                                                            }
                                                    },
                                        postalCode : {
                                                        equals : function(param1){
                                                            return true;
                                                        }
                                                    },
                                        stateCode : {
                                        equalsIgnoreCase : function(param1){
                                                return true;
                                        }
                                         },
                                         ID : "matchingID"
                        }
                    ]
                }
            };

            var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/shippingCustomHelper', {});

            var associatedAddress = object.getAssociatedAddress(shipment,customer);
            assert.equal(associatedAddress,false);
        });

    });

    describe('getTaxTotals',() => {
        
        it('',() => {

        });

    });

});