// topic-generator.js
const fs = require('fs').promises;
const path = require('path');
const { sectionConfig } = require('./section-config');

class TopicGenerator {
    constructor() {
        this.topicCache = new Map();
    }

    async generateTopicsForSection(section) {
        const config = sectionConfig[section];
        if (!config) throw new Error(`Section ${section} not found`);

        console.log(`Generating topics for ${config.title}...`);

        const topics = config.topics.map(topicName => 
            this.createTopic(topicName, section)
        );

        await this.saveTopics(section, topics);
        return topics;
    }

    createTopic(topicName, section) {
        const slug = this.generateSlug(topicName);
        return {
            id: `${section}-${slug}`,
            name: topicName,
            slug: slug,
            section: section,
            description: `Latest ${topicName} news and updates in ${sectionConfig[section].title}`,
            keywords: this.generateKeywords(topicName, section),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            articleCount: 0,
            trending: false
        };
    }

    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    generateKeywords(topicName, section) {
        const baseKeywords = [
            topicName,
            sectionConfig[section].title,
            'news',
            'updates',
            'gossip'
        ];

        // Add related keywords
        const related = topicName.split(' ');
        return [...new Set([...baseKeywords, ...related])];
    }

    async saveTopics(section, topics) {
        const outputDir = path.join('dist', section, 'topics');
        await fs.mkdir(outputDir, { recursive: true });

        // Save all topics index
        const indexPath = path.join(outputDir, 'topics.json');
        await fs.writeFile(indexPath, JSON.stringify(topics, null, 2));

        // Save individual topic files
        for (const topic of topics) {
            const topicPath = path.join(outputDir, `${topic.slug}.json`);
            await fs.writeFile(topicPath, JSON.stringify(topic, null, 2));

            // Generate topic page
            await this.generateTopicPage(section, topic);
        }
    }

    async generateTopicPage(section, topic) {
        const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic.name} - ${sectionConfig[section].title} - TheGossRoom</title>
    <meta name="description" content="${topic.description}">
    <meta name="keywords" content="${topic.keywords.join(', ')}">
    <link rel="stylesheet" href="/shared/global.css">
    <link rel="stylesheet" href="/shared/topic.css">
</head>
<body>
    <header>
        <nav id="main-nav"></nav>
        <div id="breadcrumbs">
            <a href="/">Home</a> &gt;
            <a href="/${section}">${sectionConfig[section].title}</a> &gt;
            <span>${topic.name}</span>
        </div>
    </header>

    <main>
        <h1>${topic.name}</h1>
        <p class="topic-description">${topic.description}</p>

        <section id="latest-articles">
            <h2>Latest Updates</h2>
            <div class="article-grid" data-topic="${topic.slug}"></div>
        </section>

        <section id="related-topics">
            <h2>Related Topics</h2>
            <div class="topic-grid"></div>
        </section>
    </main>

    <footer id="site-footer"></footer>

    <script src="/shared/global.js"></script>
    <script src="/shared/topic.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            loadTopicContent('${section}', '${topic.slug}');
        });
    </script>
</body>
</html>`;

        const outputPath = path.join('dist', section, 'topics', `${topic.slug}.html`);
        await fs.writeFile(outputPath, template);
    }
}

module.exports = TopicGenerator;

