'use strict';

const helper = require('./helper');
const installDirectories = [
    'social_channels',
    'social_checkout',
    'social_feeds'
];

(() => {
    installDirectories.forEach((cartridge) => {
        helper.npmInstall(cartridge);
    });
})();
