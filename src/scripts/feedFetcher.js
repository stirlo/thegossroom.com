import Parser from 'rss-parser';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const parser = new Parser({
    timeout: 30000,
    customFields: {
        item: [
            ['media:content', 'media'],
            ['media:thumbnail', 'thumbnail'],
            ['enclosure', 'enclosure']
        ]
    }
});

const feeds = {
    celebrity: {
        primary: [
            {
                url: 'https://www.tmz.com/rss.xml',
                weight: 1.0,
                categories: ['hollywood', 'trending']
            },
            {
                url: 'http://syndication.eonline.com/syndication/feeds/rssfeeds/topstories.xml',
                weight: 0.9,
                categories: ['hollywood', 'entertainment']
            },
            {
                url: 'https://people.com/tag/celebrities/rss',
                weight: 0.9,
                categories: ['hollywood', 'lifestyle']
            }
        ],
        entertainment: [
            {
                url: 'http://feeds.feedburner.com/entertainmentweekly/latest',
                weight: 0.8,
                categories: ['movies', 'tv-shows']
            },
            {
                url: 'https://variety.com/v/feed/',
                weight: 0.9,
                categories: ['movies', 'tv-shows', 'streaming']
            },
            {
                url: 'https://www.hollywoodreporter.com/feed/',
                weight: 0.9,
                categories: ['movies', 'tv-shows', 'industry']
            }
        ],
        fashion: [
            {
                url: 'https://www.elle.com/rss/everything/',
                weight: 0.9,
                categories: ['style', 'beauty']
            },
            {
                url: 'https://www.vogue.com/rss/index.xml',
                weight: 1.0,
                categories: ['style', 'red-carpet']
            },
            {
                url: 'https://www.harpersbazaar.com/rss',
                weight: 0.8,
                categories: ['style', 'beauty']
            }
        ],
        lifestyle: [
            {
                url: 'https://www.gq.com/rss/all',
                weight: 0.8,
                categories: ['style', 'living']
            },
            {
                url: 'https://www.esquire.com/rss/',
                weight: 0.8,
                categories: ['living', 'style']
            }
        ],
        gossip: [
            {
                url: 'https://perezhilton.com/feed/',
                weight: 0.7,
                categories: ['hollywood', 'trending']
            },
            {
                url: 'https://www.usmagazine.com/celebrity-news/feed/',
                weight: 0.8,
                categories: ['hollywood', 'lifestyle']
            },
            {
                url: 'https://www.justjared.com/rss.xml',
                weight: 0.7,
                categories: ['hollywood', 'fashion']
            }
        ],
        international: [
            {
                url: 'https://www.dailymail.co.uk/articles.rss',
                weight: 0.7,
                categories: ['hollywood', 'trending']
            },
            {
                url: 'https://metro.co.uk/tag/showbiz/rss/',
                weight: 0.6,
                categories: ['hollywood', 'entertainment']
            },
            {
                url: 'https://www.hellomagazine.com/rss/showbiz.rss',
                weight: 0.7,
                categories: ['hollywood', 'royals']
            }
        ]
    }
};

class FeedFetcher {
    constructor() {
        this.cacheDir = path.join(process.cwd(), 'cache');
        this.outputDir = path.join(process.cwd(), 'dist', 'content');
    }

    async initialize() {
        await mkdir(this.cacheDir, { recursive: true });
        await mkdir(this.outputDir, { recursive: true });
    }

    async fetchFeed(feedConfig) {
        try {
            const feed = await parser.parseURL(feedConfig.url);
            return feed.items.map(item => ({
                ...item,
                weight: feedConfig.weight,
                categories: feedConfig.categories,
                source: feed.title || new URL(feedConfig.url).hostname
            }));
        } catch (error) {
            console.error(`Error fetching ${feedConfig.url}:`, error);
            return [];
        }
    }

    async fetchAllFeeds() {
        const allItems = [];

        for (const [section, categories] of Object.entries(feeds)) {
            for (const [category, feedsList] of Object.entries(categories)) {
                for (const feedConfig of feedsList) {
                    const items = await this.fetchFeed(feedConfig);
                    allItems.push(...items);
                }
            }
        }

        return allItems;
    }

    categorizeItems(items) {
        const categorized = {};

        items.forEach(item => {
            item.categories.forEach(category => {
                if (!categorized[category]) {
                    categorized[category] = [];
                }
                categorized[category].push(item);
            });
        });

        // Sort items in each category by date and weight
        Object.keys(categorized).forEach(category => {
            categorized[category].sort((a, b) => {
                const dateWeight = new Date(b.pubDate) - new Date(a.pubDate);
                if (dateWeight === 0) {
                    return b.weight - a.weight;
                }
                return dateWeight;
            });
        });

        return categorized;
    }

    async saveContent(categorizedItems) {
        for (const [category, items] of Object.entries(categorizedItems)) {
            const filePath = path.join(this.outputDir, `${category}.json`);
            await writeFile(filePath, JSON.stringify(items, null, 2));
        }
    }

    async run() {
        await this.initialize();
        console.log('Fetching feeds...');
        const items = await this.fetchAllFeeds();
        console.log(`Fetched ${items.length} items`);

        const categorized = this.categorizeItems(items);
        await this.saveContent(categorized);
        console.log('Content saved successfully');
    }
}

// Run the fetcher
const fetcher = new FeedFetcher();
fetcher.run().catch(console.error);

