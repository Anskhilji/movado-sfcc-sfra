'use strict';

const SocialConstants = {
    BIZ_MNGR_SITE_ID: 'Sites-Site',
    CARTRIDGES: {
        BASE: ['int_social_base'],
        BASE_BM: ['bm_socialchannels'],
        CHECKOUT: ['int_social_checkout'],
        FEEDS: ['int_socialfeeds', 'bm_socialfeeds', 'bc_library'],
        GOOGLE: ['int_google'],
        INSTAGRAM: ['int_instagram'],
        SNAPCHAT: ['int_snapchat'],
        TIKTOK: ['int_tiktok'],
        OMS_SOM: ['int_order_som'],
        OMS_OTHER: ['int_order_no_oms'],
        PIXEL: {
            ALL: ['app_storefront_social'],
            TIKTOK: ['int_tiktok_pixel']
        }
    },
    CARTRIDGE_PATHS: {},
    DIRECTORIES: {
        BASE_DATA_DIR: 'data',
        DATA_DIRS: {
            ALL_CHANNELS: ['common'],
            GOOGLE: ['google/google_global', 'inventory_lists'],
            INSTAGRAM: ['instagram/instagram_global', 'inventory_lists'],
            SNAPCHAT: ['snapchat/snapchat_global'],
            TIKTOK: ['tiktok/tiktok_global', 'tiktok/tiktok_site'],
            OCI: ['oci_feeds']
        }
    },
    DATA_API_RESOURCES: {
        B2C_TOOLS: [
            {
                resource_id: '/code_versions',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/code_versions/*',
                methods: ['patch', 'delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/jobs/*/executions',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/jobs/*/executions/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/sites',
                methods: ['get'],
                read_attributes: '(**)'
            },
            {
                resource_id: '/sites/**',
                methods: ['get', 'put', 'post', 'delete', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/sites/*/cartridges',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            }
        ],
        TIKTOK: [
            {
                resource_id: '/user_search',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            }
        ]
    },
    DEPLOY_OPTIONS: {
        CODE_OPTIONS: ['CODE_DATA', 'CODE_ONLY'],
        DATA_OPTIONS: ['CODE_DATA', 'DATA_ONLY']
    },
    OCAPI_VERSION: '21.3',
    SCAPI_CLIENT_NAME: 'Social Channel Integrations Private Client',
    SCAPI_CLIENT_REQUIRED: {
        GOOGLE: false,
        INSTAGRAM: false,
        SNAPCHAT: true,
        TIKTOK_ADS: false,
        TIKTOK_SHOP: false,
        TIKTOK_ADS_SHOP: false
    },
    SCAPI_SCOPES: {
        SOCIAL: [
            'sfcc.orders.rw',
            'sfcc.shopper-baskets-orders',
            'sfcc.shopper-baskets-orders.rw',
            'sfcc.shopper-categories',
            'sfcc.shopper-customers.login',
            'sfcc.shopper-customers.register',
            'sfcc.shopper-gift-certificates',
            'sfcc.shopper-myaccount',
            'sfcc.shopper-myaccount.addresses',
            'sfcc.shopper-myaccount.addresses.rw',
            'sfcc.shopper-myaccount.baskets',
            'sfcc.shopper-myaccount.orders',
            'sfcc.shopper-myaccount.paymentinstruments',
            'sfcc.shopper-myaccount.paymentinstruments.rw',
            'sfcc.shopper-myaccount.productlists',
            'sfcc.shopper-myaccount.productlists.rw',
            'sfcc.shopper-myaccount.rw',
            'sfcc.shopper-product-search',
            'sfcc.shopper-productlists',
            'sfcc.shopper-products',
            'sfcc.shopper-promotions',
            'sfcc.ta_ext_on_behalf_of',
            'sfcc.ts_ext_on_behalf_of'
        ]
    },
    SITE_PREF_GROUPS: {
        TIKTOK: 'TikTok'
    },
    SHOP_API_RESOURCES: {
        TIKTOK: [
            {
                resource_id: '/order_search',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/orders/*',
                methods: ['get', 'patch', 'put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            }
        ]
    },
    SHOP_API_RESOURCES_SCAPI: {
        SNAPCHAT: [
            {
                resource_id: '/baskets',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*',
                methods: ['get', 'patch', 'delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/billing_address',
                methods: ['put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/coupons',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/coupons/*',
                methods: ['delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/customer',
                methods: ['put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/gift_certificate_items',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/gift_certificate_items/*',
                methods: ['delete', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/items',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/items/*',
                methods: ['delete', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/payment_instruments',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/payment_instruments/*',
                methods: ['delete', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/payment_methods',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/shipments',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/shipments/*',
                methods: ['delete', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/shipments/*/shipping_address',
                methods: ['put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/shipments/*/shipping_method',
                methods: ['put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/baskets/*/shipments/*/shipping_methods',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/categories/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/content/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/content_search',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*',
                methods: ['get', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/addresses',
                methods: ['get', 'post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/addresses/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/baskets',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/orders',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/password',
                methods: ['put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/payment_instruments',
                methods: ['get', 'post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/payment_instruments/*',
                methods: ['get', 'delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/product_lists',
                methods: ['get', 'post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/product_lists/*',
                methods: ['get', 'patch', 'delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/product_lists/*/items',
                methods: ['get', 'post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/*/product_lists/*/items/*',
                methods: ['get', 'patch', 'delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/auth',
                methods: ['post', 'delete'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/customers/auth/trustedsystem',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/gift_certificate',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/orders',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/orders/*',
                methods: ['get', 'patch', 'put'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/orders/*/payment_instruments',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/orders/*/payment_instruments/*',
                methods: ['delete', 'patch'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/orders/*/payment_methods',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/product_lists',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/product_lists/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/product_lists/*/items',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/product_lists/*/items/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/product_search',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/products/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/promotions',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/promotions/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/search_suggestion',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/sessions',
                methods: ['post'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/stores',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            },
            {
                resource_id: '/stores/*',
                methods: ['get'],
                read_attributes: '(**)',
                write_attributes: '(**)'
            }
        ]
    },
    SOCIAL_CHANNELS: {
        ALL_CHANNELS: 'ALL_CHANNELS',
        GOOGLE: 'GOOGLE',
        INSTAGRAM: 'INSTAGRAM',
        SNAPCHAT: 'SNAPCHAT',
        TIKTOK_ADS: 'TIKTOK_ADS',
        TIKTOK_SHOP: 'TIKTOK_SHOP',
        TIKTOK_ADS_SHOP: 'TIKTOK_ADS_SHOP'
    },
    WEBDAV_PERMISSIONS: {
        ALL: [
            {
                path: '/impex/src/feeds/export',
                operations: ['read_write']
            }
        ]
    }
};

const bmFilter = 'bm_';

// int_socialfeeds:bm_socialfeeds:bc_library:bm_socialchannels:int_social_base
SocialConstants.CARTRIDGE_PATHS.BIZ_MNGR = [
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE_BM,
    ...SocialConstants.CARTRIDGES.BASE];

// int_google:int_socialfeeds:bc_library:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.GOOGLE] = [
    ...SocialConstants.CARTRIDGES.GOOGLE,
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE
].filter(item => !item.startsWith(bmFilter));

// int_instagram:int_socialfeeds:bc_library:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.INSTAGRAM] = [
    ...SocialConstants.CARTRIDGES.INSTAGRAM,
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE
].filter(item => !item.startsWith(bmFilter));

// int_snapchat:int_social_checkout:int_socialfeeds:bc_library:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.SNAPCHAT] = [
    ...SocialConstants.CARTRIDGES.SNAPCHAT,
    ...SocialConstants.CARTRIDGES.CHECKOUT,
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE
].filter(item => !item.startsWith(bmFilter));

// int_tiktok:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.TIKTOK_ADS] = [
    ...SocialConstants.CARTRIDGES.TIKTOK,
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE
].filter(item => !item.startsWith(bmFilter));

// int_tiktok:int_social_checkout:int_socialfeeds:bc_library:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.TIKTOK_SHOP] = [
    ...SocialConstants.CARTRIDGES.TIKTOK,
    ...SocialConstants.CARTRIDGES.CHECKOUT,
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE
].filter(item => !item.startsWith(bmFilter));

// int_tiktok:int_social_checkout:int_socialfeeds:bc_library:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.TIKTOK_ADS_SHOP] = [
    ...SocialConstants.CARTRIDGE_PATHS.TIKTOK_SHOP];

// int_tiktok:int_snapchat:int_google:int_social_checkout:int_socialfeeds:bc_library:int_social_base
SocialConstants.CARTRIDGE_PATHS[SocialConstants.SOCIAL_CHANNELS.ALL_CHANNELS] = [
    ...SocialConstants.CARTRIDGES.TIKTOK,
    ...SocialConstants.CARTRIDGES.SNAPCHAT,
    ...SocialConstants.CARTRIDGES.INSTAGRAM,
    ...SocialConstants.CARTRIDGES.GOOGLE,
    ...SocialConstants.CARTRIDGES.CHECKOUT,
    ...SocialConstants.CARTRIDGES.FEEDS,
    ...SocialConstants.CARTRIDGES.BASE
].filter(item => !item.startsWith(bmFilter));

module.exports = SocialConstants;
