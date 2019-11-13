'use strict';

exports.SFMC_SUBSCRIBER_OBJECT = 'MCSubscriber';
exports.SFMC_ACCESS_TOKEN_OBJECT = 'MCAccessToken';
exports.SFMC_ACCESS_TOKEN_OBJECT_ID = 'MCAccessToken';
exports.SFMC_DATA_API_ENDPOINT = {
     CONTACT: '/contacts/v1/contacts',
     EVENT: '/interaction/v1/events',
     DATA_EXTENSION: '/hub/v1/dataevents/key:{dataExtensionKey}/rowset'
}
exports.SERVICE_ID = {
    INSTANT_AUTH: 'mc.instant.auth.api',
    BATCH_AUTH: 'mc.batch.auth.api',
    INSTANT_DATA: 'mc.instant.data.api',
    BATCH_DATA: 'mc.batch.data.api'
}
exports.SFMC_SERVICE_API_TYPE = {
    CONTACT: 'CONTACT',
    EVENT: 'EVENT',
    DATA_EXTENSION: 'DATA_EXTENSION'
}