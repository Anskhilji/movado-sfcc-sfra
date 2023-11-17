'use strict';

/**
 *   Name: OauthFactory
 */

// Public
var OauthFactory = {

    SERVICE_NAME: {
        ORDER_DETAILS: 'user.search.service'
    },

    CONST_PARAMETERS: {
        AUTH_TYPES: {
            BEARER: 'Bearer'
        },
        HTTP_HEADERS: {
            AUTH: 'authorization',
            X_AUTH: 'x-is-authorization'
        }
    },

    /**
     * @name buildOrderDetailsRequestContainer
     * @param {string} accessToken access token
     * @param {string} methodType method type
     * @return {Object} requestDataContainer
     */
    buildUserSearchRequestContainer: function (accessToken, methodType) {
        return {
            serviceName: this.SERVICE_NAME.ORDER_DETAILS,
            method: methodType,
            token: accessToken,
            data: {
                query: {
                    text_query: {
                        fields: ['login'],
                        search_phrase: 'test@test.com'
                    }
                },
                select: '(hits.(login, disabled, locked))'
            }
        };
    }
};

module.exports = OauthFactory;
