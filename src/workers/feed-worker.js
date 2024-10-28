// src/workers/feed-worker.js
import workerpool from 'workerpool';
import FeedFetcher from '../services/feed-fetcher.js';
import pino from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

async function processFeedChunk(sources, config) {
    const fetcher = new FeedFetcher(config);
    const results = [];

    fetcher.on('error', ({ url, error }) => {
        logger.error(`Error fetching ${url}:`, error);
    });

    fetcher.on('feedFetched', (url) => {
        logger.info(`Successfully fetched: ${url}`);
    });

    for (const source of sources) {
        try {
            const feed = await fetcher.fetchFeed(source);
            results.push({
                source: source.url,
                category: source.category,
                items: feed.items.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`Failed to process ${source.url}:`, error);
        }
    }

    return results;
}

// Create worker
workerpool.worker({
    processFeedChunk: processFeedChunk
});

