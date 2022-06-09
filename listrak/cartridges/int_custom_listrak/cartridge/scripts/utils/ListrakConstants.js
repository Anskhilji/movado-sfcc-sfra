'use strict';

exports.LTK_ACCESS_TOKEN_OBJECT = 'ltk_AccessToken';
exports.LTK_ACCESS_TOKEN_OBJECT_ID = 'ltk_AccessToken';
exports.CURRENCY_USD = 'USD';
exports.GERMANY_COUNTRYCODE = 'DE';
exports.BIRTH_YEAR = '1900';
exports.LTK_TRANSACTIONALSWITCH = 'Listrak';
exports.DATE_SEPRATOR = '/';
exports.Subscription_State = 'Subscribed';
exports.LTK_API_ENDPOINT = {
    CONTACT: '/List/{listId}/Contact/',
}
exports.LTK_TRANSACTIONAL_API_ENDPOINT = 'List/{listId}/TransactionalMessage/{transactionalMessageId}/Message';
exports.SERVICE_ID = {
    LTK_AUTH: 'listrak.auth.api',
    LTK_EVENT: 'listrak.event.api',
    LTK_TRANSACTIONAL: 'listrak.transactional.email',
}
exports.Source = {
    Footer: 'Listrak_FooterSourceID',
    Create_Account: 'Listrak_AccountCreateSourceID',
    Checkout: 'Listrak_CheckoutSourceID',
    BackInStock: 'Listrak_BackInStockSourceID'
}
exports.Event = {
    Footer: 'Listrak_FooterEventID',
    Create_Account: 'Listrak_AccountCreateEventID',
    Checkout: 'Listrak_CheckoutEventID',
    BackInStock: 'Listrak_BackInStockEventID'
}
exports.Subscribe = {
    Footer: 'Listrak_Footer_OverrideUnsubscribe',
    Create_Account: 'Listrak_AccountCreate_OverrideUnsubscribe',
    Checkout: 'Listrak_Checkout_OverrideUnsubscribe',
    BackInStock: 'Listrak_BackInStock_OverrideUnsubscribe'
}