'use strict';

var Resource ={
    msg: function(param1, param2,param3){
        return "nothing";
    }
}

var data = {
    stores: [
        {
            ID: 'Any ID',
            name: 'Downtown TV Shop',
            address1: '333 Washington St',
            address2: '',
            city: 'Boston',
            latitude: 42.5273334,
            longitude: -71.13758250000001,
            postalCode: '01803',
            phone: '333-333-3333',
            stateCode: 'MA',
            countryCode: 'US',
            storeHours: 'Mon - Sat: 10am - 9pm'
        }
    ],
    locations: '[{"name":"Downtown TV Shop","latitude":42.5273334,"longitude":-71.13758250000001,"infoWindowHtml":"someString"}]',
    searchKey: {
        lat: 42.5273334,
        long: -71.13758250000001
    },
    radius: 15,
    actionUrl: '/on/demandware.store/Sites-MovadoUS-Site/default/Stores-FindStores',
    googleMapsApi: 'testKey',
    radiusOptions: [15, 30, 50, 100, 300],
    storesResultsHtml: 'someString'
}

var StoresModel = function (){
    return data;
}

var StoreMgr= {
	searchStoresByCoordinates:function(p1,p2,p3,p4){
		return {
            keySet: function () {
                return [{
                    ID: 'Any ID',
                    name: 'Downtown TV Shop',
                    address1: '333 Washington St',
                    address2: '',
                    city: 'Boston',
                    postalCode: '01803',
                    phone: '333-333-3333',
                    stateCode: 'MA',
                    countryCode: {
                        value: 'US'
                    },
                    latitude: 42.5273334,
                    longitude: -71.13758250000001,
                    storeHours: {
                        markup: 'Mon - Sat: 10am - 9pm'
                    }
                }];
            }
        };
	}
}

var Site = {
    getCurrent: function () {
        return {
            getCustomPreferenceValue: function () {
                return 'testKey';
            }
        };
    }
};

var URLUtils = {
    url: function (endPointName) {
        return {
            toString: function () {
                return '/on/demandware.store/Sites-MovadoUS-Site/default/' + endPointName;
            }
        };
    }
};

var createStoresResultsHtml = function (stores) {
    return 'rendered html';
}

var HashMap = function(){
    return {
        put : function(param1,param2){

        }
    };
};

var Template = function(){
    return {
        render : function(param1){
            return {
                text : "rendered"
            };
        }
    };
};

module.exports ={
	Site,
	URLUtils,
	StoreMgr,
	StoresModel,
    Resource,
    createStoresResultsHtml,
    HashMap,
    Template
}
