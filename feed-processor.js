import fetch from 'node-fetch';
import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sectionConfig } from './section-config.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class FeedProcessor {
    constructor() {
        this.parser = new Parser({
            customFields: {
                item: [
                    ['media:content', 'media'],
                    ['media:thumbnail', 'thumbnail'],
                    ['description', 'description'],
                    ['content:encoded', 'contentEncoded']
                ]
            }
        });
        this.feedCache = new Map();
    }

    async processFeedsForSection(section) {
        console.log(chalk.blue(`Processing feeds for section: ${section}`));
        const sectionData = sectionConfig[section];

        if (!sectionData || !sectionData.feeds) {
            console.warn(chalk.yellow(`No feeds defined for section: ${section}`));
            return;
        }

        const outputDir = path.join('dist', section, 'feeds');
        await fs.mkdir(outputDir, { recursive: true });

        const processedFeeds = [];
        for (const feed of sectionData.feeds) {
            try {
                const processedFeed = await this.processFeed(feed, section);
                processedFeeds.push(processedFeed);
            } catch (error) {
                console.error(chalk.red(`Error processing feed ${feed.url}:`), error);
            }
        }

        // Save processed feeds index
        await this.saveProcessedFeeds(processedFeeds, outputDir);
    }

    async processFeed(feed, section) {
        console.log(chalk.blue(`Fetching feed: ${feed.url}`));

        try {
            const response = await fetch(feed.url);
            const xml = await response.text();
            const parsedFeed = await this.parser.parseString(xml);

            const processedItems = await Promise.all(
                parsedFeed.items.map(item => this.processItem(item, feed, section))
            );

            return {
                title: parsedFeed.title,
                description: parsedFeed.description,
                link: parsedFeed.link,
                items: processedItems,
                source: feed.name,
                section: section
            };
        } catch (error) {
            console.error(chalk.red(`Error processing feed ${feed.url}:`), error);
            return null;
        }
    }

    async processItem(item, feed, section) {
        const processedItem = {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            guid: item.guid || item.link,
            source: feed.name,
            section: section
        };

        // Process content
        processedItem.content = this.processContent(item);

        // Process image
        processedItem.image = await this.processImage(item, feed);

        // Process categories/tags
        processedItem.categories = this.processCategories(item);

        return processedItem;
    }

    processContent(item) {
        // Prefer content:encoded over description
        let content = item.contentEncoded || item.description || '';

        // Clean up HTML
        content = this.cleanHtml(content);

        // Truncate if needed
        const maxLength = 1000;
        if (content.length > maxLength) {
            content = content.substring(0, maxLength) + '...';
        }

        return content;
    }

    async processImage(item, feed) {
        let imageUrl = null;

        // Try different possible image sources
        if (item.media && item.media.$ && item.media.$.url) {
            imageUrl = item.media.$.url;
        } else if (item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url) {
            imageUrl = item.thumbnail.$.url;
        } else if (item.enclosure && item.enclosure.url) {
            imageUrl = item.enclosure.url;
        }

        // If no image found, use feed default
        if (!imageUrl && feed.defaultImage) {
            imageUrl = feed.defaultImage;
        }

        // Download and process image if found
        if (imageUrl) {
            try {
                const response = await fetch(imageUrl);
                const buffer = await response.buffer();

                // Save image and return local path
                const imageName = `${Date.now()}-${path.basename(imageUrl)}`;
                const imagePath = path.join('dist', 'assets', 'images', imageName);
                await fs.writeFile(imagePath, buffer);

                return `/assets/images/${imageName}`;
            } catch (error) {
                console.error(chalk.red(`Error processing image ${imageUrl}:`), error);
            }
        }

        return '/assets/images/default-article.jpg';
    }

    processCategories(item) {
        const categories = new Set();

        // Add explicit categories
        if (Array.isArray(item.categories)) {
            item.categories.forEach(category => {
                categories.add(category.toLowerCase());
            });
        }

        // Extract keywords from content
        const keywords = this.extractKeywords(item.title + ' ' + (item.description || ''));
        keywords.forEach(keyword => categories.add(keyword));

        return Array.from(categories);
    }

    extractKeywords(text) {
        // Simple keyword extraction
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !this.isStopWord(word));

        return Array.from(new Set(words));
    }

    isStopWord(word) {
        const stopWords = new Set(['the', 'and', 'for', 'that', 'this', 'with']);
        return stopWords.has(word);
    }

    cleanHtml(html) {
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async saveProcessedFeeds(feeds, outputDir) {
        const outputPath = path.join(outputDir, 'processed-feeds.json');
        await fs.writeFile(outputPath, JSON.stringify(feeds, null, 2));
    }
}
