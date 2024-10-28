// feed-processor.js
const Parser = require('rss-parser');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { sectionConfig } = require('./section-config');

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media'],
            ['media:thumbnail', 'thumbnail'],
            ['enclosure', 'enclosure']
        ]
    }
});

class FeedProcessor {
    constructor() {
        this.feedCache = new Map();
        this.processedItems = new Set();
    }

    async processFeedsForSection(section) {
        const config = sectionConfig[section];
        if (!config) throw new Error(`Section ${section} not found`);

        console.log(`Processing feeds for ${config.title}...`);

        const results = [];
        for (const feedUrl of config.feeds) {
            try {
                const feed = await this.processFeed(feedUrl, section);
                if (feed) results.push(feed);
            } catch (error) {
                console.error(`Error processing feed ${feedUrl}:`, error);
            }
        }

        // Save processed feeds
        await this.saveFeedResults(section, results);
        return results;
    }

    async processFeed(feedUrl, section) {
        try {
            const response = await fetch(feedUrl);
            const feedText = await response.text();
            const feed = await parser.parseString(feedText);

            return {
                title: feed.title,
                description: feed.description,
                lastUpdated: new Date().toISOString(),
                section: section,
                items: feed.items.map(item => this.processItem(item, section))
                    .filter(item => item !== null)
            };
        } catch (error) {
            console.error(`Error processing ${feedUrl}:`, error);
            return null;
        }
    }

    processItem(item, section) {
        const itemId = this.generateItemId(item);
        if (this.processedItems.has(itemId)) return null;

        this.processedItems.add(itemId);

        return {
            id: itemId,
            title: item.title,
            description: item.contentSnippet || item.description,
            link: item.link,
            pubDate: item.pubDate || item.isoDate,
            section: section,
            image: this.extractImage(item),
            topics: this.assignTopics(item, section),
            source: this.extractSource(item)
        };
    }

    generateItemId(item) {
        return Buffer.from(item.link || item.title).toString('base64');
    }

    extractImage(item) {
        if (item.media?.$.url) return item.media.$.url;
        if (item.thumbnail?.$.url) return item.thumbnail.$.url;
        if (item.enclosure?.url) return item.enclosure.url;

        // Extract first image from content if exists
        const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
        return imgMatch ? imgMatch[1] : '/assets/images/default-article.jpg';
    }

    assignTopics(item, section) {
        const topics = sectionConfig[section].topics;
        return topics.filter(topic => 
            item.title?.toLowerCase().includes(topic.toLowerCase()) ||
            item.description?.toLowerCase().includes(topic.toLowerCase())
        );
    }

    extractSource(item) {
        const hostname = new URL(item.link).hostname;
        return hostname.replace('www.', '').split('.')[0];
    }

    async saveFeedResults(section, results) {
        const outputDir = path.join('dist', section, 'feeds');
        await fs.mkdir(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, 'processed-feeds.json');
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));

        // Save individual items for easier access
        const itemsDir = path.join(outputDir, 'items');
        await fs.mkdir(itemsDir, { recursive: true });

        for (const feed of results) {
            for (const item of feed.items) {
                const itemPath = path.join(itemsDir, `${item.id}.json`);
                await fs.writeFile(itemPath, JSON.stringify(item, null, 2));
            }
        }
    }
}

module.exports = FeedProcessor;

