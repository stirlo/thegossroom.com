// feed-fetcher.js
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { gzip, ungzip } from 'zlib';
import { promisify } from 'util';
import EventEmitter from 'events';

const gzipAsync = promisify(gzip);
const ungzipAsync = promisify(ungzip);

class FeedFetcher extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.parser = new Parser({
            timeout: 10000,
            headers: {
                'User-Agent': 'TheGossRoom Feed Fetcher/1.0',
                'Accept': 'application/rss+xml, application/xml, application/atom+xml'
            },
            customFields: {
                item: [
                    ['media:content', 'media'],
                    ['content:encoded', 'contentEncoded'],
                    ['dc:creator', 'creator']
                ]
            }
        });

        this.cache = new Map();
        this.etags = new Map();
        this.lastModified = new Map();
    }

    async fetchFeed(source) {
        try {
            const cacheKey = this.getCacheKey(source.url);
            const cachedData = await this.getFromCache(cacheKey);

            if (cachedData && !this.isCacheExpired(cachedData)) {
                this.emit('cacheHit', source.url);
                return cachedData.data;
            }

            const fetchOptions = {
                headers: {
                    'If-None-Match': this.etags.get(source.url),
                    'If-Modified-Since': this.lastModified.get(source.url)
                }
            };

            const response = await fetch(source.url, fetchOptions);

            if (response.status === 304) {
                // Not modified, use cache
                this.emit('notModified', source.url);
                return cachedData.data;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Store new ETags and Last-Modified
            const etag = response.headers.get('etag');
            const lastMod = response.headers.get('last-modified');
            if (etag) this.etags.set(source.url, etag);
            if (lastMod) this.lastModified.set(source.url, lastMod);

            const feedText = await response.text();
            const feed = await this.parser.parseString(feedText);

            const processedFeed = await this.processFeed(feed, source);
            await this.saveToCache(cacheKey, processedFeed);

            this.emit('feedFetched', source.url);
            return processedFeed;

        } catch (error) {
            this.emit('error', { url: source.url, error: error.message });
            throw error;
        }
    }

    async processFeed(feed, source) {
        const processed = {
            title: feed.title,
            description: feed.description,
            link: feed.link,
            items: [],
            lastFetched: new Date().toISOString(),
            source: {
                name: source.name,
                priority: source.priority
            }
        };

        for (const item of feed.items) {
            if (this.shouldIncludeItem(item)) {
                processed.items.push({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate || item.isoDate,
                    content: item.contentEncoded || item.content,
                    creator: item.creator || item.author,
                    categories: item.categories || [],
                    media: this.extractMedia(item),
                    guid: item.guid || item.id || createHash('md5').update(item.link).digest('hex')
                });
            }
        }

        return processed;
    }

    shouldIncludeItem(item) {
        const { filters } = this.config;

        // Check word count
        const wordCount = (item.contentEncoded || item.content || '')
            .replace(/<[^>]*>/g, '')
            .split(/\s+/)
            .length;

        if (wordCount < filters.minWordCount) return false;

        // Check for excluded keywords
        const content = (item.title + ' ' + (item.contentEncoded || item.content || '')).toLowerCase();
        if (filters.excludeKeywords.some(keyword => content.includes(keyword.toLowerCase()))) {
            return false;
        }

        // Check for required image if enabled
        if (filters.requireImage && !this.extractMedia(item)) {
            return false;
        }

        return true;
    }

    extractMedia(item) {
        if (item.media) return item.media;

        // Extract first image from content if exists
        const imgMatch = (item.contentEncoded || item.content || '')
            .match(/<img[^>]+src="([^">]+)"/);
        return imgMatch ? { url: imgMatch[1] } : null;
    }

    async getFromCache(key) {
        try {
            const cacheFile = path.join(this.config.cacheDir, `${key}.gz`);
            if (await fs.access(cacheFile).then(() => true).catch(() => false)) {
                const compressed = await fs.readFile(cacheFile);
                const data = await ungzipAsync(compressed);
                return JSON.parse(data.toString());
            }
        } catch (error) {
            this.emit('cacheError', error);
        }
        return null;
    }

    async saveToCache(key, data) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            const compressed = await gzipAsync(Buffer.from(JSON.stringify(cacheData)));
            await fs.writeFile(
                path.join(this.config.cacheDir, `${key}.gz`),
                compressed
            );
        } catch (error) {
            this.emit('cacheError', error);
        }
    }

    isCacheExpired(cachedData) {
        const age = Date.now() - cachedData.timestamp;
        return age > this.config.defaultParams.cacheTime * 1000;
    }

    getCacheKey(url) {
        return createHash('md5').update(url).digest('hex');
    }

    async fetchAllSources() {
        const results = new Map();
        const sources = this.flattenSources(this.config.sources);

        // Create chunks of sources to fetch concurrently
        const chunks = this.chunkArray(sources, this.config.defaultParams.maxConcurrentRequests);

        for (const chunk of chunks) {
            const promises = chunk.map(source => 
                this.fetchFeed(source)
                    .then(feed => results.set(source.url, feed))
                    .catch(error => this.emit('error', { url: source.url, error }))
            );

            await Promise.allSettled(promises);
        }

        return results;
    }

    flattenSources(obj, prefix = '') {
        let sources = [];
        for (const [key, value] of Object.entries(obj)) {
            if (value.primary) {
                sources = sources.concat(value.primary.map(source => ({
                    ...source,
                    category: prefix ? `${prefix}.${key}` : key
                })));
            }
            if (typeof value === 'object' && !value.primary) {
                sources = sources.concat(this.flattenSources(value, prefix ? `${prefix}.${key}` : key));
            }
        }
        return sources;
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

export default FeedFetcher;

