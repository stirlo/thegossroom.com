// shared-components.js
const sharedComponents = {
    articleCard: `
<template id="article-card">
    <article class="card article-card">
        <div class="card-image-container">
            <img loading="lazy" data-src="" alt="" class="card-image">
            <div class="card-category"></div>
        </div>
        <div class="card-content">
            <h3 class="card-title"></h3>
            <p class="card-excerpt"></p>
            <div class="card-meta">
                <span class="publish-date"></span>
                <span class="source"></span>
            </div>
            <div class="card-tags"></div>
        </div>
    </article>
</template>
    `,

    topicCard: `
<template id="topic-card">
    <div class="card topic-card">
        <h3 class="topic-title"></h3>
        <div class="topic-stats">
            <span class="article-count"></span>
            <span class="trend-indicator"></span>
        </div>
        <div class="topic-tags"></div>
    </div>
</template>
    `,

    feedItem: `
<template id="feed-item">
    <div class="feed-item">
        <div class="feed-header">
            <img class="feed-icon" loading="lazy" data-src="" alt="">
            <h4 class="feed-title"></h4>
        </div>
        <div class="feed-meta">
            <span class="update-frequency"></span>
            <span class="last-updated"></span>
        </div>
    </div>
</template>
    `,

    pagination: `
<template id="pagination">
    <div class="pagination">
        <button class="prev-page" disabled>Previous</button>
        <div class="page-numbers"></div>
        <button class="next-page">Next</button>
    </div>
</template>
    `
};

// Component initialization and utility functions
const componentUtils = `
class ComponentManager {
    static init() {
        this.registerTemplates();
        this.initializeComponents();
    }

    static registerTemplates() {
        const templateContainer = document.createElement('div');
        templateContainer.style.display = 'none';
        templateContainer.innerHTML = Object.values(sharedComponents).join('\\n');
        document.body.appendChild(templateContainer);
    }

    static initializeComponents() {
        this.initArticleCards();
        this.initTopicCards();
        this.initFeedItems();
        this.initPagination();
    }

    static createArticleCard(article) {
        const template = document.getElementById('article-card');
        const card = template.content.cloneNode(true);

        // Populate card data
        card.querySelector('.card-image').dataset.src = article.image;
        card.querySelector('.card-title').textContent = article.title;
        card.querySelector('.card-excerpt').textContent = article.excerpt;
        card.querySelector('.publish-date').textContent = new Date(article.date).toLocaleDateString();
        card.querySelector('.source').textContent = article.source;

        // Add tags
        const tagsContainer = card.querySelector('.card-tags');
        article.tags?.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
        });

        return card;
    }

    static createTopicCard(topic) {
        const template = document.getElementById('topic-card');
        const card = template.content.cloneNode(true);

        card.querySelector('.topic-title').textContent = topic.title;
        card.querySelector('.article-count').textContent = \`\${topic.articleCount} articles\`;

        // Add trend indicator
        const trendEl = card.querySelector('.trend-indicator');
        trendEl.className = \`trend-indicator \${topic.trending ? 'trending' : ''}\`;

        return card;
    }

    static async loadMoreContent(container, fetchFunction, page = 1) {
        try {
            const data = await fetchFunction(page);
            if (data.items?.length) {
                data.items.forEach(item => {
                    const element = this.createArticleCard(item);
                    container.appendChild(element);
                });
                return data.hasMore;
            }
            return false;
        } catch (error) {
            console.error('Error loading content:', error);
            return false;
        }
    }
}

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => ComponentManager.init());
`;

// Shared styles for components
const componentStyles = `
/* Component Styles */
.card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.article-card {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 1rem;
}

.card-image-container {
    position: relative;
    padding-top: 56.25%; /* 16:9 aspect ratio */
}

.card-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.card-content {
    padding: 1rem;
}

.card-title {
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
}

.card-excerpt {
    color: var(--text-secondary);
    margin-bottom: 1rem;
}

.card-meta {
    display: flex;
    justify-content: space-between;
    color: var(--text-tertiary);
    font-size: 0.875rem;
}

.card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.tag {
    background: var(--tag-bg);
    color: var(--tag-color);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
}

/* Topic Card Styles */
.topic-card {
    padding: 1rem;
}

.topic-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
}

.trend-indicator {
    width: 24px;
    height: 24px;
}

.trend-indicator.trending {
    background: var(--trend-color);
    animation: pulse 2s infinite;
}

/* Feed Item Styles */
.feed-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.feed-icon {
    width: 24px;
    height: 24px;
}

/* Pagination Styles */
.pagination {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 2rem 0;
}

.page-numbers {
    display: flex;
    gap: 0.5rem;
}

button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--border-radius);
    background: var(--button-bg);
    color: var(--button-color);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Animations */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
}
`;

// Export everything
module.exports = {
    sharedComponents,
    componentUtils,
    componentStyles
};

