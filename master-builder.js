// master-builder.js
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import sass from 'sass';
import { Terser } from 'terser';
import sharp from 'sharp';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yaml from 'js-yaml';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminMozjpeg from 'imagemin-mozjpeg';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Feed } from 'feed';
import { createGzip } from 'zlib';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MasterBuilder {
    constructor() {
        this.config = {
            srcDir: path.join(__dirname, 'src'),
            distDir: path.join(__dirname, 'dist'),
            cacheDir: path.join(__dirname, 'cache'),
            configDir: path.join(__dirname, 'config'),
            tempDir: path.join(__dirname, 'temp'),
            siteUrl: 'https://thegossroom.com',
            siteName: 'The Goss Room',
            siteDescription: 'Your source for news, technology, and culture'
        };

        this.topicsFile = path.join(this.config.configDir, 'master_topics.json');
        this.sectionTree = {};
        this.templates = new Map();
        this.imageCache = new Map();
        this.feedCache = new Map();
    }

    async initialize() {
        console.log(chalk.blue('🚀 Initializing Master Builder...'));

        // Load master topics
        await this.loadTopics();

        // Load templates
        await this.loadTemplates();

        // Initialize caches
        await this.initializeCaches();

        // Setup watchers
        if (process.env.NODE_ENV === 'development') {
            this.setupWatchers();
        }
    }

    async loadTopics() {
        try {
            const topicsData = await fs.readFile(this.topicsFile, 'utf-8');
            const topics = JSON.parse(topicsData);
            this.sectionTree = topics.sectionTree;
            this.metadata = topics.metadata;
            console.log(chalk.green('✓ Topics loaded successfully'));
        } catch (error) {
            console.error(chalk.red('✗ Failed to load topics:'), error);
            process.exit(1);
        }
    }

    async loadTemplates() {
        const templateDir = path.join(this.config.srcDir, 'templates');
        const templateFiles = await glob('**/*.{html,hbs}', { cwd: templateDir });

        for (const file of templateFiles) {
            const templateName = path.basename(file, path.extname(file));
            const templateContent = await fs.readFile(path.join(templateDir, file), 'utf-8');
            this.templates.set(templateName, templateContent);
        }
        console.log(chalk.green(`✓ Loaded ${this.templates.size} templates`));
    }

    async initializeCaches() {
        await fs.ensureDir(this.config.cacheDir);
        await fs.ensureDir(this.config.tempDir);

        // Load image cache
        const imageCacheFile = path.join(this.config.cacheDir, 'image-cache.json');
        if (await fs.pathExists(imageCacheFile)) {
            const cacheData = await fs.readFile(imageCacheFile, 'utf-8');
            this.imageCache = new Map(JSON.parse(cacheData));
        }
    }

    setupWatchers() {
        // Watch for topic changes
        chokidar.watch(this.topicsFile)
            .on('change', () => this.loadTopics());

        // Watch templates
        chokidar.watch(path.join(this.config.srcDir, 'templates'))
            .on('change', () => this.loadTemplates());

        console.log(chalk.blue('👀 File watchers initialized'));
    }

    async build() {
        try {
            console.log(chalk.blue('🏗️  Starting build process...'));

            await this.initialize();
            await this.cleanDist();
            await this.createDirectoryStructure();

            // Parallel processing
            await Promise.all([
                this.processStyles(),
                this.processScripts(),
                this.processImages(),
                this.processContent(),
                this.generateFeeds(),
                this.generateSitemaps()
            ]);

            await this.generateIndexPages();
            await this.saveCaches();

            console.log(chalk.green('✨ Build completed successfully!'));
        } catch (error) {
            console.error(chalk.red('❌ Build failed:'), error);
            process.exit(1);
        }
    }

    async cleanDist() {
        console.log(chalk.yellow('🧹 Cleaning dist directory...'));
        await fs.remove(this.config.distDir);
        await fs.ensureDir(this.config.distDir);
    }

    async createDirectoryStructure() {
        console.log(chalk.yellow('📁 Creating directory structure...'));

        const createDirs = async (obj, currentPath = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const dirPath = path.join(this.config.distDir, currentPath, key);
                await fs.ensureDir(dirPath);

                // Create standard subdirectories
                const subDirs = ['styles', 'scripts', 'images', 'data'];
                for (const dir of subDirs) {
                    await fs.ensureDir(path.join(dirPath, dir));
                }

                if (Object.keys(value).length > 0) {
                    await createDirs(value, path.join(currentPath, key));
                }
            }
        };

        await createDirs(this.sectionTree);

        // Create asset directories
        const assetDirs = ['css', 'js', 'images', 'feeds', 'assets'];
        for (const dir of assetDirs) {
            await fs.ensureDir(path.join(this.config.distDir, dir));
        }
    }
    async processStyles() {
        console.log(chalk.yellow('🎨 Processing styles...'));

        // Process global styles
        const globalResult = await sass.compileAsync(
            path.join(this.config.srcDir, 'styles/global.scss'),
            {
                style: 'compressed',
                sourceMap: process.env.NODE_ENV === 'development'
            }
        );
        await fs.writeFile(
            path.join(this.config.distDir, 'css/global.css'),
            globalResult.css
        );

        // Process section-specific styles
        const processSectionStyles = async (obj, currentPath = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const sectionPath = path.join(currentPath, key);
                const styleFile = path.join(this.config.srcDir, 'styles', `${sectionPath}.scss`);

                if (await fs.pathExists(styleFile)) {
                    const result = await sass.compileAsync(styleFile, {
                        style: 'compressed',
                        sourceMap: process.env.NODE_ENV === 'development'
                    });
                    await fs.writeFile(
                        path.join(this.config.distDir, sectionPath, 'styles/section.css'),
                        result.css
                    );
                }

                if (Object.keys(value).length > 0) {
                    await processSectionStyles(value, sectionPath);
                }
            }
        };

        await processSectionStyles(this.sectionTree);
    }

    async processScripts() {
        console.log(chalk.yellow('📜 Processing scripts...'));

        // Process global scripts
        const globalScripts = await glob('*.js', {
            cwd: path.join(this.config.srcDir, 'scripts/global')
        });

        for (const script of globalScripts) {
            const source = await fs.readFile(
                path.join(this.config.srcDir, 'scripts/global', script),
                'utf-8'
            );
            const minified = await Terser.minify(source, {
                compress: true,
                mangle: true,
                sourceMap: process.env.NODE_ENV === 'development'
            });
            await fs.writeFile(
                path.join(this.config.distDir, 'js', script),
                minified.code
            );
        }

        // Process section-specific scripts
        const processSectionScripts = async (obj, currentPath = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const sectionPath = path.join(currentPath, key);
                const scriptFile = path.join(this.config.srcDir, 'scripts/sections', `${sectionPath}.js`);

                if (await fs.pathExists(scriptFile)) {
                    const source = await fs.readFile(scriptFile, 'utf-8');
                    const minified = await Terser.minify(source, {
                        compress: true,
                        mangle: true,
                        sourceMap: process.env.NODE_ENV === 'development'
                    });
                    await fs.writeFile(
                        path.join(this.config.distDir, sectionPath, 'scripts/section.js'),
                        minified.code
                    );
                }

                if (Object.keys(value).length > 0) {
                    await processSectionScripts(value, sectionPath);
                }
            }
        };

        await processSectionScripts(this.sectionTree);
    }

    async processImages() {
        console.log(chalk.yellow('🖼️  Processing images...'));

        const processImage = async (imagePath, targetPath) => {
            const imageHash = await this.getFileHash(imagePath);
            const cacheKey = `${imagePath}:${imageHash}`;

            if (!this.imageCache.has(cacheKey)) {
                const image = sharp(imagePath);
                const metadata = await image.metadata();

                // Generate responsive sizes
                const sizes = [320, 640, 1024, 1920];
                const formats = ['webp', 'jpg'];

                const outputs = await Promise.all(
                    sizes.flatMap(size => formats.map(async format => {
                        const resized = image.resize(size, null, {
                            withoutEnlargement: true,
                            fit: 'inside'
                        });

                        const outputPath = path.join(
                            path.dirname(targetPath),
                            `${path.basename(targetPath, path.extname(targetPath))}-${size}.${format}`
                        );

                        if (format === 'webp') {
                            await resized.webp({ quality: 80 }).toFile(outputPath);
                        } else {
                            await resized.jpeg({ quality: 80 }).toFile(outputPath);
                        }

                        return {
                            size,
                            format,
                            path: path.relative(this.config.distDir, outputPath)
                        };
                    }))
                );

                this.imageCache.set(cacheKey, outputs);
            }

            return this.imageCache.get(cacheKey);
        };

        // Process all images
        const imageFiles = await glob('**/*.{jpg,jpeg,png}', {
            cwd: path.join(this.config.srcDir, 'images')
        });

        for (const imageFile of imageFiles) {
            const sourcePath = path.join(this.config.srcDir, 'images', imageFile);
            const targetPath = path.join(this.config.distDir, 'images', imageFile);
            await fs.ensureDir(path.dirname(targetPath));
            await processImage(sourcePath, targetPath);
        }
    }

    async generateFeeds() {
        console.log(chalk.yellow('📡 Generating feeds...'));

        const generateSectionFeed = async (sectionPath, content) => {
            const feed = new Feed({
                title: `${this.config.siteName} - ${this.formatTitle(sectionPath)}`,
                description: `Latest updates from ${this.formatTitle(sectionPath)}`,
                id: `${this.config.siteUrl}/${sectionPath}`,
                link: `${this.config.siteUrl}/${sectionPath}`,
                language: 'en',
                image: `${this.config.siteUrl}/images/logo.png`,
                favicon: `${this.config.siteUrl}/favicon.ico`,
                copyright: `All rights reserved ${new Date().getFullYear()}, ${this.config.siteName}`,
                updated: new Date(),
                generator: 'Master Builder',
                feedLinks: {
                    json: `${this.config.siteUrl}/${sectionPath}/feed.json`,
                    atom: `${this.config.siteUrl}/${sectionPath}/feed.atom`,
                    rss: `${this.config.siteUrl}/${sectionPath}/feed.xml`
                }
            });

            // Add items to feed
            content.forEach(item => {
                feed.addItem({
                    title: item.title,
                    id: item.url,
                    link: item.url,
                    description: item.description,
                    content: item.content,
                    author: item.author,
                    date: new Date(item.date)
                });
            });

            // Save feeds in different formats
            const feedsDir = path.join(this.config.distDir, sectionPath, 'feeds');
            await fs.ensureDir(feedsDir);

            await Promise.all([
                fs.writeFile(path.join(feedsDir, 'feed.xml'), feed.rss2()),
                fs.writeFile(path.join(feedsDir, 'feed.atom'), feed.atom1()),
                fs.writeFile(path.join(feedsDir, 'feed.json'), feed.json1())
            ]);
        };

        const processSectionFeeds = async (obj, currentPath = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const sectionPath = path.join(currentPath, key);
                const contentFile = path.join(this.config.cacheDir, 'content', `${sectionPath}.json`);

                if (await fs.pathExists(contentFile)) {
                    const content = JSON.parse(await fs.readFile(contentFile, 'utf-8'));
                    await generateSectionFeed(sectionPath, content);
                }

                if (Object.keys(value).length > 0) {
                    await processSectionFeeds(value, sectionPath);
                }
            }
        };

        await processSectionFeeds(this.sectionTree);
    }

    async generateSitemaps() {
        console.log(chalk.yellow('🗺️  Generating sitemaps...'));

        const smStream = new SitemapStream({
            hostname: this.config.siteUrl
        });
        const pipeline = smStream.pipe(createGzip());

        // Add URLs to sitemap
        const addUrlsToSitemap = async (obj, currentPath = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const sectionPath = path.join(currentPath, key);
                smStream.write({
                    url: `/${sectionPath}`,
                    changefreq: 'daily',
                    priority: currentPath ? 0.7 : 0.9
                });

                if (Object.keys(value).length > 0) {
                    await addUrlsToSitemap(value, sectionPath);
                }
            }
        };

        await addUrlsToSitemap(this.sectionTree);
        smStream.end();

        const sitemap = await streamToPromise(pipeline);
        await fs.writeFile(
            path.join(this.config.distDir, 'sitemap.xml.gz'),
            sitemap
        );
    }

    async saveCaches() {
        // Save image cache
        await fs.writeFile(
            path.join(this.config.cacheDir, 'image-cache.json'),
            JSON.stringify([...this.imageCache])
        );
    }

    formatTitle(sectionPath) {
        return sectionPath
            .split('/')
            .map(part => part
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            )
            .join(' › ');
    }

    async getFileHash(filePath) {
        const crypto = await import('crypto');
        const fileBuffer = await fs.readFile(filePath);
        return crypto.createHash('md5').update(fileBuffer).digest('hex');
    }
}

// Export the builder
export default MasterBuilder;

// Create and run builder if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    const builder = new MasterBuilder();
    builder.build().catch(console.error);
}

