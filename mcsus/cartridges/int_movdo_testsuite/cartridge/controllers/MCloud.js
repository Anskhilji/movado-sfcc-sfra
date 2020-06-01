'use strict';

var server = require('server');

var SFMCApi = require('*/cartridge/scripts/api/SFMCApi');

server.get('Subscribe', function (req, res, next) {
        var requestParams = req.querystring;
        var params = {
            email: requestParams.Email,
            Country: requestParams.Country,
            FirstName: requestParams.FirstName,
            LastName: requestParams.LastName,
            CampaignName: requestParams.CampaignName,
            Birthday: requestParams.Birthday,
            Gender: requestParams.Gender,
            PhoneNumber: requestParams.PhoneNumber
        };
        SFMCApi.sendSubscriberToSFMC(params);
        var test = '';
    }
);

module.exports = server.exports();
