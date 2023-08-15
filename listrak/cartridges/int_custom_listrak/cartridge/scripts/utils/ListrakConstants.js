'use strict';

exports.LTK_ACCESS_TOKEN_OBJECT = 'ltk_AccessToken';
exports.LTK_ACCESS_TOKEN_OBJECT_ID = 'ltk_AccessToken';
exports.LTK_SMS_ACCESS_TOKEN_OBJECT = 'ltk_SMSAccessToken';
exports.LTK_SMS_ACCESS_TOKEN_OBJECT_ID = 'ltk_SMSAccessToken';
exports.CURRENCY_USD = 'USD';
exports.GERMANY_COUNTRYCODE = 'DE';
exports.BIRTH_YEAR = '1900';
exports.LTK_TRANSACTIONAL_SWITCH = 'Listrak';
exports.LTK_ACCOUNT_CONTEXT = 'Account';
exports.LTK_ORDER_CONTEXT = 'Order';
exports.DATE_SEPRATOR = '/';
exports.TOTAL_TAX = 'TBD';
exports.Subscription_State = 'Subscribed';
exports.SMS_Subscription = 'SMS Subcription';
exports.LTK_API_ENDPOINT = {
    CONTACT: '/List/{listId}/Contact/',
}
exports.LTK_TRANSACTIONAL_API_ENDPOINT = 'List/{listId}/TransactionalMessage/{transactionalMessageId}/Message';
exports.LTK_GET_CONTACT_STATUS_API_ENDPOINT = 'ShortCode/{shortCodeId}/Contact/{phoneNumber}';
exports.LTK_SUBSCRIBE_CONTACT_API_ENDPOINT = 'ShortCode/{shortCodeId}/Contact/{phoneNumber}/PhoneList/{phoneListId}';
exports.LTK_CREATE_CONTACT_API_ENDPOINT = 'ShortCode/{shortCodeId}/PhoneList/{phoneListId}/Contact';
exports.CLYDE_WARRANTY = 'clydeWarranty';
exports.PULSE_ENGRAVING = 'pulseIdEngraving';
exports.ENGRAVING = 'Engraved';
exports.EMBOSSED = 'Embossed';

exports.SERVICE_ID = {
    LTK_AUTH: 'listrak.auth.api',
    LTK_SMS_AUTH: 'listrak.sms.auth.api',
    LTK_EVENT: 'listrak.event.api',
    LTK_TRANSACTIONAL: 'listrak.transactional.email',
    LTK_SMS_SUBSCRIPTION: 'listrak.sms.subscription'
}
exports.Source = {
    Footer: 'Listrak_FooterSourceID',
    Create_Account: 'Listrak_AccountCreateSourceID',
    Checkout: 'Listrak_CheckoutSourceID',
    BackInStock: 'Listrak_BackInStockSourceID',
    PDP: 'Listrak_PDPSourceID'
}
exports.Event = {
    Footer: 'Listrak_FooterEventID',
    Create_Account: 'Listrak_AccountCreateEventID',

    Checkout: 'Listrak_CheckoutEventID',
    BackInStock: 'Listrak_BackInStockEventID',
    PDP: 'Listrak_PDPEventID'
}
exports.Subscribe = {
    Footer: 'Listrak_Footer_OverrideUnsubscribe',
    Create_Account: 'Listrak_AccountCreate_OverrideUnsubscribe',
    Checkout: 'Listrak_Checkout_OverrideUnsubscribe',
    BackInStock: 'Listrak_BackInStock_OverrideUnsubscribe',
    PDP: 'Listrak_PDP_OverrideUnsubscribe'
}