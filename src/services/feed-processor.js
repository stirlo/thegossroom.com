import { Parser } from 'rss-parser';
import fetch from 'node-fetch';
import pino from 'pino';
import config from '../config/config.js';

const logger = pino({
    level: config.logging.level,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

class FeedProcessor {
    constructor() {
        this.parser = new Parser({
            customFields: {
                item: [
                    ['media:content', 'media'],
                    ['content:encoded', 'contentEncoded'],
                    ['dc:creator', 'creator']
                ]
            }
        });
        this.cache = new Map();
    }

    async processFeed(feedConfig) {
        try {
            const feed = await this.fetchFeed(feedConfig.url);
            const processedItems = await this.processItems(feed.items, feedConfig);
            return this.formatOutput(processedItems, feedConfig);
        } catch (error) {
            logger.error(`Error processing feed ${feedConfig.url}: ${error.message}`);
            throw error;
        }
    }

    async fetchFeed(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TheGossRoom Feed Fetcher/1.0'
                }
            });
            const feedText = await response.text();
            return await this.parser.parseString(feedText);
        } catch (error) {
            logger.error(`Error fetching feed ${url}: ${error.message}`);
            throw error;
        }
    }

    async processItems(items, feedConfig) {
        return items
            .slice(0, config.feed.maxItems)
            .map(item => this.processItem(item, feedConfig))
            .filter(Boolean);
    }

    processItem(item, feedConfig) {
        // Basic item processing
        const processed = {
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate),
            content: item.contentEncoded || item.content,
            creator: item.creator || item.author,
            categories: item.categories || [],
            media: this.extractMedia(item)
        };

        // Apply feed-specific processing
        if (feedConfig.processor) {
            return feedConfig.processor(processed);
        }

        return processed;
    }

    extractMedia(item) {
        const media = [];

        if (item.media) {
            media.push({
                url: item.media.$ ? item.media.$.url : item.media,
                type: item.media.$ ? item.media.$.type : 'image/jpeg',
                width: item.media.$ ? parseInt(item.media.$.width, 10) : null,
                height: item.media.$ ? parseInt(item.media.$.height, 10) : null
            });
        }

        // Extract images from content if available
        if (item.content) {
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while ((match = imgRegex.exec(item.content)) !== null) {
                media.push({
                    url: match[1],
                    type: 'image/jpeg'
                });
            }
        }

        return media;
    }

    formatOutput(items, feedConfig) {
        return {
            feedName: feedConfig.name,
            feedUrl: feedConfig.url,
            items: items,
            timestamp: new Date().toISOString(),
            category: feedConfig.category
        };
    }
}

export default FeedProcessor;

