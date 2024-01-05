'use strict';

const inquirer = require('inquirer');

const { renameSiteDirectories } = require('../../features/social_integrations/utils/featureHelpers');

const required = (msg) => {
    return (v) => {
        if (!v || v.length === 0) {
            return msg;
        }
        return true;
    };
};

const questions = {
    SITE_ID: {
        name: 'siteId',
        message: 'What is your Site ID?',
        filter: (v) => v.replace(/\s/g, ''),
        validate: required('Please specify your site ID')
    }
};

(async () => {
    try {
        const answers = await inquirer.prompt([questions.SITE_ID], {});
        const siteId = answers.siteId || 'RefArch';
        renameSiteDirectories(siteId, { logger: console });
    } catch (err) {
        console.log(err);
    }
})();
