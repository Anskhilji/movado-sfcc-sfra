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
        var dwUtil = require('dw/util');
        var template = dwUtil.Template('contactUsEmail.isml')
        var contentMap = dwUtil.HashMap();

        
        if (contactUsForm.valid) {
            var result = {
                firstName: !empty(contactUsForm.firstname) ? contactUsForm.firstname.value :!empty(contactUsForm.name) ? contactUsForm.name.value : '',
                lastName: !empty(contactUsForm.lastname) ? contactUsForm.lastname.value : '',
                phone: !empty(contactUsForm.phone) ? contactUsForm.phone.value : '',
                email: !empty(contactUsForm.email) ? contactUsForm.email.value : '',
                comment: !empty(contactUsForm.comment) ? contactUsForm.comment.value : '',
                ordernumber: !empty(contactUsForm.ordernumber) ? contactUsForm.ordernumber.value : '',
                myquestion: !empty(contactUsForm.myquestion) ? contactUsForm.myquestion.value : '',
                contactUsForm: contactUsForm
            };
            
            contentMap.put('result',result);
            var mail = new Mail();
            mail.setFrom(result.email);
            mail.addTo(
            	Site.current.getCustomPreferenceValue('customerServiceEmail')
            );
            mail.setSubject(
                Resource.msg('subject.contactus.email', 'common', null)
            );
            var text: MimeEncodedText = template.render(contentMap);
            mail.setContent(text);
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
