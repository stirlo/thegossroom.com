class TopicPage {
    constructor() {
        this.topic = document.body.dataset.topic;
        this.section = document.body.dataset.section;
        this.articleGrid = document.querySelector('.article-grid');
        this.relatedTopics = document.querySelector('.related-topics');

        this.initialize();
    }

    async initialize() {
        await this.loadTopicData();
        this.initializeFilters();
        this.initializeInfiniteScroll();
        this.initializeSocialSharing();
    }

    async loadTopicData() {
        try {
            const response = await fetch(`/api/${this.section}/topics/${this.topic}.json`);
            this.topicData = await response.json();
            this.currentPage = 1;
            this.loadArticles();
        } catch (error) {
            console.error('Error loading topic data:', error);
            this.showErrorMessage();
        }
    }

    loadArticles(page = 1) {
        const startIndex = (page - 1) * 10;
        const articles = this.topicData.articles.slice(startIndex, startIndex + 10);

        if (articles.length === 0) {
            this.allLoaded = true;
            return;
        }

        const articleHTML = articles.map(article => this.createArticleCard(article)).join('');

        if (page === 1) {
            this.articleGrid.innerHTML = articleHTML;
        } else {
            this.articleGrid.insertAdjacentHTML('beforeend', articleHTML);
        }

        this.initializeLazyImages();
    }

    createArticleCard(article) {
        return `
            <article class="topic-article" data-id="${article.id}">
                <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" 
                    data-src="${article.image}" 
                    alt="${article.title}"
                    loading="lazy"
                >
                <div class="article-content">
                    <h3>
                        <a href="${article.link}" target="_blank" rel="noopener">
                            ${article.title}
                        </a>
                    </h3>
                    <p>${article.description}</p>
                    <div class="article-meta">
                        <span>${this.formatDate(article.pubDate)}</span>
                        <span>·</span>
                        <span>${article.source}</span>
                        <div class="share-buttons">
                            ${this.generateShareButtons(article)}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    generateShareButtons(article) {
        const encodedUrl = encodeURIComponent(article.link);
        const encodedTitle = encodeURIComponent(article.title);

        return `
            <button class="share-btn" data-platform="twitter" aria-label="Share on Twitter">
                <svg><!-- Twitter icon SVG --></svg>
            </button>
            <button class="share-btn" data-platform="facebook" aria-label="Share on Facebook">
                <svg><!-- Facebook icon SVG --></svg>
            </button>
            <button class="share-btn" data-platform="copy" aria-label="Copy link">
                <svg><!-- Copy icon SVG --></svg>
            </button>
        `;
    }

    initializeFilters() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'topic-filters';
        filterContainer.innerHTML = `
            <select id="sourceFilter">
                <option value="">All Sources</option>
                ${this.getUniqueSources().map(source => 
                    `<option value="${source}">${source}</option>`
                ).join('')}
            </select>
            <select id="dateFilter">
                <option value="">All Time</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
            </select>
        `;

        this.articleGrid.parentNode.insertBefore(filterContainer, this.articleGrid);
        this.addFilterListeners();
    }

    getUniqueSources() {
        return [...new Set(this.topicData.articles.map(article => article.source))];
    }

    addFilterListeners() {
        const sourceFilter = document.getElementById('sourceFilter');
        const dateFilter = document.getElementById('dateFilter');

        const filterArticles = () => {
            const source = sourceFilter.value;
            const date = dateFilter.value;

            let filtered = this.topicData.articles;

            if (source) {
                filtered = filtered.filter(article => article.source === source);
            }

            if (date) {
                const now = new Date();
                const cutoff = new Date();

                switch(date) {
                    case 'day':
                        cutoff.setDate(now.getDate() - 1);
                        break;
                    case 'week':
                        cutoff.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        cutoff.setMonth(now.getMonth() - 1);
                        break;
                }

                filtered = filtered.filter(article => 
                    new Date(article.pubDate) > cutoff
                );
            }

            this.topicData.articles = filtered;
            this.currentPage = 1;
            this.allLoaded = false;
            this.loadArticles();
        };

        sourceFilter.addEventListener('change', filterArticles);
        dateFilter.addEventListener('change', filterArticles);
    }

    initializeInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.allLoaded) {
                    this.currentPage++;
                    this.loadArticles(this.currentPage);
                }
            });
        }, options);

        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        this.articleGrid.appendChild(sentinel);
        observer.observe(sentinel);
    }

    initializeSocialSharing() {
        this.articleGrid.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('.share-btn');
            if (!shareBtn) return;

            const article = shareBtn.closest('.topic-article');
            const platform = shareBtn.dataset.platform;
            const url = article.querySelector('a').href;
            const title = article.querySelector('h3').textContent.trim();

            this.shareContent(platform, url, title);
        });
    }

    async shareContent(platform, url, title) {
        switch(platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
                break;
            case 'copy':
                try {
                    await navigator.clipboard.writeText(url);
                    this.showToast('Link copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
                break;
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 100);
    }

    showErrorMessage() {
        this.articleGrid.innerHTML = `
            <div class="error-message">
                <h2>Oops! Something went wrong</h2>
                <p>We couldn't load the articles. Please try again later.</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    initializeLazyImages() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TopicPage();
});

