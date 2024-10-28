// master-builder.js
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { sectionConfig } = require('./section-config');
const FeedProcessor = require('./feed-processor');
const TopicGenerator = require('./topic-generator');

async function buildSite() {
    try {
        console.log('🏗️ Starting build process...');

        // Create dist directory if it doesn't exist
        await fs.mkdir('dist', { recursive: true });

        // Clean existing dist directory
        await cleanDist();

        // Build core assets
        console.log('📦 Building assets...');
        await execAsync('node asset-builder.js');

        // Build sections and their content
        console.log('🏗️ Building sections...');
        await buildSections();

        // Process feeds and generate topics
        console.log('📰 Processing feeds and generating topics...');
        await buildContent();

        // Copy shared resources
        console.log('📋 Copying shared resources...');
        await copySharedResources();

        console.log('✅ Build completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

async function cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    try {
        await fs.rm('dist', { recursive: true, force: true });
        await fs.mkdir('dist', { recursive: true });
    } catch (error) {
        console.error('Error cleaning dist directory:', error);
        throw error;
    }
}

async function buildSections() {
    for (const [sectionName, sectionData] of Object.entries(sectionConfig)) {
        console.log(`📁 Building section: ${sectionData.title}`);
        const sectionPath = path.join('dist', sectionName);

        // Create section directory
        await fs.mkdir(sectionPath, { recursive: true });

        // Create subdirectories
        const dirs = ['topics', 'feeds', 'assets', 'templates'];
        for (const dir of dirs) {
            await fs.mkdir(path.join(sectionPath, dir), { recursive: true });
        }
    }
}

async function buildContent() {
    const feedProcessor = new FeedProcessor();
    const topicGenerator = new TopicGenerator();

    for (const section of Object.keys(sectionConfig)) {
        console.log(`📑 Processing content for ${section}...`);
        try {
            await Promise.all([
                feedProcessor.processFeedsForSection(section),
                topicGenerator.generateTopicsForSection(section)
            ]);
        } catch (error) {
            console.error(`Error processing content for ${section}:`, error);
        }
    }
}

async function copySharedResources() {
    const sharedDir = path.join('dist', 'shared');
    await fs.mkdir(sharedDir, { recursive: true });

    // Copy shared assets
    const sharedFiles = [
        'global.css',
        'global.js',
        'topic.css',
        'topic.js',
        'nav-tree.js'
    ];

    for (const file of sharedFiles) {
        try {
            await fs.copyFile(
                path.join('src', 'shared', file),
                path.join(sharedDir, file)
            );
        } catch (error) {
            console.warn(`Warning: Could not copy ${file}. File may not exist.`);
        }
    }
}

// Run the builder
if (require.main === module) {
    buildSite().catch(console.error);
}

module.exports = {
    buildSite
};

