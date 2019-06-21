'use strict'

var emailTypes = {
    registration: 1,
    passwordReset: 2,
    passwordChanged: 3,
    orderConfirmation: 4,
    accountLocked: 5,
    accountEdited: 6,
    productShareEmail: 7,
    orderCancellation: 8,
    orderPartialCancellation: 9,
    orderShipped: 10,
    wishlistShareEmail: 11
};

var Mail = function(){
    return {
        addTo: function(param1){
            return 'to'
        },
        setSubject: function(param2){
            return 'subject';
        },
        setFrom: function(param3){
            return 'from';
        },
        setContent: function(p1, p2, p3){
            return 'context';
        },
        send: function(){
            return 'email sent';
        }
    };
};

var renderTemplateHelper = {
    getRenderedHtml: function(p1, p2){
        return 'Html Data';
    }
};

var hooksHelper = function(p1, p2, p3, p4){
    return 'ABCD';
}

module.exports = {
    Mail,
    hooksHelper,
    renderTemplateHelper,
    emailTypes
}
