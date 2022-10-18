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
    var accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJDWFMiXSwiUGF5bG9hZCI6eyJjbGllbnRJZGVudGl0eSI6eyJjbGllbnRLZXkiOiJsNzMyOGIyODljMWYyZjQ1YWY5ZWQ0MDg4YjhkMDIyYzU5In0sImF1dGhlbnRpY2F0aW9uUmVhbG0iOiJDTUFDIiwiYWRkaXRpb25hbElkZW50aXR5Ijp7InRpbWVTdGFtcCI6IjE4LU9jdC0yMDIyIDE2OjI2OjU4IEVTVCIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJhcGltb2RlIjoiU2FuZGJveCIsImN4c0lzcyI6Imh0dHBzOi8vY3hzYXV0aHNlcnZlci1wcm9kLmFwcC5wYWFzLmZlZGV4LmNvbS90b2tlbi9vYXV0aDIifSwicGVyc29uYVR5cGUiOiJEaXJlY3RJbnRlZ3JhdG9yX0IyQiJ9LCJleHAiOjE2NjYxMzIwMTgsImp0aSI6ImViZDRlNWY3LTQ3NTYtNGRmMi05ZTRmLTQ0ZjAxM2Y3NDVhZSJ9.HjbJsmD8QZy_4FRMiQbHcF_fP23_9L9H1Bx9Npxx1C7Reb2xlu_LbAvXVvb2o2j-bmh0hVkhCbOUICqv19knSGSV1utB4oNyWf61dfFtbnHl_AgRJBoP5kL36NuPuBWaQw7sMAV-KyAhvVfN47c5-94cd7_-sKB-ksaLWy_v-Ie-hIt8c9wnZge_etW1Xew9AdmqMGyYp7AUtboBfKCUo0uS2pxcKdjgWIYLQ56SEB_Uz6Eq7BIfwSFBnrrr_Xyj5tVy3Io02G2aHgiH2j6vlr1RZMRb-OfcgBbtiR2tupo1xUz0zQMoJ3M97cOl4RZvlSZ_9VUmWNqdWgha-44NJblkybZm4pbfBKAFvifEu5rFvb0lwvc3xUkDVhtjLBSKRLNmG6Jw9wZwVhszVV-o72I6yzqT5w0mu0nmyDwl8B9x3Upf7XJ4QVMA4ZlQCSiNiCgiK6Hq4XSZ4KXKrrfGuLaQoVpbrL9wMf6LtySxq0lBogBTeSLJlLNQgjkcogijTrMPeneivOO6NV1WNg4pHn0VGJr_z8vVLb3849-4o9hbhxn984C6X1IrurE88xzaTMMz8edE16e8Iko93I-Gg4Ta-H7hhQACP04tBpWowd0BGOlG2Hw9qDHowdHwr9Wl1eEG6-utsY7zuf6lNrWezBqSYxE8NJFzUlC2a2ZnbYw';
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