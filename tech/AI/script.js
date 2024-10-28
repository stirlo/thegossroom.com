class AINewsManager {
    constructor() {
        this.articlesContainer = document.getElementById('articles-grid');
        this.topicsContainer = document.getElementById('topics-container');
        this.dataPath = 'data/current.json';
        this.topicsPath = 'topics.txt';
    }

    async init() {
        try {
            await this.loadTopics();
            await this.loadArticles();
            this.setupRefreshInterval();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError();
        }
    }

    async loadTopics() {
        const response = await fetch(this.topicsPath);
        const text = await response.text();
        const topics = text.split('\n').filter(topic => topic.trim());
        this.renderTopics(topics);
    }

    async loadArticles() {
        const response = await fetch(this.dataPath);
        const data = await response.json();
        this.renderArticles(data.articles);
    }

    renderTopics(topics) {
        this.topicsContainer.innerHTML = topics
            .map(topic => `<span class="topic-tag">${topic}</span>`)
            .join('');
    }

    renderArticles(articles) {
        this.articlesContainer.innerHTML = articles
            .map(article => this.createArticleCard(article))
            .join('');
    }

    createArticleCard(article) {
        return `
            <article class="article-card">
                <div class="article-content">
                    <span class="source-tag">${article.source}</span>
                    <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
                    <p>${this.truncateText(article.summary, 150)}</p>
                    <time>${this.formatDate(article.published)}</time>
                </div>
            </article>
        `;
    }

    truncateText(text, length) {
        if (!text) return '';
        text = text.replace(/<[^>]*>/g, '');
        return text.length > length ? 
            text.substring(0, length) + '...' : 
            text;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    setupRefreshInterval() {
        setInterval(() => this.loadArticles(), 300000); // Refresh every 5 minutes
    }

    showError() {
        this.articlesContainer.innerHTML = `
            <div class="error-message">
                Unable to load articles. Please try again later.
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const newsManager = new AINewsManager();
    newsManager.init();
});

