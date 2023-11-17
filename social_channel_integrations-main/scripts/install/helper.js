'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

/**
 * Runs 'npm install'
 * @param {string} directory - the directory to run npm install
 */
function npmInstall(directory) {
    console.log(`running npm install in "${directory}"`);
    const hasPackageJson = fs.existsSync(path.resolve(directory, 'package.json'));

    // Abort if there's no 'package.json' in this folder
    if (!hasPackageJson) {
        console.warn(`no package.json found in ${directory}`);
        return;
    }

    if (hasPackageJson) {
        childProcess.execSync(
            'npm install',
            {
                cwd: directory,
                env: process.env,
                stdio: 'inherit',
                windowsHide: true
            }
        );
    }
}

module.exports = {
    npmInstall: npmInstall
};
