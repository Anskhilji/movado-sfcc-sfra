'use strict';

var server = require('server');

var SFMCApi = require('*/cartridge/scripts/api/SFMCApi');

server.post('Subscribe', function (req, res, next) {
        
        var params = {
            email: req.form.email,
            Country: req.form.country,
            FirstName: req.form.firstname,
            LastName: req.form.lastname,
            CampaignName: req.form.compaign,
            Birthday: req.form.birthday,
            Gender: req.form.gender,
            PhoneNumber: req.form.phone,
        };
        var result = SFMCApi.sendSubscriberToSFMC(params);
        res.render('mcloud/result', { result: result });
        next();
    }
);

server.get('Show', function (req, res, next) {

    res.render('mcloud/subscription');
    next();
}
);

module.exports = server.exports();
