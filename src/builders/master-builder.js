import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import pino from 'pino';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({
    level: config.logging.level,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

class MasterBuilder {
    constructor() {
        this.outputDir = config.build.outputDir;
        this.sourceDir = path.join(__dirname, '../../src');
    }

    async build() {
        try {
            logger.info('Starting build process...');

            await fs.ensureDir(this.outputDir);
            await this.cleanBuild();

            await Promise.all([
                this.buildContent(),
                this.buildAssets(),
                this.buildFeeds()
            ]);

            logger.info('Build completed successfully!');
        } catch (error) {
            logger.error('Build failed:', error);
            throw error;
        }
    }

    async cleanBuild() {
        logger.info('Cleaning previous build...');
        await fs.emptyDir(this.outputDir);
    }

    async buildContent() {
        logger.info('Building content...');
        const contentDir = path.join(this.sourceDir, 'content');
        await fs.copy(contentDir, this.outputDir);
    }

    async buildAssets() {
        logger.info('Building assets...');
        const assetsDir = path.join(this.sourceDir, 'assets');
        await fs.copy(assetsDir, path.join(this.outputDir, 'assets'));
    }

    async buildFeeds() {
        logger.info('Building feeds...');
        const feedsDir = path.join(this.sourceDir, 'content/feeds');
        if (await fs.pathExists(feedsDir)) {
            await fs.copy(feedsDir, path.join(this.outputDir, 'feeds'));
        }
    }

    watch() {
        const watchPaths = [
            path.join(this.sourceDir, 'content/**/*'),
            path.join(this.sourceDir, 'assets/**/*')
        ];

        const watcher = chokidar.watch(watchPaths, {
            ignored: /(^|[\/\\])\../,
            persistent: true
        });

        watcher
            .on('ready', () => logger.info('Initial scan complete. Ready for changes...'))
            .on('change', path => {
                logger.info(`File ${path} has been changed`);
                this.build();
            })
            .on('add', path => {
                logger.info(`File ${path} has been added`);
                this.build();
            })
            .on('unlink', path => {
                logger.info(`File ${path} has been removed`);
                this.build();
            });
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const shouldWatch = args.includes('--watch');

const builder = new MasterBuilder();
builder.build().then(() => {
    if (shouldWatch) {
        builder.watch();
    }
}).catch(error => {
    logger.error(error);
    process.exit(1);
});

export default MasterBuilder;

