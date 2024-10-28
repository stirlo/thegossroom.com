// section-config.js
const sectionConfig = {
    celebrities: {
        title: "Celebrities",
        topics: [
            "Hollywood",
            "Music Stars",
            "TV Personalities",
            "Royal Family",
            "Athletes",
            "Social Media Stars"
        ],
        feeds: [
            "https://www.tmz.com/rss",
            "https://pagesix.com/feed",
            "https://people.com/feed",
            "https://www.eonline.com/news/rss",
            "https://www.justjared.com/feed"
        ]
    },
    entertainment: {
        title: "Entertainment",
        topics: [
            "Movies",
            "Television",
            "Music",
            "Streaming",
            "Awards Shows",
            "Theater"
        ],
        feeds: [
            "https://variety.com/feed",
            "https://deadline.com/feed",
            "https://www.hollywoodreporter.com/feed",
            "https://www.billboard.com/feed",
            "https://www.metacritic.com/rss"
        ]
    },
    fashion: {
        title: "Fashion",
        topics: [
            "Designer Brands",
            "Street Style",
            "Red Carpet",
            "Fashion Week",
            "Trends",
            "Beauty"
        ],
        feeds: [
            "https://www.vogue.com/feed",
            "https://www.elle.com/rss",
            "https://www.harpersbazaar.com/rss",
            "https://wwd.com/feed",
            "https://www.cosmopolitan.com/rss"
        ]
    },
    lifestyle: {
        title: "Lifestyle",
        topics: [
            "Health & Wellness",
            "Relationships",
            "Travel",
            "Food & Dining",
            "Home & Design",
            "Fitness"
        ],
        feeds: [
            "https://www.wellandgood.com/feed",
            "https://www.mindbodygreen.com/rss",
            "https://www.refinery29.com/rss",
            "https://www.popsugar.com/feed",
            "https://www.byrdie.com/rss"
        ]
    },
    trending: {
        title: "Trending",
        topics: [
            "Viral Stories",
            "Social Media Trends",
            "Memes",
            "Breaking News",
            "Controversies",
            "Pop Culture"
        ],
        feeds: [
            "https://www.buzzfeed.com/feed",
            "https://www.dailybeast.com/rss",
            "https://www.insider.com/rss",
            "https://www.complex.com/feed",
            "https://www.theverge.com/rss"
        ]
    }
};

// Topic generator function
const generateTopics = async (section) => {
    const config = sectionConfig[section];
    if (!config) throw new Error(`Section ${section} not found in config`);

    return config.topics.map(topic => ({
        name: topic,
        slug: topic.toLowerCase().replace(/\s+/g, '-'),
        description: `Latest news and updates about ${topic} in ${config.title}`,
        keywords: [topic, config.title, 'news', 'gossip', 'updates'],
        parentSection: section
    }));
};

// Feed processor function
const processFeed = async (feedUrl) => {
    try {
        const response = await fetch(feedUrl);
        const feedData = await response.text();
        // Process RSS/Atom feed and return structured data
        // You'll need a feed parser library here
        return {
            url: feedUrl,
            lastUpdated: new Date().toISOString(),
            items: [] // Parsed items will go here
        };
    } catch (error) {
        console.error(`Error processing feed ${feedUrl}:`, error);
        return null;
    }
};

module.exports = {
    sectionConfig,
    generateTopics,
    processFeed
};

