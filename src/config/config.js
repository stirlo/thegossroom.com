import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const config = {
    env: process.env.NODE_ENV || 'development',
    server: {
        port: parseInt(process.env.PORT, 10) || 3000,
        host: process.env.HOST || 'localhost'
    },
    feed: {
        cacheDuration: parseInt(process.env.FEED_CACHE_DURATION, 10) || 1800,
        maxItems: parseInt(process.env.FEED_MAX_ITEMS, 10) || 50,
        concurrentRequests: parseInt(process.env.FEED_CONCURRENT_REQUESTS, 10) || 10
    },
    cache: {
        enabled: process.env.CACHE_ENABLED === 'true',
        directory: process.env.CACHE_DIRECTORY || path.join(__dirname, '../cache'),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE, 10) || 104857600
    },
    build: {
        outputDir: process.env.BUILD_OUTPUT_DIR || path.join(__dirname, '../../dist'),
        compressAssets: process.env.COMPRESS_ASSETS === 'true',
        minifyHtml: process.env.MINIFY_HTML === 'true'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'pretty'
    },
    paths: {
        content: process.env.CONTENT_DIR || path.join(__dirname, '../../content'),
        assets: process.env.ASSETS_DIR || path.join(__dirname, '../../public/assets')
    }
};

export default config;

