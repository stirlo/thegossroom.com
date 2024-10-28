import FeedProcessor from './feed-processor.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({
    level: config.logging.level,
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

class FeedAggregator {
    constructor() {
        this.processor = new FeedProcessor();
        this.outputDir = path.join(config.build.outputDir, 'feeds');
    }

    async aggregate() {
        try {
            const feedSources = await this.loadFeedSources();
            const aggregatedFeeds = {};

            // Process each category
            for (const [category, sources] of Object.entries(feedSources.sources)) {
                aggregatedFeeds[category] = await this.aggregateCategory(category, sources);
            }

            await this.saveFeeds(aggregatedFeeds);
            return aggregatedFeeds;
        } catch (error) {
            logger.error('Feed aggregation failed:', error);
            throw error;
        }
    }

    async loadFeedSources() {
        const sourcePath = path.join(__dirname, '../config/feed_sources.json');
        return await fs.readJson(sourcePath);
    }

    async aggregateCategory(category, sources) {
        const categoryFeeds = {};

        for (const [subcategory, feeds] of Object.entries(sources)) {
            if (feeds.primary) {
                const items = await this.processFeeds(feeds.primary);
                categoryFeeds[subcategory] = {
                    name: subcategory,
                    items: this.sortAndDeduplicate(items)
                };
            }
        }

        return categoryFeeds;
    }

    async processFeeds(feeds) {
        const allItems = [];

        await Promise.all(feeds.map(async (feed) => {
            try {
                const processed = await this.processor.processFeed(feed);
                allItems.push(...processed.items);
            } catch (error) {
                logger.error(`Error processing feed ${feed.url}:`, error);
            }
        }));

        return allItems;
    }

    sortAndDeduplicate(items) {
        // Sort by date descending
        const sorted = items.sort((a, b) => 
            new Date(b.pubDate) - new Date(a.pubDate)
        );

        // Deduplicate based on URL
        const seen = new Set();
        return sorted.filter(item => {
            const duplicate = seen.has(item.link);
            seen.add(item.link);
            return !duplicate;
        });
    }

    async saveFeeds(aggregatedFeeds) {
        await fs.ensureDir(this.outputDir);

        // Save individual category feeds
        for (const [category, feeds] of Object.entries(aggregatedFeeds)) {
            await fs.writeJson(
                path.join(this.outputDir, `${category}.json`),
                feeds,
                { spaces: 2 }
            );
        }

        // Save combined feed
        await fs.writeJson(
            path.join(this.outputDir, 'all.json'),
            aggregatedFeeds,
            { spaces: 2 }
        );

        // Generate RSS feeds
        await this.generateRSSFeeds(aggregatedFeeds);
    }

    async generateRSSFeeds(aggregatedFeeds) {
        const Feed = (await import('feed')).default;

        for (const [category, feeds] of Object.entries(aggregatedFeeds)) {
            const feed = new Feed({
                title: `TheGossRoom - ${category}`,
                description: `Latest ${category} news and updates`,
                id: `https://thegossroom.com/feeds/${category}`,
                link: `https://thegossroom.com/feeds/${category}`,
                language: 'en',
                updated: new Date()
            });

            Object.values(feeds).forEach(subcategory => {
                subcategory.items.forEach(item => {
                    feed.addItem({
                        title: item.title,
                        id: item.link,
                        link: item.link,
                        description: item.content,
                        date: new Date(item.pubDate)
                    });
                });
            });

            await fs.writeFile(
                path.join(this.outputDir, `${category}.xml`),
                feed.rss2()
            );
        }
    }
}

export default FeedAggregator;

