'use strict';

exports.API_ENDPOINT = {
    AVAILABILITY: '{{api_url}}/inventory/availability/{{api_version}}/organizations/{{tenant_group_id}}/availability-records/actions/get-availability',
    BATCH_UPDATE: '{{api_url}}/inventory/availability/{{api_version}}/organizations/{{tenant_group_id}}/availability-records/actions/batch-update'
}

exports.SERVICE_ID = {
    OMNI_CHANNEL_AUTH: 'commerceAPI.login',
    OMNI_CHANNEL_INVENTORY: 'commerceAPI.rest'
}

exports.ERRORS_TYPE = {
    ERROR: 'ERROR',
    LOCATION_NOT_EXIST: 'LocationDoesNotExist'
}

exports.US_COUNTRY_CODE='US';
exports.RAKUTEN_SITE_ID = 'atrv';
exports.RAKUTEN_DROPPED_DATE = 'ald';
exports.RAKUTEN_Order_GMT_DATE = 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'';