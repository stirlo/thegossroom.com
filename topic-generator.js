import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sectionConfig } from './section-config.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TopicGenerator {
    constructor() {
        this.topics = new Map();
        this.relationshipGraph = new Map();
    }

    async generateTopicsForSection(section) {
        console.log(chalk.blue(`Generating topics for section: ${section}`));

        // Load processed feeds
        const feedsPath = path.join('dist', section, 'feeds', 'processed-feeds.json');
        let feeds;
        try {
            const feedsData = await fs.readFile(feedsPath, 'utf-8');
            feeds = JSON.parse(feedsData);
        } catch (error) {
            console.error(chalk.red(`Error loading feeds for ${section}:`), error);
            return;
        }

        // Extract topics from feeds
        await this.extractTopics(feeds, section);

        // Generate topic pages
        await this.generateTopicPages(section);

        // Save topic index
        await this.saveTopicIndex(section);
    }

    async extractTopics(feeds, section) {
        const sectionTopics = new Map();

        for (const feed of feeds) {
            for (const item of feed.items) {
                const itemTopics = this.identifyTopics(item, section);

                for (const topic of itemTopics) {
                    if (!sectionTopics.has(topic.slug)) {
                        sectionTopics.set(topic.slug, {
                            name: topic.name,
                            slug: topic.slug,
                            section: section,
                            articles: [],
                            relatedTopics: new Set(),
                            score: 0
                        });
                    }

                    const topicData = sectionTopics.get(topic.slug);
                    topicData.articles.push({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        image: item.image,
                        description: item.content.substring(0, 200) + '...',
                        source: item.source
                    });
                    topicData.score += 1;

                    // Build relationship graph
                    itemTopics.forEach(relatedTopic => {
                        if (relatedTopic.slug !== topic.slug) {
                            topicData.relatedTopics.add(relatedTopic.slug);
                        }
                    });
                }
            }
        }

        this.topics.set(section, sectionTopics);
    }

    identifyTopics(item, section) {
        const topics = new Set();

        // Add explicit categories
        if (item.categories) {
            item.categories.forEach(category => {
                const topic = this.normalizeTopicName(category);
                if (this.isValidTopic(topic, section)) {
                    topics.add({
                        name: this.capitalizeWords(topic),
                        slug: this.slugify(topic)
                    });
                }
            });
        }

        // Extract topics from content
        const contentTopics = this.extractTopicsFromContent(
            item.title + ' ' + item.content,
            section
        );
        contentTopics.forEach(topic => topics.add(topic));

        return Array.from(topics);
    }

    extractTopicsFromContent(content, section) {
        const topics = new Set();
        const sectionConfig = this.getSectionConfig(section);

        if (sectionConfig && sectionConfig.topicPatterns) {
            sectionConfig.topicPatterns.forEach(pattern => {
                const matches = content.match(new RegExp(pattern, 'gi'));
                if (matches) {
                    matches.forEach(match => {
                        const topic = this.normalizeTopicName(match);
                        if (this.isValidTopic(topic, section)) {
                            topics.add({
                                name: this.capitalizeWords(topic),
                                slug: this.slugify(topic)
                            });
                        }
                    });
                }
            });
        }

        return topics;
    }

    async generateTopicPages(section) {
        const sectionTopics = this.topics.get(section);
        if (!sectionTopics) return;

        const topicDir = path.join('dist', section, 'topics');
        await fs.mkdir(topicDir, { recursive: true });

        for (const [slug, topicData] of sectionTopics.entries()) {
            await this.generateTopicPage(topicData, topicDir);
        }
    }

    async generateTopicPage(topic, outputDir) {
        const template = await this.getTopicTemplate();

        // Sort articles by date
        topic.articles.sort((a, b) => 
            new Date(b.pubDate) - new Date(a.pubDate)
        );

        // Get related topics data
        const relatedTopics = Array.from(topic.relatedTopics)
            .map(slug => this.topics.get(topic.section).get(slug))
            .filter(t => t)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        const pageContent = template
            .replace('{{topicName}}', topic.name)
            .replace('{{topicDescription}}', this.generateTopicDescription(topic))
            .replace('{{articles}}', this.generateArticlesList(topic.articles))
            .replace('{{relatedTopics}}', this.generateRelatedTopicsList(relatedTopics));

        const outputPath = path.join(outputDir, `${topic.slug}.html`);
        await fs.writeFile(outputPath, pageContent);
    }

    async getTopicTemplate() {
        // Load and cache template
        if (!this.topicTemplate) {
            const templatePath = path.join('src', 'templates', 'topic.html');
            this.topicTemplate = await fs.readFile(templatePath, 'utf-8');
        }
        return this.topicTemplate;
    }

    generateTopicDescription(topic) {
        const articleCount = topic.articles.length;
        const latestDate = new Date(Math.max(
            ...topic.articles.map(a => new Date(a.pubDate))
        ));

        return `
            Latest news and updates about ${topic.name}. 
            Featuring ${articleCount} articles, with the most recent from 
            ${latestDate.toLocaleDateString()}.
        `;
    }

    generateArticlesList(articles) {
        return articles.map(article => `
            <article class="topic-article">
                <img src="${article.image}" alt="${article.title}">
                <div class="article-content">
                    <h3><a href="${article.link}">${article.title}</a></h3>
                    <p>${article.description}</p>
                    <div class="article-meta">
                        <span>${new Date(article.pubDate).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>${article.source}</span>
                    </div>
                </div>
            </article>
        `).join('\n');
    }

    generateRelatedTopicsList(topics) {
        return topics.map(topic => `
            <a href="${topic.slug}.html" class="related-topic">
                ${topic.name}
                <span class="article-count">${topic.articles.length} articles</span>
            </a>
        `).join('\n');
    }

    async saveTopicIndex(section) {
        const sectionTopics = this.topics.get(section);
        if (!sectionTopics) return;

        const topicIndex = Array.from(sectionTopics.values()).map(topic => ({
            name: topic.name,
            slug: topic.slug,
            articleCount: topic.articles.length,
            latestArticle: new Date(Math.max(
                ...topic.articles.map(a => new Date(a.pubDate))
            )).toISOString()
        }));

        const indexPath = path.join('dist', section, 'topics', 'index.json');
        await fs.writeFile(indexPath, JSON.stringify(topicIndex, null, 2));
    }

    // Utility methods
    normalizeTopicName(topic) {
        return topic.toLowerCase().trim();
    }

    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    capitalizeWords(text) {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    isValidTopic(topic, section) {
        if (topic.length < 3) return false;

        const sectionConfig = this.getSectionConfig(section);
        if (!sectionConfig) return false;

        // Check against blacklist
        if (sectionConfig.topicBlacklist && 
            sectionConfig.topicBlacklist.includes(topic)) {
            return false;
        }

        return true;
    }

    getSectionConfig(section) {
        return sectionConfig[section];
    }
}

