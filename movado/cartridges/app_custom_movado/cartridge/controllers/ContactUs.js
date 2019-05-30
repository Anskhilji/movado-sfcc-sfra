/**
 * The controller loads and submits the ContactUs form.
 * @module  controllers/ContactUs
 */

'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');

server.get(
    'Load',
    server.middleware.include,
    csrfProtection.generateToken,
    function (req, res, next) {
        var contactUsForm = server.forms.getForm('contactus');
        contactUsForm.clear();
        res.render('/content/contactUsForm', {
            contactUsForm: contactUsForm,
            resources: {
                send: Resource.msg('button.send', 'common', null)
            }
        });
        return next();
    }
);

server.post(
    'Send',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var Mail = require('dw/net/Mail');
        var Site = require('dw/system/Site');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var contactUsForm = server.forms.getForm('contactus');
        if (contactUsForm.valid) {
            var result = {
                firstName: contactUsForm.firstname.value,
                lastName: contactUsForm.lastname.value,
                phone: contactUsForm.phone.value || '',
                email: contactUsForm.email.value,
                comment: contactUsForm.comment.value || '',
                ordernumber: contactUsForm.ordernumber.value || '',
                myquestion: contactUsForm.myquestion.value || '',
                contactUsForm: contactUsForm
            };

            var mail = new Mail();
            mail.setFrom(result.email);
            mail.addTo(
                Site.current.getCustomPreferenceValue('customerServiceEmail')
            );
            mail.setSubject(
                Resource.msg('subject.contactus.email', 'common', null)
            );
            mail.setContent(
                'firstName:' +
                    result.firstName +
                    'lastName:' +
                    result.lastName +
                    'phone:' +
                    result.phone +
                    'comment' +
                    result.comment +
                    'ordernumber' +
                    result.ordernumber +
                    'question' +
                    result.myquestion
            );
            mail.send();

            var apiContent = ContentMgr.getContent('ca-contactus-thankyou');
            var thankyouMessage = apiContent && apiContent.custom && apiContent.custom.body ? apiContent.custom.body.markup : '';
            res.json({
                success: true,
                message: thankyouMessage
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(contactUsForm)
            });
        }
        return next();
    }
);

module.exports = server.exports();
