"use strict";
/* global empty */

/* Modules */
var Resource = require("dw/web/Resource");
var CommerceServiceUtils = require("*/cartridge/scripts/CommerceService/util/CommerceServiceUtils");
var ServiceBuilder = require("*/cartridge/scripts/CommerceService/service/ServiceBuilder");
var Logger = require("dw/system/Logger");
var Log = Logger.getLogger("CommerceService", "");

// service constants
var SERVICE_LOGIN = "commerceAPI.login";
var SERVICE_REST = "commerceAPI.rest";
var ENDPOINT_GET_INVENTORY_AVAILABILITY =
    "{{api_url}}/inventory/availability/{{api_version}}/organizations/{{tenant_group_id}}/availability-records/actions/get-availability";
var ENDPOINT_BATCH_UPDATE_INVENTORY_RECORDS =
    "{{api_url}}/inventory/availability/{{api_version}}/organizations/{{tenant_group_id}}/availability-records/actions/batch-update";

var CommerceAPIModel = {
    /**
     * @name createCommerceAPILogin
     * @desc Gets the access_token to be used in service calls
     * @return {Object} Service result
     */
    createCommerceAPILogin: function () {
        var createCommerceAPILoginResult;
        try {
            var svc = new ServiceBuilder(SERVICE_LOGIN);
            var serviceCredential = svc.getServiceCredential();

            if (serviceCredential) {
                var clientId = serviceCredential.getUser();
                var clientSecret = serviceCredential.getPassword();
                var loginParams = clientId + ":" + clientSecret;
                var encodedLoginParams =
                    require("dw/util/StringUtils").encodeBase64(loginParams);

                svc.setRequestMethod("POST");
                svc.addHeader(
                    "Content-Type",
                    "application/x-www-form-urlencoded"
                );
                svc.addHeader("Authorization", "Basic " + encodedLoginParams);
                svc.addParam("grant_type", "client_credentials");
                var scopes =
                    Object.hasOwnProperty.call(
                        serviceCredential.custom,
                        "scopes"
                    ) && serviceCredential.custom.scopes
                        ? serviceCredential.custom.scopes
                        : null;
                var instanceId =
                    Object.hasOwnProperty.call(
                        serviceCredential.custom,
                        "instance_id"
                    ) && serviceCredential.custom.instance_id
                        ? serviceCredential.custom.instance_id
                        : null;
                var realmId =
                    Object.hasOwnProperty.call(
                        serviceCredential.custom,
                        "realm_id"
                    ) && serviceCredential.custom.realm_id
                        ? serviceCredential.custom.realm_id
                        : null;
                scopes = scopes.replace("{{realm_id}}", realmId);
                scopes = scopes.replace("{{instance_id}}", instanceId);
                svc.addParam("scope", scopes);

                createCommerceAPILoginResult = svc.call(null);
            }
        } catch (e) {
            Log.error(
                "Error processing CommerceAPI Authorization. Error message: " +
                    e.message +
                    " more details: " +
                    e.toString() +
                    " in " +
                    e.fileName +
                    ":" +
                    e.lineNumber
            );
            return {
                error: true,
            };
        }
        return createCommerceAPILoginResult;
    },
    setServiceURLPlaceholders: function (svc, svcReqUrl) {
        if (svc) {
            try {
                var serviceCredential = svc.getServiceCredential();
                if (serviceCredential && !empty(svcReqUrl)) {
                    var serviceConfigUrl = serviceCredential.URL;
                    var serviceRequestUrl = svcReqUrl;
                    if (serviceConfigUrl) {
                        var shortCode =
                            Object.hasOwnProperty.call(
                                serviceCredential.custom,
                                "short_code"
                            ) && serviceCredential.custom.short_code
                                ? serviceCredential.custom.short_code
                                : null;
                        var apiVersion =
                            Object.hasOwnProperty.call(
                                serviceCredential.custom,
                                "version"
                            ) && serviceCredential.custom.version
                                ? serviceCredential.custom.version
                                : null;
                        var tenantGroupId =
                            Object.hasOwnProperty.call(
                                serviceCredential.custom,
                                "tenant_group_id"
                            ) && serviceCredential.custom.tenant_group_id
                                ? serviceCredential.custom.tenant_group_id
                                : null;
                        // Replacing the placeholder for short_code
                        if (empty(shortCode))
                            throw new Error(
                                "ShortCode is NOT defined in service configuration!"
                            );
                        serviceConfigUrl = serviceConfigUrl.replace(
                            "{{short_code}}",
                            shortCode
                        );
                        // Replacing the placeholder for api_url
                        serviceRequestUrl = serviceRequestUrl.replace(
                            "{{api_url}}",
                            serviceConfigUrl
                        );
                        // Replacing the placeholder for api_version
                        if (empty(apiVersion)) {
                            throw new Error(
                                "API Version is NOT defined in service configuration!"
                            );
                        }
                        serviceRequestUrl = serviceRequestUrl.replace(
                            "{{api_version}}",
                            apiVersion
                        );
                        // Replacing the placeholder for tenant_group_id
                        if (empty(tenantGroupId))
                            throw new Error(
                                "TenantGroupId is NOT defined in service configuration!"
                            );
                        serviceRequestUrl = serviceRequestUrl.replace(
                            "{{tenant_group_id}}",
                            tenantGroupId
                        );
                        // Setting the final URL for the service request
                        svc.setURL(serviceRequestUrl);
                    }
                }
            } catch (ex) {
                throw new Error(
                    "Cannot get the service Credential or Configuration object"
                );
            }
        }
    },
    getOCIAvailabilityRequest: function (req) {
        var result = null;
        try {
            var svc = new ServiceBuilder(SERVICE_REST);
            CommerceAPIModel.setServiceURLPlaceholders(
                svc,
                ENDPOINT_GET_INVENTORY_AVAILABILITY
            );
            result = CommerceAPIModel.callService(svc, req);
        } catch (e) {
            Log.error(
                "Error processing CommerceAPI Request (getOCIAvailabilityRequest). Error message: " +
                    e.message +
                    " more details: " +
                    e.toString() +
                    " in " +
                    e.fileName +
                    ":" +
                    e.lineNumber
            );
            return {
                error: true,
            };
        }
        return result.object;
    },
    batchUpdateOCIInventoryRecords: function (req) {
        var result = null;
        try {
            var svc = new ServiceBuilder(SERVICE_REST);
            CommerceAPIModel.setServiceURLPlaceholders(
                svc,
                ENDPOINT_BATCH_UPDATE_INVENTORY_RECORDS
            );
            result = CommerceAPIModel.callService(svc, req);
        } catch (e) {
            Log.error(
                "Error processing CommerceAPI Request (batchUpdateInventoryRecords). Error message: " +
                    e.message +
                    " more details: " +
                    e.toString() +
                    " in " +
                    e.fileName +
                    ":" +
                    e.lineNumber
            );
            return {
                error: true,
            };
        }

        var BAD_REQUEST_ERROR = Resource.msg("oms.fenwick.jobs.status.failure.badrequest", "oms_fenwick_jobs", null);
        if (result.error === 400 && result.msg === BAD_REQUEST_ERROR) {
            return {
                status: Resource.msg(
                    "oms.fenwick.jobs.status.Error",
                    "oms_fenwick_jobs",
                    null
                ),
                errorCode: 400,
                message: BAD_REQUEST_ERROR,
                result: null,
            };
        } else {
            return result.object;
        }
    },
    callService: function (svc, req) {
        if (svc) {
            try {
                svc.setContentType("application/json");
                var tokenObject = CommerceServiceUtils.getAccessToken();
                var authToken = null;
                if (tokenObject != null && tokenObject.token != null) {
                    var parsedToken = JSON.parse(tokenObject.token);
                    if (parsedToken != null)
                        authToken = parsedToken.access_token;
                }
                svc.addHeader("Authorization", "Bearer " + authToken);
                return svc.call(req);
            } catch (e) {
                Log.error(
                    "Error processing CommerceAPI Authentication. Error message: " +
                        e.message +
                        " more details: " +
                        e.toString() +
                        " in " +
                        e.fileName +
                        ":" +
                        e.lineNumber
                );
                return {
                    error: true,
                };
            }
        }
        return {};
    },
};

module.exports = CommerceAPIModel;
