/* eslint no-console: 0 */
/* global cp, mkdir */

/**
 * Copies fonts and flags to static directory
 */

var chalk = require('chalk');

module.exports = function (ignorePath, src, args) {
    console.log('Copying fonts from ' + src);
    var fontsDestDir = args.dest + '/fonts';

    mkdir('-p', fontsDestDir);
    console.log(chalk.green('Created fonts directory: ' + fontsDestDir));

    cp('-r', src, args.dest);
    console.log(chalk.green('Copied fonts to ' + args.dest));

    if (args.flags) {
        cp('-r', args.flags, fontsDestDir + '/flags');
        console.log(chalk.green('Copied flags to ' + fontsDestDir + '/flags'));
    }
};
