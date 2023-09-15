'use strict';

module.exports = {
    BUSINESS_PLATFORM: 'SALESFORCE',
    ENDPOINTS: {
        AUTH: '/open_api/v1.2/oauth2/access_token/',
        BUSINESS_CREDENTIALS: '/tbp/v2.0/salesforce/auth_callback/',
        CREATE_APPLICATION: '/marketing_api/api/developer/app/create_auto_approve/',
        DISCONNECT_SHOP: '/tbp/v2.0/shop/connection/disconnect',
        DISCONNECT: '/open_api/v1.2/tbp/business_profile/disconnect/',
        FEED_NOTIFICATION: '/tbp/v2.0/feed/download/',
        GET_BUSINESS_PROFILE: '/open_api/v1.2/tbp/business_profile/get/',
        GET_CATALOG_OVERVIEW: '/open_api/v1.2/catalog/overview/',
        GET_PIXEL_LIST: '/open_api/v1.2/pixel/list/',
        PIXEL_TRACK_BATCH: '/open_api/v1.3/pixel/batch/',
        PIXEL_TRACK: '/open_api/v1.3/pixel/track/',
        REMOVE_PRODUCTS: '/open_api/v1.2/catalog/product/delete/',
        SHOP_CONNECTION_STATUS: '/tbp/v2.0/shop/connection/get_status',
        UPLOAD_PRODUCTS: '/open_api/v1.2/catalog/product/upload/'
    },
    EXTERNAL_DATA_HMAC_VERSION: 'HmacSHA256',
    EXTERNAL_DATA_VERSION: '1.0',
    FEED_PATHS: {
        inventory: '/src/feeds/export/social/tiktok/inventory',
        product: '/src/feeds/export/social/tiktok/product'
    },
    IMPEX_DEFAULT_PATH: '/on/demandware.servlet/webdav/Sites/Impex',
    MAX_TRACKING_EVENTS: 300000,
    OCAPI_VERSION: 'v22_6',
    PLUGIN_JS: 'https://sf16-scmcdn-va.ibytedtos.com/obj/static-us/tiktok-business-plugin/tbp_external_platform-v2.3.11.js',
    SERVICE_RETRTY_COUNT: 3,
    SERVICES: {
        TIKTOK: {
            ADS: 'tiktok-ads',
            BASE: 'tiktok.rest',
            BUSINESS_API: 'tiktok.catalog',
            ORDER_FEED: 'tiktok.order.svc',
            TRACKING: 'tiktok.tracking'
        }
    },
    SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION: 'SocialChannels',
    STATIC_APP_ACCESS_TOKEN: '244e1de7-8dad-4656-a859-8dc09eea299d',
    TIKTOK_CUSTOM_OBJECT_ID: 'tiktok-settings'
};
