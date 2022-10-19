'use strict';

var Logger = require('dw/system/Logger').getLogger('FedEx');
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
var fedExAPIHelper = require('~/cartridge/scripts/helpers/fedExAPIHelper');

function fexExAddressValidationAPI(address) {
    var result = {
        message: 'Error Occured during fedExAPICall',
        success: false
    }
    // var accessToken = fedExAPIHelper.getAuthToken(Constants.FEDEX_SERVICE_ID.FEDEX_AUTHENTICATION);
    var accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJDWFMiXSwiUGF5bG9hZCI6eyJjbGllbnRJZGVudGl0eSI6eyJjbGllbnRLZXkiOiJsNzMyOGIyODljMWYyZjQ1YWY5ZWQ0MDg4YjhkMDIyYzU5In0sImF1dGhlbnRpY2F0aW9uUmVhbG0iOiJDTUFDIiwiYWRkaXRpb25hbElkZW50aXR5Ijp7InRpbWVTdGFtcCI6IjE5LU9jdC0yMDIyIDE3OjQ2OjQ1IEVTVCIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJhcGltb2RlIjoiU2FuZGJveCIsImN4c0lzcyI6Imh0dHBzOi8vY3hzYXV0aHNlcnZlci1wcm9kLmFwcC5wYWFzLmZlZGV4LmNvbS90b2tlbi9vYXV0aDIifSwicGVyc29uYVR5cGUiOiJEaXJlY3RJbnRlZ3JhdG9yX0IyQiJ9LCJleHAiOjE2NjYyMjMyMDUsImp0aSI6IjYwNTExNDFjLTYwZDctNDc4NS1hMzMwLTE0YzUzMjAyYmE2NyJ9.S2NVilrtv3571c-UPc25_t-uGE3CEEHx7Au932rinu50U_jEWDYerpKQtM4KFOBX0Fg_ZNIh0X4-dzSLy8yz2eaZPYFgv2IX5NEHqy--n4KAqGlD4yAuTyMkvsq5FkiZ1SNoUCA1NzbwrEDysZzthOu0oHFLwv7xl_Er-aLLjQ9L6a3Hzslza5rQiPEImE_UFNhQnQm1mHc7uwhgCD5o5RgubjqDjh2eJQi7km6XM8o07FF1EGrv7cIjm5yka1fErmagkbHOtRhhD7Pqd7Ud8PjzQzUvxKYkAnG4-1UPjx5_cBQvPXKVjHIAM-PiCNL_-d8Oe1U7zQ7Tni91hh_rzPwS1FIXKfCOQMCAI0EFXe-bVVDL4VWwj05gwDyAgAbz6iJ74fFK7cVMnsKf0jfjpfmcCmVnJBoCjaBUYiDpBk-uYJmpUSnGWfHk--czSI-Lj-dX5_-XG6WniQx7lEF6-GltNNQpLRvOAZI4WwA4jgq3KjO6yw9f3IrBFqjjB70AMqbd1fTkmgPw0oEZ2l0bU_Kw4QCZ7FwfDNnHaLhbyZo7l-3JZfvS48T76QTefrjgwx15ktHh1_NaNK1noEyGRWxuenplk-wBSV6vVec1_Hh04tn7K94x1LOGR_oLsyTyyFYn7S5yUwhirER4UxVDFko9Z4iNbTuTE9I3eyzG4rY';
    try {
        service = fedExAPIHelper.getFedExAPIService(Constants.FEDEX_SERVICE_ID.FEDEX_ADDRESS_VALIDATION, accessToken);
        result = fedExAPIHelper.fedExValidateAddressAPICall(address, service);
    } catch (e) {
        Logger.error('Error Occured during fedExAPICall: error is : {0}', e.toString());
    }
    return result;
}

module.exports = {
    fexExAddressValidationAPI: fexExAddressValidationAPI
}