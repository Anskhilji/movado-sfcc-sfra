'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

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
        const directoryPath = path.resolve('data/tiktok/tiktok_site/sites');
        const siteDirectories = fs.readdirSync(directoryPath).filter(file => fs.statSync(path.join(directoryPath, file)).isDirectory());
        if (siteDirectories.length === 1) {
            const oldSiteId = siteDirectories[0];
            if (oldSiteId === siteId) {
                console.log(`Directory is already named renamed "${siteId}", no update required.`);
            } else {
                const currentPath = path.resolve(`${directoryPath}/${oldSiteId}`);
                const newPath = path.resolve(`${directoryPath}/${siteId}`);
                fs.renameSync(currentPath, newPath);
                console.log(`Successfully renamed "${oldSiteId}" directory to "${siteId}".`);
            }
        }
    } catch (err) {
        console.log(err);
    }
})();
