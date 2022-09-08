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
