'use strict';

const Assert = require('chai').assert;
const Proxy = require('proxyquire').noCallThru().noPreserveCache();

var File = require('../../../../mocks/dw.io.File');
var HTTPRequestPart = require('../../../../mocks/dw.net.HTTPRequestPart');

describe('serviceHelper', function () {

    const serviceHelper = Proxy('../../../../../social_channels/cartridges/int_instagram/cartridge/scripts/services/serviceHelper.js', {
        '*/cartridge/scripts/social/helpers/serviceHelpers': {},
        'dw/util/ArrayList': {

        },
        'dw/net/HTTPRequestPart': HTTPRequestPart,
        'dw/svc/LocalServiceRegistry': {
            createService: function () {
                return {
                    request: {}
                }
            }
        },
        'dw/system/Logger': {
            getLogger: function () {

            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getID: function () {
                        return {
                            toLowerCase: function () {

                            }
                        }
                    }
                }
            }
        }
    });

    global.__proto__.empty = function () { return false; }
    global.__proto__.request = {
        locale: {
            split: function () {
                return ['','']
            }
        }
    }

    it('It should get service', function () {
        var getService = serviceHelper.getService({
            custom: {
                catalogId: '',
                accessToken: ''
            }
        }, '', '');

        Assert.isObject(getService);
    });

    it('It should convert to multipart file', function () {
        var convertToMultiPartFile = serviceHelper.convertToMultiPartFile('', new File());
        Assert.isObject(convertToMultiPartFile);
    });

    it('It should convert to multipart param', function () {
        var convertToMultiPartParam = serviceHelper.convertToMultiPartParam('', '');
        Assert.isObject(convertToMultiPartParam);
    });
});