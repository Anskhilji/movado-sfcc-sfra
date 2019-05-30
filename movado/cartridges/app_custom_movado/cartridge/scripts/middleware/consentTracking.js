'use strict';

/**
 * Middleware to use consent tracking check
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function consent(req, res, next) {
    res.setViewData({
        tracking_consent: req.session.privacyCache.get('consent')
    });
    next();
}

module.exports = {
    consent: consent
};
