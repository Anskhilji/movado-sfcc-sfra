'use strict';

const { expect } = require('chai');

const Assert = require('chai').assert;
const Proxy = require('proxyquire').noCallThru().noPreserveCache();

describe('InstagramConstants', function () {

    const InstagramConstants = Proxy('../../../../social_channels/cartridges/int_instagram/cartridge/scripts/InstagramConstants.js', {
    });

    it('It should get SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION', function () {
        Assert.equal(InstagramConstants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, 'SocialChannels');
    });

    it('It should get SOCIAL_CHANNEL_CUSTOM_OBJECT_FEED_CONFIG', function () {
        Assert.equal(InstagramConstants.SOCIAL_CHANNEL_CUSTOM_OBJECT_FEED_CONFIG, 'SalesChannelFeedConfig');
    });

    it('It should get INSTAGRAM_CUSTOM_OBJECT_ID', function () {
        Assert.equal(InstagramConstants.INSTAGRAM_CUSTOM_OBJECT_ID, 'instagram-settings');
    });

    it('It should get LOGGER_NAME', function () {
        Assert.equal(InstagramConstants.LOGGER_NAME, 'instagram');
    });

    it('It should get API_VERSION', function () {
        Assert.equal(InstagramConstants.API_VERSION, 'v17.0');
    });

    it('It should get APP_IDS', function () {
        var expectResult = {
            PROD: "414303402113306",
            TEST: "629918388687475"
        } 
       expect(InstagramConstants.APP_IDS).to.deep.equal(expectResult)
    });

    it('It should get ENDPOINTS', function () {
        var expectResult = {
            MBE_INSTALLS: '/fbe_business/fbe_installs',
            SYSTEM_USER_TOKEN: '/access_token'
        }
        expect(InstagramConstants.ENDPOINTS).to.deep.equal(expectResult)
    });

    it('It should get SERVICES', function () {
        var expectResult = {
            INSTAGRAM: {
                BASE: 'facebook.graph'
            }
        }
        expect(InstagramConstants.SERVICES).to.deep.equal(expectResult)
    });

    it('It should get SERVICE_RETRY_COUNT', function () {
        Assert.equal(InstagramConstants.SERVICE_RETRY_COUNT, 3);
    });
});