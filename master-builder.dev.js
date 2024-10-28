// master-builder.dev.js
const { exec } = require('child_process');
const util = require('util');
const chalk = require('chalk');
const execAsync = util.promisify(exec);

const log = {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✓'), msg),
    warning: (msg) => console.log(chalk.yellow('⚠'), msg),
    error: (msg) => console.log(chalk.red('✖'), msg)
};

async function buildSite() {
    try {
        log.info('Starting build process...');

        // Clean dist directory
        log.info('Cleaning dist directory...');
        await execAsync('npm run clean');

        // Generate site structure
        log.info('Generating folder structure...');
        await execAsync('node enhanced-site-generator.js');

        // Build assets
        log.info('Building assets...');
        await execAsync('node asset-builder.js');

        // Populate content
        log.info('Populating content...');
        await execAsync('node content-populator.js');

        log.success('Build completed successfully!');
    } catch (error) {
        log.error('Build failed:');
        console.error(error);
        process.exit(1);
    }
}

// Watch mode
if (process.argv.includes('--watch')) {
    const nodemon = require('nodemon');

    nodemon({
        script: 'master-builder.dev.js',
        ext: 'js,json,html,css,scss',
        watch: ['src', '*.js'],
        ignore: ['dist/*'],
        env: { 'NODE_ENV': 'development' }
    });

    nodemon.on('start', () => {
        log.info('Starting build...');
    }).on('restart', (files) => {
        log.info('Files changed, rebuilding...');
        console.log(chalk.gray('Changed files:', files));
    }).on('quit', () => {
        log.info('Build process terminated');
        process.exit();
    });
} else {
    buildSite();
}

