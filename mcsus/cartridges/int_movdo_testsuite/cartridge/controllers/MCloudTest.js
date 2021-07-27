'use strict';

var server = require('server');

var SFMCApi = require('*/cartridge/scripts/api/SFMCApi');

server.post('Subscribe', function (req, res, next) {
        
        var params = {
            email: req.form.email,
            country: req.form.country,
            firstName: req.form.firstname,
            lastName: req.form.lastname,
            campaignName: req.form.compaign,
            birthday: req.form.birthday,
            gender: req.form.gender,
            phoneNumber: req.form.phone,
            eventName: req.form.eventname
        };z
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
