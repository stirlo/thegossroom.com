// content-populator.js
const fs = require('fs').promises;
const path = require('path');

const feedSources = {
    'climate/research/current': [
        'https://climate.nasa.gov/news/feed/',
        'https://www.carbonbrief.org/feed/',
        'https://www.climatechangenews.com/feed/',
        'https://news.mongabay.com/feed/',
        'https://phys.org/rss-feed/earth/earth-sciences/',
        'https://www.nature.com/nature/climate-change.rss'
    ],
    'climate/energy/renewable': [
        'https://cleantechnica.com/feed/',
        'https://reneweconomy.com.au/feed/',
        'https://www.renewableenergyworld.com/feed/',
        'https://www.pv-tech.org/feed/',
        'https://www.windpowermonthly.com/feed/',
        'https://www.solarpowerworldonline.com/feed/'
    ],
    'climate/conservation/biodiversity': [
        'https://www.conservation.org/feed',
        'https://www.iucn.org/news/feed',
        'https://news.mongabay.com/feed/biodiversity/',
        'https://www.worldwildlife.org/feed',
        'https://www.fauna-flora.org/feed'
    ],
    'tech/AI/general': [
        'https://www.artificialintelligence-news.com/feed/',
        'https://www.unite.ai/feed/',
        'https://www.marktechpost.com/feed/',
        'https://machinelearningmastery.com/feed/',
        'https://www.datanami.com/feed/',
        'https://blogs.nvidia.com/feed/',
        'https://openai.com/blog/rss/'
    ],
    'tech/gaming/industry': [
        'https://www.gamedeveloper.com/rss.xml',
        'https://www.gamesindustry.biz/feed/rss',
        'https://www.pocketgamer.biz/rss/',
        'https://www.gamesradar.com/rss/',
        'https://www.eurogamer.net/feed',
        'https://www.polygon.com/rss/index.xml'
    ],
    'tech/security/cybersecurity': [
        'https://threatpost.com/feed/',
        'https://krebsonsecurity.com/feed/',
        'https://www.darkreading.com/rss.xml',
        'https://www.bleepingcomputer.com/feed/',
        'https://nakedsecurity.sophos.com/feed/'
    ],
    'tech/mobile/apple': [
        'https://www.macrumors.com/macrumors.xml',
        'https://9to5mac.com/feed/',
        'https://appleinsider.com/rss/news/',
        'https://www.imore.com/feed',
        'https://www.cultofmac.com/feed/'
    ]
    // Add more sections as needed
};

const topicSuggestions = {
    'climate/research/current': [
        'Global Temperature Trends',
        'Arctic Ice Measurements',
        'Ocean Acidification',
        'Atmospheric CO2 Levels',
        'Extreme Weather Events',
        'Sea Level Rise',
        'Climate Modeling',
        'Greenhouse Gas Emissions'
    ],
    'climate/energy/renewable': [
        'Solar Technology Advances',
        'Wind Power Innovation',
        'Energy Storage Solutions',
        'Grid Integration',
        'Green Hydrogen',
        'Offshore Wind Development',
        'Solar Panel Efficiency',
        'Renewable Energy Policy'
    ],
    'tech/AI/general': [
        'Machine Learning Advances',
        'Neural Networks',
        'Natural Language Processing',
        'Computer Vision',
        'AI Ethics',
        'Deep Learning',
        'Reinforcement Learning',
        'AI in Healthcare',
        'Quantum Computing'
    ],
    'tech/gaming/industry': [
        'Console Gaming',
        'Mobile Gaming Trends',
        'eSports Development',
        'Game Engine Updates',
        'Industry Acquisitions',
        'Cloud Gaming',
        'Gaming Hardware',
        'Indie Game Development'
    ]
};

const defaultTopics = [
    'Latest News',
    'Industry Updates',
    'Technology Trends',
    'Research Developments',
    'Future Outlook'
];

async function generateSectionContent(section, topics) {
    return {
        title: section.split('/').pop(),
        description: `Latest updates and news about ${section}`,
        topics: topics || defaultTopics,
        lastUpdated: new Date().toISOString()
    };
}

async function populateContent() {
    try {
        console.log('Starting content population...');

        for (const [section, feeds] of Object.entries(feedSources)) {
            const dataPath = path.join('dist', section, 'data');
            console.log(`Processing section: ${section}`);

            // Ensure directory exists
            await fs.mkdir(dataPath, { recursive: true });

            // Generate feeds file
            const feedData = {
                feeds,
                lastUpdated: new Date().toISOString(),
                refreshInterval: 3600 // refresh every hour
            };

            await fs.writeFile(
                path.join(dataPath, 'feeds.json'),
                JSON.stringify(feedData, null, 2)
            );

            // Generate topics file
            const topics = topicSuggestions[section] || defaultTopics;
            const topicsData = await generateSectionContent(section, topics);

            await fs.writeFile(
                path.join(dataPath, 'topics.json'),
                JSON.stringify(topicsData, null, 2)
            );

            // Generate metadata file
            const metadata = {
                section,
                lastUpdated: new Date().toISOString(),
                feedCount: feeds.length,
                topicCount: topics.length,
                configuration: {
                    refreshInterval: 3600,
                    cacheExpiration: 86400,
                    maxArticles: 50
                }
            };

            await fs.writeFile(
                path.join(dataPath, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );
        }

        console.log('Content population completed successfully!');
    } catch (error) {
        console.error('Error populating content:', error);
        throw error;
    }
}

// Additional utility function to validate feeds
async function validateFeeds() {
    console.log('Validating RSS feeds...');
    const invalidFeeds = [];

    for (const [section, feeds] of Object.entries(feedSources)) {
        for (const feed of feeds) {
            try {
                const response = await fetch(feed, { method: 'HEAD' });
                if (!response.ok) {
                    invalidFeeds.push({ section, feed });
                }
            } catch (error) {
                invalidFeeds.push({ section, feed, error: error.message });
            }
        }
    }

    if (invalidFeeds.length > 0) {
        console.warn('Warning: Some feeds may be invalid:', invalidFeeds);
    } else {
        console.log('All feeds validated successfully!');
    }
}

// Run the populator with validation
async function run() {
    try {
        await validateFeeds();
        await populateContent();
    } catch (error) {
        console.error('Error in content population process:', error);
    }
}

run();

module.exports = {
    populateContent,
    validateFeeds,
    feedSources,
    topicSuggestions
};

